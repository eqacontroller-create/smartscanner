import { useState, useEffect, useRef, useCallback } from 'react';
import { RideStatus, RideEntry, DailySummary, TripSettings } from '@/types/tripSettings';

// Constantes para backup
const BACKUP_KEY = 'current_trip_backup';
const BACKUP_INTERVAL = 10000; // 10 segundos
const BACKUP_MAX_AGE = 600000; // 10 minutos

interface UseAutoRideOptions {
  speed: number | null;
  rpm: number | null;
  settings: TripSettings;
  speak?: (text: string) => void;
  // Funções de sincronização com cloud
  onSaveRide?: (ride: RideEntry) => Promise<void>;
  onUpdateRide?: (id: string, updates: Partial<RideEntry>) => Promise<void>;
  onClearRides?: () => Promise<void>;
  initialRides?: RideEntry[];
}

interface UseAutoRideReturn {
  rideStatus: RideStatus;
  currentRide: RideEntry | null;
  todayRides: RideEntry[];
  dailySummary: DailySummary;
  isModalOpen: boolean;
  finishedRide: RideEntry | null;
  closeModal: () => void;
  saveRideWithAmount: (amountReceived: number) => void;
  skipAmountEntry: () => void;
  clearTodayRides: () => void;
  getVoiceReport: () => string;
  // Novas funções de recuperação
  pendingRecovery: RideEntry | null;
  recoverRide: () => void;
  discardRecovery: () => void;
}

const STORAGE_KEY_RIDES = 'obd2-today-rides';

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function loadTodayRides(): RideEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_RIDES);
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    // Se os dados forem de outro dia, limpar
    if (data.date !== getTodayDateString()) {
      localStorage.removeItem(STORAGE_KEY_RIDES);
      return [];
    }
    return data.rides || [];
  } catch {
    return [];
  }
}

function saveTodayRides(rides: RideEntry[]): void {
  localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify({
    date: getTodayDateString(),
    rides,
  }));
}

