import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { JarvisSettings, defaultJarvisSettings, FuelType } from '@/types/jarvisSettings';
import { TripSettings, defaultTripSettings } from '@/types/tripSettings';
import { toast } from 'sonner';

// Chaves do localStorage para migração
const LOCAL_JARVIS_KEY = 'jarvis-settings';
const LOCAL_TRIP_KEY = 'trip-settings';
const LOCAL_VEHICLE_KEY = 'vehicle-info';

export interface VehicleInfo {
  vin: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  modelYear: string | null;
}

export interface SyncedProfile {
  vehicle: VehicleInfo;
  jarvisSettings: JarvisSettings;
  tripSettings: TripSettings;
}

interface UseSyncedProfileReturn {
  profile: SyncedProfile;
  updateVehicle: (vehicle: Partial<VehicleInfo>) => Promise<void>;
  updateJarvisSettings: (settings: Partial<JarvisSettings>) => Promise<void>;
  updateTripSettings: (settings: Partial<TripSettings>) => Promise<void>;
  loading: boolean;
  synced: boolean;
  lastSyncedAt: Date | null;
}

const defaultVehicle: VehicleInfo = {
  vin: null,
  vehicleBrand: null,
  vehicleModel: null,
  modelYear: null,
};

const defaultProfile: SyncedProfile = {
  vehicle: defaultVehicle,
  jarvisSettings: defaultJarvisSettings,
  tripSettings: defaultTripSettings,
};

// Converte dados do banco para o formato do app
function dbToProfile(dbData: Record<string, unknown>): SyncedProfile {
  return {
    vehicle: {
      vin: dbData.vin as string | null,
      vehicleBrand: dbData.vehicle_brand as string | null,
      vehicleModel: dbData.vehicle_model as string | null,
      modelYear: dbData.model_year as string | null,
    },
    jarvisSettings: {
      fuelType: (dbData.fuel_type as FuelType) || 'gasoline',
      redlineRPM: (dbData.redline_rpm as number) || 6500,
      highTempThreshold: (dbData.high_temp_threshold as number) || 100,
      speedLimit: (dbData.speed_limit as number) || 120,
      lowVoltageThreshold: (dbData.low_voltage_threshold as number) || 12.5,
      currentMileage: (dbData.current_mileage as number) || 0,
      nextOilChange: 15000,
      nextInspection: 30000,
      welcomeEnabled: dbData.welcome_enabled !== false,
      highRpmAlertEnabled: dbData.high_rpm_alert_enabled !== false,
      highTempAlertEnabled: dbData.high_temp_alert_enabled !== false,
      speedAlertEnabled: dbData.speed_alert_enabled !== false,
      lowVoltageAlertEnabled: dbData.low_voltage_alert_enabled !== false,
      maintenanceAlertEnabled: dbData.maintenance_alert_enabled !== false,
      shiftLightEnabled: dbData.shift_light_enabled !== false,
      ecoShiftEnabled: true,
      sportShiftEnabled: true,
      luggingAlertEnabled: dbData.lugging_alert_enabled !== false,
      aiModeEnabled: dbData.ai_mode_enabled !== false,
      aiResponseLength: 'short' as const,
      continuousListening: false,
      wakeWord: 'jarvis',
      keepAwakeEnabled: dbData.keep_awake_enabled !== false,
      autoReconnectEnabled: true,
      volume: (dbData.voice_volume as number) || 1.0,
      rate: (dbData.voice_rate as number) || 0.9,
      pitch: (dbData.voice_pitch as number) || 0.95,
      selectedVoiceURI: dbData.selected_voice_uri as string | null || null,
    },
    tripSettings: {
      fuelPrice: (dbData.fuel_price as number) || 6.00,
      averageConsumption: (dbData.average_consumption as number) || 12,
      vehicleCostPerKm: (dbData.vehicle_cost_per_km as number) || 0.10,
      autoRideEnabled: dbData.auto_ride_enabled !== false,
      autoStartDelay: (dbData.auto_start_delay as number) || 5,
      autoStopDelay: (dbData.auto_stop_delay as number) || 30,
      speedThreshold: (dbData.speed_threshold as number) || 10,
    },
  };
}

// Converte dados do app para o formato do banco
function profileToDb(profile: SyncedProfile, userId: string): Record<string, unknown> {
  return {
    id: userId,
    // Vehicle
    vin: profile.vehicle.vin,
    vehicle_brand: profile.vehicle.vehicleBrand,
    vehicle_model: profile.vehicle.vehicleModel,
    model_year: profile.vehicle.modelYear,
    // Fuel/Trip
    fuel_price: profile.tripSettings.fuelPrice,
    average_consumption: profile.tripSettings.averageConsumption,
    vehicle_cost_per_km: profile.tripSettings.vehicleCostPerKm,
    fuel_type: profile.jarvisSettings.fuelType,
    // Auto-ride
    auto_ride_enabled: profile.tripSettings.autoRideEnabled,
    auto_start_delay: profile.tripSettings.autoStartDelay,
    auto_stop_delay: profile.tripSettings.autoStopDelay,
    speed_threshold: profile.tripSettings.speedThreshold,
    // Jarvis settings
    redline_rpm: profile.jarvisSettings.redlineRPM,
    high_temp_threshold: profile.jarvisSettings.highTempThreshold,
    speed_limit: profile.jarvisSettings.speedLimit,
    low_voltage_threshold: profile.jarvisSettings.lowVoltageThreshold,
    current_mileage: profile.jarvisSettings.currentMileage,
    // Alerts
    welcome_enabled: profile.jarvisSettings.welcomeEnabled,
    high_rpm_alert_enabled: profile.jarvisSettings.highRpmAlertEnabled,
    high_temp_alert_enabled: profile.jarvisSettings.highTempAlertEnabled,
    speed_alert_enabled: profile.jarvisSettings.speedAlertEnabled,
    low_voltage_alert_enabled: profile.jarvisSettings.lowVoltageAlertEnabled,
    maintenance_alert_enabled: profile.jarvisSettings.maintenanceAlertEnabled,
    shift_light_enabled: profile.jarvisSettings.shiftLightEnabled,
    lugging_alert_enabled: profile.jarvisSettings.luggingAlertEnabled,
    ai_mode_enabled: profile.jarvisSettings.aiModeEnabled,
    keep_awake_enabled: profile.jarvisSettings.keepAwakeEnabled,
    // Voice
    voice_volume: profile.jarvisSettings.volume,
    voice_rate: profile.jarvisSettings.rate,
    voice_pitch: profile.jarvisSettings.pitch,
    selected_voice_uri: profile.jarvisSettings.selectedVoiceURI,
  };
}

