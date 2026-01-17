import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { RideEntry, DailySummary } from '@/types/tripSettings';
import { RidesService } from '@/services/supabase/RidesService';
import logger from '@/lib/logger';

const LOCAL_STORAGE_KEY = 'smartscanner-today-rides';

interface UseSyncedRidesReturn {
  todayRides: RideEntry[];
  dailySummary: DailySummary;
  saveRide: (ride: RideEntry) => Promise<void>;
  updateRide: (id: string, updates: Partial<RideEntry>) => Promise<void>;
  clearTodayRides: () => Promise<void>;
  loading: boolean;
  synced: boolean;
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateDailySummary(rides: RideEntry[]): DailySummary {
  return {
    date: getTodayDateString(),
    rides,
    totalDistance: rides.reduce((sum, r) => sum + r.distance, 0),
    totalCost: rides.reduce((sum, r) => sum + r.cost, 0),
    totalReceived: rides.reduce((sum, r) => sum + (r.amountReceived || 0), 0),
    totalProfit: rides.reduce((sum, r) => sum + (r.profit || 0), 0),
  };
}

export function useSyncedRides(): UseSyncedRidesReturn {
  const { user, isAuthenticated } = useAuth();
  const [todayRides, setTodayRides] = useState<RideEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  // Load rides on mount
  useEffect(() => {
    const loadRides = async () => {
      setLoading(true);
      const todayStr = getTodayDateString();

      // Load from localStorage first (offline support)
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed.date === todayStr && Array.isArray(parsed.rides)) {
            setTodayRides(parsed.rides);
          }
        } catch {
          // Invalid JSON
        }
      }

      // If authenticated, sync from Supabase using RidesService
      if (isAuthenticated && user) {
        try {
          const cloudRides = await RidesService.getTodayRides(user.id);
          setTodayRides(cloudRides);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
            date: todayStr,
            rides: cloudRides,
          }));
          setSynced(true);
        } catch (err) {
          logger.error('[SyncedRides] Erro ao carregar do cloud:', err);
        }
      }

      setLoading(false);
    };

    loadRides();
  }, [isAuthenticated, user]);

  // Realtime subscription
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = RidesService.subscribeToChanges(user.id, (payload) => {
      const todayStr = getTodayDateString();
      
      if (payload.eventType === 'INSERT') {
        const newRide = payload.new;
        const rideDate = new Date(newRide.start_time).toISOString().split('T')[0];
        if (rideDate === todayStr) {
          const ride: RideEntry = {
            id: newRide.id,
            startTime: new Date(newRide.start_time).getTime(),
            endTime: newRide.end_time ? new Date(newRide.end_time).getTime() : Date.now(),
            distance: Number(newRide.distance),
            cost: Number(newRide.cost),
            costPerKm: Number(newRide.cost_per_km),
            duration: newRide.duration ?? 0,
            averageSpeed: Number(newRide.average_speed),
            amountReceived: newRide.amount_received ? Number(newRide.amount_received) : undefined,
            profit: newRide.profit ? Number(newRide.profit) : undefined,
          };
          setTodayRides(prev => [...prev, ride]);
        }
      } else if (payload.eventType === 'UPDATE') {
        const updated = payload.new;
        setTodayRides(prev => prev.map(r => 
          r.id === updated.id 
            ? {
                ...r,
                amountReceived: updated.amount_received ? Number(updated.amount_received) : undefined,
                profit: updated.profit ? Number(updated.profit) : undefined,
              }
            : r
        ));
      } else if (payload.eventType === 'DELETE') {
        setTodayRides(prev => prev.filter(r => r.id !== payload.old.id));
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [isAuthenticated, user]);

  const saveRide = useCallback(async (ride: RideEntry) => {
    const todayStr = getTodayDateString();
    
    // Save locally first
    setTodayRides(prev => {
      const updated = [...prev, ride];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        date: todayStr,
        rides: updated,
      }));
      return updated;
    });

    // Sync to Supabase if authenticated using RidesService
    if (isAuthenticated && user) {
      try {
        await RidesService.save(ride, user.id);
        setSynced(true);
      } catch (err) {
        logger.error('[SyncedRides] Erro ao salvar no cloud:', err);
        setSynced(false);
      }
    }
  }, [isAuthenticated, user]);

  const updateRide = useCallback(async (id: string, updates: Partial<RideEntry>) => {
    const todayStr = getTodayDateString();
    
    // Update locally first
    setTodayRides(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        date: todayStr,
        rides: updated,
      }));
      return updated;
    });

    // Sync to Supabase if authenticated using RidesService
    if (isAuthenticated && user) {
      try {
        await RidesService.update(id, updates);
        setSynced(true);
      } catch (err) {
        logger.error('[SyncedRides] Erro ao atualizar no cloud:', err);
        setSynced(false);
      }
    }
  }, [isAuthenticated, user]);

  const clearTodayRides = useCallback(async () => {
    const todayStr = getTodayDateString();
    
    // Clear locally
    setTodayRides([]);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      date: todayStr,
      rides: [],
    }));

    // Clear from Supabase if authenticated using RidesService
    if (isAuthenticated && user) {
      try {
        await RidesService.deleteTodayRides(user.id);
        setSynced(true);
      } catch (err) {
        logger.error('[SyncedRides] Erro ao limpar no cloud:', err);
        setSynced(false);
      }
    }
  }, [isAuthenticated, user]);

  return {
    todayRides,
    dailySummary: calculateDailySummary(todayRides),
    saveRide,
    updateRide,
    clearTodayRides,
    loading,
    synced,
  };
}
