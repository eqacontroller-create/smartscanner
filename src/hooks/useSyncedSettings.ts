import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TripSettings, defaultTripSettings } from '@/types/tripSettings';

const LOCAL_STORAGE_KEY = 'smartscanner-trip-settings';

interface UseSyncedSettingsReturn {
  settings: TripSettings;
  updateSettings: (newSettings: Partial<TripSettings>) => Promise<void>;
  loading: boolean;
  synced: boolean;
}

export function useSyncedSettings(): UseSyncedSettingsReturn {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<TripSettings>(defaultTripSettings);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      
      // Always load from localStorage first (offline support)
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setSettings({ ...defaultTripSettings, ...parsed });
        } catch {
          // Invalid JSON, use defaults
        }
      }

      // If authenticated, sync from Supabase
      if (isAuthenticated && user) {
        try {
          const { data, error } = await supabase
            .from('trip_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (data && !error) {
            const cloudSettings: TripSettings = {
              fuelPrice: Number(data.fuel_price),
              averageConsumption: Number(data.average_consumption),
              vehicleCostPerKm: Number(data.vehicle_cost_per_km),
              autoRideEnabled: data.auto_ride_enabled ?? true,
              autoStartDelay: data.auto_start_delay ?? 5,
              autoStopDelay: data.auto_stop_delay ?? 30,
              speedThreshold: data.speed_threshold ?? 10,
            };
            setSettings(cloudSettings);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudSettings));
            setSynced(true);
          } else if (error?.code === 'PGRST116') {
            // No row found, create one with current settings
            await supabase.from('trip_settings').insert({
              user_id: user.id,
              fuel_price: settings.fuelPrice,
              average_consumption: settings.averageConsumption,
              vehicle_cost_per_km: settings.vehicleCostPerKm,
              auto_ride_enabled: settings.autoRideEnabled,
              auto_start_delay: settings.autoStartDelay,
              auto_stop_delay: settings.autoStopDelay,
              speed_threshold: settings.speedThreshold,
            });
            setSynced(true);
          }
        } catch (err) {
          console.error('Error loading settings from cloud:', err);
        }
      }

      setLoading(false);
    };

    loadSettings();
  }, [isAuthenticated, user]);

  const updateSettings = useCallback(async (newSettings: Partial<TripSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Save to localStorage immediately (offline-first)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Sync to Supabase if authenticated
    if (isAuthenticated && user) {
      try {
        await supabase
          .from('trip_settings')
          .upsert({
            user_id: user.id,
            fuel_price: updated.fuelPrice,
            average_consumption: updated.averageConsumption,
            vehicle_cost_per_km: updated.vehicleCostPerKm,
            auto_ride_enabled: updated.autoRideEnabled,
            auto_start_delay: updated.autoStartDelay,
            auto_stop_delay: updated.autoStopDelay,
            speed_threshold: updated.speedThreshold,
          }, { onConflict: 'user_id' });
        setSynced(true);
      } catch (err) {
        console.error('Error syncing settings to cloud:', err);
        setSynced(false);
      }
    }
  }, [settings, isAuthenticated, user]);

  return {
    settings,
    updateSettings,
    loading,
    synced,
  };
}
