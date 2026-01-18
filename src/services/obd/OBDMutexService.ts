/**
 * OBD Mutex Service
 * Gerenciador de acesso exclusivo ao barramento Bluetooth ELM327
 * 
 * O adaptador ELM327 não suporta comandos concorrentes - apenas um
 * componente por vez pode enviar comandos. Este serviço implementa
 * um mutex com fila de prioridade para coordenar o acesso.
 * 
 * Prioridades:
 * - 0 (Alta): Reconexão automática, comandos AT críticos
 * - 1 (Normal): Dashboard polling
 * - 2 (Baixa): Testes manuais (Refuel, DTC, Battery, LiveData)
 */

import logger from '@/lib/logger';

// ============= TYPES =============

export type OBDLockPriority = 0 | 1 | 2;

export interface OBDLockRequest {
  owner: string;
  priority: OBDLockPriority;
  resolve: (acquired: boolean) => void;
  timestamp: number;
  timeoutId?: NodeJS.Timeout;
}

export interface OBDMutexState {
  isLocked: boolean;
  currentOwner: string | null;
  queueLength: number;
  lockAcquiredAt: number | null;
}

// ============= CONSTANTS =============

const DEFAULT_LOCK_TIMEOUT_MS = 30000; // 30 segundos
const LOCK_WARNING_THRESHOLD_MS = 10000; // Avisar se lock > 10s

// ============= SERVICE =============

export class OBDMutexService {
  private locked: boolean = false;
  private owner: string | null = null;
  private lockAcquiredAt: number | null = null;
  private queue: OBDLockRequest[] = [];
  
  // Listeners para mudanças de estado
  private listeners: Set<(state: OBDMutexState) => void> = new Set();

  /**
   * Adquire o lock do barramento OBD
   * @param owner Identificador único do componente (ex: 'dashboard', 'refuel-monitor')
   * @param priority Prioridade: 0 (alta), 1 (normal), 2 (baixa)
   * @param timeout Timeout em ms para aguardar na fila (default: 30s)
   * @returns Promise<boolean> - true se adquiriu, false se timeout
   */
  acquire(owner: string, priority: OBDLockPriority = 2, timeout: number = DEFAULT_LOCK_TIMEOUT_MS): Promise<boolean> {
    return new Promise((resolve) => {
      // Se já é o dono do lock, retornar imediatamente
      if (this.locked && this.owner === owner) {
        logger.debug(`[OBDMutex] ${owner} já possui o lock (re-entrante)`);
        resolve(true);
        return;
      }

      // Se não está travado, adquirir imediatamente
      if (!this.locked) {
        this.locked = true;
        this.owner = owner;
        this.lockAcquiredAt = Date.now();
        logger.debug(`[OBDMutex] Lock adquirido por: ${owner} (prioridade ${priority})`);
        this.notifyListeners();
        resolve(true);
        return;
      }

      // Criar request para a fila
      const request: OBDLockRequest = {
        owner,
        priority,
        resolve,
        timestamp: Date.now(),
      };

      // Timeout para não ficar esperando eternamente
      request.timeoutId = setTimeout(() => {
        const index = this.queue.indexOf(request);
        if (index !== -1) {
          this.queue.splice(index, 1);
          logger.warn(`[OBDMutex] Timeout aguardando lock: ${owner}`);
          resolve(false);
        }
      }, timeout);

      // Inserir na fila ordenada por prioridade (menor = maior prioridade)
      const insertIndex = this.queue.findIndex(r => r.priority > priority);
      if (insertIndex === -1) {
        this.queue.push(request);
      } else {
        this.queue.splice(insertIndex, 0, request);
      }

      logger.debug(`[OBDMutex] ${owner} adicionado à fila (pos ${insertIndex === -1 ? this.queue.length : insertIndex + 1}, prioridade ${priority})`);
      this.notifyListeners();
    });
  }

