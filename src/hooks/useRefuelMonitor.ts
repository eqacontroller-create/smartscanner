// Hook para monitoramento de qualidade de combustível
// Analisa Fuel Trim após abastecimento para detectar adulteração
// Arquitetura: Loop unificado de 500ms com cálculo preciso baseado em timestamp
// CORREÇÃO: Sistema de fila de voz, cleanup adequado, mutex GLOBAL OBD, loop unificado
// CORREÇÃO v2: Settings congelados durante monitoramento, cálculo de distância corrigido
// V3: FUEL STATE MACHINE - Análise forense com O2 Sensor e contexto de troca Flex
// V4: MUTEX GLOBAL - Usa OBDMutexService para coordenação com outros componentes

import { useState, useRef, useCallback, useEffect } from 'react';
import logger from '@/lib/logger';
import { 
  RefuelMode, 
  RefuelFlowType,
  RefuelEntry, 
  FuelTrimSample, 
  FuelQuality,
  RefuelSettings,
  defaultRefuelSettings 
} from '@/types/refuelTypes';
import { supabase } from '@/integrations/supabase/client';
import type { 
  FuelChangeContext, 
  FuelMonitoringData, 
  FuelDiagnosticResult,
  O2SensorReading,
  FuelSystemStatus,
} from '@/types/fuelForensics';
import { DEFAULT_FUEL_THRESHOLDS, decodeFuelSystemStatus, isClosedLoop } from '@/types/fuelForensics';
import { 
  evaluateFuelState, 
  createInitialMonitoringData, 
  addSample 
} from '@/services/fuel/FuelStateMachine';
import { obdMutex } from '@/services/obd/OBDMutexService';

// Constantes de timing
const MONITORING_INTERVAL = 500;         // Loop principal: 500ms para precisão
const UI_UPDATE_THROTTLE = 1000;         // Atualizar UI a cada 1s
const FUEL_TRIM_THROTTLE = 2000;         // Ler Fuel Trim a cada 2s
const FUEL_LEVEL_THROTTLE = 5000;        // Ler nível de combustível a cada 5s
const FUEL_SYSTEM_CHECK_THROTTLE = 2000; // Verificar Closed Loop a cada 2s

