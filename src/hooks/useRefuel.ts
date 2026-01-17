// Hook composto que agrupa refuelMonitor + refuelSettings
// Simplifica a passagem de props relacionadas a abastecimento
// V2: Expõe fuelContext e forensicResult da State Machine

import { useRefuelMonitor } from '@/hooks/useRefuelMonitor';
import { useRefuelSettings } from '@/hooks/useRefuelSettings';
import type { RefuelContext } from '@/types/sessionContext';

interface UseRefuelOptions {
  speed: number;
  sendRawCommand: (cmd: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  speak: (text: string, options?: { priority?: number; interrupt?: boolean }) => Promise<void>;
  onFuelPriceUpdate?: (price: number) => void;
  userId?: string;
  // AUTO-RECONNECT: Função para tentar reconectar ao Bluetooth
  reconnect?: () => Promise<boolean>;
}

export function useRefuel(options: UseRefuelOptions): RefuelContext {
  const refuelSettings = useRefuelSettings();
  
  const refuelMonitor = useRefuelMonitor({
    speed: options.speed,
    sendRawCommand: options.sendRawCommand,
    isConnected: options.isConnected,
    speak: options.speak,
    onFuelPriceUpdate: options.onFuelPriceUpdate,
    userId: options.userId,
    settings: refuelSettings.settings,
    reconnect: options.reconnect,
  });

  return {
    // Monitor
    mode: refuelMonitor.mode,
    flowType: refuelMonitor.flowType,
    currentRefuel: refuelMonitor.currentRefuel,
    fuelTrimHistory: refuelMonitor.fuelTrimHistory,
    fuelLevelSupported: refuelMonitor.fuelLevelSupported,
    stftSupported: refuelMonitor.stftSupported,
    currentSTFT: refuelMonitor.currentSTFT,
    currentLTFT: refuelMonitor.currentLTFT,
    currentO2: refuelMonitor.currentO2,
    currentFuelLevel: refuelMonitor.currentFuelLevel,
    distanceMonitored: refuelMonitor.distanceMonitored,
    anomalyActive: refuelMonitor.anomalyActive,
    anomalyDuration: refuelMonitor.anomalyDuration,
    frozenSettings: refuelMonitor.frozenSettings,
    
    // State Machine (Forensic Analysis)
    fuelContext: refuelMonitor.fuelContext,
    setFuelContext: refuelMonitor.setFuelContext,
    forensicResult: refuelMonitor.forensicResult,
    monitoringData: refuelMonitor.monitoringData,
    
    // Settings
    settings: refuelSettings.settings,
    isSyncing: refuelSettings.isSyncing,
    
    // Ações Monitor
    startRefuelMode: refuelMonitor.startRefuelMode,
    startQuickTest: refuelMonitor.startQuickTest,
    confirmRefuel: refuelMonitor.confirmRefuel,
    cancelRefuel: refuelMonitor.cancelRefuel,
    checkPIDSupport: refuelMonitor.checkPIDSupport,
    
    // Ações Settings
    updateSettings: refuelSettings.updateSettings,
    resetToDefaults: refuelSettings.resetToDefaults,
  };
}