  /**
   * Libera o lock do barramento OBD
   * @param owner Identificador do componente que está liberando
   */
  release(owner: string): void {
    if (!this.locked) {
      logger.debug(`[OBDMutex] release ignorado - não há lock ativo`);
      return;
    }

    if (this.owner !== owner) {
      logger.warn(`[OBDMutex] ${owner} tentou liberar lock que pertence a ${this.owner}`);
      return;
    }

    const holdTime = this.lockAcquiredAt ? Date.now() - this.lockAcquiredAt : 0;
    
    if (holdTime > LOCK_WARNING_THRESHOLD_MS) {
      logger.warn(`[OBDMutex] ${owner} manteve lock por ${holdTime}ms (acima do threshold)`);
    }

    logger.debug(`[OBDMutex] Lock liberado por: ${owner} (tempo: ${holdTime}ms)`);

    this.locked = false;
    this.owner = null;
    this.lockAcquiredAt = null;

    // Processar próximo da fila
    this.processQueue();
  }

  /**
   * Força liberação do lock (usar com cuidado!)
   * Útil para cleanup em caso de erros ou desconexão
   */
  forceRelease(): void {
    if (this.owner) {
      logger.warn(`[OBDMutex] Force release - lock de ${this.owner} removido`);
    }
    
    this.locked = false;
    this.owner = null;
    this.lockAcquiredAt = null;
    
    // Limpar fila e rejeitar todos os requests pendentes
    for (const request of this.queue) {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
      request.resolve(false);
    }
    this.queue = [];
    
    this.notifyListeners();
  }

  /**
   * Executa uma função com lock automático
   * Adquire o lock, executa a função, e libera o lock
   */
  async withLock<T>(
    owner: string,
    fn: () => Promise<T>,
    options?: { priority?: OBDLockPriority; timeout?: number }
  ): Promise<T> {
    const priority = options?.priority ?? 2;
    const timeout = options?.timeout ?? DEFAULT_LOCK_TIMEOUT_MS;

    const acquired = await this.acquire(owner, priority, timeout);
    if (!acquired) {
      throw new Error(`[OBDMutex] Timeout aguardando lock para ${owner}`);
    }

    try {
      return await fn();
    } finally {
      this.release(owner);
    }
  }

  /**
   * Verifica se o barramento está ocupado
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Retorna o dono atual do lock
   */
  currentOwner(): string | null {
    return this.owner;
  }

  /**
   * Retorna o estado atual do mutex
   */
  getState(): OBDMutexState {
    return {
      isLocked: this.locked,
      currentOwner: this.owner,
      queueLength: this.queue.length,
      lockAcquiredAt: this.lockAcquiredAt,
    };
  }

  /**
   * Registra um listener para mudanças de estado
   */
  subscribe(listener: (state: OBDMutexState) => void): () => void {
    this.listeners.add(listener);
    // Retorna função de unsubscribe
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Verifica se um owner específico possui o lock
   */
  isOwner(owner: string): boolean {
    return this.owner === owner;
  }

  // ============= PRIVATE METHODS =============

  private processQueue(): void {
    if (this.queue.length === 0) {
      this.notifyListeners();
      return;
    }

    // Pegar o próximo da fila (já ordenado por prioridade)
    const next = this.queue.shift();
    if (!next) {
      this.notifyListeners();
      return;
    }

    // Limpar timeout
    if (next.timeoutId) {
      clearTimeout(next.timeoutId);
    }

    // Conceder lock
    this.locked = true;
    this.owner = next.owner;
    this.lockAcquiredAt = Date.now();
    
    logger.debug(`[OBDMutex] Lock concedido da fila para: ${next.owner}`);
    this.notifyListeners();
    
    next.resolve(true);
  }

  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (e) {
        logger.error('[OBDMutex] Erro em listener:', e);
      }
    }
  }
}

// Singleton instance para uso global
export const obdMutex = new OBDMutexService();