// Carrega dados do localStorage para migração
function getLocalStorageData(): Partial<SyncedProfile> {
  const result: Partial<SyncedProfile> = {};
  
  try {
    const jarvisData = localStorage.getItem(LOCAL_JARVIS_KEY);
    if (jarvisData) {
      result.jarvisSettings = { ...defaultJarvisSettings, ...JSON.parse(jarvisData) };
    }
    
    const tripData = localStorage.getItem(LOCAL_TRIP_KEY);
    if (tripData) {
      result.tripSettings = { ...defaultTripSettings, ...JSON.parse(tripData) };
    }
    
    const vehicleData = localStorage.getItem(LOCAL_VEHICLE_KEY);
    if (vehicleData) {
      result.vehicle = { ...defaultVehicle, ...JSON.parse(vehicleData) };
    }
  } catch (error) {
    console.error('Erro ao ler localStorage:', error);
  }
  
  return result;
}

// Limpa dados migrados do localStorage
function clearLocalStorageData() {
  try {
    localStorage.removeItem(LOCAL_JARVIS_KEY);
    localStorage.removeItem(LOCAL_TRIP_KEY);
    localStorage.removeItem(LOCAL_VEHICLE_KEY);
    console.log('✅ Dados locais migrados e removidos do localStorage');
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error);
  }
}

export function useSyncedProfile(): UseSyncedProfileReturn {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<SyncedProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Carrega perfil do Supabase ou cria um novo
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      
      try {
        // Tenta carregar do Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Erro ao carregar perfil:', error);
          toast.error('Erro ao carregar configurações');
          setLoading(false);
          return;
        }

        // Se encontrou perfil no banco
        if (data) {
          console.log('✅ Perfil carregado do Cloud:', data);
          const loadedProfile = dbToProfile(data);
          setProfile(loadedProfile);
          setSynced(true);
          setLastSyncedAt(new Date(data.updated_at as string));
        } else {
          // Não existe perfil, verificar se tem dados locais para migrar
          console.log('📦 Perfil não encontrado, verificando localStorage...');
          const localData = getLocalStorageData();
          
          const newProfile: SyncedProfile = {
            vehicle: localData.vehicle || defaultVehicle,
            jarvisSettings: localData.jarvisSettings || defaultJarvisSettings,
            tripSettings: localData.tripSettings || defaultTripSettings,
          };
          
          // Prepara dados para inserção
          const dbData = profileToDb(newProfile, user.id);
          
          // Cria perfil no banco
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(dbData as any);
          
          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
            toast.error('Erro ao criar configurações');
          } else {
            console.log('✅ Perfil criado no Cloud');
            setProfile(newProfile);
            setSynced(true);
            setLastSyncedAt(new Date());
            
            // Se tinha dados locais, limpa após migração
            if (localData.jarvisSettings || localData.tripSettings || localData.vehicle) {
              clearLocalStorageData();
              toast.success('Suas configurações foram sincronizadas na nuvem!');
            }
          }
        }
      } catch (err) {
        console.error('Erro inesperado:', err);
      }
      
      setLoading(false);
    };

    loadProfile();
  }, [isAuthenticated, user]);

  // Função para salvar no banco
  const saveToDb = useCallback(async (updatedProfile: SyncedProfile) => {
    if (!user) return;
    
    setSynced(false);
    
    const dbData = profileToDb(updatedProfile, user.id);
    const { error } = await supabase
      .from('profiles')
      .upsert(dbData as any);
    
    if (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar configurações');
      setSynced(false);
    } else {
      console.log('✅ Perfil salvo no Cloud');
      setSynced(true);
      setLastSyncedAt(new Date());
    }
  }, [user]);

  // Atualiza informações do veículo
  const updateVehicle = useCallback(async (vehicle: Partial<VehicleInfo>) => {
    const newProfile = {
      ...profile,
      vehicle: { ...profile.vehicle, ...vehicle },
    };
    setProfile(newProfile);
    await saveToDb(newProfile);
  }, [profile, saveToDb]);

  // Atualiza configurações do Jarvis
  const updateJarvisSettings = useCallback(async (settings: Partial<JarvisSettings>) => {
    const newProfile = {
      ...profile,
      jarvisSettings: { ...profile.jarvisSettings, ...settings },
    };
    setProfile(newProfile);
    await saveToDb(newProfile);
  }, [profile, saveToDb]);

  // Atualiza configurações de viagem
  const updateTripSettings = useCallback(async (settings: Partial<TripSettings>) => {
    const newProfile = {
      ...profile,
      tripSettings: { ...profile.tripSettings, ...settings },
    };
    setProfile(newProfile);
    await saveToDb(newProfile);
  }, [profile, saveToDb]);

  return {
    profile,
    updateVehicle,
    updateJarvisSettings,
    updateTripSettings,
    loading,
    synced,
    lastSyncedAt,
  };
}
