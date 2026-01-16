import { useEffect, useRef, useState, useCallback } from 'react';
import { useOBD } from '@/hooks/useOBD';
import { useAlerts } from '@/hooks/useAlerts';
import { useJarvis } from '@/hooks/useJarvis';
import { useJarvisSettings } from '@/hooks/useJarvisSettings';
import { useJarvisAI } from '@/hooks/useJarvisAI';
import { useVehicleTheme } from '@/hooks/useVehicleTheme';
import { useVehicleBenefits } from '@/hooks/useVehicleBenefits';
import { useShiftLight } from '@/hooks/useShiftLight';
import { useTripCalculator } from '@/hooks/useTripCalculator';
import { useAutoRide } from '@/hooks/useAutoRide';
import { useAuth } from '@/hooks/useAuth';
import { useSyncedRides } from '@/hooks/useSyncedRides';
import { useRefuelMonitor } from '@/hooks/useRefuelMonitor';
import { useRefuelSettings } from '@/hooks/useRefuelSettings';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useMaintenanceSchedule } from '@/hooks/useMaintenanceSchedule';
import { StatusIndicator } from '@/components/dashboard/StatusIndicator';
import { ConnectionButton } from '@/components/dashboard/ConnectionButton';
import { JarvisTestButton } from '@/components/dashboard/JarvisTestButton';
import { JarvisSettingsButton } from '@/components/dashboard/JarvisSettingsButton';
import { JarvisSettingsSheet } from '@/components/dashboard/JarvisSettingsSheet';
import { JarvisVoiceButton } from '@/components/dashboard/JarvisVoiceButton';
import { JarvisFloatingWidget } from '@/components/dashboard/JarvisFloatingWidget';
import { SyncStatus } from '@/components/dashboard/SyncStatus';
import { VehicleBadge } from '@/components/dashboard/VehicleBadge';
import { RideEndModal } from '@/components/financial/RideEndModal';
import { RideRecoveryDialog } from '@/components/financial/RideRecoveryDialog';
import { RefuelButton } from '@/components/refuel/RefuelButton';
import { RefuelModal } from '@/components/refuel/RefuelModal';
import { RefuelFlowSelector } from '@/components/refuel/RefuelFlowSelector';
import { FuelQualityMonitor } from '@/components/refuel/FuelQualityMonitor';
import { RefuelResult } from '@/components/refuel/RefuelResult';
import { RefuelSettingsSheet } from '@/components/refuel/RefuelSettingsSheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, AlertTriangle, Home, DollarSign, Settings, Wrench, HelpCircle, Download, MoreVertical, Volume2, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Novos componentes de aba
import { DashboardTab } from '@/components/tabs/DashboardTab';
import { MechanicTab } from '@/components/tabs/MechanicTab';
import { FinancialTab } from '@/components/tabs/FinancialTab';
import { SettingsTab } from '@/components/tabs/SettingsTab';

