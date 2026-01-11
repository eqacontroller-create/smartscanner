// Hook para monitoramento de qualidade de combustível
// Analisa Fuel Trim após abastecimento para detectar adulteração

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

interface UseRefuelMonitorOptions {
  speed: number;
  sendRawCommand: (command: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  speak: (text: string) => void;
  onFuelPriceUpdate?: (price: number) => void;
  userId?: string;
  settings?: RefuelSettings; // Configurações externas opcionais
}

interface UseRefuelMonitorReturn {
  // Estado do modo
  mode: RefuelMode;
  currentRefuel: Partial<RefuelEntry> | null;
  fuelTrimHistory: FuelTrimSample[];
  
  // Suporte de PIDs
  fuelLevelSupported: boolean | null;
  stftSupported: boolean | null;
  
  // Dados atuais
  currentSTFT: number | null;
  currentLTFT: number | null;
  currentFuelLevel: number | null;
  distanceMonitored: number;
  
  // Anomalias
  anomalyActive: boolean;
  anomalyDuration: number;
  
  // Configurações
  settings: RefuelSettings;
  
  // Ações
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
  const distanceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fuelLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startOdometerRef = useRef(0);
  const anomalyStartRef = useRef<number | null>(null);
  const stftSamplesRef = useRef<number[]>([]);
  const initialLTFTRef = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const isMonitoringActiveRef = useRef(false);
  const speedRef = useRef(0);
  
  // CORREÇÃO 2: Converter variáveis de alerta para useRef (persistentes entre renders)
  const lastAnomalyAlertTimeRef = useRef(0);
  const anomalyRecoveryAnnouncedRef = useRef(false);
  const announcedMilestonesRef = useRef<Set<number>>(new Set());
  
  // CORREÇÃO 5: Contador de falhas de leitura OBD
  const readFailureCountRef = useRef(0);
  const MAX_READ_FAILURES = 5;
  
