import { useState, useCallback, useRef, useEffect } from 'react';
import { TripData, TripSettings, TripHistoryEntry, initialTripData, defaultTripSettings } from '@/types/tripSettings';

const SETTINGS_STORAGE_KEY = 'trip-settings';
const HISTORY_STORAGE_KEY = 'trip-history';
const MAX_HISTORY_ENTRIES = 50;

interface UseTripCalculatorOptions {
  speed: number | null; // Velocidade atual do OBD-II em km/h
}

interface UseTripCalculatorReturn {
  // Dados da viagem
  tripData: TripData;
  
  // Configurações
  settings: TripSettings;
  updateSettings: (newSettings: Partial<TripSettings>) => void;
  
  // Histórico
  history: TripHistoryEntry[];
  clearHistory: () => void;
  
  // Ações
  startTrip: () => void;
  pauseTrip: () => void;
  resumeTrip: () => void;
  resetTrip: () => void;
  saveTrip: () => void;
  
  // Relatório para Jarvis
  getVoiceReport: () => string;
}

export function useTripCalculator(options: UseTripCalculatorOptions): UseTripCalculatorReturn {
  const { speed } = options;
  
  // Estados
  const [tripData, setTripData] = useState<TripData>(initialTripData);
  const [settings, setSettings] = useState<TripSettings>(defaultTripSettings);
  const [history, setHistory] = useState<TripHistoryEntry[]>([]);
  
  // Refs para cálculos
  const lastUpdateRef = useRef<number>(Date.now());
  const totalDistanceRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);
  const speedSamplesRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  
  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        setSettings({ ...defaultTripSettings, ...JSON.parse(storedSettings) });
      }
      
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de viagem:', error);
    }
  }, []);
  
  // Atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<TripSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar configurações:', error);
      }
      return updated;
    });
  }, []);
  
  // Calcular custo atual
  const calculateCost = useCallback((distance: number) => {
    const fuelCost = (distance / settings.averageConsumption) * settings.fuelPrice;
    const additionalCost = distance * settings.vehicleCostPerKm;
    return fuelCost + additionalCost;
  }, [settings]);
  
  // Atualizar dados da viagem
  const updateTripData = useCallback(() => {
    if (!tripData.isActive) return;
    
    const now = Date.now();
    const deltaTime = (now - lastUpdateRef.current) / 1000; // em segundos
    lastUpdateRef.current = now;
    
    // Calcular distância percorrida neste intervalo
    // Distância = Velocidade (km/h) / 3600 * tempo (segundos) = km
    const currentSpeed = speed ?? 0;
    const distanceTraveled = (currentSpeed / 3600) * deltaTime;
    
    totalDistanceRef.current += distanceTraveled;
    totalDurationRef.current += deltaTime;
    
    // Amostras de velocidade para média
    if (currentSpeed > 0) {
      speedSamplesRef.current.push(currentSpeed);
    }
    
    // Calcular velocidade média
    const avgSpeed = speedSamplesRef.current.length > 0
      ? speedSamplesRef.current.reduce((a, b) => a + b, 0) / speedSamplesRef.current.length
      : 0;
    
    // Calcular custo
    const totalCost = calculateCost(totalDistanceRef.current);
    const costPerKm = totalDistanceRef.current > 0 
      ? totalCost / totalDistanceRef.current 
      : 0;
    
    setTripData(prev => ({
      ...prev,
      distance: totalDistanceRef.current,
      duration: totalDurationRef.current,
      cost: totalCost,
      costPerKm,
      averageSpeed: avgSpeed,
    }));
    
    // Continuar atualizando
    animationFrameRef.current = requestAnimationFrame(updateTripData);
  }, [tripData.isActive, speed, calculateCost]);
  
  // Iniciar loop de atualização quando viagem ativa
  useEffect(() => {
    if (tripData.isActive) {
      lastUpdateRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(updateTripData);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [tripData.isActive, updateTripData]);
  
  // Iniciar viagem
  const startTrip = useCallback(() => {
    totalDistanceRef.current = 0;
    totalDurationRef.current = 0;
    speedSamplesRef.current = [];
    lastUpdateRef.current = Date.now();
    
    setTripData({
      ...initialTripData,
      isActive: true,
      startTime: Date.now(),
    });
  }, []);
  
  // Pausar viagem
  const pauseTrip = useCallback(() => {
    setTripData(prev => ({ ...prev, isActive: false }));
  }, []);
  
  // Retomar viagem
  const resumeTrip = useCallback(() => {
    lastUpdateRef.current = Date.now();
    setTripData(prev => ({ ...prev, isActive: true }));
  }, []);
  
  // Zerar viagem
  const resetTrip = useCallback(() => {
    totalDistanceRef.current = 0;
    totalDurationRef.current = 0;
    speedSamplesRef.current = [];
    setTripData(initialTripData);
  }, []);
  
  // Salvar viagem no histórico
  const saveTrip = useCallback(() => {
    if (tripData.distance < 0.01) return; // Não salvar viagens muito curtas
    
    const entry: TripHistoryEntry = {
      id: `trip-${Date.now()}`,
      date: new Date().toISOString(),
      distance: tripData.distance,
      cost: tripData.cost,
      costPerKm: tripData.costPerKm,
      duration: tripData.duration,
      averageSpeed: tripData.averageSpeed,
    };
    
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, MAX_HISTORY_ENTRIES);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar histórico:', error);
      }
      return updated;
    });
    
    // Zerar após salvar
    resetTrip();
  }, [tripData, resetTrip]);
  
  // Limpar histórico
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  }, []);
  
  // Gerar relatório de voz para Jarvis
  const getVoiceReport = useCallback(() => {
    const dist = tripData.distance.toFixed(1);
    const cost = tripData.cost.toFixed(2);
    const costKm = tripData.costPerKm.toFixed(2);
    
    if (tripData.distance < 0.1) {
      return 'Ainda não há dados de viagem registrados, piloto.';
    }
    
    return `Piloto, você rodou ${dist} quilômetros e gastou aproximadamente ${cost} reais nesta corrida. Isso dá ${costKm} reais por quilômetro.`;
  }, [tripData]);
  
  return {
    tripData,
    settings,
    updateSettings,
    history,
    clearHistory,
    startTrip,
    pauseTrip,
    resumeTrip,
    resetTrip,
    saveTrip,
    getVoiceReport,
  };
}
