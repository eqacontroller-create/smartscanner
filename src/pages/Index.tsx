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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFlowSelectorOpen, setIsFlowSelectorOpen] = useState(false);
  const [isRefuelModalOpen, setIsRefuelModalOpen] = useState(false);
  const reconnectAttemptedRef = useRef(false);

  // Hooks compostos
  const tripCalculator = useTripCalculator({ speed: 0 });
  const jarvis = useJarvisSystem({ vehicleData: { rpm: 0, speed: 0, temperature: 0, voltage: 0, fuelLevel: 0, engineLoad: 0 }, tripData: tripCalculator.tripData, isConnected: false, isPolling: false, brandDisplayName: 'Genérico' });
  const session = useVehicleSession({ jarvisSettings: jarvis.settings, onApplyOptimizedSettings: (s) => { jarvis.updateSetting('redlineRPM', s.redlineRPM); jarvis.updateSetting('highTempThreshold', s.highTempThreshold); jarvis.updateSetting('lowVoltageThreshold', s.lowVoltageThreshold); jarvis.updateSetting('speedLimit', s.speedLimit); }, speak: jarvis.speak });
  const tripCalc = useTripCalculator({ speed: session.vehicleData.speed });
  const jarvisReal = useJarvisSystem({ vehicleData: session.vehicleData, tripData: tripCalc.tripData, isConnected: session.isConnected, isPolling: session.isPolling, brandDisplayName: session.currentProfile.displayName, brandCharacteristics: session.currentProfile.characteristics, modelYear: session.themeVehicle?.modelYear });
  const refuelSettings = useRefuelSettings();
  const autoRide = useAutoRide({ speed: session.vehicleData.speed, rpm: session.vehicleData.rpm, settings: tripCalc.settings, speak: jarvis.settings.aiModeEnabled ? jarvisReal.speak : undefined, onSaveRide: session.syncedRides.saveRide, onUpdateRide: session.syncedRides.updateRide, onClearRides: session.syncedRides.clearTodayRides, initialRides: session.syncedRides.todayRides });
  const refuelMonitor = useRefuelMonitor({ speed: session.vehicleData.speed, sendRawCommand: session.sendRawCommand, isConnected: session.isConnected, speak: jarvisReal.speak, onFuelPriceUpdate: (p) => tripCalc.updateSettings({ fuelPrice: p }), userId: session.user?.id, settings: refuelSettings.settings });
  const maintenanceSchedule = useMaintenanceSchedule({ brand: (session.themeVehicle?.brand || 'generic') as any, currentMileage: jarvis.settings.currentMileage, onAlertSpeak: jarvis.settings.maintenanceAlertEnabled && jarvis.settings.aiModeEnabled ? jarvisReal.speak : undefined });

  const handleVisibilityRestore = useCallback(async () => {
    if (jarvis.settings.autoReconnectEnabled && session.hasLastDevice && session.status === 'disconnected' && !reconnectAttemptedRef.current) {
      reconnectAttemptedRef.current = true;
      session.addLog('👁 Tela desbloqueada - verificando conexão...');
      const success = await session.reconnect();
      if (success) { jarvisReal.speak('Reconectado automaticamente'); setTimeout(() => session.startPolling(), 500); } 
      else { jarvisReal.speak('Conexão perdida. Toque para reconectar.'); }
      reconnectAttemptedRef.current = false;
    }
  }, [jarvis.settings.autoReconnectEnabled, session, jarvisReal]);

  const wakeLock = useWakeLock({ enabled: jarvis.settings.keepAwakeEnabled, isConnected: session.isConnected, onVisibilityRestore: handleVisibilityRestore });

  useShiftLight({ rpm: session.vehicleData.rpm, redlineRPM: jarvis.settings.redlineRPM, ecoEnabled: jarvis.settings.ecoShiftEnabled, sportEnabled: jarvis.settings.sportShiftEnabled, shiftLightEnabled: jarvis.settings.shiftLightEnabled, speak: jarvisReal.speak });
  useAlerts({ vehicleData: session.vehicleData, settings: { highRpmAlertEnabled: jarvis.settings.highRpmAlertEnabled, highTempAlertEnabled: jarvis.settings.highTempAlertEnabled, highTempThreshold: jarvis.settings.highTempThreshold, speedAlertEnabled: jarvis.settings.speedAlertEnabled, speedLimit: jarvis.settings.speedLimit, lowVoltageAlertEnabled: jarvis.settings.lowVoltageAlertEnabled, lowVoltageThreshold: jarvis.settings.lowVoltageThreshold, luggingAlertEnabled: jarvis.settings.luggingAlertEnabled, redlineRPM: jarvis.settings.redlineRPM, welcomeEnabled: jarvis.settings.welcomeEnabled, maintenanceAlertEnabled: jarvis.settings.maintenanceAlertEnabled, currentMileage: jarvis.settings.currentMileage, nextOilChange: jarvis.settings.nextOilChange, nextInspection: jarvis.settings.nextInspection, aiModeEnabled: jarvis.settings.aiModeEnabled }, status: session.status, speak: jarvisReal.speak, brandName: session.currentProfile.displayName, modelYear: session.themeVehicle?.modelYear, brandTip: session.vehicleBenefits.getWelcomeTip() });

  useEffect(() => { if (session.status === 'ready') refuelMonitor.checkPIDSupport(); }, [session.status]);
  useEffect(() => { if (wakeLock.isWakeLockActive && session.isConnected) session.addLog('🌙 Modo Insônia ativado - tela permanecerá ligada'); }, [wakeLock.isWakeLockActive, session.isConnected]);

  const handleVoiceReport = useCallback(() => jarvisReal.speak(tripCalc.getVoiceReport()), [jarvisReal, tripCalc]);
  const handleDailyReport = useCallback(() => jarvisReal.speak(autoRide.getVoiceReport()), [jarvisReal, autoRide]);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-y">
      <AppHeader themeVehicle={session.themeVehicle} currentProfile={session.currentProfile} syncStatus={{ synced: session.syncedRides.synced, loading: session.syncedRides.loading }} status={session.status} jarvisEnabled={jarvis.settings.aiModeEnabled} isJarvisSupported={jarvisReal.isTTSSupported} isSpeaking={jarvisReal.isSpeaking} isListening={jarvisReal.isListening} isProcessing={jarvisReal.isProcessing} isAISupported={jarvisReal.isAISupported} aiError={jarvisReal.aiError} isWakeLockActive={wakeLock.isWakeLockActive} onOpenSettings={() => setIsSettingsOpen(true)} onTestAudio={jarvisReal.testAudio} onToggleListening={jarvisReal.toggleListening} />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 safe-area-x">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <ConnectionPanel status={session.status} error={session.error} isSupported={session.isSupported} themeVehicle={session.themeVehicle} onConnect={session.connect} onDisconnect={session.disconnect} />

          <MainTabs value={mainTab} onValueChange={setMainTab} vehicleData={session.vehicleData} status={session.status} isPolling={session.isPolling} logs={session.logs} themeVehicle={session.themeVehicle} currentProfile={session.currentProfile} onStartPolling={session.startPolling} onStopPolling={session.stopPolling} sendRawCommand={session.sendRawCommand} addLog={session.addLog} jarvisSettings={jarvis.settings} isSpeaking={jarvisReal.isSpeaking} speak={jarvisReal.speak} availableVoices={jarvisReal.availableVoices} portugueseVoices={jarvisReal.portugueseVoices} onUpdateJarvisSetting={jarvis.updateSetting} onResetJarvisSettings={jarvis.resetToDefaults} onTestVoice={jarvisReal.testAudio} isWakeLockActive={wakeLock.isWakeLockActive} tripData={tripCalc.tripData} tripSettings={tripCalc.settings} tripHistory={tripCalc.history} onStartTrip={tripCalc.startTrip} onPauseTrip={tripCalc.pauseTrip} onResumeTrip={tripCalc.resumeTrip} onResetTrip={tripCalc.resetTrip} onSaveTrip={tripCalc.saveTrip} onClearTripHistory={tripCalc.clearHistory} onUpdateTripSettings={tripCalc.updateSettings} onVoiceReport={handleVoiceReport} rideStatus={autoRide.rideStatus} dailySummary={autoRide.dailySummary} onClearTodayRides={autoRide.clearTodayRides} onDailyReport={handleDailyReport} refuelMode={refuelMonitor.mode} refuelFlowType={refuelMonitor.flowType} distanceMonitored={refuelMonitor.distanceMonitored} currentSTFT={refuelMonitor.currentSTFT} currentLTFT={refuelMonitor.currentLTFT} anomalyActive={refuelMonitor.anomalyActive} anomalyDuration={refuelMonitor.anomalyDuration} fuelTrimHistory={refuelMonitor.fuelTrimHistory} refuelSettings={refuelSettings.settings} frozenSettings={refuelMonitor.frozenSettings} currentRefuel={refuelMonitor.currentRefuel} isSyncing={refuelSettings.isSyncing} stftSupported={refuelMonitor.stftSupported ?? false} isAuthenticated={session.isAuthenticated} onStartRefuelMode={refuelMonitor.startRefuelMode} onStartQuickTest={refuelMonitor.startQuickTest} onCancelRefuel={refuelMonitor.cancelRefuel} onOpenRefuelModal={() => setIsRefuelModalOpen(true)} onUpdateRefuelSettings={refuelSettings.updateSettings} onResetRefuelSettings={refuelSettings.resetToDefaults} vehicleBenefits={session.vehicleBenefits} maintenanceSchedule={maintenanceSchedule} />
        </div>
      </main>

      <AppFooter />

      <FloatingControls isListening={jarvisReal.isListening} isContinuousMode={jarvisReal.isContinuousMode} isWakeWordDetected={jarvisReal.isWakeWordDetected} isProcessing={jarvisReal.isProcessing} isSpeakingAI={jarvisReal.isSpeakingAI} isAISupported={jarvisReal.isAISupported} aiEnabled={jarvis.settings.aiModeEnabled} continuousListeningEnabled={jarvis.settings.continuousListening} wakeWord={jarvis.settings.wakeWord} aiError={jarvisReal.aiError} lastTranscript={jarvisReal.lastTranscript} interimTranscript={jarvisReal.interimTranscript} lastResponse={jarvisReal.lastResponse} conversationHistory={jarvisReal.conversationHistory} onToggleListening={jarvisReal.toggleListening} onToggleContinuousMode={jarvisReal.toggleContinuousMode} onClearHistory={jarvisReal.clearHistory} isSettingsOpen={isSettingsOpen} onSettingsChange={setIsSettingsOpen} jarvisSettings={jarvis.settings} onUpdateJarvisSetting={jarvis.updateSetting} onResetJarvisSettings={jarvis.resetToDefaults} availableVoices={jarvisReal.availableVoices} portugueseVoices={jarvisReal.portugueseVoices} onTestVoice={jarvisReal.testAudio} isSpeaking={jarvisReal.isSpeaking} isWakeLockActive={wakeLock.isWakeLockActive} autoRide={autoRide} refuelMode={refuelMonitor.mode} refuelFlowType={refuelMonitor.flowType} currentRefuel={refuelMonitor.currentRefuel} currentFuelLevel={refuelMonitor.currentFuelLevel} fuelLevelSupported={refuelMonitor.fuelLevelSupported} distanceMonitored={refuelMonitor.distanceMonitored} currentSTFT={refuelMonitor.currentSTFT} currentLTFT={refuelMonitor.currentLTFT} anomalyActive={refuelMonitor.anomalyActive} anomalyDuration={refuelMonitor.anomalyDuration} fuelTrimHistory={refuelMonitor.fuelTrimHistory} refuelSettings={refuelSettings.settings} frozenSettings={refuelMonitor.frozenSettings} confirmRefuel={refuelMonitor.confirmRefuel} cancelRefuel={refuelMonitor.cancelRefuel} startRefuelMode={refuelMonitor.startRefuelMode} startQuickTest={refuelMonitor.startQuickTest} stftSupported={refuelMonitor.stftSupported} onUpdateRefuelSettings={refuelSettings.updateSettings} onResetRefuelSettings={refuelSettings.resetToDefaults} isSyncing={refuelSettings.isSyncing} tripFuelPrice={tripCalc.settings.fuelPrice} isConnected={session.isConnected} isAuthenticated={session.isAuthenticated} isFlowSelectorOpen={isFlowSelectorOpen} isRefuelModalOpen={isRefuelModalOpen} onFlowSelectorChange={setIsFlowSelectorOpen} onRefuelModalChange={setIsRefuelModalOpen} />
    </div>
  );
};

export default Index;
