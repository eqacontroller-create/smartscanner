// Hook de Saúde Unificada do Veículo
// Agrega dados de bateria, combustível e DTCs com cache local

import { useState, useEffect, useCallback, useRef } from 'react';
import { VehicleHealthService } from '@/services/supabase/VehicleHealthService';
import logger from '@/lib/logger';
import type {
  VehicleHealthSnapshot,
  BatteryHealthStatus,
  FuelHealthStatus,
  DTCHealthStatus,
  HealthLevel,
} from '@/types/vehicleHealth';
import {
  defaultBatteryHealth,
  defaultFuelHealth,
  defaultDTCHealth,
  defaultHealthSnapshot,
} from '@/types/vehicleHealth';

interface UseVehicleHealthOptions {
  userId?: string;
  vin?: string | null;
}

interface UseVehicleHealthReturn {
  // Snapshot completo
  health: VehicleHealthSnapshot | null;
  loading: boolean;
  
  // Status individuais para cards do dashboard
  batteryHealth: BatteryHealthStatus;
  fuelHealth: FuelHealthStatus;
  dtcHealth: DTCHealthStatus;
  overallLevel: HealthLevel;
  
  // Ações
  refresh: () => Promise<void>;
  clearHealth: () => void;
}

const CACHE_KEY_PREFIX = 'vehicle_health_';
const CACHE_KEY_LAST = 'vehicle_health_last'; // Cache fixo para acesso rápido
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache

function getCacheKey(userId: string): string {
  return `${CACHE_KEY_PREFIX}${userId}`;
}

function parseCachedSnapshot(cached: string): VehicleHealthSnapshot | null {
  try {
    const parsed = JSON.parse(cached);
    // Converter strings de data de volta para Date
    if (parsed.lastUpdated) parsed.lastUpdated = new Date(parsed.lastUpdated);
    if (parsed.battery?.lastTestDate) parsed.battery.lastTestDate = new Date(parsed.battery.lastTestDate);
    if (parsed.fuel?.lastRefuelDate) parsed.fuel.lastRefuelDate = new Date(parsed.fuel.lastRefuelDate);
    if (parsed.dtc?.lastScanDate) parsed.dtc.lastScanDate = new Date(parsed.dtc.lastScanDate);
    return parsed as VehicleHealthSnapshot;
  } catch (err) {
    console.error('[useVehicleHealth] Error parsing cache:', err);
    return null;
  }
}

function loadFromCache(userId: string): VehicleHealthSnapshot | null {
  try {
    const cached = localStorage.getItem(getCacheKey(userId));
    if (!cached) return null;
    return parseCachedSnapshot(cached);
  } catch (err) {
    console.error('[useVehicleHealth] Error loading cache:', err);
    return null;
  }
}

function loadLastCache(): VehicleHealthSnapshot | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY_LAST);
    if (!cached) return null;
    return parseCachedSnapshot(cached);
  } catch (err) {
    console.error('[useVehicleHealth] Error loading last cache:', err);
    return null;
  }
}

function saveToCache(userId: string, snapshot: VehicleHealthSnapshot): void {
  try {
    const jsonStr = JSON.stringify(snapshot);
    localStorage.setItem(getCacheKey(userId), jsonStr);
    // Também salvar na chave fixa para acesso rápido na abertura do app
    localStorage.setItem(CACHE_KEY_LAST, jsonStr);
  } catch (err) {
    console.error('[useVehicleHealth] Error saving cache:', err);
  }
}

function clearCache(userId: string): void {
  try {
    localStorage.removeItem(getCacheKey(userId));
    // Não limpar CACHE_KEY_LAST para manter alerta mesmo após logout
  } catch (err) {
    console.error('[useVehicleHealth] Error clearing cache:', err);
  }
}

export function useVehicleHealth({
  userId,
  vin,
}: UseVehicleHealthOptions): UseVehicleHealthReturn {
  // Carregar cache fixo imediatamente na montagem (antes do auth)
  const [health, setHealth] = useState<VehicleHealthSnapshot | null>(() => {
    // Tenta carregar o último cache salvo para exibir alertas imediatamente
    return loadLastCache();
  });
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const initialLoadDoneRef = useRef(false);

  // Buscar dados do Supabase
  const fetchHealth = useCallback(async (force = false) => {
    if (!userId) {
      setHealth(null);
      return;
    }
    
    // Evitar múltiplas requisições em sequência
    const now = Date.now();
    if (!force && now - lastFetchRef.current < CACHE_TTL_MS) {
      return;
    }
    
    setLoading(true);
    try {
      const snapshot = await VehicleHealthService.getHealthSnapshot(userId, vin);
      setHealth(snapshot);
      saveToCache(userId, snapshot);
      lastFetchRef.current = now;
    } catch (err) {
      console.error('[useVehicleHealth] Error fetching health:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, vin]);

  // Carregar cache do usuário e depois buscar do servidor
  useEffect(() => {
    if (!userId) {
      // Manter cache fixo mesmo sem userId para mostrar alertas
      initialLoadDoneRef.current = false;
      return;
    }
    
    // Carregar do cache do usuário (pode ter dados mais recentes)
    if (!initialLoadDoneRef.current) {
      const cached = loadFromCache(userId);
      if (cached) {
        setHealth(cached);
      }
      initialLoadDoneRef.current = true;
    }
    
    // Buscar do servidor em background
    fetchHealth();
  }, [userId, vin, fetchHealth]);

  // Escutar evento de atualização de saúde (disparado pelo useBatteryHistory)
  useEffect(() => {
    const handleHealthUpdate = () => {
      logger.debug('[useVehicleHealth] Health update event received, refreshing...');
      fetchHealth(true);
    };
    
    window.addEventListener('vehicle-health-updated', handleHealthUpdate);
    return () => window.removeEventListener('vehicle-health-updated', handleHealthUpdate);
  }, [fetchHealth]);

  // Refresh manual
  const refresh = useCallback(async () => {
    await fetchHealth(true);
  }, [fetchHealth]);

  // Limpar saúde (logout, troca de veículo, etc)
  const clearHealth = useCallback(() => {
    if (userId) {
      clearCache(userId);
    }
    setHealth(null);
    initialLoadDoneRef.current = false;
  }, [userId]);

  return {
    health,
    loading,
    
    // Valores individuais para uso fácil nos componentes
    batteryHealth: health?.battery ?? defaultBatteryHealth,
    fuelHealth: health?.fuel ?? defaultFuelHealth,
    dtcHealth: health?.dtc ?? defaultDTCHealth,
    overallLevel: health?.overallLevel ?? 'unknown',
    
    refresh,
    clearHealth,
  };
}