  // Manter speedRef atualizado para evitar closure stale no intervalo de distância
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  
  // CORREÇÃO 3: Cleanup geral no unmount do componente
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      if (distanceIntervalRef.current) {
        clearInterval(distanceIntervalRef.current);
        distanceIntervalRef.current = null;
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
      // Verificar PID 012F (Fuel Level)
      const fuelResponse = await sendRawCommand('012F', 2500);
      const fuelSupported = !fuelResponse.includes('NODATA') && 
                           !fuelResponse.includes('ERROR') &&
                           !fuelResponse.includes('UNABLE');
      setFuelLevelSupported(fuelSupported);
      
      // Verificar PID 0106 (STFT Bank 1)
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
  
  // Ler STFT (PID 0106) - Precisão melhorada com 1 casa decimal
  const readSTFT = useCallback(async (): Promise<number | null> => {
    if (!stftSupported) return null;
    
    try {
      const response = await sendRawCommand('0106', 2000);
      const match = response.match(/41\s*06\s*([0-9A-Fa-f]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        // Manter 1 casa decimal para precisão na detecção de anomalias
        return Math.round(((a - 128) * 100 / 128) * 10) / 10;
      }
    } catch (error) {
      console.error('[Refuel] Error reading STFT:', error);
    }
    return null;
  }, [stftSupported, sendRawCommand]);
  
  // Ler LTFT (PID 0107) - Precisão melhorada com 1 casa decimal
  const readLTFT = useCallback(async (): Promise<number | null> => {
    try {
      const response = await sendRawCommand('0107', 2000);
      const match = response.match(/41\s*07\s*([0-9A-Fa-f]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        // Manter 1 casa decimal para precisão
        return Math.round(((a - 128) * 100 / 128) * 10) / 10;
      }
    } catch (error) {
      console.error('[Refuel] Error reading LTFT:', error);
    }
    return null;
  }, [sendRawCommand]);
  
  // CORREÇÃO 1: Iniciar modo abastecimento - captura nível ANTES de abastecer
  const startRefuelMode = useCallback(async () => {
    // Capturar nível ANTES do usuário abastecer fisicamente
    const levelBefore = await readFuelLevel();
    
    console.log('[Refuel] startRefuelMode - Nível ANTES de abastecer:', levelBefore);
    
    setMode('waiting');
    setCurrentRefuel({
      fuelLevelBefore: levelBefore, // Armazena imediatamente (antes de ir à bomba)
    });
    setFuelTrimHistory([]);
    setDistanceMonitored(0);
    distanceRef.current = 0;
    setAnomalyActive(false);
    setAnomalyDuration(0);
    stftSamplesRef.current = [];
    initialLTFTRef.current = null;
    anomalyStartRef.current = null;
    
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
  
  // CORREÇÃO 1: Confirmar dados do abastecimento - NÃO sobrescreve fuelLevelBefore
  const confirmRefuel = useCallback(async (pricePerLiter: number, litersAdded: number) => {
    // Verificar se STFT é suportado antes de continuar
    if (!stftSupported) {
      speak('Este veículo não suporta monitoramento de Fuel Trim. Registrando abastecimento sem análise de qualidade.');
      
      // Salvar entrada sem análise
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
      
      // Salvar no banco se usuário logado
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
      
      // Atualizar preço do combustível
      if (onFuelPriceUpdate) {
        onFuelPriceUpdate(pricePerLiter);
      }
      
      setMode('inactive');
      return;
    }
    
    const totalPaid = pricePerLiter * litersAdded;
    
    // CORREÇÃO 1: Capturar nível DEPOIS do abastecimento físico (antes de dirigir)
    const fuelLevelAfterRefuel = await readFuelLevel();
    
    // Manter o fuelLevelBefore capturado em startRefuelMode
    const savedLevelBefore = currentRefuel?.fuelLevelBefore ?? null;
    
    console.log('[Refuel] confirmRefuel - Níveis:', {
      antes: savedLevelBefore,
      depois: fuelLevelAfterRefuel,
      litrosInformados: litersAdded,
      tanque: settings.tankCapacity,
    });
    
    setCurrentRefuel(prev => ({
      ...prev, // Mantém fuelLevelBefore do startRefuelMode
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      pricePerLiter,
      litersAdded,
      totalPaid,
      fuelLevelAfter: fuelLevelAfterRefuel, // Nível DEPOIS de abastecer
      tankCapacity: settings.tankCapacity,
      quality: 'unknown',
      stftAverage: 0,
      ltftDelta: 0,
      distanceMonitored: 0,
      anomalyDetected: false,
    }));
    
    // Atualizar preço do combustível nas configurações
    if (onFuelPriceUpdate) {
      onFuelPriceUpdate(pricePerLiter);
    }
    
    // Ler LTFT inicial para comparação
    initialLTFTRef.current = await readLTFT();
    
    // Feedback com níveis se disponíveis
    if (savedLevelBefore !== null && fuelLevelAfterRefuel !== null) {
      const increase = fuelLevelAfterRefuel - savedLevelBefore;
      speak(`Dados registrados. Tanque subiu de ${savedLevelBefore} para ${fuelLevelAfterRefuel} porcento. Inicie o trajeto para análise.`);
    } else {
      speak('Dados registrados. Quando iniciar o trajeto, começarei a análise do combustível.');
    }
  }, [stftSupported, currentRefuel, readFuelLevel, readLTFT, settings.tankCapacity, onFuelPriceUpdate, userId, speak]);
  
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
    if (distanceIntervalRef.current) {
      clearInterval(distanceIntervalRef.current);
      distanceIntervalRef.current = null;
    }
  }, []);
  
  // CORREÇÃO 6: Simplificar analyzeQuality - remover redundância
  const analyzeQuality = useCallback((): FuelQuality => {
    const samples = stftSamplesRef.current;
    if (samples.length === 0) return 'unknown';
    
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const absAvg = Math.abs(avg);
    
    // Lógica simplificada sem redundância
    if (absAvg <= settings.stftWarningThreshold) return 'ok';
    if (absAvg <= settings.stftCriticalThreshold) return 'warning';
    return 'critical';
  }, [settings.stftWarningThreshold, settings.stftCriticalThreshold]);
  
  // CORREÇÃO 5: Finalizar análise com validação de dados
  const finalizeAnalysis = useCallback(async () => {
    if (!currentRefuel) return;
    
    setMode('analyzing');
    isMonitoringActiveRef.current = false;
    
    // Limpar intervalos
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    if (distanceIntervalRef.current) {
      clearInterval(distanceIntervalRef.current);
      distanceIntervalRef.current = null;
    }
    
    // Ler nível final (após rodar 5km - só para registro, não usado no cálculo da bomba)
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
    
    // CORREÇÃO 5: Calcular precisão da bomba com validação
    // Usa fuelLevelBefore (antes de abastecer) e fuelLevelAfter (depois de abastecer, antes de dirigir)
    let pumpAccuracyPercent: number | undefined;
    const levelBefore = currentRefuel.fuelLevelBefore;
    const levelAfter = currentRefuel.fuelLevelAfter; // Capturado em confirmRefuel
    
    console.log('[Refuel] finalizeAnalysis - Cálculo precisão bomba:', {
      levelBefore,
      levelAfter,
      litersAdded: currentRefuel.litersAdded,
      tankCapacity: settings.tankCapacity,
      levelAfterDriving: fuelLevelAfterDriving,
    });
    
    if (
      levelBefore !== null && 
      levelBefore !== undefined &&
      levelAfter !== null && 
      levelAfter !== undefined &&
      currentRefuel.litersAdded &&
      levelAfter > levelBefore // VALIDAÇÃO: nível deve ter aumentado
    ) {
      const expectedIncrease = (currentRefuel.litersAdded / settings.tankCapacity) * 100;
      const actualIncrease = levelAfter - levelBefore;
      
      // Só calcula se valores fazem sentido
      if (expectedIncrease > 0 && actualIncrease > 0) {
        pumpAccuracyPercent = Math.round((actualIncrease / expectedIncrease) * 100);
        
        // CORREÇÃO 5: Limitar a valores razoáveis (50% a 150%)
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
      // Mantém fuelLevelAfter como o nível logo após abastecer (para cálculo da bomba)
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
    
    // Salvar no banco se usuário logado
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
    
    // Feedback sobre precisão da bomba (se disponível e válido)
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
    
    // Feedback sobre salvamento na nuvem
    setTimeout(() => {
      if (userId) {
        speak('Dados salvos no seu histórico de abastecimentos.');
      } else {
        speak('Faça login para salvar seu histórico de abastecimentos na nuvem.');
      }
    }, pumpAccuracyPercent !== undefined ? 6000 : 2000);
    
    setMode('completed');
  }, [currentRefuel, readFuelLevel, readLTFT, analyzeQuality, settings.tankCapacity, userId, speak]);
  
  // CORREÇÃO 4: Helper para mensagens de progresso contextuais
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
  
  // CORREÇÃO 7: Detectar início de movimento (waiting -> monitoring) - useEffect separado
  useEffect(() => {
    if (mode === 'waiting' && currentRefuel && speed > 5 && !isMonitoringActiveRef.current) {
      isMonitoringActiveRef.current = true;
      setMode('monitoring');
      startOdometerRef.current = 0;
      distanceRef.current = 0;
      
      // Resetar refs de alerta ao iniciar monitoramento
      lastAnomalyAlertTimeRef.current = 0;
      anomalyRecoveryAnnouncedRef.current = false;
      announcedMilestonesRef.current.clear();
      readFailureCountRef.current = 0;
      
      speak('Monitoramento iniciado. Analisarei os primeiros 5 quilômetros.');
    }
  }, [mode, currentRefuel, speed, speak]);
  
  // CORREÇÃO 1: useEffect unificado para monitoramento (Fuel Trim + Distância juntos)
  useEffect(() => {
    if (mode !== 'monitoring') return;
    
    // Só inicia se ainda não tiver intervalos ativos
    if (monitoringIntervalRef.current || distanceIntervalRef.current) return;
    
    console.log('[Refuel] Iniciando monitoramento unificado');
    
    // Iniciar polling de Fuel Trim
    monitoringIntervalRef.current = setInterval(async () => {
      const stft = await readSTFT();
      const ltft = await readLTFT();
      
      // CORREÇÃO 5: Tratamento de falhas de leitura
      if (stft === null) {
        readFailureCountRef.current++;
        if (readFailureCountRef.current === MAX_READ_FAILURES) {
          speak('Atenção. Dificuldade na leitura do Fuel Trim. Verifique a conexão com o adaptador.');
        }
      } else {
        readFailureCountRef.current = 0; // Reset no sucesso
        setCurrentSTFT(stft);
        stftSamplesRef.current.push(stft);
        
        // Verificar anomalia
        const absSTFT = Math.abs(stft);
        const isCritical = absSTFT > settings.stftCriticalThreshold;
        const isWarning = absSTFT > settings.stftWarningThreshold;
        
        if (isWarning) {
          if (!anomalyStartRef.current) {
            anomalyStartRef.current = Date.now();
            anomalyRecoveryAnnouncedRef.current = false;
          }
          const duration = (Date.now() - anomalyStartRef.current) / 1000;
          setAnomalyDuration(duration);
          setAnomalyActive(true);
          
          const now = Date.now();
          const timeSinceLastAlert = (now - lastAnomalyAlertTimeRef.current) / 1000;
          
          // Alertas diferenciados baseado na severidade (com rate limiting de 30s)
          if (duration >= settings.anomalyDurationWarning && timeSinceLastAlert >= 30) {
            lastAnomalyAlertTimeRef.current = now;
            const direction = stft > 0 ? 'pobre' : 'rica';
            const progress = Math.round((distanceRef.current / settings.monitoringDistance) * 100);
            
            if (isCritical) {
              speak(`Alerta crítico! STFT em ${Math.abs(stft).toFixed(0)} porcento. Mistura ${direction}. Progresso: ${progress} porcento. Combustível suspeito.`);
            } else {
              speak(`Atenção. Correção de ${Math.abs(stft).toFixed(0)} porcento detectada. Mistura ${direction}. Análise em ${progress} porcento.`);
            }
          }
        } else {
          // Voltou ao normal - anunciar recuperação se estava em anomalia por >= 5s
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
    }, 2000);
    
    // Iniciar cálculo de distância (no mesmo useEffect para sincronizar)
    distanceIntervalRef.current = setInterval(() => {
      const currentSpeed = speedRef.current;
      
      // Só acumula distância se estiver em movimento (>= 3 km/h)
      if (currentSpeed >= 3) {
        const kmPerSecond = currentSpeed / 3600;
        distanceRef.current += kmPerSecond;
        const newDistance = distanceRef.current;
        setDistanceMonitored(newDistance);
        
        // Log para debug
        console.log(`[Refuel] Distance: ${newDistance.toFixed(2)} km @ ${currentSpeed} km/h`);
        
        // Calcular progresso em porcentagem
        const progressPercent = (newDistance / settings.monitoringDistance) * 100;
        
        // CORREÇÃO 4: Alertas de progresso contextuais (verificando estado de anomalia)
        const milestones = [25, 50, 75];
        for (const milestone of milestones) {
          if (progressPercent >= milestone && !announcedMilestonesRef.current.has(milestone)) {
            announcedMilestonesRef.current.add(milestone);
            
            // Verificar se há anomalia ativa para mensagem contextual
            const hasActiveAnomaly = anomalyStartRef.current !== null;
            speak(getProgressMessage(milestone, hasActiveAnomaly));
            break; // Só anuncia um milestone por iteração
          }
        }
        
        // Finalizar análise ao atingir distância configurada
        if (newDistance >= settings.monitoringDistance) {
          finalizeAnalysis();
        }
      }
    }, 1000);
    
    // Cleanup quando sair do modo monitoring
    return () => {
      // NÃO limpar aqui - será limpo no cleanup geral ou finalizeAnalysis
    };
  }, [mode, settings, readSTFT, readLTFT, speak, getProgressMessage, finalizeAnalysis]);
  
  // Ler nível de combustível atual - polling condicional
  useEffect(() => {
    // Só faz polling quando está em modo de monitoramento ou waiting
    if (fuelLevelSupported && isConnected && (mode === 'monitoring' || mode === 'waiting')) {
      fuelLevelIntervalRef.current = setInterval(async () => {
        const level = await readFuelLevel();
        setCurrentFuelLevel(level);
      }, 5000);
      
      return () => {
        if (fuelLevelIntervalRef.current) {
          clearInterval(fuelLevelIntervalRef.current);
          fuelLevelIntervalRef.current = null;
        }
      };
    }
  }, [fuelLevelSupported, isConnected, mode, readFuelLevel]);
  
  // Cleanup geral quando modo muda para inactive ou completed
  useEffect(() => {
    if (mode === 'inactive' || mode === 'completed') {
      isMonitoringActiveRef.current = false;
      
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      if (distanceIntervalRef.current) {
        clearInterval(distanceIntervalRef.current);
        distanceIntervalRef.current = null;
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
