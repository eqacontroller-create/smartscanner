// Hook para monitoramento de qualidade de combustível
// Analisa Fuel Trim após abastecimento para detectar adulteração
// Arquitetura: Loop unificado de 500ms com cálculo preciso baseado em timestamp
// CORREÇÃO: Sistema de fila de voz, cleanup adequado, mutex OBD, loop unificado
// CORREÇÃO v2: Settings congelados durante monitoramento, cálculo de distância corrigido

import { useState, useRef, useCallback, useEffect } from 'react';
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

// Constantes de timing
const MONITORING_INTERVAL = 500;      // Loop principal: 500ms para precisão
const UI_UPDATE_THROTTLE = 1000;      // Atualizar UI a cada 1s
const FUEL_TRIM_THROTTLE = 2000;      // Ler Fuel Trim a cada 2s
const FUEL_LEVEL_THROTTLE = 5000;     // Ler nível de combustível a cada 5s

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
  currentFuelLevel: number | null;
  distanceMonitored: number;
  anomalyActive: boolean;
  anomalyDuration: number;
  settings: RefuelSettings;
  frozenSettings: RefuelSettings | null;
  startRefuelMode: () => void;
  startQuickTest: () => void;
  confirmRefuel: (pricePerLiter: number, litersAdded: number) => void;
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
  const [currentFuelLevel, setCurrentFuelLevel] = useState<number | null>(null);
  const [distanceMonitored, setDistanceMonitored] = useState(0);
  
  // Anomalias
  const [anomalyActive, setAnomalyActive] = useState(false);
  const [anomalyDuration, setAnomalyDuration] = useState(0);
  
  // Refs para monitoramento (evitar re-renders e memory leaks)
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startOdometerRef = useRef(0);
  const anomalyStartRef = useRef<number | null>(null);
  const stftSamplesRef = useRef<number[]>([]);
  const initialLTFTRef = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const isMonitoringActiveRef = useRef(false);
  
  // CORREÇÃO 4: Mutex para leituras OBD
  const isReadingOBDRef = useRef(false);
  
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
  
  // CORREÇÃO v3: Manter speakRef SEMPRE atualizado com a versão mais recente
  // Isso garante que mudanças nas configurações de voz sejam refletidas imediatamente
  useEffect(() => {
    console.log('[Refuel] speakRef atualizado - nova função speak recebida');
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
      
      console.log(`[Refuel] Auto-reconnect attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);
      
      try {
        const success = await reconnectRef.current();
        
        if (success) {
          reconnectAttemptsRef.current = 0;
          isReconnectingRef.current = false;
          return true;
        }
      } catch (error) {
        console.error(`[Refuel] Reconnect attempt ${attempt} failed:`, error);
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
        console.warn('[Refuel] Bluetooth disconnected during monitoring - attempting auto-reconnect');
        
        // Tentar reconectar automaticamente
        attemptAutoReconnect().then(success => {
          if (success) {
            disconnectionAnnouncedRef.current = false;
            speakRef.current('Conexão restaurada. Monitoramento retomado.');
            console.log('[Refuel] Auto-reconnect successful');
          } else {
            speakRef.current('Não foi possível reconectar. O monitoramento continua pausado. Verifique o adaptador.');
            console.error('[Refuel] Auto-reconnect failed after all attempts');
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
      console.log('[Refuel] Bluetooth reconnected during monitoring');
    }
  }, [isConnected, mode, attemptAutoReconnect]);
  
  // Cleanup geral no unmount do componente
  useEffect(() => {
    return () => {
      console.log('[Refuel] Unmount - limpando intervalos');
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
      
      console.log('[Refuel] PID Support - Fuel Level:', fuelSupported, 'STFT:', stftOk);
    } catch (error) {
      console.error('[Refuel] Error checking PID support:', error);
    }
  }, [isConnected, sendRawCommand]);
  
  // CORREÇÃO 4: Ler Fuel Level com proteção de mutex
  const readFuelLevel = useCallback(async (): Promise<number | null> => {
    if (!fuelLevelSupported) return null;
    if (isReadingOBDRef.current) {
      console.log('[Refuel] readFuelLevel ignorado - outra leitura em andamento');
      return null;
    }
    
    isReadingOBDRef.current = true;
    try {
      const response = await sendRawCommand('012F', 2000);
      const match = response.match(/41\s*2F\s*([0-9A-Fa-f]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        return Math.round(a * 100 / 255);
      }
    } catch (error) {
      console.error('[Refuel] Error reading fuel level:', error);
    } finally {
      isReadingOBDRef.current = false;
    }
    return null;
  }, [fuelLevelSupported, sendRawCommand]);
  
  // CORREÇÃO 4: Ler STFT com proteção de mutex
  // BUG FIX: Só bloquear se stftSupported === false (não quando null/verificando)
  const readSTFT = useCallback(async (): Promise<number | null> => {
    if (stftSupported === false) {
      console.log('[Refuel] readSTFT bloqueado - PID não suportado');
      return null;
    }
    if (isReadingOBDRef.current) {
      console.log('[Refuel] readSTFT ignorado - outra leitura em andamento');
      return null;
    }
    
    isReadingOBDRef.current = true;
    try {
      const response = await sendRawCommand('0106', 2000);
      console.log('[Refuel] STFT raw response:', response);
      const match = response.match(/41\s*06\s*([0-9A-Fa-f]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        const value = Math.round(((a - 128) * 100 / 128) * 10) / 10;
        console.log('[Refuel] STFT parsed:', value);
        return value;
      }
    } catch (error) {
      console.error('[Refuel] Error reading STFT:', error);
    } finally {
      isReadingOBDRef.current = false;
    }
    return null;
  }, [stftSupported, sendRawCommand]);
  
  // CORREÇÃO 4: Ler LTFT com proteção de mutex
  const readLTFT = useCallback(async (): Promise<number | null> => {
    if (isReadingOBDRef.current) {
      console.log('[Refuel] readLTFT ignorado - outra leitura em andamento');
      return null;
    }
    
    isReadingOBDRef.current = true;
    try {
      const response = await sendRawCommand('0107', 2000);
      console.log('[Refuel] LTFT raw response:', response);
      const match = response.match(/41\s*07\s*([0-9A-Fa-f]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        const value = Math.round(((a - 128) * 100 / 128) * 10) / 10;
        console.log('[Refuel] LTFT parsed:', value);
        return value;
      }
    } catch (error) {
      console.error('[Refuel] Error reading LTFT:', error);
    } finally {
      isReadingOBDRef.current = false;
    }
    return null;
  }, [sendRawCommand]);
  
  // Manter refs de funções atualizados
  useEffect(() => {
    readSTFTRef.current = readSTFT;
    readLTFTRef.current = readLTFT;
    readFuelLevelRef.current = readFuelLevel;
  }, [readSTFT, readLTFT, readFuelLevel]);
  
  // Iniciar modo abastecimento (fluxo completo)
  const startRefuelMode = useCallback(async () => {
    const levelBefore = await readFuelLevel();
    
    console.log('[Refuel] startRefuelMode - Nível ANTES de abastecer:', levelBefore);
    
    // Definir fluxo como abastecimento
    setFlowType('refuel');
    flowTypeRef.current = 'refuel';
    
    setMode('waiting');
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
    console.log('[Refuel] startQuickTest - Iniciando teste rápido');
    console.log('[Refuel] Função speak recebida:', typeof speak);
    
    // Verificar se STFT é suportado (bloqueia apenas se explicitamente false)
    if (stftSupported === false) {
      await speak('Este veículo não suporta leitura de Fuel Trim. Teste não disponível.');
      return;
    }
    
    // Definir fluxo como teste rápido
    setFlowType('quick-test');
    flowTypeRef.current = 'quick-test';
    
    // Definir modo como waiting-quick (sem necessidade de dados)
    setMode('waiting-quick');
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
    initialLTFTRef.current = await readLTFT();
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
    
    // Usar speak diretamente (não speakRef) para garantir versão mais recente
    console.log('[Refuel] Anunciando início do teste rápido com voz configurada');
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
          console.error('[Refuel] Error saving to database:', error);
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
    
    console.log('[Refuel] confirmRefuel - Níveis:', {
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
    console.log('[Refuel] cancelRefuel - Limpando estado');
    
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
    
    console.log('[Refuel] analyzeQuality:', {
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
  
  // Finalizar análise
  const finalizeAnalysis = useCallback(async () => {
    console.log('[Refuel] finalizeAnalysis - Iniciando conclusão');
    
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
    
    // Calcular resultados
    const quality = analyzeQuality(stftSamplesRef.current);
    const avgSTFT = stftSamplesRef.current.length > 0
      ? stftSamplesRef.current.reduce((a, b) => a + b, 0) / stftSamplesRef.current.length
      : 0;
    const ltftDelta = finalLTFT !== null && initialLTFTRef.current !== null
      ? finalLTFT - initialLTFTRef.current
      : 0;
    
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
    
    const anomalyDetected = quality === 'warning' || quality === 'critical';
    
    // Atualizar estado final
    setCurrentRefuel(prev => ({
      ...prev,
      quality,
      stftAverage: avgSTFT,
      ltftDelta,
      distanceMonitored: distanceRef.current,
      anomalyDetected,
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
          stft_average: avgSTFT,
          ltft_delta: ltftDelta,
          distance_monitored: distanceRef.current,
          anomaly_detected: anomalyDetected,
          anomaly_details: anomalyDetected ? `STFT médio: ${avgSTFT.toFixed(1)}%, Delta LTFT: ${ltftDelta.toFixed(1)}%` : null,
          pump_accuracy_percent: pumpAccuracyPercent ?? null,
        };
        
        await supabase.from('refuel_entries').insert(insertData);
        console.log('[Refuel] Dados salvos no Supabase');
      } catch (error) {
        console.error('[Refuel] Error saving to database:', error);
      }
    } else if (!isRefuelFlow) {
      console.log('[Refuel] Teste rápido - dados não salvos no banco');
    }
    
    // Anunciar resultado (mensagem diferente por fluxo)
    // CORREÇÃO v3: Log de debug para confirmar que speakRef está atualizado
    console.log('[Refuel] Anunciando resultado final com speakRef.current');
    if (isRefuelFlow) {
      await speakRef.current(getQualityAnnouncement(quality, avgSTFT, ltftDelta, distanceRef.current));
    } else {
      console.log('[Refuel] Teste rápido - anunciando resultado');
      await speakRef.current(getQuickTestAnnouncement(quality, avgSTFT));
    }
    
    // Marcar como concluído
    setMode('completed');
    
    // Limpar settings congelados após conclusão
    setFrozenSettings(null);
    frozenSettingsRef.current = null;
    
  }, [currentRefuel, analyzeQuality, userId, settings]);
  
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
  
  // Detectar início de movimento (waiting ou waiting-quick -> monitoring)
  // Congelar settings ao iniciar monitoramento
  useEffect(() => {
    const isWaiting = mode === 'waiting' || mode === 'waiting-quick';
    
    if (isWaiting && speed > 5 && !isMonitoringActiveRef.current) {
      // Para waiting normal, precisa ter currentRefuel
      if (mode === 'waiting' && !currentRefuel) return;
      
      isMonitoringActiveRef.current = true;
      
      // Congelar settings ANTES de iniciar monitoramento
      const frozen = { ...settings };
      frozenSettingsRef.current = frozen;
      setFrozenSettings(frozen);
      console.log('[Refuel] Settings congelados para monitoramento:', frozen.monitoringDistance, 'km', '| FlowType:', flowTypeRef.current);
      
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
  }, [mode, currentRefuel, speed, speak, settings]);
  
  // CORREÇÃO v2: LOOP UNIFICADO DE MONITORAMENTO com dependência mínima
  // Usa refs para funções e settings congelados
  useEffect(() => {
    if (mode !== 'monitoring') return;
    
    // Limpar intervalo anterior antes de criar novo
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    console.log('[Refuel] Iniciando loop unificado de monitoramento (500ms)');
    
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
        console.warn('[Refuel] Settings congelados não disponíveis');
        return;
      }
      
      // DEBUG: Log de estado a cada tick
      console.log('[Refuel] Loop tick:', {
        isConnected: isConnectedRef.current,
        speed: speedRef.current,
        stftSupported,
        distance: distanceRef.current.toFixed(3),
        mode,
      });
      
      // BUG FIX 3: Verificar conexão antes de tentar leituras OBD
      if (!isConnectedRef.current) {
        console.log('[Refuel] Pulando leitura OBD - desconectado');
        // Apenas atualizar UI, não tenta ler OBD
        if (now - lastUIUpdateRef.current >= UI_UPDATE_THROTTLE) {
          setDistanceMonitored(distanceRef.current);
          lastUIUpdateRef.current = now;
        }
        return; // Pular leituras OBD enquanto desconectado
      }
      
      // BUG FIX 4: Usar speedRef.current (via ref, não closure)
      const currentSpeed = speedRef.current;
      
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
        console.log(`[Refuel] Distance: ${newDistance.toFixed(3)} km / ${currentSettings.monitoringDistance} km (${progressPercent.toFixed(1)}%) @ ${currentSpeed} km/h`);
      }
      
      // ========== 3. LER FUEL TRIM (THROTTLED 2s) ==========
      if (now - lastFuelTrimReadRef.current >= FUEL_TRIM_THROTTLE) {
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
        
        // Adicionar ao histórico (Limitar a 500 amostras)
        setFuelTrimHistory(prev => {
          const updated = [...prev, {
            timestamp: Date.now(),
            stft: stft ?? 0,
            ltft: ltft ?? 0,
            distance: distanceRef.current,
          }];
          return updated.slice(-500);
        });
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
        console.log(`[Refuel] Distância alcançada: ${distanceRef.current.toFixed(3)} km >= ${currentSettings.monitoringDistance} km`);
        finalizeAnalysis();
      }
      
    }, MONITORING_INTERVAL);
    
    // Cleanup adequado
    return () => {
      console.log('[Refuel] Cleanup do loop de monitoramento');
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
  
  return {
    mode,
    flowType,
    currentRefuel,
    fuelTrimHistory,
    fuelLevelSupported,
    stftSupported,
    currentSTFT,
    currentLTFT,
    currentFuelLevel,
    distanceMonitored,
    anomalyActive,
    anomalyDuration,
    settings,
    frozenSettings,
    startRefuelMode,
    startQuickTest,
    confirmRefuel,
    cancelRefuel,
    checkPIDSupport,
  };
}