export function useAutoRide({ 
  speed, 
  rpm, 
  settings,
  speak,
  onSaveRide,
  onUpdateRide,
  onClearRides,
  initialRides,
}: UseAutoRideOptions): UseAutoRideReturn {
  const [rideStatus, setRideStatus] = useState<RideStatus>('idle');
  const [currentRide, setCurrentRide] = useState<RideEntry | null>(null);
  const [todayRides, setTodayRides] = useState<RideEntry[]>(() => 
    initialRides ?? loadTodayRides()
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [finishedRide, setFinishedRide] = useState<RideEntry | null>(null);
  const [pendingRecovery, setPendingRecovery] = useState<RideEntry | null>(null);
  
  // Refs para controle de tempo
  const detectionStartRef = useRef<number | null>(null);
  const stoppedSinceRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const totalDistanceRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);
  const speedSamplesRef = useRef<number[]>([]);
  const backupIntervalRef = useRef<number | null>(null);
  
  // Verificar backup ao iniciar
  useEffect(() => {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const { ride, timestamp } = JSON.parse(backup);
        const age = Date.now() - timestamp;
        
        if (age < BACKUP_MAX_AGE && ride.endTime === 0) {
          // Corrida não finalizada encontrada
          console.log('[AutoRide] Backup encontrado:', ride);
          setPendingRecovery(ride);
        } else {
          // Backup expirado, limpar
          console.log('[AutoRide] Backup expirado, removendo');
          localStorage.removeItem(BACKUP_KEY);
        }
      }
    } catch (err) {
      console.error('[AutoRide] Erro ao verificar backup:', err);
      localStorage.removeItem(BACKUP_KEY);
    }
  }, []);
  
  // Auto-backup durante corrida (a cada 10 segundos)
  useEffect(() => {
    if (rideStatus !== 'in_ride' || !currentRide) {
      // Limpar intervalo se não estiver em corrida
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
        backupIntervalRef.current = null;
      }
      return;
    }
    
    // Criar intervalo de backup
    backupIntervalRef.current = window.setInterval(() => {
      const backupData = {
        ride: {
          ...currentRide,
          distance: totalDistanceRef.current,
          duration: totalDurationRef.current,
        },
        timestamp: Date.now(),
      };
      
      try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
        console.log('[AutoRide] Backup salvo:', backupData.ride.distance.toFixed(2), 'km');
      } catch (err) {
        console.error('[AutoRide] Erro ao salvar backup:', err);
      }
    }, BACKUP_INTERVAL);
    
    return () => {
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
        backupIntervalRef.current = null;
      }
    };
  }, [rideStatus, currentRide]);
  
  // Função para recuperar corrida
  const recoverRide = useCallback(() => {
    if (!pendingRecovery) return;
    
    console.log('[AutoRide] Recuperando corrida:', pendingRecovery);
    
    // Restaurar refs
    totalDistanceRef.current = pendingRecovery.distance;
    totalDurationRef.current = pendingRecovery.duration;
    lastUpdateRef.current = Date.now();
    speedSamplesRef.current = pendingRecovery.averageSpeed > 0 
      ? [pendingRecovery.averageSpeed] 
      : [];
    
    setCurrentRide(pendingRecovery);
    setRideStatus('in_ride');
    setPendingRecovery(null);
    
    // Não remove o backup ainda - será mantido até finalizar
    
    if (speak) {
      speak('Corrida anterior restaurada, piloto. Continuando de onde parou.');
    }
  }, [pendingRecovery, speak]);
  
  // Função para descartar recuperação
  const discardRecovery = useCallback(() => {
    console.log('[AutoRide] Descartando recuperação');
    setPendingRecovery(null);
    localStorage.removeItem(BACKUP_KEY);
  }, []);
  
  // Atualizar quando initialRides mudar (dados do cloud chegarem)
  useEffect(() => {
    if (initialRides && initialRides.length > 0) {
      setTodayRides(initialRides);
    }
  }, [initialRides]);
  
  // Calcular custo baseado nas configurações
  const calculateCost = useCallback((distance: number): number => {
    const fuelCost = (distance / settings.averageConsumption) * settings.fuelPrice;
    const additionalCost = distance * settings.vehicleCostPerKm;
    return fuelCost + additionalCost;
  }, [settings]);
  
  // Iniciar nova corrida
  const startNewRide = useCallback(() => {
    const now = Date.now();
    const newRide: RideEntry = {
      id: `ride-${now}`,
      startTime: now,
      endTime: 0,
      distance: 0,
      cost: 0,
      costPerKm: 0,
      duration: 0,
      averageSpeed: 0,
    };
    
    setCurrentRide(newRide);
    totalDistanceRef.current = 0;
    totalDurationRef.current = 0;
    speedSamplesRef.current = [];
    lastUpdateRef.current = now;
    
    if (speak) {
      speak('Corrida iniciada automaticamente, piloto. Boa viagem!');
    }
  }, [speak]);
  
  // Finalizar corrida
  const finishRide = useCallback(() => {
    if (!currentRide) return;
    
    const now = Date.now();
    const duration = totalDurationRef.current;
    const distance = totalDistanceRef.current;
    const cost = calculateCost(distance);
    const avgSpeed = speedSamplesRef.current.length > 0 
      ? speedSamplesRef.current.reduce((a, b) => a + b, 0) / speedSamplesRef.current.length 
      : 0;
    
    const finishedRideData: RideEntry = {
      ...currentRide,
      endTime: now,
      distance,
      cost,
      costPerKm: distance > 0 ? cost / distance : 0,
      duration,
      averageSpeed: avgSpeed,
    };
    
    // Limpar backup ao finalizar
    localStorage.removeItem(BACKUP_KEY);
    
    setFinishedRide(finishedRideData);
    setIsModalOpen(true);
    setCurrentRide(null);
    
    if (speak) {
      const costFormatted = cost.toFixed(2).replace('.', ' reais e ').replace(/(\d{2})$/, '$1 centavos');
      speak(`Corrida finalizada. Custo de combustível: ${costFormatted}. Digite o valor recebido para calcular o lucro.`);
    }
  }, [currentRide, calculateCost, speak]);
  
  // Salvar corrida com valor recebido
  const saveRideWithAmount = useCallback(async (amountReceived: number) => {
    if (!finishedRide) return;
    
    const profit = amountReceived - finishedRide.cost;
    const rideWithProfit: RideEntry = {
      ...finishedRide,
      amountReceived,
      profit,
    };
    
    const updatedRides = [...todayRides, rideWithProfit];
    setTodayRides(updatedRides);
    
    // Usar callback de sincronização se disponível
    if (onSaveRide) {
      await onSaveRide(rideWithProfit);
    } else {
      saveTodayRides(updatedRides);
    }
    
    setIsModalOpen(false);
    setFinishedRide(null);
    
    if (speak) {
      const profitText = profit >= 0 
        ? `Seu lucro nesta corrida foi de ${profit.toFixed(2).replace('.', ' reais e ')} centavos.`
        : `Você teve prejuízo de ${Math.abs(profit).toFixed(2).replace('.', ' reais e ')} centavos nesta corrida.`;
      speak(profitText);
    }
  }, [finishedRide, todayRides, speak, onSaveRide]);
  
  // Pular entrada de valor
  const skipAmountEntry = useCallback(async () => {
    if (!finishedRide) return;
    
    const updatedRides = [...todayRides, finishedRide];
    setTodayRides(updatedRides);
    
    // Usar callback de sincronização se disponível
    if (onSaveRide) {
      await onSaveRide(finishedRide);
    } else {
      saveTodayRides(updatedRides);
    }
    
    setIsModalOpen(false);
    setFinishedRide(null);
  }, [finishedRide, todayRides, onSaveRide]);
  
  // Fechar modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);
  
  // Limpar corridas do dia
  const clearTodayRides = useCallback(async () => {
    setTodayRides([]);
    
    if (onClearRides) {
      await onClearRides();
    } else {
      localStorage.removeItem(STORAGE_KEY_RIDES);
    }
  }, [onClearRides]);
  
  // Calcular resumo do dia
  const dailySummary: DailySummary = {
    date: getTodayDateString(),
    rides: todayRides,
    totalDistance: todayRides.reduce((sum, r) => sum + r.distance, 0),
    totalCost: todayRides.reduce((sum, r) => sum + r.cost, 0),
    totalReceived: todayRides.reduce((sum, r) => sum + (r.amountReceived || 0), 0),
    totalProfit: todayRides.reduce((sum, r) => sum + (r.profit || 0), 0),
  };
  
  // Gerar relatório por voz
  const getVoiceReport = useCallback((): string => {
    if (todayRides.length === 0) {
      return 'Você ainda não fez nenhuma corrida hoje, piloto.';
    }
    
    const { totalDistance, totalCost, totalProfit } = dailySummary;
    const ridesCount = todayRides.length;
    
    return `Hoje você fez ${ridesCount} ${ridesCount === 1 ? 'corrida' : 'corridas'}, ` +
      `rodou ${totalDistance.toFixed(1)} quilômetros e gastou ${totalCost.toFixed(2).replace('.', ' reais e ')} centavos em combustível. ` +
      `Seu lucro líquido foi de ${totalProfit.toFixed(2).replace('.', ' reais e ')} centavos. ` +
      `Guarde ${totalCost.toFixed(2).replace('.', ' reais e ')} centavos para o combustível de amanhã.`;
  }, [todayRides, dailySummary]);
  
  // Lógica principal de detecção auto-start e auto-stop
  useEffect(() => {
    if (!settings.autoRideEnabled) {
      setRideStatus('idle');
      return;
    }
    
    const now = Date.now();
    const currentSpeed = speed ?? 0;
    const currentRpm = rpm ?? 0;
    const isEngineRunning = currentRpm > 0;
    
    // Atualizar dados da corrida em andamento
    if (rideStatus === 'in_ride' && currentRide) {
      const timeDelta = (now - lastUpdateRef.current) / 1000; // em segundos
      lastUpdateRef.current = now;
      
      // Calcular distância (velocidade em km/h, tempo em segundos)
      const distanceIncrement = (currentSpeed / 3600) * timeDelta;
      totalDistanceRef.current += distanceIncrement;
      totalDurationRef.current += timeDelta;
      
      if (currentSpeed > 0) {
        speedSamplesRef.current.push(currentSpeed);
      }
    }
    
    // Estado: IDLE - aguardando início
    if (rideStatus === 'idle') {
      if (currentSpeed > settings.speedThreshold) {
        setRideStatus('detecting');
        detectionStartRef.current = now;
      }
    }
    
    // Estado: DETECTING - contando tempo acima do threshold
    if (rideStatus === 'detecting') {
      if (currentSpeed <= settings.speedThreshold) {
        // Voltou para baixa velocidade, resetar
        setRideStatus('idle');
        detectionStartRef.current = null;
      } else if (detectionStartRef.current && (now - detectionStartRef.current) >= settings.autoStartDelay * 1000) {
        // Passou tempo suficiente, iniciar corrida
        setRideStatus('in_ride');
        startNewRide();
        detectionStartRef.current = null;
      }
    }
    
    // Estado: IN_RIDE - monitorando parada
    if (rideStatus === 'in_ride') {
      if (currentSpeed === 0 && isEngineRunning) {
        // Parou mas motor ainda ligado
        if (!stoppedSinceRef.current) {
          stoppedSinceRef.current = now;
        } else if ((now - stoppedSinceRef.current) >= settings.autoStopDelay * 1000) {
          // Passou tempo suficiente parado, finalizar
          setRideStatus('finishing');
          finishRide();
          stoppedSinceRef.current = null;
        }
      } else if (currentSpeed > 0) {
        // Voltou a se mover, resetar contador de parada
        stoppedSinceRef.current = null;
      }
    }
    
    // Estado: FINISHING - aguardando confirmação
    if (rideStatus === 'finishing') {
      // Após o modal ser fechado, voltar para idle
      if (!isModalOpen) {
        setRideStatus('idle');
      }
    }
  }, [speed, rpm, settings, rideStatus, currentRide, isModalOpen, startNewRide, finishRide]);
  
  return {
    rideStatus,
    currentRide,
    todayRides,
    dailySummary,
    isModalOpen,
    finishedRide,
    closeModal,
    saveRideWithAmount,
    skipAmountEntry,
    clearTodayRides,
    getVoiceReport,
    // Novas funções de recuperação
    pendingRecovery,
    recoverRide,
    discardRecovery,
  };
}
