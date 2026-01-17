// Página principal do dashboard - Componente maestro

import { useEffect, useRef, useState, useCallback } from 'react';
import { useVehicleSession } from '@/hooks/useVehicleSession';
import { useJarvisSystem } from '@/hooks/useJarvisSystem';
import { useTripCalculator } from '@/hooks/useTripCalculator';
import { useAutoRide } from '@/hooks/useAutoRide';
import { useRefuelMonitor } from '@/hooks/useRefuelMonitor';
import { useRefuelSettings } from '@/hooks/useRefuelSettings';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useMaintenanceSchedule } from '@/hooks/useMaintenanceSchedule';
import { useShiftLight } from '@/hooks/useShiftLight';
import { useAlerts } from '@/hooks/useAlerts';
import { AppHeader } from '@/components/dashboard/AppHeader';
import { AppFooter } from '@/components/dashboard/AppFooter';
import { ConnectionPanel } from '@/components/dashboard/ConnectionPanel';
import { MainTabs } from '@/components/dashboard/MainTabs';
import { FloatingControls } from '@/components/dashboard/FloatingControls';

const Index = () => {
  const [mainTab, setMainTab] = useState('painel');
  const [isFlowSelectorOpen, setIsFlowSelectorOpen] = useState(false);
  const [isRefuelModalOpen, setIsRefuelModalOpen] = useState(false);
  const reconnectAttemptedRef = useRef(false);

  // Hooks compostos - useJarvisSystem agora usa store global, então só precisamos de uma instância
  const session = useVehicleSession({ 
    jarvisSettings: undefined, // Será preenchido depois via efeito
    onApplyOptimizedSettings: undefined, 
    speak: undefined 
  });
  
  const tripCalc = useTripCalculator({ speed: session.vehicleData.speed });
  
  // Uma única instância do Jarvis - agora com estado global compartilhado
  const jarvis = useJarvisSystem({ 
    vehicleData: session.vehicleData, 
    tripData: tripCalc.tripData, 
    isConnected: session.isConnected, 
    isPolling: session.isPolling, 
    brandDisplayName: session.currentProfile.displayName, 
    brandCharacteristics: session.currentProfile.characteristics, 
    modelYear: session.themeVehicle?.modelYear 
  });
  
  const refuelSettings = useRefuelSettings();
  const autoRide = useAutoRide({ speed: session.vehicleData.speed, rpm: session.vehicleData.rpm, settings: tripCalc.settings, speak: jarvis.settings.aiModeEnabled ? jarvis.speak : undefined, onSaveRide: session.syncedRides.saveRide, onUpdateRide: session.syncedRides.updateRide, onClearRides: session.syncedRides.clearTodayRides, initialRides: session.syncedRides.todayRides });
  const refuelMonitor = useRefuelMonitor({ speed: session.vehicleData.speed, sendRawCommand: session.sendRawCommand, isConnected: session.isConnected, speak: jarvis.speak, onFuelPriceUpdate: (p) => tripCalc.updateSettings({ fuelPrice: p }), userId: session.user?.id, settings: refuelSettings.settings, reconnect: session.reconnect });
  const maintenanceSchedule = useMaintenanceSchedule({ brand: (session.themeVehicle?.brand || 'generic') as any, currentMileage: jarvis.settings.currentMileage, onAlertSpeak: jarvis.settings.maintenanceAlertEnabled && jarvis.settings.aiModeEnabled ? jarvis.speak : undefined });

  const handleVisibilityRestore = useCallback(async () => {
    if (jarvis.settings.autoReconnectEnabled && session.hasLastDevice && session.status === 'disconnected' && !reconnectAttemptedRef.current) {
      reconnectAttemptedRef.current = true;
      session.addLog('👁 Tela desbloqueada - verificando conexão...');
      const success = await session.reconnect();
      if (success) { jarvis.speak('Reconectado automaticamente'); setTimeout(() => session.startPolling(), 500); } 
      else { jarvis.speak('Conexão perdida. Toque para reconectar.'); }
      reconnectAttemptedRef.current = false;
    }
  }, [jarvis.settings.autoReconnectEnabled, session, jarvis]);

  const wakeLock = useWakeLock({ enabled: jarvis.settings.keepAwakeEnabled, isConnected: session.isConnected, onVisibilityRestore: handleVisibilityRestore });

  useShiftLight({ rpm: session.vehicleData.rpm, redlineRPM: jarvis.settings.redlineRPM, ecoEnabled: jarvis.settings.ecoShiftEnabled, sportEnabled: jarvis.settings.sportShiftEnabled, shiftLightEnabled: jarvis.settings.shiftLightEnabled, speak: jarvis.speak });
  useAlerts({ vehicleData: session.vehicleData, settings: { highRpmAlertEnabled: jarvis.settings.highRpmAlertEnabled, highTempAlertEnabled: jarvis.settings.highTempAlertEnabled, highTempThreshold: jarvis.settings.highTempThreshold, speedAlertEnabled: jarvis.settings.speedAlertEnabled, speedLimit: jarvis.settings.speedLimit, lowVoltageAlertEnabled: jarvis.settings.lowVoltageAlertEnabled, lowVoltageThreshold: jarvis.settings.lowVoltageThreshold, luggingAlertEnabled: jarvis.settings.luggingAlertEnabled, redlineRPM: jarvis.settings.redlineRPM, welcomeEnabled: jarvis.settings.welcomeEnabled, maintenanceAlertEnabled: jarvis.settings.maintenanceAlertEnabled, currentMileage: jarvis.settings.currentMileage, nextOilChange: jarvis.settings.nextOilChange, nextInspection: jarvis.settings.nextInspection, aiModeEnabled: jarvis.settings.aiModeEnabled }, status: session.status, speak: jarvis.speak, brandName: session.currentProfile.displayName, modelYear: session.themeVehicle?.modelYear, brandTip: session.vehicleBenefits.getWelcomeTip() });

  useEffect(() => { if (session.status === 'ready') refuelMonitor.checkPIDSupport(); }, [session.status]);
  useEffect(() => { if (wakeLock.isWakeLockActive && session.isConnected) session.addLog('🌙 Modo Insônia ativado - tela permanecerá ligada'); }, [wakeLock.isWakeLockActive, session.isConnected]);

  // CORREÇÃO: Pausar polling do dashboard durante monitoramento de Fuel Trim
  // Isso libera o barramento OBD-II exclusivamente para leituras de STFT/LTFT
  useEffect(() => {
    const isRefuelActive = refuelMonitor.mode === 'monitoring' || 
                           refuelMonitor.mode === 'analyzing' ||
                           refuelMonitor.mode === 'waiting' ||
                           refuelMonitor.mode === 'waiting-quick';
    
    if (isRefuelActive && session.isPolling) {
      console.log('[Index] Pausando polling do dashboard para monitoramento de combustível');
      session.stopPolling();
    }
    
    // Retomar polling quando refuel terminar (e estiver conectado)
    if (!isRefuelActive && session.isConnected && !session.isPolling && session.status === 'ready') {
      console.log('[Index] Retomando polling do dashboard');
      session.startPolling();
    }
  }, [refuelMonitor.mode, session.isPolling, session.isConnected, session.status, session.startPolling, session.stopPolling]);

  const handleVoiceReport = useCallback(() => jarvis.speak(tripCalc.getVoiceReport()), [jarvis, tripCalc]);
  const handleDailyReport = useCallback(() => jarvis.speak(autoRide.getVoiceReport()), [jarvis, autoRide]);
  
  // Navigate to Config tab when settings button is clicked
  const handleOpenSettings = useCallback(() => {
    setMainTab('config');
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-y">
      {/* Header with stagger animation */}
      <div className="animate-stagger-fade-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
        <AppHeader themeVehicle={session.themeVehicle} currentProfile={session.currentProfile} syncStatus={{ synced: session.syncedRides.synced, loading: session.syncedRides.loading }} status={session.status} jarvisEnabled={jarvis.settings.aiModeEnabled} isJarvisSupported={jarvis.isTTSSupported} isSpeaking={jarvis.isSpeaking} isListening={jarvis.isListening} isProcessing={jarvis.isProcessing} isAISupported={jarvis.isAISupported} aiError={jarvis.aiError} isWakeLockActive={wakeLock.isWakeLockActive} onOpenSettings={handleOpenSettings} onTestAudio={jarvis.testAudio} onToggleListening={jarvis.toggleListening} />
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 safe-area-x">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {/* Connection Panel with stagger */}
          <div className="animate-stagger-fade-in" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
            <ConnectionPanel status={session.status} error={session.error} isSupported={session.isSupported} themeVehicle={session.themeVehicle} onConnect={session.connect} onDisconnect={session.disconnect} />
          </div>

          {/* Main Tabs with stagger */}
          <div className="animate-stagger-fade-in" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
            <MainTabs value={mainTab} onValueChange={setMainTab} vehicleData={session.vehicleData} status={session.status} isPolling={session.isPolling} logs={session.logs} themeVehicle={session.themeVehicle} currentProfile={session.currentProfile} onStartPolling={session.startPolling} onStopPolling={session.stopPolling} sendRawCommand={session.sendRawCommand} addLog={session.addLog} jarvisSettings={jarvis.settings} isSpeaking={jarvis.isSpeaking} speak={jarvis.speak} availableVoices={jarvis.availableVoices} portugueseVoices={jarvis.portugueseVoices} onUpdateJarvisSetting={jarvis.updateSetting} onResetJarvisSettings={jarvis.resetToDefaults} onTestVoice={jarvis.testAudio} isWakeLockActive={wakeLock.isWakeLockActive} tripData={tripCalc.tripData} tripSettings={tripCalc.settings} tripHistory={tripCalc.history} onStartTrip={tripCalc.startTrip} onPauseTrip={tripCalc.pauseTrip} onResumeTrip={tripCalc.resumeTrip} onResetTrip={tripCalc.resetTrip} onSaveTrip={tripCalc.saveTrip} onClearTripHistory={tripCalc.clearHistory} onUpdateTripSettings={tripCalc.updateSettings} onVoiceReport={handleVoiceReport} rideStatus={autoRide.rideStatus} dailySummary={autoRide.dailySummary} onClearTodayRides={autoRide.clearTodayRides} onDailyReport={handleDailyReport} refuelMode={refuelMonitor.mode} refuelFlowType={refuelMonitor.flowType} distanceMonitored={refuelMonitor.distanceMonitored} currentSTFT={refuelMonitor.currentSTFT} currentLTFT={refuelMonitor.currentLTFT} currentO2={refuelMonitor.currentO2} o2Readings={refuelMonitor.o2Readings} o2FrozenDuration={refuelMonitor.o2FrozenDuration} anomalyActive={refuelMonitor.anomalyActive} anomalyDuration={refuelMonitor.anomalyDuration} fuelTrimHistory={refuelMonitor.fuelTrimHistory} refuelSettings={refuelSettings.settings} frozenSettings={refuelMonitor.frozenSettings} currentRefuel={refuelMonitor.currentRefuel} isSyncing={refuelSettings.isSyncing} stftSupported={refuelMonitor.stftSupported} isAuthenticated={session.isAuthenticated} onStartRefuelMode={refuelMonitor.startRefuelMode} onStartQuickTest={refuelMonitor.startQuickTest} onCancelRefuel={refuelMonitor.cancelRefuel} onOpenRefuelModal={() => setIsRefuelModalOpen(true)} onUpdateRefuelSettings={refuelSettings.updateSettings} onResetRefuelSettings={refuelSettings.resetToDefaults} vehicleBenefits={session.vehicleBenefits} maintenanceSchedule={maintenanceSchedule} vehicleContext={session.syncedProfile.profile.vehicle.vehicleModel ? { brand: session.syncedProfile.profile.vehicle.vehicleBrand, model: session.syncedProfile.profile.vehicle.vehicleModel, year: session.syncedProfile.profile.vehicle.modelYear, engine: session.syncedProfile.profile.vehicle.vehicleEngine } : session.themeVehicle ? { brand: session.themeVehicle.brand, model: null, year: session.themeVehicle.modelYear, engine: null } : undefined} vehicleInfo={session.syncedProfile.profile.vehicle} onUpdateVehicle={session.syncedProfile.updateVehicle} />
          </div>
        </div>
      </main>

      {/* Footer with stagger */}
      <div className="animate-stagger-fade-in" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
        <AppFooter />
      </div>

      <FloatingControls isListening={jarvis.isListening} isContinuousMode={jarvis.isContinuousMode} isWakeWordDetected={jarvis.isWakeWordDetected} isProcessing={jarvis.isProcessing} isSpeakingAI={jarvis.isSpeakingAI} isAISupported={jarvis.isAISupported} aiEnabled={jarvis.settings.aiModeEnabled} continuousListeningEnabled={jarvis.settings.continuousListening} wakeWord={jarvis.settings.wakeWord} aiError={jarvis.aiError} lastTranscript={jarvis.lastTranscript} interimTranscript={jarvis.interimTranscript} lastResponse={jarvis.lastResponse} conversationHistory={jarvis.conversationHistory} onToggleListening={jarvis.toggleListening} onToggleContinuousMode={jarvis.toggleContinuousMode} onClearHistory={jarvis.clearHistory} isSettingsOpen={false} onSettingsChange={() => {}} jarvisSettings={jarvis.settings} onUpdateJarvisSetting={jarvis.updateSetting} onResetJarvisSettings={jarvis.resetToDefaults} availableVoices={jarvis.availableVoices} portugueseVoices={jarvis.portugueseVoices} onTestVoice={jarvis.testAudio} isSpeaking={jarvis.isSpeaking} isWakeLockActive={wakeLock.isWakeLockActive} autoRide={autoRide} refuelMode={refuelMonitor.mode} refuelFlowType={refuelMonitor.flowType} currentRefuel={refuelMonitor.currentRefuel} currentFuelLevel={refuelMonitor.currentFuelLevel} fuelLevelSupported={refuelMonitor.fuelLevelSupported} distanceMonitored={refuelMonitor.distanceMonitored} currentSTFT={refuelMonitor.currentSTFT} currentLTFT={refuelMonitor.currentLTFT} anomalyActive={refuelMonitor.anomalyActive} anomalyDuration={refuelMonitor.anomalyDuration} fuelTrimHistory={refuelMonitor.fuelTrimHistory} refuelSettings={refuelSettings.settings} frozenSettings={refuelMonitor.frozenSettings} confirmRefuel={refuelMonitor.confirmRefuel} cancelRefuel={refuelMonitor.cancelRefuel} startRefuelMode={refuelMonitor.startRefuelMode} startQuickTest={refuelMonitor.startQuickTest} stftSupported={refuelMonitor.stftSupported} onUpdateRefuelSettings={refuelSettings.updateSettings} onResetRefuelSettings={refuelSettings.resetToDefaults} isSyncing={refuelSettings.isSyncing} tripFuelPrice={tripCalc.settings.fuelPrice} isConnected={session.isConnected} isAuthenticated={session.isAuthenticated} isFlowSelectorOpen={isFlowSelectorOpen} isRefuelModalOpen={isRefuelModalOpen} onFlowSelectorChange={setIsFlowSelectorOpen} onRefuelModalChange={setIsRefuelModalOpen} />
    </div>
  );
};

export default Index;
