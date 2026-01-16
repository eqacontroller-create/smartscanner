import { useEffect } from 'react';
import { useOBD } from '@/hooks/useOBD';
import { useVehicleTheme } from '@/hooks/useVehicleTheme';
import { useAuth } from '@/hooks/useAuth';
import { useSyncedRides } from '@/hooks/useSyncedRides';
import { useVehicleBenefits } from '@/hooks/useVehicleBenefits';
import type { JarvisSettings } from '@/types/jarvisSettings';

interface UseVehicleSessionOptions {
  jarvisSettings: JarvisSettings;
  onApplyOptimizedSettings?: (settings: {
    redlineRPM: number;
    highTempThreshold: number;
    lowVoltageThreshold: number;
    speedLimit: number;
  }) => void;
  speak?: (message: string) => void;
}

/**
 * Hook composto que agrupa toda a lógica de sessão do veículo:
 * - Conexão OBD
 * - Tema dinâmico baseado no veículo
 * - Autenticação
 * - Sincronização de corridas
 * - Benefícios específicos da marca
 */
export function useVehicleSession({
  jarvisSettings,
  onApplyOptimizedSettings,
  speak,
}: UseVehicleSessionOptions) {
  // Dados OBD via contexto global
  const obd = useOBD();
  
  // Hook de autenticação
  const { isAuthenticated, user } = useAuth();
  
  // Hook de tema dinâmico baseado no veículo
  const { 
    detectedVehicle: themeVehicle, 
    currentProfile, 
    setVehicle, 
    resetToGeneric 
  } = useVehicleTheme();
  
  // Hook de sincronização de corridas
  const syncedRides = useSyncedRides();
  
  // Hook de benefícios específicos do veículo
  const vehicleBenefits = useVehicleBenefits({
    brand: themeVehicle?.brand || 'generic',
    profile: currentProfile,
    modelYear: themeVehicle?.modelYear,
    currentSettings: {
      redlineRPM: jarvisSettings.redlineRPM,
      highTempThreshold: jarvisSettings.highTempThreshold,
      lowVoltageThreshold: jarvisSettings.lowVoltageThreshold,
      speedLimit: jarvisSettings.speedLimit,
    },
    onApplySettings: (settings) => {
      if (onApplyOptimizedSettings) {
        onApplyOptimizedSettings(settings);
      }
      if (speak) {
        speak(`Configurações otimizadas para ${currentProfile.displayName} aplicadas.`);
      }
    },
  });

  // Atualizar tema quando veículo for detectado
  useEffect(() => {
    if (obd.detectedVehicle?.vin) {
      setVehicle(
        obd.detectedVehicle.vin,
        obd.detectedVehicle.manufacturer || undefined,
        obd.detectedVehicle.modelYear || undefined,
        obd.detectedVehicle.country || undefined
      );
    } else if (obd.status === 'disconnected') {
      resetToGeneric();
    }
  }, [obd.detectedVehicle, obd.status, setVehicle, resetToGeneric]);

  return {
    // Conexão OBD
    status: obd.status,
    vehicleData: obd.vehicleData,
    detectedVehicle: obd.detectedVehicle,
    error: obd.error,
    logs: obd.logs,
    isPolling: obd.isPolling,
    isSupported: obd.isSupported,
    hasLastDevice: obd.hasLastDevice,
    connect: obd.connect,
    disconnect: obd.disconnect,
    startPolling: obd.startPolling,
    stopPolling: obd.stopPolling,
    sendRawCommand: obd.sendRawCommand,
    addLog: obd.addLog,
    reconnect: obd.reconnect,
    
    // Tema do veículo
    themeVehicle,
    currentProfile,
    
    // Autenticação
    isAuthenticated,
    user,
    
    // Sincronização
    syncedRides,
    
    // Benefícios
    vehicleBenefits,
    
    // Helpers
    isReady: obd.status === 'ready',
    isReading: obd.status === 'reading',
    isConnected: obd.status === 'ready' || obd.status === 'reading',
  };
}
