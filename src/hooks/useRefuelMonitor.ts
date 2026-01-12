// Hook para monitoramento de qualidade de combustível
// Analisa Fuel Trim após abastecimento para detectar adulteração
// Arquitetura: Loop unificado de 500ms com cálculo preciso baseado em timestamp

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  RefuelMode, 
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
const MILESTONE_ANNOUNCE_DELAY = 500; // Delay entre anúncios de milestone

interface UseRefuelMonitorOptions {
  speed: number;
  sendRawCommand: (command: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  speak: (text: string) => void;
  onFuelPriceUpdate?: (price: number) => void;
  userId?: string;
  settings?: RefuelSettings;
}

interface UseRefuelMonitorReturn {
  mode: RefuelMode;
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
  startRefuelMode: () => void;
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
}: UseRefuelMonitorOptions): UseRefuelMonitorReturn {
  // Estados principais
  const [mode, setMode] = useState<RefuelMode>('inactive');
  const [currentRefuel, setCurrentRefuel] = useState<Partial<RefuelEntry> | null>(null);
  const [fuelTrimHistory, setFuelTrimHistory] = useState<FuelTrimSample[]>([]);
  
  // Usar settings externas ou padrão
  const settings = externalSettings || defaultRefuelSettings;
  
  // CRÍTICO: Ref para settings - evita stale closure nos intervalos
  const settingsRef = useRef(settings);
  
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
  const fuelLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startOdometerRef = useRef(0);
  const anomalyStartRef = useRef<number | null>(null);
  const stftSamplesRef = useRef<number[]>([]);
  const initialLTFTRef = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const isMonitoringActiveRef = useRef(false);
  const speedRef = useRef(0);
  
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
  
  // Manter settingsRef sincronizado - CRÍTICO para evitar stale closure
  useEffect(() => {
    settingsRef.current = settings;
    console.log('[Refuel] Settings atualizadas:', settings.monitoringDistance, 'km');
  }, [settings]);
  
  // Manter speedRef atualizado
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  
  // Cleanup geral no unmount do componente
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      if (fuelLevelIntervalRef.current) {
        clearInterval(fuelLevelIntervalRef.current);
        fuelLevelIntervalRef.current = null;
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
  
  // Ler Fuel Level (PID 012F)
  const readFuelLevel = useCallback(async (): Promise<number | null> => {
    if (!fuelLevelSupported) return null;
    
    try {
      const response = await sendRawCommand('012F', 2000);
      const match = response.match(/41\s*2F\s*([0-9A-Fa-f]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        return Math.round(a * 100 / 255);
      }
    } catch (error) {
      console.error('[Refuel] Error reading fuel level:', error);
    }
    return null;
  }, [fuelLevelSupported, sendRawCommand]);
  
  // Ler STFT (PID 0106)
  const readSTFT = useCallback(async (): Promise<number | null> => {
    if (!stftSupported) return null;
    
    try {
      const response = await sendRawCommand('0106', 2000);
      const match = response.match(/41\s*06\s*([0-9A-Fa-f]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        return Math.round(((a - 128) * 100 / 128) * 10) / 10;
      }
    } catch (error) {
      console.error('[Refuel] Error reading STFT:', error);
    }
    return null;
  }, [stftSupported, sendRawCommand]);
  
  // Ler LTFT (PID 0107)
  const readLTFT = useCallback(async (): Promise<number | null> => {
    try {
      const response = await sendRawCommand('0107', 2000);
      const match = response.match(/41\s*07\s*([0-9A-Fa-f]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        return Math.round(((a - 128) * 100 / 128) * 10) / 10;
      }
    } catch (error) {
      console.error('[Refuel] Error reading LTFT:', error);
    }
    return null;
  }, [sendRawCommand]);
  
  // Iniciar modo abastecimento
  const startRefuelMode = useCallback(async () => {
    const levelBefore = await readFuelLevel();
    
    console.log('[Refuel] startRefuelMode - Nível ANTES de abastecer:', levelBefore);
    
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
      speak(`Modo abastecimento ativado. Nível atual: ${levelBefore} porcento. Abasteça e confirme os dados.`);
    } else {
      speak('Modo abastecimento ativado. Abasteça e confirme os dados quando terminar.');
    }
  }, [readFuelLevel, speak]);
  
  // Confirmar dados do abastecimento
  const confirmRefuel = useCallback(async (pricePerLiter: number, litersAdded: number) => {
    if (!stftSupported) {
      speak('Este veículo não suporta monitoramento de Fuel Trim. Registrando abastecimento sem análise de qualidade.');
      
      const entry: Partial<RefuelEntry> = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        pricePerLiter,
        litersAdded,
        totalPaid: pricePerLiter * litersAdded,
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
      tanque: settingsRef.current.tankCapacity,
    });
    
    setCurrentRefuel(prev => ({
      ...prev,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      pricePerLiter,
      litersAdded,
      totalPaid,
      fuelLevelAfter: fuelLevelAfterRefuel,
      tankCapacity: settingsRef.current.tankCapacity,
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
      speak(`Dados registrados. Tanque subiu de ${savedLevelBefore} para ${fuelLevelAfterRefuel} porcento. Inicie o trajeto para análise.`);
    } else {
      speak('Dados registrados. Quando iniciar o trajeto, começarei a análise do combustível.');
    }
  }, [stftSupported, currentRefuel, readFuelLevel, readLTFT, onFuelPriceUpdate, userId, speak]);
  
  // Cancelar modo abastecimento
  const cancelRefuel = useCallback(() => {
    setMode('inactive');
    setCurrentRefuel(null);
    setFuelTrimHistory([]);
    setDistanceMonitored(0);
    distanceRef.current = 0;
    setAnomalyActive(false);
    setAnomalyDuration(0);
    isMonitoringActiveRef.current = false;
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  }, []);
  
  // Analisar qualidade do combustível
  const analyzeQuality = useCallback((): FuelQuality => {
    const samples = stftSamplesRef.current;
    if (samples.length === 0) return 'unknown';
    
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const absAvg = Math.abs(avg);
    
    // Usa settingsRef para ter valores atuais
    if (absAvg <= settingsRef.current.stftWarningThreshold) return 'ok';
    if (absAvg <= settingsRef.current.stftCriticalThreshold) return 'warning';
    return 'critical';
  }, []);
  
  // Helper para mensagens de progresso contextuais
  const getProgressMessage = useCallback((milestone: number, hasAnomaly: boolean): string => {
    if (hasAnomaly) {
      const messages: Record<number, string> = {
        25: 'Vinte e cinco por cento. Correções elevadas detectadas. Continuando análise.',
        50: 'Metade da análise. Anomalias persistem. Recomendo atenção.',
        75: 'Setenta e cinco por cento. Finalizando com observações de irregularidade.',
      };
      return messages[milestone] || '';
    }
    
    const messages: Record<number, string> = {
      25: 'Vinte e cinco por cento da análise concluída. Fuel Trim estável até agora.',
      50: 'Metade da análise concluída. Adaptação de combustível dentro do normal.',
      75: 'Setenta e cinco por cento concluído. Quase finalizando. Tudo normal.',
    };
    return messages[milestone] || '';
  }, []);
  
  // Finalizar análise
  const finalizeAnalysis = useCallback(async () => {
    if (!currentRefuel) return;
    
    setMode('analyzing');
    isMonitoringActiveRef.current = false;
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    const fuelLevelAfterDriving = await readFuelLevel();
    const currentLTFTValue = await readLTFT();
    
    const samples = stftSamplesRef.current;
    const stftAverage = samples.length > 0 
      ? samples.reduce((a, b) => a + b, 0) / samples.length 
      : 0;
    
    const ltftDelta = initialLTFTRef.current !== null && currentLTFTValue !== null
      ? currentLTFTValue - initialLTFTRef.current
      : 0;
    
    const quality = analyzeQuality();
    const finalDistance = distanceRef.current;
    
    // Calcular precisão da bomba
    let pumpAccuracyPercent: number | undefined;
    const levelBefore = currentRefuel.fuelLevelBefore;
    const levelAfter = currentRefuel.fuelLevelAfter;
    
    console.log('[Refuel] finalizeAnalysis - Cálculo precisão bomba:', {
      levelBefore,
      levelAfter,
      litersAdded: currentRefuel.litersAdded,
      tankCapacity: settingsRef.current.tankCapacity,
      levelAfterDriving: fuelLevelAfterDriving,
    });
    
    if (
      levelBefore !== null && 
      levelBefore !== undefined &&
      levelAfter !== null && 
      levelAfter !== undefined &&
      currentRefuel.litersAdded &&
      levelAfter > levelBefore
    ) {
      const expectedIncrease = (currentRefuel.litersAdded / settingsRef.current.tankCapacity) * 100;
      const actualIncrease = levelAfter - levelBefore;
      
      if (expectedIncrease > 0 && actualIncrease > 0) {
        pumpAccuracyPercent = Math.round((actualIncrease / expectedIncrease) * 100);
        pumpAccuracyPercent = Math.max(50, Math.min(150, pumpAccuracyPercent));
        
        console.log('[Refuel] Precisão calculada:', {
          expectedIncrease: expectedIncrease.toFixed(1),
          actualIncrease,
          accuracy: pumpAccuracyPercent,
        });
      }
    }
    
    const finalEntry: RefuelEntry = {
      ...(currentRefuel as RefuelEntry),
      quality,
      stftAverage: Math.round(stftAverage * 10) / 10,
      ltftDelta: Math.round(ltftDelta * 10) / 10,
      distanceMonitored: finalDistance,
      anomalyDetected: quality !== 'ok' && quality !== 'unknown',
      anomalyDetails: quality === 'warning' 
        ? `STFT médio de ${stftAverage.toFixed(1)}% indica possível combustível de baixa qualidade.`
        : quality === 'critical'
        ? `STFT médio de ${stftAverage.toFixed(1)}% indica anomalia grave. Recomendado abastecer em outro posto.`
        : undefined,
      pumpAccuracyPercent,
    };
    
    setCurrentRefuel(finalEntry);
    
    if (userId) {
      try {
        await supabase.from('refuel_entries').insert({
          user_id: userId,
          timestamp: new Date(finalEntry.timestamp).toISOString(),
          price_per_liter: finalEntry.pricePerLiter,
          liters_added: finalEntry.litersAdded,
          total_paid: finalEntry.totalPaid,
          fuel_level_before: finalEntry.fuelLevelBefore,
          fuel_level_after: finalEntry.fuelLevelAfter,
          tank_capacity: finalEntry.tankCapacity,
          quality: finalEntry.quality,
          stft_average: finalEntry.stftAverage,
          ltft_delta: finalEntry.ltftDelta,
          distance_monitored: finalEntry.distanceMonitored,
          anomaly_detected: finalEntry.anomalyDetected,
          anomaly_details: finalEntry.anomalyDetails,
          pump_accuracy_percent: finalEntry.pumpAccuracyPercent,
        });
      } catch (error) {
        console.error('[Refuel] Error saving to database:', error);
      }
    }
    
    // Anunciar resultado
    if (quality === 'ok') {
      speak('Análise concluída. Combustível aprovado. Adaptação de injeção normal.');
    } else if (quality === 'warning') {
      speak(`Análise concluída. Detectei anomalias na mistura. STFT médio de ${stftAverage.toFixed(0)} porcento. Recomendo abastecer em outro posto no próximo tanque.`);
    } else if (quality === 'critical') {
      speak(`Atenção! Anomalia grave detectada. A injeção está corrigindo ${Math.abs(stftAverage).toFixed(0)} porcento. Combustível de baixa qualidade confirmado.`);
    }
    
    // Feedback sobre precisão da bomba (usa fila de voz, não setTimeout)
    if (pumpAccuracyPercent !== undefined && pumpAccuracyPercent >= 50) {
      setTimeout(() => {
        if (pumpAccuracyPercent! < 85) {
          speak(`Atenção: a bomba entregou ${100 - pumpAccuracyPercent!} porcento menos que o indicado. Considere denunciar ao INMETRO.`);
        } else if (pumpAccuracyPercent! > 115) {
          speak('Curioso: o sensor detectou mais combustível que o esperado. Pode ser calibração do sensor do veículo.');
        } else {
          speak('Bomba verificada. Quantidade entregue confere com o sensor do veículo.');
        }
      }, 3000);
    }
    
    // Feedback sobre salvamento
    setTimeout(() => {
      if (userId) {
        speak('Dados salvos no seu histórico de abastecimentos.');
      } else {
        speak('Faça login para salvar seu histórico de abastecimentos na nuvem.');
      }
    }, pumpAccuracyPercent !== undefined ? 6000 : 2000);
    
    setMode('completed');
  }, [currentRefuel, readFuelLevel, readLTFT, analyzeQuality, userId, speak]);
  
  // Detectar início de movimento (waiting -> monitoring)
  useEffect(() => {
    if (mode === 'waiting' && currentRefuel && speed > 5 && !isMonitoringActiveRef.current) {
      isMonitoringActiveRef.current = true;
      setMode('monitoring');
      startOdometerRef.current = 0;
      distanceRef.current = 0;
      lastUpdateTimestampRef.current = Date.now();
      
      // Resetar refs de alerta
      lastAnomalyAlertTimeRef.current = 0;
      anomalyRecoveryAnnouncedRef.current = false;
      announcedMilestonesRef.current.clear();
      readFailureCountRef.current = 0;
      
      // Anunciar com a distância configurada ATUAL
      speak(`Monitoramento iniciado. Analisarei os primeiros ${settingsRef.current.monitoringDistance} quilômetros.`);
    }
  }, [mode, currentRefuel, speed, speak]);
  
  // LOOP UNIFICADO DE MONITORAMENTO (500ms)
  useEffect(() => {
    if (mode !== 'monitoring') return;
    if (monitoringIntervalRef.current) return; // Já tem intervalo ativo
    
    console.log('[Refuel] Iniciando loop unificado de monitoramento (500ms)');
    
    // Inicializar timestamps
    lastUpdateTimestampRef.current = Date.now();
    lastUIUpdateRef.current = Date.now();
    lastFuelTrimReadRef.current = 0;
    lastFuelLevelReadRef.current = 0;
    
    monitoringIntervalRef.current = setInterval(async () => {
      const now = Date.now();
      const currentSettings = settingsRef.current; // Sempre pega settings atuais
      const currentSpeed = speedRef.current;
      
      // ========== 1. CALCULAR DISTÂNCIA (TIMESTAMP-BASED) ==========
      if (currentSpeed >= 3 && lastUpdateTimestampRef.current) {
        const deltaTime = (now - lastUpdateTimestampRef.current) / 1000; // segundos
        const kmThisTick = (currentSpeed / 3600) * deltaTime;
        distanceRef.current += kmThisTick;
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
        
        const stft = await readSTFT();
        const ltft = await readLTFT();
        
        if (stft === null) {
          readFailureCountRef.current++;
          if (readFailureCountRef.current === MAX_READ_FAILURES) {
            speak('Atenção. Dificuldade na leitura do Fuel Trim. Verifique a conexão com o adaptador.');
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
                speak(`Alerta crítico! STFT em ${Math.abs(stft).toFixed(0)} porcento. Mistura ${direction}. Progresso: ${progress} porcento. Combustível suspeito.`);
              } else {
                speak(`Atenção. Correção de ${Math.abs(stft).toFixed(0)} porcento detectada. Mistura ${direction}. Análise em ${progress} porcento.`);
              }
            }
          } else {
            if (anomalyStartRef.current && !anomalyRecoveryAnnouncedRef.current) {
              const durationInAnomaly = (Date.now() - anomalyStartRef.current) / 1000;
              if (durationInAnomaly >= 5) {
                speak('Fuel Trim estabilizou. Valores normais restaurados.');
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
        
        // Adicionar ao histórico
        setFuelTrimHistory(prev => [...prev, {
          timestamp: Date.now(),
          stft: stft ?? 0,
          ltft: ltft ?? 0,
          distance: distanceRef.current,
        }]);
      }
      
      // ========== 4. VERIFICAR MILESTONES (DINÂMICO) ==========
      const progressPercent = (distanceRef.current / currentSettings.monitoringDistance) * 100;
      const milestones = [25, 50, 75];
      
      for (const milestone of milestones) {
        if (progressPercent >= milestone && !announcedMilestonesRef.current.has(milestone)) {
          announcedMilestonesRef.current.add(milestone);
          const hasActiveAnomaly = anomalyStartRef.current !== null;
          speak(getProgressMessage(milestone, hasActiveAnomaly));
          break; // Só anuncia um milestone por iteração
        }
      }
      
      // ========== 5. VERIFICAR CONCLUSÃO ==========
      if (distanceRef.current >= currentSettings.monitoringDistance) {
        console.log(`[Refuel] Distância alcançada: ${distanceRef.current.toFixed(3)} km >= ${currentSettings.monitoringDistance} km`);
        finalizeAnalysis();
      }
      
    }, MONITORING_INTERVAL);
    
    return () => {
      // Cleanup é feito no finalizeAnalysis ou cancelRefuel
    };
  }, [mode, readSTFT, readLTFT, speak, getProgressMessage, finalizeAnalysis]);
  
  // Polling de nível de combustível
  useEffect(() => {
    if (fuelLevelSupported && isConnected && (mode === 'monitoring' || mode === 'waiting')) {
      fuelLevelIntervalRef.current = setInterval(async () => {
        const level = await readFuelLevel();
        setCurrentFuelLevel(level);
      }, FUEL_LEVEL_THROTTLE);
      
      return () => {
        if (fuelLevelIntervalRef.current) {
          clearInterval(fuelLevelIntervalRef.current);
          fuelLevelIntervalRef.current = null;
        }
      };
    }
  }, [fuelLevelSupported, isConnected, mode, readFuelLevel]);
  
  // Cleanup quando modo muda para inactive ou completed
  useEffect(() => {
    if (mode === 'inactive' || mode === 'completed') {
      isMonitoringActiveRef.current = false;
      
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
    }
  }, [mode]);
  
  return {
    mode,
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
    startRefuelMode,
    confirmRefuel,
    cancelRefuel,
    checkPIDSupport,
  };
}
