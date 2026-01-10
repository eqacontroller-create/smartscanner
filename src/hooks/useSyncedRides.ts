import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RideEntry, DailySummary } from '@/types/tripSettings';

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

      // If authenticated, sync from Supabase
      if (isAuthenticated && user) {
        try {
          const startOfDay = new Date(todayStr);
          const endOfDay = new Date(todayStr);
          endOfDay.setDate(endOfDay.getDate() + 1);

          const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('user_id', user.id)
            .gte('start_time', startOfDay.toISOString())
            .lt('start_time', endOfDay.toISOString())
            .order('start_time', { ascending: true });

          if (data && !error) {
            const cloudRides: RideEntry[] = data.map(r => ({
              id: r.id,
              startTime: new Date(r.start_time).getTime(),
              endTime: r.end_time ? new Date(r.end_time).getTime() : Date.now(),
              distance: Number(r.distance),
              cost: Number(r.cost),
              costPerKm: Number(r.cost_per_km),
              duration: r.duration ?? 0,
              averageSpeed: Number(r.average_speed),
              amountReceived: r.amount_received ? Number(r.amount_received) : undefined,
              profit: r.profit ? Number(r.profit) : undefined,
            }));
            setTodayRides(cloudRides);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
              date: todayStr,
              rides: cloudRides,
            }));
            setSynced(true);
          }
        } catch (err) {
          console.error('Error loading rides from cloud:', err);
        }
      }

      setLoading(false);
    };

    loadRides();
  }, [isAuthenticated, user]);

  // Realtime subscription
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase
      .channel('rides-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
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
        }
      )
      .subscribe();

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

    // Sync to Supabase if authenticated
    if (isAuthenticated && user) {
      try {
        await supabase.from('rides').insert({
          id: ride.id,
          user_id: user.id,
          start_time: new Date(ride.startTime).toISOString(),
          end_time: new Date(ride.endTime).toISOString(),
          distance: ride.distance,
          cost: ride.cost,
          cost_per_km: ride.costPerKm,
          duration: ride.duration,
          average_speed: ride.averageSpeed,
          amount_received: ride.amountReceived,
          profit: ride.profit,
        });
        setSynced(true);
      } catch (err) {
        console.error('Error saving ride to cloud:', err);
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

    // Sync to Supabase if authenticated
    if (isAuthenticated && user) {
      try {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.amountReceived !== undefined) dbUpdates.amount_received = updates.amountReceived;
        if (updates.profit !== undefined) dbUpdates.profit = updates.profit;
        if (updates.distance !== undefined) dbUpdates.distance = updates.distance;
        if (updates.cost !== undefined) dbUpdates.cost = updates.cost;

        await supabase
          .from('rides')
          .update(dbUpdates)
          .eq('id', id);
        setSynced(true);
      } catch (err) {
        console.error('Error updating ride in cloud:', err);
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

    // Clear from Supabase if authenticated
    if (isAuthenticated && user) {
      try {
        const startOfDay = new Date(todayStr);
        const endOfDay = new Date(todayStr);
        endOfDay.setDate(endOfDay.getDate() + 1);

        await supabase
          .from('rides')
          .delete()
          .eq('user_id', user.id)
          .gte('start_time', startOfDay.toISOString())
          .lt('start_time', endOfDay.toISOString());
        setSynced(true);
      } catch (err) {
        console.error('Error clearing rides from cloud:', err);
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
