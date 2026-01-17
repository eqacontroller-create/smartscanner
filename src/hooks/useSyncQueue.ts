import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import logger from '@/lib/logger';

const QUEUE_STORAGE_KEY = 'sync-queue';

interface SyncQueueItem {
  id: string;
  table: 'rides' | 'profiles' | 'refuel_entries';
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  createdAt: number;
}

interface UseSyncQueueReturn {
  enqueue: (item: Omit<SyncQueueItem, 'id' | 'createdAt'>) => void;
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  processQueue: () => Promise<void>;
}

// Gera ID único
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Carrega fila do localStorage
function loadQueue(): SyncQueueItem[] {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Salva fila no localStorage
function saveQueue(queue: SyncQueueItem[]) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    logger.error('[SyncQueue] Erro ao salvar fila:', error);
  }
}

export function useSyncQueue(): UseSyncQueueReturn {
  const { isAuthenticated, user } = useAuth();
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const processingRef = useRef(false);

  // Carrega fila ao montar
  useEffect(() => {
    setQueue(loadQueue());
  }, []);

  // Monitora status online/offline
  useEffect(() => {
    const handleOnline = () => {
      logger.info('[SyncQueue] Conexão restaurada');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      logger.info('[SyncQueue] Sem conexão');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Processa fila automaticamente quando volta online
  useEffect(() => {
    if (isOnline && queue.length > 0 && isAuthenticated && !processingRef.current) {
      processQueue();
    }
  }, [isOnline, queue.length, isAuthenticated]);

  // Adiciona item à fila
  const enqueue = useCallback((item: Omit<SyncQueueItem, 'id' | 'createdAt'>) => {
    const newItem: SyncQueueItem = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    
    setQueue(prev => {
      const updated = [...prev, newItem];
      saveQueue(updated);
      logger.debug(`[SyncQueue] Item adicionado: ${item.operation} em ${item.table}`);
      return updated;
    });
  }, []);

  // Processa fila de sincronização
  const processQueue = useCallback(async () => {
    if (!isAuthenticated || !user || processingRef.current || queue.length === 0) {
      return;
    }
    
    processingRef.current = true;
    setIsSyncing(true);
    logger.info(`[SyncQueue] Processando ${queue.length} item(s)`);
    
    const successIds: string[] = [];
    
    for (const item of queue) {
      try {
        let error = null;
        
        // Adiciona user_id se necessário
        const dataWithUser = { ...item.data, user_id: user.id };
        
        switch (item.operation) {
          case 'insert':
            const insertResult = await supabase
              .from(item.table)
              .insert(dataWithUser as any);
            error = insertResult.error;
            break;
            
          case 'update':
            const itemId = item.data.id as string;
            const updateResult = await supabase
              .from(item.table)
              .update(item.data as any)
              .eq('id', itemId);
            error = updateResult.error;
            break;
            
          case 'delete':
            const deleteId = item.data.id as string;
            const deleteResult = await supabase
              .from(item.table)
              .delete()
              .eq('id', deleteId);
            error = deleteResult.error;
            break;
        }
        
        if (error) {
          logger.error(`[SyncQueue] Erro ao processar item ${item.id}:`, error);
        } else {
          logger.debug(`[SyncQueue] Item ${item.id} sincronizado`);
          successIds.push(item.id);
        }
      } catch (err) {
        logger.error(`[SyncQueue] Erro inesperado ao processar item ${item.id}:`, err);
      }
    }
    
    // Remove itens processados com sucesso
    if (successIds.length > 0) {
      setQueue(prev => {
        const remaining = prev.filter(item => !successIds.includes(item.id));
        saveQueue(remaining);
        return remaining;
      });
      
      if (successIds.length === queue.length) {
        toast.success('Dados sincronizados com sucesso!');
      } else {
        toast.info(`${successIds.length} de ${queue.length} itens sincronizados`);
      }
    }
    
    processingRef.current = false;
    setIsSyncing(false);
  }, [isAuthenticated, user, queue]);

  return {
    enqueue,
    pendingCount: queue.length,
    isOnline,
    isSyncing,
    processQueue,
  };
}
