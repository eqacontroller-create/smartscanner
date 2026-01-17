/**
 * Hook para gerenciar diagnósticos de combustível offline
 * Armazena localmente e sincroniza com a nuvem quando houver conexão
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { RefuelEntry } from '@/types/refuelTypes';

const OFFLINE_QUEUE_KEY = 'offline-refuel-queue';

export interface OfflineRefuelEntry extends Omit<RefuelEntry, 'id' | 'userId'> {
  localId: string;
  createdAt: number;
  synced: boolean;
}

interface UseOfflineRefuelReturn {
  // Estado
  pendingEntries: OfflineRefuelEntry[];
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: number;
  
  // Ações
  saveOffline: (entry: Omit<OfflineRefuelEntry, 'localId' | 'createdAt' | 'synced'>) => void;
  syncNow: () => Promise<void>;
  removeEntry: (localId: string) => void;
  clearSynced: () => void;
}

// Gera ID único local
function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Carrega fila do localStorage
function loadQueue(): OfflineRefuelEntry[] {
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Salva fila no localStorage
function saveQueue(queue: OfflineRefuelEntry[]) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[OfflineRefuel] Erro ao salvar fila:', error);
  }
}

export function useOfflineRefuel(): UseOfflineRefuelReturn {
  const { isAuthenticated, user } = useAuth();
  const [pendingEntries, setPendingEntries] = useState<OfflineRefuelEntry[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const syncingRef = useRef(false);

  // Carrega fila ao montar
  useEffect(() => {
    const queue = loadQueue();
    setPendingEntries(queue);
    console.log('[OfflineRefuel] Carregou', queue.length, 'entradas pendentes');
  }, []);

  // Monitora status online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('📶 [OfflineRefuel] Conexão restaurada');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('📴 [OfflineRefuel] Sem conexão');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sincroniza automaticamente quando volta online
  useEffect(() => {
    const unsyncedCount = pendingEntries.filter(e => !e.synced).length;
    if (isOnline && unsyncedCount > 0 && isAuthenticated && !syncingRef.current) {
      console.log('[OfflineRefuel] Iniciando sync automático...');
      syncNow();
    }
  }, [isOnline, pendingEntries, isAuthenticated]);

  // Salva entrada offline
  const saveOffline = useCallback((entry: Omit<OfflineRefuelEntry, 'localId' | 'createdAt' | 'synced'>) => {
    const newEntry: OfflineRefuelEntry = {
      ...entry,
      localId: generateLocalId(),
      createdAt: Date.now(),
      synced: false,
    };
    
    setPendingEntries(prev => {
      const updated = [...prev, newEntry];
      saveQueue(updated);
      console.log('[OfflineRefuel] Salvo offline:', newEntry.localId);
      return updated;
    });
    
    toast.info('Diagnóstico salvo localmente', {
      description: isOnline ? 'Será sincronizado em breve' : 'Sincronizará quando houver conexão',
    });
    
    // Se online e autenticado, tenta sincronizar imediatamente
    if (isOnline && isAuthenticated) {
      setTimeout(() => syncNow(), 1000);
    }
  }, [isOnline, isAuthenticated]);

  // Sincroniza com a nuvem
  const syncNow = useCallback(async () => {
    if (!isAuthenticated || !user || syncingRef.current) {
      return;
    }
    
    const unsynced = pendingEntries.filter(e => !e.synced);
    if (unsynced.length === 0) {
      console.log('[OfflineRefuel] Nada para sincronizar');
      return;
    }
    
    syncingRef.current = true;
    setIsSyncing(true);
    setSyncProgress(0);
    
    console.log(`[OfflineRefuel] Sincronizando ${unsynced.length} entradas...`);
    
    const syncedIds: string[] = [];
    
    for (let i = 0; i < unsynced.length; i++) {
      const entry = unsynced[i];
      
      try {
        const { error } = await supabase
          .from('refuel_entries')
          .insert({
            user_id: user.id,
            timestamp: new Date(entry.timestamp).toISOString(),
            liters_added: entry.litersAdded,
            price_per_liter: entry.pricePerLiter,
            total_paid: entry.totalPaid,
            station_name: entry.stationName || null,
            fuel_level_before: entry.fuelLevelBefore,
            fuel_level_after: entry.fuelLevelAfter,
            quality: entry.quality || 'unknown',
            stft_average: entry.stftAverage,
            ltft_delta: entry.ltftDelta,
            ltft_final: entry.ltftFinal ?? null,
            o2_avg: entry.o2Avg ?? null,
            anomaly_detected: entry.anomalyDetected || false,
            anomaly_details: entry.anomalyDetails,
            distance_monitored: entry.distanceMonitored,
            tank_capacity: entry.tankCapacity,
            pump_accuracy_percent: entry.pumpAccuracyPercent,
            fuel_context: entry.fuelContext ?? null,
            fuel_state: entry.fuelState ?? null,
            adaptation_complete: entry.adaptationComplete ?? null,
          });
        
        if (error) {
          console.error('[OfflineRefuel] Erro ao sincronizar:', entry.localId, error);
        } else {
          console.log('[OfflineRefuel] Sincronizado:', entry.localId);
          syncedIds.push(entry.localId);
        }
      } catch (err) {
        console.error('[OfflineRefuel] Erro inesperado:', entry.localId, err);
      }
      
      setSyncProgress(Math.round(((i + 1) / unsynced.length) * 100));
    }
    
    // Marca entradas como sincronizadas
    if (syncedIds.length > 0) {
      setPendingEntries(prev => {
        const updated = prev.map(e => 
          syncedIds.includes(e.localId) ? { ...e, synced: true } : e
        );
        saveQueue(updated);
        return updated;
      });
      
      if (syncedIds.length === unsynced.length) {
        toast.success('Diagnósticos sincronizados!', {
          description: `${syncedIds.length} registro(s) enviados para a nuvem`,
        });
      } else {
        toast.warning('Sincronização parcial', {
          description: `${syncedIds.length} de ${unsynced.length} registros sincronizados`,
        });
      }
    }
    
    syncingRef.current = false;
    setIsSyncing(false);
    setSyncProgress(0);
  }, [isAuthenticated, user, pendingEntries]);

  // Remove entrada da fila
  const removeEntry = useCallback((localId: string) => {
    setPendingEntries(prev => {
      const updated = prev.filter(e => e.localId !== localId);
      saveQueue(updated);
      console.log('[OfflineRefuel] Removido:', localId);
      return updated;
    });
  }, []);

  // Limpa entradas já sincronizadas
  const clearSynced = useCallback(() => {
    setPendingEntries(prev => {
      const updated = prev.filter(e => !e.synced);
      saveQueue(updated);
      console.log('[OfflineRefuel] Limpou entradas sincronizadas');
      return updated;
    });
  }, []);

  const pendingCount = pendingEntries.filter(e => !e.synced).length;

  return {
    pendingEntries,
    pendingCount,
    isOnline,
    isSyncing,
    syncProgress,
    saveOffline,
    syncNow,
    removeEntry,
    clearSynced,
  };
}