const Index = () => {
  // Dados OBD via contexto global (persiste entre navegações)
  const {
    status,
    vehicleData,
    detectedVehicle,
    error,
    logs,
    isPolling,
    connect,
    disconnect,
    startPolling,
    stopPolling,
    sendRawCommand,
    addLog,
    isSupported,
    reconnect,
    hasLastDevice,
  } = useOBD();

  // Extrair dados do veículo para compatibilidade
  const { rpm, speed, temperature, voltage, fuelLevel, engineLoad } = vehicleData;

  const {
    settings: jarvisSettings,
    updateSetting,
    resetToDefaults,
    availableVoices,
    portugueseVoices,
  } = useJarvisSettings();

  const { speak, testAudio, isSpeaking, isSupported: isJarvisSupported } = useJarvis({ settings: jarvisSettings });
  
  // Hook de tema dinâmico baseado no veículo
  const { 
    detectedVehicle: themeVehicle, 
    currentProfile, 
    setVehicle, 
    resetToGeneric 
  } = useVehicleTheme();
  
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
      updateSetting('redlineRPM', settings.redlineRPM);
      updateSetting('highTempThreshold', settings.highTempThreshold);
      updateSetting('lowVoltageThreshold', settings.lowVoltageThreshold);
      updateSetting('speedLimit', settings.speedLimit);
      speak(`Configurações otimizadas para ${currentProfile.displayName} aplicadas.`);
    },
  });
  
  // Hook de calculadora de viagem (Taxímetro)
  const tripCalculator = useTripCalculator({ speed });
  
  // Hooks de autenticação e sincronização - CARREGA PRIMEIRO
  const { isAuthenticated, user } = useAuth();
  const syncedRides = useSyncedRides();
  
  // Hook de detecção automática de corridas - INTEGRADO COM CLOUD
  const autoRide = useAutoRide({
    speed,
    rpm,
    settings: tripCalculator.settings,
    speak: jarvisSettings.aiModeEnabled ? speak : undefined,
    // Integração com Cloud
    onSaveRide: syncedRides.saveRide,
    onUpdateRide: syncedRides.updateRide,
    onClearRides: syncedRides.clearTodayRides,
    initialRides: syncedRides.todayRides,
  });
  
  // Hook de IA conversacional
  const jarvisAI = useJarvisAI({
    settings: jarvisSettings,
    vehicleContext: {
      rpm,
      speed,
      temperature,
      voltage,
      fuelLevel,
      engineLoad,
      isConnected: status === 'ready' || status === 'reading',
      isPolling,
      brand: currentProfile.displayName,
      brandCharacteristics: currentProfile.characteristics,
      modelYear: themeVehicle?.modelYear,
    },
    tripData: tripCalculator.tripData,
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mainTab, setMainTab] = useState('painel');
  const [isFlowSelectorOpen, setIsFlowSelectorOpen] = useState(false);
  const [isRefuelModalOpen, setIsRefuelModalOpen] = useState(false);
  
  // Hook de configurações de abastecimento
  const refuelSettings = useRefuelSettings();
  
  // Hook de manutenção inteligente por marca
  const maintenanceSchedule = useMaintenanceSchedule({
    brand: themeVehicle?.brand || 'generic',
    currentMileage: jarvisSettings.currentMileage,
    onAlertSpeak: jarvisSettings.maintenanceAlertEnabled && jarvisSettings.aiModeEnabled 
      ? speak 
      : undefined,
  });
  
  // Hook de monitoramento de abastecimento
  const refuelMonitor = useRefuelMonitor({
    speed,
    sendRawCommand,
    isConnected: status === 'ready' || status === 'reading',
    speak,
    onFuelPriceUpdate: (price) => tripCalculator.updateSettings({ fuelPrice: price }),
    userId: user?.id,
    settings: refuelSettings.settings,
  });

  // Verificar suporte de PIDs ao conectar
  useEffect(() => {
    if (status === 'ready') {
      refuelMonitor.checkPIDSupport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  
  // Hook de Shift Light Adaptativo
  useShiftLight({
    rpm,
    redlineRPM: jarvisSettings.redlineRPM,
    ecoEnabled: jarvisSettings.ecoShiftEnabled,
    sportEnabled: jarvisSettings.sportShiftEnabled,
    shiftLightEnabled: jarvisSettings.shiftLightEnabled,
    speak,
  });
  
  // Ref para controlar tentativas de reconexão
  const reconnectAttemptedRef = useRef(false);
  
  // Handler para reconexão automática quando tela é desbloqueada
  const handleVisibilityRestore = useCallback(async () => {
    if (
      jarvisSettings.autoReconnectEnabled && 
      hasLastDevice &&
      status === 'disconnected' &&
      !reconnectAttemptedRef.current
    ) {
      reconnectAttemptedRef.current = true;
      addLog('👁 Tela desbloqueada - verificando conexão...');
      
      const success = await reconnect();
      if (success) {
        speak('Reconectado automaticamente');
        setTimeout(() => {
          startPolling();
        }, 500);
      } else {
        speak('Conexão perdida. Toque para reconectar.');
      }
      
      reconnectAttemptedRef.current = false;
    }
  }, [jarvisSettings.autoReconnectEnabled, hasLastDevice, status, reconnect, speak, addLog, startPolling]);
  
  // Hook de Wake Lock (Modo Insônia)
  const wakeLock = useWakeLock({
    enabled: jarvisSettings.keepAwakeEnabled,
    isConnected: status === 'ready' || status === 'reading',
    onVisibilityRestore: handleVisibilityRestore,
  });
  
  // Log quando Wake Lock é ativado
  useEffect(() => {
    if (wakeLock.isWakeLockActive && (status === 'ready' || status === 'reading')) {
      addLog('🌙 Modo Insônia ativado - tela permanecerá ligada');
    }
  }, [wakeLock.isWakeLockActive, status, addLog]);
  
  const isReady = status === 'ready';
  const isReading = status === 'reading';

  // Sistema centralizado de alertas via hook dedicado
  useAlerts({
    vehicleData: { rpm, speed, temperature, voltage, engineLoad },
    settings: {
      highRpmAlertEnabled: jarvisSettings.highRpmAlertEnabled,
      highTempAlertEnabled: jarvisSettings.highTempAlertEnabled,
      highTempThreshold: jarvisSettings.highTempThreshold,
      speedAlertEnabled: jarvisSettings.speedAlertEnabled,
      speedLimit: jarvisSettings.speedLimit,
      lowVoltageAlertEnabled: jarvisSettings.lowVoltageAlertEnabled,
      lowVoltageThreshold: jarvisSettings.lowVoltageThreshold,
      luggingAlertEnabled: jarvisSettings.luggingAlertEnabled,
      redlineRPM: jarvisSettings.redlineRPM,
      welcomeEnabled: jarvisSettings.welcomeEnabled,
      maintenanceAlertEnabled: jarvisSettings.maintenanceAlertEnabled,
      currentMileage: jarvisSettings.currentMileage,
      nextOilChange: jarvisSettings.nextOilChange,
      nextInspection: jarvisSettings.nextInspection,
      aiModeEnabled: jarvisSettings.aiModeEnabled,
    },
    status,
    speak,
    brandName: currentProfile.displayName,
    modelYear: themeVehicle?.modelYear,
    brandTip: vehicleBenefits.getWelcomeTip(),
  });

  // Atualizar tema quando veículo for detectado
  useEffect(() => {
    if (detectedVehicle?.vin) {
      setVehicle(
        detectedVehicle.vin,
        detectedVehicle.manufacturer || undefined,
        detectedVehicle.modelYear || undefined,
        detectedVehicle.country || undefined
      );
    } else if (status === 'disconnected') {
      resetToGeneric();
    }
  }, [detectedVehicle, status, setVehicle, resetToGeneric]);

  // Handler para relatório de voz
  const handleVoiceReport = () => {
    const report = tripCalculator.getVoiceReport();
    speak(report);
  };
  
  // Handler para relatório do dia (auto-ride)
  const handleDailyReport = () => {
    const report = autoRide.getVoiceReport();
    speak(report);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-y">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 safe-area-top">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Badge da Marca Detectada ou Ícone Padrão */}
              {themeVehicle ? (
                <VehicleBadge 
                  brand={themeVehicle.brand} 
                  profile={themeVehicle.profile}
                  modelYear={themeVehicle.modelYear}
                  compact
                />
              ) : (
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Car className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-foreground truncate">
                  {themeVehicle ? 'Scanner OBD-II' : 'OBD-II Scanner'}
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">
                  {themeVehicle ? currentProfile.slogan : 'Scanner Universal Didático'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Status de Sincronização */}
              <SyncStatus 
                synced={syncedRides.synced} 
                lastSyncedAt={syncedRides.loading ? null : new Date()}
              />
              
              {/* Botões secundários - visíveis em telas >= xs */}
              <div className="hidden xs:flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9">
                  <Link to="/instalar">
                    <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9">
                  <Link to="/ajuda">
                    <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </div>
              
              {/* Menu dropdown para mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="xs:hidden">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuItem asChild>
                    <Link to="/instalar" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Instalar App
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/ajuda" className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Central de Ajuda
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações Jarvis
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={testAudio} 
                    disabled={!isJarvisSupported || isSpeaking}
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Testar Áudio
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Botão de voz do Jarvis AI */}
              {jarvisSettings.aiModeEnabled && (
                <JarvisVoiceButton
                  isListening={jarvisAI.isListening}
                  isProcessing={jarvisAI.isProcessing}
                  isSpeaking={jarvisAI.isSpeaking}
                  isSupported={jarvisAI.isSupported}
                  error={jarvisAI.error}
                  onToggle={jarvisAI.toggleListening}
                />
              )}
              
              {/* Botões de configuração - visíveis em telas >= xs */}
              <div className="hidden xs:flex items-center gap-1 sm:gap-2">
                <JarvisSettingsButton 
                  onClick={() => setIsSettingsOpen(true)} 
                  disabled={!isJarvisSupported} 
                />
                <JarvisTestButton 
                  onTest={testAudio} 
                  isSpeaking={isSpeaking} 
                  isSupported={isJarvisSupported} 
                />
              </div>
              
              {/* Indicador de Modo Insônia */}
              {wakeLock.isWakeLockActive && (
                <div className="flex items-center text-blue-400" title="Modo Insônia ativo">
                  <Moon className="h-4 w-4" />
                </div>
              )}
              
              {/* Status de conexão */}
              <StatusIndicator status={status} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 safe-area-x">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {/* Browser Support Warning */}
          {!isSupported && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-destructive text-sm sm:text-base">Navegador não suportado</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    A Web Bluetooth API não é suportada neste navegador. Use o Chrome, Edge ou Opera em desktop, 
                    ou Chrome no Android.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-destructive text-sm sm:text-base">Erro de Conexão</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vehicle Detection Info */}
          {themeVehicle && isReady && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-3 sm:p-4">
                <VehicleBadge 
                  brand={themeVehicle.brand} 
                  profile={themeVehicle.profile}
                  modelYear={themeVehicle.modelYear}
                />
              </CardContent>
            </Card>
          )}

          {/* Connection Section */}
          <div className="flex justify-center">
            <ConnectionButton
              status={status}
              onConnect={connect}
              onDisconnect={disconnect}
              disabled={!isSupported}
            />
          </div>

          {/* Main Navigation Tabs - 4 ABAS */}
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto tabs-scroll">
              <TabsTrigger value="painel" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row">
                <Home className="h-4 w-4" />
                <span className="hidden xs:inline">Painel</span>
              </TabsTrigger>
              <TabsTrigger value="mecanica" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row">
                <Wrench className="h-4 w-4" />
                <span className="hidden xs:inline">Mecânica</span>
              </TabsTrigger>
              <TabsTrigger value="financas" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row">
                <DollarSign className="h-4 w-4" />
                <span className="hidden xs:inline">Finanças</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row">
                <Settings className="h-4 w-4" />
                <span className="hidden xs:inline">Config</span>
              </TabsTrigger>
            </TabsList>

            {/* Aba PAINEL (Dashboard Principal) */}
            <TabsContent value="painel" className="mt-4 sm:mt-6">
              <DashboardTab
                rpm={rpm}
                speed={speed}
                temperature={temperature}
                voltage={voltage}
                fuelLevel={fuelLevel}
                engineLoad={engineLoad}
                redlineRPM={jarvisSettings.redlineRPM}
                isReady={isReady}
                isReading={isReading}
                isPolling={isPolling}
                logs={logs}
                onStartPolling={startPolling}
                onStopPolling={stopPolling}
              />
            </TabsContent>

            {/* Aba MECÂNICA (Diagnóstico Completo) */}
            <TabsContent value="mecanica" className="mt-4 sm:mt-6">
              <MechanicTab
                sendCommand={sendRawCommand}
                isConnected={isReady || isReading}
                isPolling={isPolling}
                addLog={addLog}
                stopPolling={stopPolling}
                logs={logs}
                themeVehicle={themeVehicle}
                currentProfile={currentProfile}
                vehicleBenefits={vehicleBenefits}
                maintenanceSchedule={maintenanceSchedule}
                currentMileage={jarvisSettings.currentMileage}
                speak={speak}
                isSpeaking={isSpeaking}
                aiModeEnabled={jarvisSettings.aiModeEnabled}
              />
            </TabsContent>

            {/* Aba FINANÇAS (Custos e Viagens) */}
            <TabsContent value="financas" className="mt-4 sm:mt-6">
              <FinancialTab
                tripData={tripCalculator.tripData}
                tripSettings={tripCalculator.settings}
                tripHistory={tripCalculator.history}
                onStartTrip={tripCalculator.startTrip}
                onPauseTrip={tripCalculator.pauseTrip}
                onResumeTrip={tripCalculator.resumeTrip}
                onResetTrip={tripCalculator.resetTrip}
                onSaveTrip={tripCalculator.saveTrip}
                onClearHistory={tripCalculator.clearHistory}
                onUpdateSettings={tripCalculator.updateSettings}
                onVoiceReport={handleVoiceReport}
                currentSpeed={speed}
                isSpeaking={isSpeaking}
                autoRideEnabled={tripCalculator.settings.autoRideEnabled}
                rideStatus={autoRide.rideStatus}
                dailySummary={autoRide.dailySummary}
                onClearTodayRides={autoRide.clearTodayRides}
                onDailyReport={handleDailyReport}
                refuelMode={refuelMonitor.mode}
                refuelFlowType={refuelMonitor.flowType}
                distanceMonitored={refuelMonitor.distanceMonitored}
                currentSTFT={refuelMonitor.currentSTFT}
                currentLTFT={refuelMonitor.currentLTFT}
                anomalyActive={refuelMonitor.anomalyActive}
                anomalyDuration={refuelMonitor.anomalyDuration}
                fuelTrimHistory={refuelMonitor.fuelTrimHistory}
                refuelSettings={refuelSettings.settings}
                frozenSettings={refuelMonitor.frozenSettings}
                currentRefuel={refuelMonitor.currentRefuel}
                isSyncing={refuelSettings.isSyncing}
                stftSupported={refuelMonitor.stftSupported ?? false}
                isConnected={isReady || isReading}
                isAuthenticated={isAuthenticated}
                onStartRefuelMode={refuelMonitor.startRefuelMode}
                onStartQuickTest={refuelMonitor.startQuickTest}
                onCancelRefuel={refuelMonitor.cancelRefuel}
                onOpenRefuelModal={() => setIsRefuelModalOpen(true)}
                onUpdateRefuelSettings={refuelSettings.updateSettings}
                onResetRefuelSettings={refuelSettings.resetToDefaults}
              />
            </TabsContent>

            {/* Aba CONFIGURAÇÕES */}
            <TabsContent value="config" className="mt-4 sm:mt-6">
              <SettingsTab
                jarvisSettings={jarvisSettings}
                tripSettings={tripCalculator.settings}
                refuelSettings={refuelSettings.settings}
                onUpdateJarvisSetting={updateSetting}
                onUpdateTripSettings={tripCalculator.updateSettings}
                onUpdateRefuelSettings={refuelSettings.updateSettings}
                onResetJarvisSettings={resetToDefaults}
                onResetRefuelSettings={refuelSettings.resetToDefaults}
                onTestVoice={testAudio}
                availableVoices={availableVoices}
                portugueseVoices={portugueseVoices}
                isSpeaking={isSpeaking}
                isWakeLockActive={wakeLock.isWakeLockActive}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto safe-area-bottom">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <p className="text-center text-[11px] sm:text-xs text-muted-foreground">
            Scanner Universal OBD-II • Compatível com qualquer veículo 2008+
          </p>
        </div>
      </footer>

      {/* Jarvis Floating Widget */}
      <JarvisFloatingWidget
        isListening={jarvisAI.isListening}
        isContinuousMode={jarvisAI.isContinuousMode}
        isWakeWordDetected={jarvisAI.isWakeWordDetected}
        isProcessing={jarvisAI.isProcessing}
        isSpeaking={jarvisAI.isSpeaking}
        isSupported={jarvisAI.isSupported}
        isEnabled={jarvisSettings.aiModeEnabled}
        continuousListeningEnabled={jarvisSettings.continuousListening}
        wakeWord={jarvisSettings.wakeWord}
        error={jarvisAI.error}
        lastTranscript={jarvisAI.lastTranscript}
        interimTranscript={jarvisAI.interimTranscript}
        lastResponse={jarvisAI.lastResponse}
        conversationHistory={jarvisAI.conversationHistory}
        onToggleListening={jarvisAI.toggleListening}
        onToggleContinuousMode={jarvisAI.toggleContinuousMode}
        onClearHistory={jarvisAI.clearHistory}
      />

      {/* Jarvis Settings Sheet */}
      <JarvisSettingsSheet
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={jarvisSettings}
        onUpdateSetting={updateSetting}
        onResetToDefaults={resetToDefaults}
        availableVoices={availableVoices}
        portugueseVoices={portugueseVoices}
        onTestVoice={testAudio}
        isSpeaking={isSpeaking}
        isWakeLockActive={wakeLock.isWakeLockActive}
      />
      
      {/* Modal de fim de corrida automática */}
      <RideEndModal
        isOpen={autoRide.isModalOpen}
        ride={autoRide.finishedRide}
        onClose={autoRide.closeModal}
        onSave={autoRide.saveRideWithAmount}
        onSkip={autoRide.skipAmountEntry}
      />
      
      {/* Dialog de recuperação de corrida */}
      <RideRecoveryDialog
        pendingRide={autoRide.pendingRecovery}
        onRecover={autoRide.recoverRide}
        onDiscard={autoRide.discardRecovery}
      />
      
      {/* Modal de Abastecimento */}
      <RefuelModal
        open={isRefuelModalOpen}
        onOpenChange={setIsRefuelModalOpen}
        fuelLevelBefore={refuelMonitor.currentRefuel?.fuelLevelBefore ?? null}
        currentFuelLevel={refuelMonitor.currentFuelLevel}
        fuelLevelSupported={refuelMonitor.fuelLevelSupported}
        defaultPrice={tripCalculator.settings.fuelPrice}
        isAuthenticated={isAuthenticated}
        onConfirm={(price, liters) => {
          refuelMonitor.confirmRefuel(price, liters);
          setIsRefuelModalOpen(false);
        }}
      />
      
      {/* Monitoramento de Combustível Flutuante */}
      {(refuelMonitor.mode === 'monitoring' || refuelMonitor.mode === 'analyzing') && (
        <div className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto">
          <FuelQualityMonitor
            mode={refuelMonitor.mode}
            distanceMonitored={refuelMonitor.distanceMonitored}
            currentSTFT={refuelMonitor.currentSTFT}
            currentLTFT={refuelMonitor.currentLTFT}
            anomalyActive={refuelMonitor.anomalyActive}
            anomalyDuration={refuelMonitor.anomalyDuration}
            fuelTrimHistory={refuelMonitor.fuelTrimHistory}
            settings={refuelMonitor.settings}
            frozenSettings={refuelMonitor.frozenSettings}
            isSyncing={refuelSettings.isSyncing}
            flowType={refuelMonitor.flowType}
          />
        </div>
      )}
      
      {/* Resultado da Análise de Combustível */}
      {refuelMonitor.mode === 'completed' && refuelMonitor.currentRefuel && (
        <div className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto">
          <RefuelResult
            refuel={refuelMonitor.currentRefuel}
            flowType={refuelMonitor.flowType}
            onClose={refuelMonitor.cancelRefuel}
          />
        </div>
      )}
      
      {/* Botão Flutuante de Abastecimento */}
      {(status === 'ready' || status === 'reading') && (
        <div className="fixed bottom-4 left-4 z-50 safe-area-bottom flex items-center gap-2">
          <RefuelButton
            mode={refuelMonitor.mode}
            isConnected={status === 'ready' || status === 'reading'}
            isAuthenticated={isAuthenticated}
            onStart={() => setIsFlowSelectorOpen(true)}
            onCancel={refuelMonitor.cancelRefuel}
          />
          {/* Botão de configurações de abastecimento */}
          {refuelMonitor.mode === 'inactive' && (
            <RefuelSettingsSheet
              settings={refuelSettings.settings}
              onSettingsChange={refuelSettings.updateSettings}
              onReset={refuelSettings.resetToDefaults}
            />
          )}
        </div>
      )}
      
      {/* Seletor de Fluxo de Combustível */}
      <RefuelFlowSelector
        open={isFlowSelectorOpen}
        onOpenChange={setIsFlowSelectorOpen}
        stftSupported={refuelMonitor.stftSupported}
        isAuthenticated={isAuthenticated}
        onSelectRefuel={() => {
          refuelMonitor.startRefuelMode();
          setIsRefuelModalOpen(true);
        }}
        onSelectQuickTest={() => {
          refuelMonitor.startQuickTest();
        }}
      />
    </div>
  );
};

export default Index;