interface UseRefuelMonitorOptions {
  speed: number;
  sendRawCommand: (command: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  speak: (text: string, options?: { priority?: number; interrupt?: boolean }) => Promise<void>;
  onFuelPriceUpdate?: (price: number) => void;
  userId?: string;
  settings?: RefuelSettings;
  // AUTO-RECONNECT: Função para tentar reconectar ao Bluetooth
  reconnect?: () => Promise<boolean>;
}

interface UseRefuelMonitorReturn {
  mode: RefuelMode;
  flowType: RefuelFlowType | null;
  currentRefuel: Partial<RefuelEntry> | null;
  fuelTrimHistory: FuelTrimSample[];
  fuelLevelSupported: boolean | null;
  stftSupported: boolean | null;
  currentSTFT: number | null;
  currentLTFT: number | null;
  currentO2: number | null;
  currentFuelLevel: number | null;
  distanceMonitored: number;
  anomalyActive: boolean;
  anomalyDuration: number;
  settings: RefuelSettings;
  frozenSettings: RefuelSettings | null;
  // State Machine
  fuelContext: FuelChangeContext;
  setFuelContext: (ctx: FuelChangeContext) => void;
  forensicResult: FuelDiagnosticResult | null;
  monitoringData: FuelMonitoringData | null;
  // O2 Sensor data for real-time monitor
  o2Readings: O2SensorReading[];
  o2FrozenDuration: number;
  // Closed Loop detection
  fuelSystemStatus: FuelSystemStatus;
  isClosedLoopActive: boolean;
  // Ações
  startRefuelMode: () => void;
  startQuickTest: () => void;
  confirmRefuel: (pricePerLiter: number, litersAdded: number, stationName?: string) => void;
  cancelRefuel: () => void;
  checkPIDSupport: () => Promise<void>;
}

export function useRefuelMonitor({
  speed,
  sendRawCommand,
  isConnected,
  speak,
  onFuelPriceUpdate,
  userId,
  settings: externalSettings,
  reconnect,
}: UseRefuelMonitorOptions): UseRefuelMonitorReturn {
  // Estados principais
  const [mode, setMode] = useState<RefuelMode>('inactive');
  const [flowType, setFlowType] = useState<RefuelFlowType | null>(null);
  const [currentRefuel, setCurrentRefuel] = useState<Partial<RefuelEntry> | null>(null);
  const [fuelTrimHistory, setFuelTrimHistory] = useState<FuelTrimSample[]>([]);
  
  // Usar settings externas ou padrão
  const settings = externalSettings || defaultRefuelSettings;
  
  // CORREÇÃO v2: Settings congelados durante monitoramento (imutáveis após iniciar)
  const [frozenSettings, setFrozenSettings] = useState<RefuelSettings | null>(null);
  const frozenSettingsRef = useRef<RefuelSettings | null>(null);
  const flowTypeRef = useRef<RefuelFlowType | null>(null);
  
  // Suporte de PIDs
  const [fuelLevelSupported, setFuelLevelSupported] = useState<boolean | null>(null);
  const [stftSupported, setStftSupported] = useState<boolean | null>(null);
  
  // Dados atuais
  const [currentSTFT, setCurrentSTFT] = useState<number | null>(null);
  const [currentLTFT, setCurrentLTFT] = useState<number | null>(null);
  const [currentO2, setCurrentO2] = useState<number | null>(null);
  const [currentFuelLevel, setCurrentFuelLevel] = useState<number | null>(null);
  const [distanceMonitored, setDistanceMonitored] = useState(0);
  
  // CORREÇÃO: Velocidade interna (lida diretamente do OBD quando polling está pausado)
  const [internalSpeed, setInternalSpeed] = useState<number>(0);
  const internalSpeedRef = useRef<number>(0);
  
  // Anomalias
  const [anomalyActive, setAnomalyActive] = useState(false);
  const [anomalyDuration, setAnomalyDuration] = useState(0);
  
  // === STATE MACHINE ===
  const [fuelContext, setFuelContext] = useState<FuelChangeContext>('unknown');
  const fuelContextRef = useRef<FuelChangeContext>('unknown');
  const [forensicResult, setForensicResult] = useState<FuelDiagnosticResult | null>(null);
  const [monitoringData, setMonitoringData] = useState<FuelMonitoringData | null>(null);
  const monitoringDataRef = useRef<FuelMonitoringData | null>(null);
  
  // O2 Sensor data for real-time monitor
  const [o2Readings, setO2Readings] = useState<O2SensorReading[]>([]);
  const [o2FrozenDuration, setO2FrozenDuration] = useState(0);
  const o2FrozenStartRef = useRef<number | null>(null);
  
  // Closed Loop detection (PID 03)
  const [fuelSystemStatus, setFuelSystemStatus] = useState<FuelSystemStatus>('motor_off');
  const [isClosedLoopActive, setIsClosedLoopActive] = useState(false);
  const isClosedLoopRef = useRef(false);
  const closedLoopAnnouncedRef = useRef(false);
  const lastFuelSystemCheckRef = useRef(0);
  
  // Refs para monitoramento (evitar re-renders e memory leaks)
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startOdometerRef = useRef(0);
  const anomalyStartRef = useRef<number | null>(null);
  const stftSamplesRef = useRef<number[]>([]);
  const initialLTFTRef = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const isMonitoringActiveRef = useRef(false);
  
  // MUTEX GLOBAL: Identificador do componente para lock OBD
  const MUTEX_OWNER = 'refuel-monitor';
  
  // Refs para timing preciso
  const lastUpdateTimestampRef = useRef<number | null>(null);
  const lastUIUpdateRef = useRef(0);
  const lastFuelTrimReadRef = useRef(0);
  const lastFuelLevelReadRef = useRef(0);
  
  // Refs para controle de alertas
  const lastAnomalyAlertTimeRef = useRef(0);
  const anomalyRecoveryAnnouncedRef = useRef(false);
  const announcedMilestonesRef = useRef<Set<number>>(new Set());
  
  // Contador de falhas de leitura OBD
  const readFailureCountRef = useRef(0);
  const MAX_READ_FAILURES = 5;
  
  // BUG FIX 4: Ref para velocidade (evita recriar interval a cada mudança de speed)
  const speedRef = useRef(speed);
  
  // BUG FIX 3: Ref para estado de conexão (detectar desconexão durante monitoramento)
  const isConnectedRef = useRef(isConnected);
  const disconnectionAnnouncedRef = useRef(false);
  
  // AUTO-RECONNECT: Refs para controle de reconexão automática
  const reconnectRef = useRef(reconnect);
  const isReconnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 3;
  const RECONNECT_DELAY_MS = 2000;
  
  // CORREÇÃO v2: Refs estáveis para funções (evita mudanças de dependência no useEffect)
  const speakRef = useRef(speak);
  const readSTFTRef = useRef<() => Promise<number | null>>(() => Promise.resolve(null));
  const readLTFTRef = useRef<() => Promise<number | null>>(() => Promise.resolve(null));
  const readFuelLevelRef = useRef<() => Promise<number | null>>(() => Promise.resolve(null));
  const readO2SensorRef = useRef<() => Promise<number | null>>(() => Promise.resolve(null));
  const readSpeedRef = useRef<() => Promise<number | null>>(() => Promise.resolve(null));
  const readFuelSystemStatusRef = useRef<() => Promise<number | null>>(() => Promise.resolve(null));
  
  // CORREÇÃO v3: Manter speakRef SEMPRE atualizado com a versão mais recente
  // Isso garante que mudanças nas configurações de voz sejam refletidas imediatamente
  useEffect(() => {
    logger.debug('[Refuel] speakRef atualizado - nova função speak recebida');
    speakRef.current = speak;
  }, [speak]);
  
  // Manter reconnectRef atualizado
  useEffect(() => {
    reconnectRef.current = reconnect;
  }, [reconnect]);
  
  // BUG FIX 4: Manter speedRef atualizado (sem recriar interval)
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  
  // AUTO-RECONNECT: Função de reconexão automática durante monitoramento
  const attemptAutoReconnect = useCallback(async (): Promise<boolean> => {
    if (!reconnectRef.current || isReconnectingRef.current) {
      return false;
    }
    
    isReconnectingRef.current = true;
    
    while (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttemptsRef.current++;
      const attempt = reconnectAttemptsRef.current;
      
      logger.debug(`[Refuel] Auto-reconnect attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);
      
      try {
        const success = await reconnectRef.current();
        
        if (success) {
          reconnectAttemptsRef.current = 0;
          isReconnectingRef.current = false;
          return true;
        }
      } catch (error) {
        logger.error(`[Refuel] Reconnect attempt ${attempt} failed:`, error);
      }
      
      // Esperar antes da próxima tentativa
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY_MS));
      }
    }
    
    isReconnectingRef.current = false;
    return false;
  }, []);
  
  // BUG FIX 3 + AUTO-RECONNECT: Detectar desconexão e tentar reconectar automaticamente
  useEffect(() => {
    const wasConnected = isConnectedRef.current;
    isConnectedRef.current = isConnected;
    
    // Detectar desconexão durante monitoramento
    if (wasConnected && !isConnected && mode === 'monitoring') {
      if (!disconnectionAnnouncedRef.current) {
        disconnectionAnnouncedRef.current = true;
        speakRef.current('Atenção. Conexão com o adaptador perdida. Tentando reconectar automaticamente.');
        logger.warn('[Refuel] Bluetooth disconnected during monitoring - attempting auto-reconnect');
        
        // Tentar reconectar automaticamente
        attemptAutoReconnect().then(success => {
          if (success) {
            disconnectionAnnouncedRef.current = false;
            speakRef.current('Conexão restaurada. Monitoramento retomado.');
            logger.log('[Refuel] Auto-reconnect successful');
          } else {
            speakRef.current('Não foi possível reconectar. O monitoramento continua pausado. Verifique o adaptador.');
            logger.error('[Refuel] Auto-reconnect failed after all attempts');
          }
        });
      }
    }
    
    // Reconexão manual durante monitoramento (usuário reconectou por conta própria)
    if (!wasConnected && isConnected && mode === 'monitoring' && disconnectionAnnouncedRef.current) {
      disconnectionAnnouncedRef.current = false;
      reconnectAttemptsRef.current = 0;
      isReconnectingRef.current = false;
      speakRef.current('Conexão restaurada. Monitoramento retomado.');
      logger.log('[Refuel] Bluetooth reconnected during monitoring');
    }
  }, [isConnected, mode, attemptAutoReconnect]);
  
  // Cleanup geral no unmount do componente
  useEffect(() => {
    return () => {
      logger.debug('[Refuel] Unmount - limpando intervalos');
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
    };
  }, []);
  
  // Verificar suporte de PIDs
  const checkPIDSupport = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      const fuelResponse = await sendRawCommand('012F', 2500);
      const fuelSupported = !fuelResponse.includes('NODATA') && 
                           !fuelResponse.includes('ERROR') &&
                           !fuelResponse.includes('UNABLE');
      setFuelLevelSupported(fuelSupported);
      
      const stftResponse = await sendRawCommand('0106', 2500);
      const stftOk = !stftResponse.includes('NODATA') && 
                     !stftResponse.includes('ERROR') &&
                     !stftResponse.includes('UNABLE');
      setStftSupported(stftOk);
      
      logger.debug('[Refuel] PID Support - Fuel Level:', fuelSupported, 'STFT:', stftOk);
    } catch (error) {
      logger.error('[Refuel] Error checking PID support:', error);
    }
  }, [isConnected, sendRawCommand]);
  
  // MUTEX GLOBAL: Ler Fuel Level com proteção de mutex
  const readFuelLevel = useCallback(async (): Promise<number | null> => {
    if (!fuelLevelSupported) return null;
    
    const acquired = await obdMutex.acquire(MUTEX_OWNER, 2, 3000);
    if (!acquired) {
      logger.debug('[Refuel] readFuelLevel ignorado - não conseguiu lock OBD');
      return null;
    }
    
    try {
      const response = await sendRawCommand('012F', 2000);
      const match = response.match(/41\s*2F\s*([0-9A-Fa-f]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        return Math.round(a * 100 / 255);
      }
    } catch (error) {
      logger.error('[Refuel] Error reading fuel level:', error);
    } finally {
      obdMutex.release(MUTEX_OWNER);
    }
    return null;
  }, [fuelLevelSupported, sendRawCommand]);
  
  // MUTEX GLOBAL: Ler STFT com RETRY e timeout maior
  const readSTFT = useCallback(async (): Promise<number | null> => {
    if (stftSupported === false) {
      logger.debug('[Refuel] readSTFT bloqueado - PID não suportado');
      return null;
    }
    
    const acquired = await obdMutex.acquire(MUTEX_OWNER, 2, 3000);
    if (!acquired) {
      logger.debug('[Refuel] readSTFT - não conseguiu lock OBD');
      return null;
    }
    
    // RETRY: Tentar até 2 vezes com timeout maior
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await sendRawCommand('0106', 2500); // Timeout maior
        logger.debug(`[Refuel] STFT attempt ${attempt} raw:`, JSON.stringify(response));
        
        // Limpar resposta - remover espaços extras, newlines, headers
        const cleanResponse = response.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
        
        // Tentar múltiplos formatos de resposta
        const match = cleanResponse.match(/41\s*06\s*([0-9A-F]{2})/i) || 
                      cleanResponse.match(/(?:^|\s)06\s*([0-9A-F]{2})(?:\s|$)/i);
        
        if (match) {
          const a = parseInt(match[1], 16);
          const value = Math.round(((a - 128) * 100 / 128) * 10) / 10;
          logger.debug('[Refuel] STFT parsed:', value);
          obdMutex.release(MUTEX_OWNER);
          return value;
        } else if (!cleanResponse.includes('NODATA') && !cleanResponse.includes('ERROR')) {
          logger.warn(`[Refuel] STFT attempt ${attempt} - unexpected format:`, cleanResponse);
        }
      } catch (error) {
        logger.error(`[Refuel] STFT attempt ${attempt} error:`, error);
      }
      
      // Pequeno delay antes de retry
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 150));
      }
    }
    
    obdMutex.release(MUTEX_OWNER);
    return null;
  }, [stftSupported, sendRawCommand]);
  
  // MUTEX GLOBAL: Ler LTFT com RETRY e timeout maior
  const readLTFT = useCallback(async (): Promise<number | null> => {
    const acquired = await obdMutex.acquire(MUTEX_OWNER, 2, 3000);
    if (!acquired) {
      logger.debug('[Refuel] readLTFT - não conseguiu lock OBD');
      return null;
    }
    
    // RETRY: Tentar até 2 vezes
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await sendRawCommand('0107', 2500);
        logger.debug(`[Refuel] LTFT attempt ${attempt} raw:`, JSON.stringify(response));
        
        const cleanResponse = response.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
        
        const match = cleanResponse.match(/41\s*07\s*([0-9A-F]{2})/i) ||
                      cleanResponse.match(/(?:^|\s)07\s*([0-9A-F]{2})(?:\s|$)/i);
        
        if (match) {
          const a = parseInt(match[1], 16);
          const value = Math.round(((a - 128) * 100 / 128) * 10) / 10;
          logger.debug('[Refuel] LTFT parsed:', value);
          obdMutex.release(MUTEX_OWNER);
          return value;
        } else if (!cleanResponse.includes('NODATA') && !cleanResponse.includes('ERROR')) {
          logger.warn(`[Refuel] LTFT attempt ${attempt} - unexpected format:`, cleanResponse);
        }
      } catch (error) {
        logger.error(`[Refuel] LTFT attempt ${attempt} error:`, error);
      }
      
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 150));
      }
    }
    
    obdMutex.release(MUTEX_OWNER);
    return null;
  }, [sendRawCommand]);
  
  // MUTEX GLOBAL: Ler velocidade diretamente do OBD (quando polling do dashboard está pausado)
  const readSpeed = useCallback(async (): Promise<number | null> => {
    const acquired = await obdMutex.acquire(MUTEX_OWNER, 2, 2000);
    if (!acquired) {
      logger.debug('[Refuel] readSpeed - não conseguiu lock OBD');
      return null;
    }
    
    try {
      const response = await sendRawCommand('010D', 2000);
      const cleanResponse = response.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
      
      // Verificar erros conhecidos
      if (cleanResponse.includes('NODATA') || 
          cleanResponse.includes('ERROR') ||
          cleanResponse.includes('TIMEOUT') ||
          cleanResponse.includes('UNABLE') ||
          cleanResponse.includes('STOPPED')) {
        return null;
      }
      
      const match = cleanResponse.match(/41\s*0D\s*([0-9A-F]{2})/i);
      if (match) {
        const speed = parseInt(match[1], 16); // km/h diretamente
        logger.debug('[Refuel] Speed parsed from OBD:', speed);
        return speed;
      }
    } catch (error) {
      logger.error('[Refuel] Error reading speed:', error);
    } finally {
      obdMutex.release(MUTEX_OWNER);
    }
    
    return null;
  }, [sendRawCommand]);
  
  // MUTEX GLOBAL: Ler O2 Sensor (Sonda Lambda) - PID 0114 Bank 1 Sensor 1
  const readO2Sensor = useCallback(async (): Promise<number | null> => {
    const acquired = await obdMutex.acquire(MUTEX_OWNER, 2, 2000);
    if (!acquired) {
      logger.debug('[Refuel] readO2Sensor - não conseguiu lock OBD');
      return null;
    }
    
    try {
      const response = await sendRawCommand('0114', 2000);
      const cleanResponse = response.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
      
      if (cleanResponse.includes('NODATA') || 
          cleanResponse.includes('ERROR') ||
          cleanResponse.includes('UNABLE')) {
        return null;
      }
      
      // Resposta: 41 14 AA BB - AA = voltage (A/200), BB = STFT (não usado aqui)
      const match = cleanResponse.match(/41\s*14\s*([0-9A-F]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        const voltage = a / 200; // 0-1.275V
        logger.debug('[Refuel] O2 Sensor parsed:', voltage.toFixed(3), 'V');
        return voltage;
      }
    } catch (error) {
      logger.error('[Refuel] Error reading O2 sensor:', error);
    } finally {
      obdMutex.release(MUTEX_OWNER);
    }
    
    return null;
  }, [sendRawCommand]);
  
  // MUTEX GLOBAL: Ler Fuel System Status (PID 03) - Detecta Open/Closed Loop
  const readFuelSystemStatus = useCallback(async (): Promise<number | null> => {
    const acquired = await obdMutex.acquire(MUTEX_OWNER, 2, 2000);
    if (!acquired) {
      logger.debug('[Refuel] readFuelSystemStatus - não conseguiu lock OBD');
      return null;
    }
    
    try {
      const response = await sendRawCommand('0103', 2000);
      const cleanResponse = response.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
      
      if (cleanResponse.includes('NODATA') || 
          cleanResponse.includes('ERROR') ||
          cleanResponse.includes('UNABLE')) {
        return null;
      }
      
      // Resposta: 41 03 XX [YY] - XX = status sistema 1, YY = status sistema 2 (opcional)
      const match = cleanResponse.match(/41\s*03\s*([0-9A-F]{2})/i);
      if (match) {
        const statusValue = parseInt(match[1], 16);
        logger.debug('[Refuel] Fuel System Status raw:', statusValue);
        return statusValue;
      }
    } catch (error) {
      logger.error('[Refuel] Error reading Fuel System Status:', error);
    } finally {
      obdMutex.release(MUTEX_OWNER);
    }
    
    return null;
  }, [sendRawCommand]);
  
  // Manter refs de funções atualizados
  useEffect(() => {
    readSTFTRef.current = readSTFT;
    readLTFTRef.current = readLTFT;
    readFuelLevelRef.current = readFuelLevel;
    readSpeedRef.current = readSpeed;
    readO2SensorRef.current = readO2Sensor;
    readFuelSystemStatusRef.current = readFuelSystemStatus;
  }, [readSTFT, readLTFT, readFuelLevel, readSpeed, readO2Sensor, readFuelSystemStatus]);
  
  // CONSTANTE: Delay de sincronização para aguardar polling pausar
  const POLLING_SYNC_DELAY_MS = 600;
  
  // Iniciar modo abastecimento (fluxo completo)
  const startRefuelMode = useCallback(async () => {
    logger.debug('[Refuel] startRefuelMode - Iniciando modo abastecimento');
    
    // PASSO 1: Definir modo PRIMEIRO para acionar pausa do polling no Index.tsx
    setFlowType('refuel');
    flowTypeRef.current = 'refuel';
    setMode('waiting');
    
    // PASSO 2: Aguardar polling do dashboard pausar
    // O useEffect no Index.tsx reage à mudança de mode e chama stopPolling()
    logger.debug('[Refuel] Aguardando polling pausar...');
    await new Promise(r => setTimeout(r, POLLING_SYNC_DELAY_MS));
    
    // PASSO 3: Agora é seguro ler do OBD (sem conflito com polling)
    const levelBefore = await readFuelLevel();
    logger.debug('[Refuel] startRefuelMode - Nível ANTES de abastecer:', levelBefore);
    
    setCurrentRefuel({
      fuelLevelBefore: levelBefore,
    });
    setFuelTrimHistory([]);
    setDistanceMonitored(0);
    distanceRef.current = 0;
    setAnomalyActive(false);
    setAnomalyDuration(0);
    stftSamplesRef.current = [];
    initialLTFTRef.current = null;
    anomalyStartRef.current = null;
    
    // Limpar settings congelados
    setFrozenSettings(null);
    frozenSettingsRef.current = null;
    
    // Resetar refs de timing
    lastUpdateTimestampRef.current = null;
    lastUIUpdateRef.current = 0;
    lastFuelTrimReadRef.current = 0;
    lastFuelLevelReadRef.current = 0;
    
    // Resetar refs de alerta
    lastAnomalyAlertTimeRef.current = 0;
    anomalyRecoveryAnnouncedRef.current = false;
    announcedMilestonesRef.current.clear();
    readFailureCountRef.current = 0;
    
    if (levelBefore !== null) {
      await speak(`Modo abastecimento ativado. Nível atual: ${levelBefore} porcento. Abasteça e confirme os dados.`);
    } else {
      await speak('Modo abastecimento ativado. Abasteça e confirme os dados quando terminar.');
    }
  }, [readFuelLevel, speak]);
  
  // Iniciar teste rápido de combustível (sem salvar dados)
  const startQuickTest = useCallback(async () => {
    logger.debug('[Refuel] startQuickTest - Iniciando teste rápido');
    logger.debug('[Refuel] Função speak recebida:', typeof speak);
    
    // Verificar se STFT é suportado (bloqueia apenas se explicitamente false)
    if (stftSupported === false) {
      await speak('Este veículo não suporta leitura de Fuel Trim. Teste não disponível.');
      return;
    }
    
    // PASSO 1: Definir modo PRIMEIRO para acionar pausa do polling no Index.tsx
    // IMPORTANTE: Isso deve acontecer ANTES de qualquer leitura OBD
    setFlowType('quick-test');
    flowTypeRef.current = 'quick-test';
    setMode('waiting-quick');
    
    // Preparar estado inicial (sem leituras OBD ainda)
    setCurrentRefuel({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      pricePerLiter: 0,
      litersAdded: 0,
      totalPaid: 0,
      fuelLevelBefore: null,
      fuelLevelAfter: null,
      quality: 'unknown',
    });
    
    setFuelTrimHistory([]);
    setDistanceMonitored(0);
    distanceRef.current = 0;
    setAnomalyActive(false);
    setAnomalyDuration(0);
    stftSamplesRef.current = [];
    anomalyStartRef.current = null;
    
    // Limpar settings congelados
    setFrozenSettings(null);
    frozenSettingsRef.current = null;
    
    // Resetar refs de timing
    lastUpdateTimestampRef.current = null;
    lastUIUpdateRef.current = 0;
    lastFuelTrimReadRef.current = 0;
    lastFuelLevelReadRef.current = 0;
    
    // Resetar refs de alerta
    lastAnomalyAlertTimeRef.current = 0;
    anomalyRecoveryAnnouncedRef.current = false;
    announcedMilestonesRef.current.clear();
    readFailureCountRef.current = 0;
    
    // PASSO 2: Aguardar polling do dashboard pausar
    // O useEffect no Index.tsx reage à mudança de mode e chama stopPolling()
    logger.debug('[Refuel] Aguardando polling pausar antes de ler LTFT...');
    await new Promise(r => setTimeout(r, POLLING_SYNC_DELAY_MS));
    
    // PASSO 3: Agora é seguro ler LTFT inicial (sem conflito com polling)
    initialLTFTRef.current = await readLTFT();
    logger.debug('[Refuel] LTFT inicial lido após pausa do polling:', initialLTFTRef.current);
    
    // Usar speak diretamente (não speakRef) para garantir versão mais recente
    logger.debug('[Refuel] Anunciando início do teste rápido com voz configurada');
    await speak('Teste de combustível ativado. Comece a dirigir para iniciar a análise.');
  }, [stftSupported, speak, readLTFT]);
  
  // Confirmar dados do abastecimento
  // BUG FIX: Só bloquear se stftSupported === false (não quando null/verificando)
  const confirmRefuel = useCallback(async (pricePerLiter: number, litersAdded: number, stationName?: string) => {
    if (stftSupported === false) {
      await speak('Este veículo não suporta monitoramento de Fuel Trim. Registrando abastecimento sem análise de qualidade.');
      
      const entry: Partial<RefuelEntry> = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        pricePerLiter,
        litersAdded,
        totalPaid: pricePerLiter * litersAdded,
        stationName,
        quality: 'unknown',
        stftAverage: 0,
        ltftDelta: 0,
        distanceMonitored: 0,
        anomalyDetected: false,
      };
      
      if (userId) {
        try {
          await supabase.from('refuel_entries').insert({
            user_id: userId,
            timestamp: new Date(entry.timestamp!).toISOString(),
            price_per_liter: entry.pricePerLiter,
            liters_added: entry.litersAdded,
            total_paid: entry.totalPaid,
            station_name: stationName || null,
            quality: 'unknown',
            stft_average: 0,
            ltft_delta: 0,
            distance_monitored: 0,
            anomaly_detected: false,
          });
        } catch (error) {
          logger.error('[Refuel] Error saving to database:', error);
        }
      }
      
      if (onFuelPriceUpdate) {
        onFuelPriceUpdate(pricePerLiter);
      }
      
      setMode('inactive');
      return;
    }
    
    const totalPaid = pricePerLiter * litersAdded;
    const fuelLevelAfterRefuel = await readFuelLevel();
    const savedLevelBefore = currentRefuel?.fuelLevelBefore ?? null;
    
    logger.debug('[Refuel] confirmRefuel - Níveis:', {
      antes: savedLevelBefore,
      depois: fuelLevelAfterRefuel,
      litrosInformados: litersAdded,
      tanque: settings.tankCapacity,
      posto: stationName,
    });
    
    setCurrentRefuel(prev => ({
      ...prev,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      pricePerLiter,
      litersAdded,
      totalPaid,
      stationName,
      fuelLevelAfter: fuelLevelAfterRefuel,
      tankCapacity: settings.tankCapacity,
      quality: 'unknown',
      stftAverage: 0,
      ltftDelta: 0,
      distanceMonitored: 0,
      anomalyDetected: false,
    }));
    
    if (onFuelPriceUpdate) {
      onFuelPriceUpdate(pricePerLiter);
    }
    
    initialLTFTRef.current = await readLTFT();
    
    if (savedLevelBefore !== null && fuelLevelAfterRefuel !== null) {
      await speak(`Dados registrados. Tanque subiu de ${savedLevelBefore} para ${fuelLevelAfterRefuel} porcento. Inicie o trajeto para análise.`);
    } else {
      await speak('Dados registrados. Quando iniciar o trajeto, começarei a análise do combustível.');
    }
  }, [stftSupported, speak, userId, onFuelPriceUpdate, readFuelLevel, currentRefuel?.fuelLevelBefore, readLTFT, settings.tankCapacity]);
  
  // Cancelar modo abastecimento
  const cancelRefuel = useCallback(() => {
    logger.debug('[Refuel] cancelRefuel - Limpando estado');
    
    // BUG FIX 1: Capturar flowType ANTES de limpar para mensagem correta
    const wasQuickTest = flowTypeRef.current === 'quick-test';
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    // Limpar flowType DEPOIS de capturar
    setFlowType(null);
    flowTypeRef.current = null;
    
    setMode('inactive');
    setCurrentRefuel(null);
    setFuelTrimHistory([]);
    setDistanceMonitored(0);
    distanceRef.current = 0;
    setAnomalyActive(false);
    setAnomalyDuration(0);
    setCurrentSTFT(null);
    setCurrentLTFT(null);
    setCurrentFuelLevel(null);
    
    // Limpar settings congelados
    setFrozenSettings(null);
    frozenSettingsRef.current = null;
    
    stftSamplesRef.current = [];
    initialLTFTRef.current = null;
    anomalyStartRef.current = null;
    isMonitoringActiveRef.current = false;
    lastUpdateTimestampRef.current = null;
    readFailureCountRef.current = 0;
    
    // Usar variável capturada (wasQuickTest) em vez de flowTypeRef.current (já null)
    speak(wasQuickTest ? 'Teste cancelado.' : 'Modo abastecimento cancelado.');
  }, [speak]);
  
  // Analisar qualidade do combustível
  const analyzeQuality = useCallback((samples: number[]): FuelQuality => {
    if (samples.length === 0) return 'unknown';
    
    // CORREÇÃO v2: Usar settings congelados durante análise
    const currentSettings = frozenSettingsRef.current || settings;
    
    const avgSTFT = samples.reduce((a, b) => a + b, 0) / samples.length;
    const absAvg = Math.abs(avgSTFT);
    const exceededWarning = samples.filter(s => Math.abs(s) > currentSettings.stftWarningThreshold).length;
    const exceededCritical = samples.filter(s => Math.abs(s) > currentSettings.stftCriticalThreshold).length;
    
    const exceedPercentWarning = (exceededWarning / samples.length) * 100;
    const exceedPercentCritical = (exceededCritical / samples.length) * 100;
    
    logger.debug('[Refuel] analyzeQuality:', {
      avgSTFT,
      samples: samples.length,
      exceededWarning,
      exceededCritical,
      exceedPercentWarning,
      exceedPercentCritical,
    });
    
    if (exceedPercentCritical > 30 || absAvg > currentSettings.stftCriticalThreshold) {
      return 'critical';
    }
    if (exceedPercentWarning > 20 || absAvg > currentSettings.stftWarningThreshold) {
      return 'warning';
    }
    return 'ok';
  }, [settings]);
  
  // Gerar mensagem de progresso
  const getProgressMessage = useCallback((milestone: number, hasAnomaly: boolean): string => {
    if (hasAnomaly) {
      return `${milestone} porcento do monitoramento. Atenção: anomalias detectadas. Continuando análise.`;
    }
    switch (milestone) {
      case 25:
        return `${milestone} porcento do monitoramento concluído. Combustível dentro do esperado até agora.`;
      case 50:
        return `Metade do monitoramento. Leituras estáveis. Parece combustível de qualidade.`;
      case 75:
        return `${milestone} porcento concluído. Quase lá. Combustível aparenta estar normal.`;
      default:
        return `${milestone} porcento do monitoramento concluído.`;
    }
  }, []);
  
  // Finalizar análise usando Fuel State Machine
  const finalizeAnalysis = useCallback(async () => {
    logger.debug('[Refuel] finalizeAnalysis - Iniciando conclusão com State Machine');
    
    // Parar monitoramento imediatamente
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    isMonitoringActiveRef.current = false;
    
    setMode('analyzing');
    
    // CORREÇÃO v2: Usar settings congelados para análise final
    const currentSettings = frozenSettingsRef.current || settings;
    
    // Ler valores finais
    const finalFuelLevel = await readFuelLevelRef.current();
    const finalLTFT = await readLTFTRef.current();
    const finalO2 = await readO2SensorRef.current();
    
    // Pegar dados de monitoramento acumulados
    const data = monitoringDataRef.current || createInitialMonitoringData();
    
    // Atualizar dados finais
    const finalData: FuelMonitoringData = {
      ...data,
      ltftCurrent: finalLTFT,
      ltftDelta: finalLTFT !== null && data.ltftInitial !== null 
        ? finalLTFT - data.ltftInitial 
        : data.ltftDelta,
      distanceMonitored: distanceRef.current,
      monitoringDuration: (Date.now() - data.monitoringStartTime) / 1000,
    };
    
    // Se temos O2, adicionar leitura final
    if (finalO2 !== null) {
      const o2Reading: O2SensorReading = {
        voltage: finalO2,
        timestamp: Date.now(),
        isLean: finalO2 < DEFAULT_FUEL_THRESHOLDS.o2LeanThreshold,
        isRich: finalO2 > DEFAULT_FUEL_THRESHOLDS.o2RichThreshold,
      };
      finalData.o2Readings = [...finalData.o2Readings, o2Reading];
      finalData.o2Average = finalData.o2Readings.reduce((a, b) => a + b.voltage, 0) / finalData.o2Readings.length;
    }
    
    // === USAR A STATE MACHINE ===
    const forensicDiagnosis = evaluateFuelState(finalData, fuelContextRef.current);
    logger.debug('[Refuel] Forensic Diagnosis:', forensicDiagnosis);
    
    // Mapear estado para qualidade legada (para compatibilidade)
    const qualityMap: Record<string, FuelQuality> = {
      'stable': 'ok',
      'adapting': 'ok', // Adaptação é OK
      'suspicious': 'warning',
      'contaminated': 'critical',
      'mechanical': 'critical',
    };
    const quality = qualityMap[forensicDiagnosis.state] || 'unknown';
    
    // Salvar resultado forense
    setForensicResult(forensicDiagnosis);
    setMonitoringData(finalData);
    
    // Calcular precisão da bomba
    let pumpAccuracyPercent: number | undefined;
    const levelBefore = currentRefuel?.fuelLevelBefore;
    const levelAfter = currentRefuel?.fuelLevelAfter;
    const litersAdded = currentRefuel?.litersAdded;
    
    if (levelBefore !== undefined && levelBefore !== null && 
        levelAfter !== undefined && levelAfter !== null && 
        litersAdded !== undefined && litersAdded !== null) {
      const percentDiff = levelAfter - levelBefore;
      const expectedLiters = (percentDiff / 100) * currentSettings.tankCapacity;
      if (expectedLiters > 0) {
        pumpAccuracyPercent = (litersAdded / expectedLiters) * 100;
      }
    }
    
    // Atualizar estado final
    setCurrentRefuel(prev => ({
      ...prev,
      quality,
      stftAverage: finalData.stftAverage,
      ltftDelta: finalData.ltftDelta,
      distanceMonitored: distanceRef.current,
      anomalyDetected: forensicDiagnosis.anomalyDetected,
      anomalyDetails: forensicDiagnosis.anomalyDetails,
      pumpAccuracyPercent,
      fuelLevelAfter: finalFuelLevel ?? prev?.fuelLevelAfter,
    }));
    
    // Salvar no Supabase APENAS se for fluxo de abastecimento E usuário autenticado
    const isRefuelFlow = flowTypeRef.current === 'refuel';
    if (isRefuelFlow && userId && currentRefuel) {
      try {
        const insertData = {
          user_id: userId,
          timestamp: new Date(currentRefuel.timestamp || Date.now()).toISOString(),
          price_per_liter: currentRefuel.pricePerLiter || 0,
          liters_added: currentRefuel.litersAdded || 0,
          total_paid: currentRefuel.totalPaid || 0,
          fuel_level_before: currentRefuel.fuelLevelBefore ?? null,
          fuel_level_after: finalFuelLevel ?? currentRefuel.fuelLevelAfter ?? null,
          tank_capacity: currentSettings.tankCapacity,
          station_name: currentRefuel.stationName || null,
          quality,
          stft_average: finalData.stftAverage,
          ltft_delta: finalData.ltftDelta,
          distance_monitored: distanceRef.current,
          anomaly_detected: forensicDiagnosis.anomalyDetected,
          anomaly_details: forensicDiagnosis.anomalyDetails || null,
          pump_accuracy_percent: pumpAccuracyPercent ?? null,
          // Novos campos forenses
          fuel_context: fuelContextRef.current,
          fuel_state: forensicDiagnosis.state,
          o2_avg: finalData.o2Average,
          ltft_final: finalLTFT,
          adaptation_complete: forensicDiagnosis.adaptationComplete,
        };
        
        await supabase.from('refuel_entries').insert(insertData);
        logger.debug('[Refuel] Dados forenses salvos no Supabase');
      } catch (error) {
        logger.error('[Refuel] Error saving to database:', error);
      }
    } else if (!isRefuelFlow) {
      logger.debug('[Refuel] Teste rápido - dados não salvos no banco');
    }
    
    // Anunciar resultado com mensagem baseada no estado forense
    logger.debug('[Refuel] Anunciando resultado forense');
    const announcement = getForensicAnnouncement(forensicDiagnosis, distanceRef.current);
    await speakRef.current(announcement);
    
    // Marcar como concluído
    setMode('completed');
    
    // Limpar settings congelados após conclusão
    setFrozenSettings(null);
    frozenSettingsRef.current = null;
    
  }, [currentRefuel, analyzeQuality, userId, settings]);
  
  // Gerar anúncio baseado no diagnóstico forense
  const getForensicAnnouncement = (result: FuelDiagnosticResult, distance: number): string => {
    const distStr = distance.toFixed(1);
    
    switch (result.state) {
      case 'stable':
        return `Análise concluída em ${distStr} quilômetros. Combustível aprovado! ${result.recommendation}`;
      case 'adapting':
        return `Análise concluída em ${distStr} quilômetros. A ECU está adaptando ao novo combustível. Isso é normal para veículos Flex. ${result.recommendation}`;
      case 'suspicious':
        return `Análise concluída em ${distStr} quilômetros. Atenção: valores fora do esperado. ${result.recommendation}`;
      case 'contaminated':
        return `Análise concluída em ${distStr} quilômetros. Alerta crítico! Combustível possivelmente adulterado. ${result.recommendation}`;
      case 'mechanical':
        return `Análise concluída em ${distStr} quilômetros. Detectado possível problema mecânico, não relacionado ao combustível. ${result.recommendation}`;
      default:
        return `Análise concluída em ${distStr} quilômetros. ${result.recommendation}`;
    }
  };
  
  // Gerar anúncio de qualidade
  const getQualityAnnouncement = (quality: FuelQuality, avgSTFT: number, ltftDelta: number, distance: number): string => {
    const distStr = distance.toFixed(1);
    
    switch (quality) {
      case 'ok':
        return `Análise concluída em ${distStr} quilômetros. Combustível aprovado! Fuel Trim médio de ${Math.abs(avgSTFT).toFixed(0)} porcento, dentro do esperado.`;
      case 'warning':
        return `Análise concluída em ${distStr} quilômetros. Atenção: Fuel Trim médio de ${Math.abs(avgSTFT).toFixed(0)} porcento. Combustível pode estar fora de especificação. Monitore o consumo nos próximos dias.`;
      case 'critical':
        return `Análise concluída em ${distStr} quilômetros. Alerta crítico! Fuel Trim médio de ${Math.abs(avgSTFT).toFixed(0)} porcento. Combustível possivelmente adulterado. Considere drenar o tanque e abastecer em posto confiável.`;
      default:
        return `Análise concluída em ${distStr} quilômetros. Não foi possível determinar a qualidade do combustível.`;
    }
  };
  
  // Gerar anúncio para teste rápido (mais curto, sem dados financeiros)
  const getQuickTestAnnouncement = (quality: FuelQuality, avgSTFT: number): string => {
    switch (quality) {
      case 'ok':
        return `Teste concluído. Combustível OK! Fuel Trim médio de ${Math.abs(avgSTFT).toFixed(0)} porcento, dentro do normal.`;
      case 'warning':
        return `Teste concluído. Atenção: Fuel Trim elevado em ${Math.abs(avgSTFT).toFixed(0)} porcento. Pode haver problema com o combustível.`;
      case 'critical':
        return `Teste concluído. Alerta crítico! Fuel Trim em ${Math.abs(avgSTFT).toFixed(0)} porcento. Combustível possivelmente adulterado.`;
      default:
        return `Teste concluído. Não foi possível determinar a qualidade do combustível.`;
    }
  };
  
  // CORREÇÃO: Loop de PRÉ-LEITURA durante waiting (lê velocidade + Fuel Trim antes de andar)
  // Isso resolve o dead lock: polling pausado → velocidade congelada → refuel não funciona
  // CORREÇÃO v2: Delay inicial de 1s para garantir que polling está completamente pausado
  useEffect(() => {
    const isWaiting = mode === 'waiting' || mode === 'waiting-quick';
    if (!isWaiting || !isConnected) return;
    
    logger.debug('[Refuel] Preparando loop de pré-leitura (aguardando polling pausar)');
    
    // Resetar velocidade interna ao entrar no modo waiting
    internalSpeedRef.current = 0;
    setInternalSpeed(0);
    
    // Ref para guardar o interval (para cleanup correto)
    let preReadInterval: NodeJS.Timeout | null = null;
    
    // CORREÇÃO: Delay inicial de 1 segundo para garantir que:
    // 1. O Index.tsx já executou stopPolling()
    // 2. Qualquer leitura pendente do polling terminou
    // 3. O barramento Bluetooth está livre
    const startupDelay = setTimeout(() => {
      logger.debug('[Refuel] Iniciando loop de pré-leitura (velocidade + Fuel Trim)');
      
      preReadInterval = setInterval(async () => {
        logger.debug('[Refuel] Pre-read tick - isConnected:', isConnectedRef.current);
        
        if (!isConnectedRef.current) {
          logger.debug('[Refuel] Pre-read - desconectado, pulando');
          return;
        }
        
        // 1. Ler velocidade diretamente do OBD
        const obdSpeed = await readSpeedRef.current();
        if (obdSpeed !== null) {
          internalSpeedRef.current = obdSpeed;
          setInternalSpeed(obdSpeed);
          logger.debug('[Refuel] Pre-read - velocidade OBD:', obdSpeed);
        }
        
        // 2. Ler Fuel Trim (para mostrar valores antes de andar)
        const stft = await readSTFTRef.current();
        const ltft = await readLTFTRef.current();
        
        if (stft !== null) {
          setCurrentSTFT(stft);
          logger.debug('[Refuel] Pre-read - STFT:', stft);
        }
        if (ltft !== null) {
          setCurrentLTFT(ltft);
          logger.debug('[Refuel] Pre-read - LTFT:', ltft);
        }
      }, 2000); // A cada 2 segundos após o delay inicial
    }, 1000); // Aguardar 1 segundo antes de iniciar pré-leitura
    
    return () => {
      logger.debug('[Refuel] Cleanup loop de pré-leitura');
      clearTimeout(startupDelay);
      if (preReadInterval) {
        clearInterval(preReadInterval);
      }
    };
  }, [mode, isConnected]);
  
  // Detectar início de movimento (waiting ou waiting-quick -> monitoring)
  // CORREÇÃO: Usar internalSpeed (lido diretamente do OBD) em vez de speed (prop congelada)
  useEffect(() => {
    const isWaiting = mode === 'waiting' || mode === 'waiting-quick';
    
    // Usar velocidade interna (lida do OBD) como fonte primária
    const effectiveSpeed = internalSpeedRef.current > 0 ? internalSpeedRef.current : speed;
    
    if (isWaiting && effectiveSpeed > 5 && !isMonitoringActiveRef.current) {
      // Para waiting normal, precisa ter currentRefuel
      if (mode === 'waiting' && !currentRefuel) return;
      
      isMonitoringActiveRef.current = true;
      
      // Congelar settings ANTES de iniciar monitoramento
      const frozen = { ...settings };
      frozenSettingsRef.current = frozen;
      setFrozenSettings(frozen);
      logger.debug('[Refuel] Settings congelados para monitoramento:', frozen.monitoringDistance, 'km', '| FlowType:', flowTypeRef.current, '| Context:', fuelContextRef.current);
      
      // Inicializar dados de monitoramento para State Machine
      const initialData = createInitialMonitoringData();
      initialData.ltftInitial = initialLTFTRef.current;
      monitoringDataRef.current = initialData;
      setMonitoringData(initialData);
      
      setMode('monitoring');
      startOdometerRef.current = 0;
      distanceRef.current = 0;
      lastUpdateTimestampRef.current = Date.now();
      
      // Resetar refs de alerta
      lastAnomalyAlertTimeRef.current = 0;
      anomalyRecoveryAnnouncedRef.current = false;
      announcedMilestonesRef.current.clear();
      readFailureCountRef.current = 0;
      
      // Anunciar com mensagem apropriada ao fluxo
      const isQuickTest = flowTypeRef.current === 'quick-test';
      if (isQuickTest) {
        speak(`Teste iniciado. Analisarei ${frozen.monitoringDistance} quilômetros.`);
      } else {
        speak(`Monitoramento iniciado. Analisarei os primeiros ${frozen.monitoringDistance} quilômetros.`);
      }
    }
  }, [mode, currentRefuel, speed, internalSpeed, speak, settings]);
  
  // CORREÇÃO v2: LOOP UNIFICADO DE MONITORAMENTO com dependência mínima
  // Usa refs para funções e settings congelados
  useEffect(() => {
    if (mode !== 'monitoring') return;
    
    // Limpar intervalo anterior antes de criar novo
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    logger.debug('[Refuel] Iniciando loop unificado de monitoramento (500ms)');
    
    // Inicializar timestamps
    lastUpdateTimestampRef.current = Date.now();
    lastUIUpdateRef.current = Date.now();
    lastFuelTrimReadRef.current = 0;
    lastFuelLevelReadRef.current = 0;
    
    monitoringIntervalRef.current = setInterval(async () => {
      const now = Date.now();
      
      // CORREÇÃO v2: Usar settings congelados (imutáveis durante sessão)
      const currentSettings = frozenSettingsRef.current;
      if (!currentSettings) {
        logger.warn('[Refuel] Settings congelados não disponíveis');
        return;
      }
      
      // DEBUG: Log de estado a cada tick
      logger.debug('[Refuel] Loop tick:', {
        isConnected: isConnectedRef.current,
        speed: speedRef.current,
        stftSupported,
        distance: distanceRef.current.toFixed(3),
        mode,
      });
      
      // BUG FIX 3: Verificar conexão antes de tentar leituras OBD
      if (!isConnectedRef.current) {
        logger.debug('[Refuel] Pulando leitura OBD - desconectado');
        // Apenas atualizar UI, não tenta ler OBD
        if (now - lastUIUpdateRef.current >= UI_UPDATE_THROTTLE) {
          setDistanceMonitored(distanceRef.current);
          lastUIUpdateRef.current = now;
        }
        return; // Pular leituras OBD enquanto desconectado
      }
      
      // ========== 0. LER VELOCIDADE DIRETAMENTE DO OBD ==========
      // CORREÇÃO: Polling do dashboard está pausado, então lemos velocidade nós mesmos
      const obdSpeed = await readSpeedRef.current();
      if (obdSpeed !== null) {
        internalSpeedRef.current = obdSpeed;
        setInternalSpeed(obdSpeed);
      }
      
      // Usar velocidade interna (lida do OBD) como fonte primária
      const currentSpeed = internalSpeedRef.current > 0 ? internalSpeedRef.current : speedRef.current;
      
      // ========== 1. CALCULAR DISTÂNCIA (TIMESTAMP-BASED) ==========
      // CORREÇÃO v2: Só acumula distância quando velocidade >= 3 km/h
      if (lastUpdateTimestampRef.current) {
        const deltaTime = (now - lastUpdateTimestampRef.current) / 1000; // segundos
        
        if (currentSpeed >= 3) {
          const kmThisTick = (currentSpeed / 3600) * deltaTime;
          distanceRef.current += kmThisTick;
        }
        // Timestamp sempre atualizado (mesmo parado) para delta correto
      }
      lastUpdateTimestampRef.current = now;
      
      // ========== 2. ATUALIZAR UI (THROTTLED 1s) ==========
      if (now - lastUIUpdateRef.current >= UI_UPDATE_THROTTLE) {
        const newDistance = distanceRef.current;
        setDistanceMonitored(newDistance);
        lastUIUpdateRef.current = now;
        
        // Log para debug
        const progressPercent = (newDistance / currentSettings.monitoringDistance) * 100;
        logger.debug(`[Refuel] Distance: ${newDistance.toFixed(3)} km / ${currentSettings.monitoringDistance} km (${progressPercent.toFixed(1)}%) @ ${currentSpeed} km/h`);
      }
      
      // ========== 2.5 VERIFICAR CLOSED LOOP ANTES DE FUEL TRIM ==========
      // PID 03 indica se a ECU está usando feedback do O2 (dados confiáveis)
      // CORREÇÃO: Usar flag em vez de return prematuro para permitir seções 4-6
      let skipFuelTrimRead = false;
      
      if (now - lastFuelSystemCheckRef.current >= FUEL_SYSTEM_CHECK_THROTTLE) {
        lastFuelSystemCheckRef.current = now;
        
        const rawStatus = await readFuelSystemStatusRef.current();
        if (rawStatus !== null) {
          const status = decodeFuelSystemStatus(rawStatus);
          setFuelSystemStatus(status);
          
          const inClosedLoop = isClosedLoop(status);
          setIsClosedLoopActive(inClosedLoop);
          
          // Detectar mudança de estado para anunciar
          if (isClosedLoopRef.current !== inClosedLoop) {
            if (!inClosedLoop) {
              // Entrou em Open Loop - pausar coleta
              if (status === 'open_loop_cold' && !closedLoopAnnouncedRef.current) {
                speakRef.current('Aguardando aquecimento do motor. A análise será retomada quando atingir temperatura ideal.');
                closedLoopAnnouncedRef.current = true;
              } else if (status === 'open_loop_load' && !closedLoopAnnouncedRef.current) {
                speakRef.current('Aceleração detectada. Análise pausada temporariamente.');
                closedLoopAnnouncedRef.current = true;
              }
            } else {
              // Voltou ao Closed Loop - retomar coleta
              if (closedLoopAnnouncedRef.current) {
                speakRef.current('Motor aquecido. Retomando análise de combustível.');
                closedLoopAnnouncedRef.current = false;
              }
            }
            isClosedLoopRef.current = inClosedLoop;
          }
          
          // CORREÇÃO: Flag para pular Fuel Trim, NÃO return prematuro
          if (!inClosedLoop) {
            logger.debug('[Refuel] Open Loop detectado:', status, '- pulando leitura de Fuel Trim');
            skipFuelTrimRead = true;
          }
        }
      } else {
        // Se não verificou PID 03 neste ciclo, usar estado anterior do ref
        skipFuelTrimRead = !isClosedLoopRef.current;
      }
      
      // ========== 3. LER FUEL TRIM (THROTTLED 2s) - SÓ SE CLOSED LOOP ==========
      // CORREÇÃO: Usa flag skipFuelTrimRead para pausar apenas esta seção
      if (!skipFuelTrimRead && now - lastFuelTrimReadRef.current >= FUEL_TRIM_THROTTLE) {
        lastFuelTrimReadRef.current = now;
        
        const stft = await readSTFTRef.current();
        const ltft = await readLTFTRef.current();
        
        if (stft === null) {
          readFailureCountRef.current++;
          if (readFailureCountRef.current === MAX_READ_FAILURES) {
            speakRef.current('Atenção. Dificuldade na leitura do Fuel Trim. Verifique a conexão com o adaptador.');
          }
        } else {
          readFailureCountRef.current = 0;
          setCurrentSTFT(stft);
          stftSamplesRef.current.push(stft);
          
          // Verificar anomalia
          const absSTFT = Math.abs(stft);
          const isCritical = absSTFT > currentSettings.stftCriticalThreshold;
          const isWarning = absSTFT > currentSettings.stftWarningThreshold;
          
          if (isWarning) {
            if (!anomalyStartRef.current) {
              anomalyStartRef.current = Date.now();
              anomalyRecoveryAnnouncedRef.current = false;
            }
            const duration = (Date.now() - anomalyStartRef.current) / 1000;
            setAnomalyDuration(duration);
            setAnomalyActive(true);
            
            const timeSinceLastAlert = (now - lastAnomalyAlertTimeRef.current) / 1000;
            
            if (duration >= currentSettings.anomalyDurationWarning && timeSinceLastAlert >= 30) {
              lastAnomalyAlertTimeRef.current = now;
              const direction = stft > 0 ? 'pobre' : 'rica';
              const progress = Math.round((distanceRef.current / currentSettings.monitoringDistance) * 100);
              
              if (isCritical) {
                speakRef.current(`Alerta crítico! STFT em ${Math.abs(stft).toFixed(0)} porcento. Mistura ${direction}. Progresso: ${progress} porcento. Combustível suspeito.`);
              } else {
                speakRef.current(`Atenção. Correção de ${Math.abs(stft).toFixed(0)} porcento detectada. Mistura ${direction}. Análise em ${progress} porcento.`);
              }
            }
          } else {
            if (anomalyStartRef.current && !anomalyRecoveryAnnouncedRef.current) {
              const durationInAnomaly = (Date.now() - anomalyStartRef.current) / 1000;
              if (durationInAnomaly >= 5) {
                speakRef.current('Fuel Trim estabilizou. Valores normais restaurados.');
                anomalyRecoveryAnnouncedRef.current = true;
              }
            }
            anomalyStartRef.current = null;
            setAnomalyActive(false);
            setAnomalyDuration(0);
          }
        }
        
        if (ltft !== null) {
          setCurrentLTFT(ltft);
        }
        
        // ========== 3.5 LER O2 SENSOR (Sonda Lambda) ==========
        const o2 = await readO2SensorRef.current();
        if (o2 !== null) {
          setCurrentO2(o2);
        }
        
        // ========== 3.6 ATUALIZAR MONITORING DATA (State Machine) ==========
        if (stft !== null && monitoringDataRef.current) {
          // Criar leitura O2 se disponível
          let o2Reading: O2SensorReading | undefined;
          if (o2 !== null) {
            o2Reading = {
              voltage: o2,
              timestamp: Date.now(),
              isLean: o2 < DEFAULT_FUEL_THRESHOLDS.o2LeanThreshold,
              isRich: o2 > DEFAULT_FUEL_THRESHOLDS.o2RichThreshold,
            };
          }
          
          // Adicionar sample aos dados de monitoramento
          const updatedData = addSample(
            monitoringDataRef.current,
            stft,
            ltft,
            o2Reading
          );
          updatedData.distanceMonitored = distanceRef.current;
          
          monitoringDataRef.current = updatedData;
          // Atualizar UI periodicamente (não a cada tick)
          if (now - lastUIUpdateRef.current >= UI_UPDATE_THROTTLE) {
            setMonitoringData(updatedData);
          }
        }
        
        // Adicionar ao histórico só com valores válidos (mantém último valor se null)
        if (stft !== null || ltft !== null) {
          setFuelTrimHistory(prev => {
            const lastEntry = prev[prev.length - 1];
            const updated = [...prev, {
              timestamp: Date.now(),
              stft: stft ?? lastEntry?.stft ?? 0,
              ltft: ltft ?? lastEntry?.ltft ?? 0,
              distance: distanceRef.current,
            }];
            return updated.slice(-500);
          });
        }
      }
      
      // ========== 4. LER FUEL LEVEL INTEGRADO (THROTTLED 5s) ==========
      if (now - lastFuelLevelReadRef.current >= FUEL_LEVEL_THROTTLE) {
        if (fuelLevelSupported) {
          const level = await readFuelLevelRef.current();
          if (level !== null) {
            setCurrentFuelLevel(level);
          }
          lastFuelLevelReadRef.current = now;
        }
      }
      
      // ========== 5. VERIFICAR MILESTONES (DINÂMICO) ==========
      const progressPercent = (distanceRef.current / currentSettings.monitoringDistance) * 100;
      const milestones = [25, 50, 75];
      
      for (const milestone of milestones) {
        if (progressPercent >= milestone && !announcedMilestonesRef.current.has(milestone)) {
          announcedMilestonesRef.current.add(milestone);
          const hasActiveAnomaly = anomalyStartRef.current !== null;
          speakRef.current(getProgressMessage(milestone, hasActiveAnomaly));
          break; // Só anuncia um milestone por iteração
        }
      }
      
      // ========== 6. VERIFICAR CONCLUSÃO ==========
      if (distanceRef.current >= currentSettings.monitoringDistance) {
        logger.debug(`[Refuel] Distância alcançada: ${distanceRef.current.toFixed(3)} km >= ${currentSettings.monitoringDistance} km`);
        finalizeAnalysis();
      }
      
    }, MONITORING_INTERVAL);
    
    // Cleanup adequado
    return () => {
      logger.debug('[Refuel] Cleanup do loop de monitoramento');
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
    };
  // BUG FIX 4: Dependências mínimas - apenas mode (speed via ref, não recria interval)
  // Funções via refs, settings via frozenSettingsRef, speed via speedRef
  }, [mode, fuelLevelSupported, getProgressMessage, finalizeAnalysis]);
  
  // Cleanup quando modo muda para inactive ou completed
  useEffect(() => {
    if (mode === 'inactive' || mode === 'completed') {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      isMonitoringActiveRef.current = false;
    }
  }, [mode]);
  
  // Handler para atualizar fuelContext com ref sincronizado
  const handleSetFuelContext = useCallback((ctx: FuelChangeContext) => {
    setFuelContext(ctx);
    fuelContextRef.current = ctx;
  }, []);
  
  return {
    mode,
    flowType,
    currentRefuel,
    fuelTrimHistory,
    fuelLevelSupported,
    stftSupported,
    currentSTFT,
    currentLTFT,
    currentO2,
    currentFuelLevel,
    distanceMonitored,
    anomalyActive,
    anomalyDuration,
    settings,
    frozenSettings,
    // State Machine
    fuelContext,
    setFuelContext: handleSetFuelContext,
    forensicResult,
    monitoringData,
    // O2 Sensor data
    o2Readings,
    o2FrozenDuration,
    // Closed Loop detection
    fuelSystemStatus,
    isClosedLoopActive,
    // Ações
    startRefuelMode,
    startQuickTest,
    confirmRefuel,
    cancelRefuel,
    checkPIDSupport,
  };
}
