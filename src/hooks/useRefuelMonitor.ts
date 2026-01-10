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
}: UseRefuelMonitorOptions): UseRefuelMonitorReturn {
  // Estados principais
  const [mode, setMode] = useState<RefuelMode>('inactive');
  const [currentRefuel, setCurrentRefuel] = useState<Partial<RefuelEntry> | null>(null);
  const [fuelTrimHistory, setFuelTrimHistory] = useState<FuelTrimSample[]>([]);
  const [settings] = useState<RefuelSettings>(defaultRefuelSettings);
  
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
  
  // Refs para monitoramento
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeedRef = useRef(0);
  const startOdometerRef = useRef(0);
  const anomalyStartRef = useRef<number | null>(null);
  const stftSamplesRef = useRef<number[]>([]);
  const initialLTFTRef = useRef<number | null>(null);
  
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
  
  // Ler STFT (PID 0106)
  const readSTFT = useCallback(async (): Promise<number | null> => {
    try {
      const response = await sendRawCommand('0106', 2000);
      const match = response.match(/41\s*06\s*([0-9A-Fa-f]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        return Math.round((a - 128) * 100 / 128);
      }
    } catch (error) {
      console.error('[Refuel] Error reading STFT:', error);
    }
    return null;
  }, [sendRawCommand]);
  
  // Ler LTFT (PID 0107)
  const readLTFT = useCallback(async (): Promise<number | null> => {
    try {
      const response = await sendRawCommand('0107', 2000);
      const match = response.match(/41\s*07\s*([0-9A-Fa-f]{2})/i);
      if (match) {
        const a = parseInt(match[1], 16);
        return Math.round((a - 128) * 100 / 128);
      }
    } catch (error) {
      console.error('[Refuel] Error reading LTFT:', error);
    }
    return null;
  }, [sendRawCommand]);
  
  // Iniciar modo abastecimento
  const startRefuelMode = useCallback(() => {
    setMode('waiting');
    setCurrentRefuel(null);
    setFuelTrimHistory([]);
    setDistanceMonitored(0);
    setAnomalyActive(false);
    setAnomalyDuration(0);
    stftSamplesRef.current = [];
    initialLTFTRef.current = null;
    anomalyStartRef.current = null;
    
    speak('Modo abastecimento ativado. Monitorando parâmetros de injeção. Abasteça e inicie o trajeto.');
  }, [speak]);
  
  // Confirmar dados do abastecimento
  const confirmRefuel = useCallback(async (pricePerLiter: number, litersAdded: number) => {
    const totalPaid = pricePerLiter * litersAdded;
    const fuelLevelBefore = await readFuelLevel();
    
    setCurrentRefuel({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      pricePerLiter,
      litersAdded,
      totalPaid,
      fuelLevelBefore,
      fuelLevelAfter: null,
      tankCapacity: settings.tankCapacity,
      quality: 'unknown',
      stftAverage: 0,
      ltftDelta: 0,
      distanceMonitored: 0,
      anomalyDetected: false,
    });
    
    // Atualizar preço do combustível nas configurações
    if (onFuelPriceUpdate) {
      onFuelPriceUpdate(pricePerLiter);
    }
    
    // Ler LTFT inicial para comparação
    initialLTFTRef.current = await readLTFT();
    
    speak('Dados registrados. Quando iniciar o trajeto, começarei a análise do combustível.');
  }, [readFuelLevel, readLTFT, settings.tankCapacity, onFuelPriceUpdate, speak]);
  
  // Cancelar modo abastecimento
  const cancelRefuel = useCallback(() => {
    setMode('inactive');
    setCurrentRefuel(null);
    setFuelTrimHistory([]);
    setDistanceMonitored(0);
    setAnomalyActive(false);
    setAnomalyDuration(0);
    
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
    
    if (absAvg <= 10) return 'ok';
    if (absAvg <= settings.stftWarningThreshold) return 'ok';
    if (absAvg <= settings.stftCriticalThreshold) return 'warning';
    return 'critical';
  }, [settings.stftWarningThreshold, settings.stftCriticalThreshold]);
  
  // Finalizar análise
  const finalizeAnalysis = useCallback(async () => {
    if (!currentRefuel) return;
    
    setMode('analyzing');
    
    const fuelLevelAfter = await readFuelLevel();
    const currentLTFTValue = await readLTFT();
    
    const samples = stftSamplesRef.current;
    const stftAverage = samples.length > 0 
      ? samples.reduce((a, b) => a + b, 0) / samples.length 
      : 0;
    
    const ltftDelta = initialLTFTRef.current !== null && currentLTFTValue !== null
      ? currentLTFTValue - initialLTFTRef.current
      : 0;
    
    const quality = analyzeQuality();
    
    // Calcular precisão da bomba
    let pumpAccuracyPercent: number | undefined;
    if (currentRefuel.fuelLevelBefore !== null && fuelLevelAfter !== null && currentRefuel.litersAdded) {
      const expectedIncrease = (currentRefuel.litersAdded / settings.tankCapacity) * 100;
      const actualIncrease = fuelLevelAfter - currentRefuel.fuelLevelBefore;
      pumpAccuracyPercent = Math.round((actualIncrease / expectedIncrease) * 100);
    }
    
    const finalEntry: RefuelEntry = {
      ...(currentRefuel as RefuelEntry),
      fuelLevelAfter,
      quality,
      stftAverage: Math.round(stftAverage * 10) / 10,
      ltftDelta: Math.round(ltftDelta * 10) / 10,
      distanceMonitored,
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
    
    setMode('completed');
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  }, [currentRefuel, distanceMonitored, readFuelLevel, readLTFT, analyzeQuality, settings.tankCapacity, userId, speak]);
  
  // Monitorar quando carro começa a se mover
  useEffect(() => {
    if (mode === 'waiting' && currentRefuel && speed > 5) {
      setMode('monitoring');
      startOdometerRef.current = 0;
      speak('Monitoramento iniciado. Analisarei os primeiros 5 quilômetros.');
      
      // Iniciar polling de Fuel Trim
      monitoringIntervalRef.current = setInterval(async () => {
        const stft = await readSTFT();
        const ltft = await readLTFT();
        
        if (stft !== null) {
          setCurrentSTFT(stft);
          stftSamplesRef.current.push(stft);
          
          // Verificar anomalia
          const absSTFT = Math.abs(stft);
          if (absSTFT > settings.stftWarningThreshold) {
            if (!anomalyStartRef.current) {
              anomalyStartRef.current = Date.now();
            }
            const duration = (Date.now() - anomalyStartRef.current) / 1000;
            setAnomalyDuration(duration);
            setAnomalyActive(true);
            
            // Alertar se duração exceder threshold
            if (duration >= settings.anomalyDurationWarning && duration < settings.anomalyDurationWarning + 3) {
              const direction = stft > 0 ? 'pobre' : 'rica';
              speak(`Atenção. A injeção está fazendo correções excessivas de ${Math.abs(stft)} porcento. Mistura ${direction} detectada.`);
            }
          } else {
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
          distance: distanceMonitored,
        }]);
      }, 2000);
    }
    
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [mode, currentRefuel, speed, settings, distanceMonitored, readSTFT, readLTFT, speak]);
  
  // Calcular distância percorrida
  useEffect(() => {
    if (mode === 'monitoring') {
      const interval = setInterval(() => {
        // Calcular distância baseada na velocidade atual
        const kmPerSecond = speed / 3600;
        setDistanceMonitored(prev => {
          const newDistance = prev + kmPerSecond;
          
          // Anunciar progresso a cada 2.5km
          if (prev < 2.5 && newDistance >= 2.5) {
            speak('Metade da análise concluída. Adaptação de combustível dentro do normal até agora.');
          }
          
          // Finalizar análise aos 5km
          if (newDistance >= settings.monitoringDistance) {
            finalizeAnalysis();
          }
          
          return newDistance;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [mode, speed, settings.monitoringDistance, finalizeAnalysis, speak]);
  
  // Ler nível de combustível atual
  useEffect(() => {
    if (fuelLevelSupported && isConnected) {
      const interval = setInterval(async () => {
        const level = await readFuelLevel();
        setCurrentFuelLevel(level);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [fuelLevelSupported, isConnected, readFuelLevel]);
  
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
