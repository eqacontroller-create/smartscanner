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
import { RPMGauge } from '@/components/dashboard/RPMGauge';
import { RPMCard } from '@/components/dashboard/RPMCard';
import { VehicleStats } from '@/components/dashboard/VehicleStats';
import { VehicleBadge } from '@/components/dashboard/VehicleBadge';
import { VehicleVIN } from '@/components/dashboard/VehicleVIN';
import { VehicleInfoCard } from '@/components/dashboard/VehicleInfoCard';
import { MaintenanceCard } from '@/components/dashboard/MaintenanceCard';
import { LogPanel } from '@/components/dashboard/LogPanel';
import { DTCScanner } from '@/components/mechanic/DTCScanner';
import { LiveDataMonitor } from '@/components/mechanic/LiveDataMonitor';
import { TripMonitor } from '@/components/financial/TripMonitor';
import { TripControls } from '@/components/financial/TripControls';
import { QuickSettings } from '@/components/financial/QuickSettings';
import { TripHistory } from '@/components/financial/TripHistory';
import { RideStatusBadge } from '@/components/financial/RideStatusBadge';
import { RideEndModal } from '@/components/financial/RideEndModal';
import { TodayRides } from '@/components/financial/TodayRides';
import { RideRecoveryDialog } from '@/components/financial/RideRecoveryDialog';
import { RefuelButton } from '@/components/refuel/RefuelButton';
import { RefuelModal } from '@/components/refuel/RefuelModal';
import { FuelQualityMonitor } from '@/components/refuel/FuelQualityMonitor';
import { RefuelResult } from '@/components/refuel/RefuelResult';
import { RefuelSettingsSheet } from '@/components/refuel/RefuelSettingsSheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Car, AlertTriangle, Home, DollarSign, Settings, Gauge, Wrench, Activity, HelpCircle, Download, MoreVertical, Volume2, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  // isAuthModalOpen removido - login agora é página dedicada
  const [mainTab, setMainTab] = useState('painel');
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
    settings: refuelSettings.settings, // Passar configurações externas
  });

  // Verificar suporte de PIDs ao conectar
  // CORRIGIDO: Comentário eslint para ignorar dependência intencionalmente
  useEffect(() => {
    if (status === 'ready') {
      refuelMonitor.checkPIDSupport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // Intencionalmente omitido refuelMonitor para executar apenas quando status muda
  
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
  // CORRIGIDO: Adiciona verificação de status desconectado para evitar tentativas desnecessárias
  const handleVisibilityRestore = useCallback(async () => {
    if (
      jarvisSettings.autoReconnectEnabled && 
      hasLastDevice &&
      status === 'disconnected' && // NOVA VERIFICAÇÃO: Só reconecta se realmente desconectou
      !reconnectAttemptedRef.current
    ) {
      reconnectAttemptedRef.current = true;
      addLog('👁 Tela desbloqueada - verificando conexão...');
      
      const success = await reconnect();
      if (success) {
        speak('Reconectado automaticamente');
        // Reiniciar polling após reconexão bem-sucedida
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

  // ALERTAS MOVIDOS PARA useAlerts hook - Sistema centralizado com queue e prioridade

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
              {/* Status de Sincronização - sempre visível */}
              <SyncStatus 
                synced={syncedRides.synced} 
                lastSyncedAt={syncedRides.loading ? null : new Date()}
              />
              
              {/* Botões secundários - visíveis em telas >= xs */}
              <div className="hidden xs:flex items-center gap-1 sm:gap-2">
                {/* Botão Instalar PWA */}
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9">
                  <Link to="/instalar">
                    <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
                {/* Botão de Ajuda */}
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9">
                  <Link to="/ajuda">
                    <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </div>
              
              {/* Menu dropdown para mobile (< xs) */}
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
              
              {/* Botão de voz do Jarvis AI - sempre visível se ativo */}
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
              
              {/* Status de conexão - sempre visível */}
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

          {/* Main Navigation Tabs */}
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="painel" className="gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm touch-target">
                <Home className="h-4 w-4" />
                <span className="hidden xs:inline">Painel</span>
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm touch-target">
                <DollarSign className="h-4 w-4" />
                <span className="hidden xs:inline">Financeiro</span>
              </TabsTrigger>
              <TabsTrigger value="ajustes" className="gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm touch-target">
                <Settings className="h-4 w-4" />
                <span className="hidden xs:inline">Ajustes</span>
              </TabsTrigger>
            </TabsList>

            {/* Painel Tab (Dashboard) */}
            <TabsContent value="painel" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              {/* Sub-tabs for dashboard features */}
              <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="dashboard" className="gap-1.5 sm:gap-2 py-2 text-xs touch-target">
                    <Gauge className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Gauges</span>
                  </TabsTrigger>
                  <TabsTrigger value="live" className="gap-1.5 sm:gap-2 py-2 text-xs touch-target">
                    <Activity className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Live Data</span>
                  </TabsTrigger>
                  <TabsTrigger value="mechanic" className="gap-1.5 sm:gap-2 py-2 text-xs touch-target">
                    <Wrench className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Diagnóstico</span>
                  </TabsTrigger>
                </TabsList>

                {/* Dashboard Sub-Tab */}
                <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 mt-4">
                  {/* Gauge Section */}
                  <div className="flex flex-col items-center gap-4 sm:gap-6">
                    <RPMGauge value={rpm} redlineRPM={jarvisSettings.redlineRPM} />
                    
                    {/* Polling Toggle Button */}
                    {(isReady || isReading) && (
                      <Button
                        size="lg"
                        onClick={isPolling ? stopPolling : startPolling}
                        className={`gap-2 min-h-[48px] px-6 touch-target ${isPolling 
                          ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                          : 'bg-accent text-accent-foreground hover:bg-accent/90'
                        }`}
                      >
                        {isPolling ? (
                          <>
                            <Square className="h-5 w-5" />
                            <span>Parar Leitura</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5" />
                            <span>Iniciar Leitura</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Vehicle Stats */}
                  <VehicleStats 
                    speed={speed} 
                    temperature={temperature} 
                    voltage={voltage}
                    fuelLevel={fuelLevel}
                    engineLoad={engineLoad}
                    isReading={isReading}
                  />

                  {/* RPM Card */}
                  <RPMCard value={rpm} isReading={isReading} />

                  {/* Log Panel */}
                  <LogPanel logs={logs} />
                </TabsContent>

                {/* Live Data Sub-Tab */}
                <TabsContent value="live" className="space-y-4 sm:space-y-6 mt-4">
                  <LiveDataMonitor
                    sendCommand={sendRawCommand}
                    isConnected={isReady || isReading}
                    addLog={addLog}
                    stopPolling={stopPolling}
                    isPolling={isPolling}
                  />
                  
                  {/* Log Panel */}
                  <LogPanel logs={logs} />
                </TabsContent>

                {/* Mechanic/Diagnostics Sub-Tab */}
                <TabsContent value="mechanic" className="space-y-4 sm:space-y-6 mt-4">
                  {/* Vehicle VIN Reader */}
                  <VehicleVIN
                    sendCommand={sendRawCommand}
                    isConnected={isReady || isReading}
                    addLog={addLog}
                  />
                  
                  {/* Vehicle Info Card - Mostra benefícios específicos da marca */}
                  {themeVehicle && (
                    <VehicleInfoCard
                      brand={themeVehicle.brand}
                      profile={currentProfile}
                      modelYear={themeVehicle.modelYear}
                      benefits={vehicleBenefits}
                    />
                  )}
                  
                  {/* Maintenance Card - Cronograma de manutenção por marca */}
                  <MaintenanceCard
                    alerts={maintenanceSchedule.alerts}
                    intervals={maintenanceSchedule.intervals}
                    currentMileage={jarvisSettings.currentMileage}
                    brandName={currentProfile.displayName}
                    onRecordMaintenance={maintenanceSchedule.recordMaintenance}
                    onSpeakAlerts={() => {
                      const message = maintenanceSchedule.getVoiceMessage();
                      if (message) speak(message);
                    }}
                    isSpeaking={isSpeaking}
                  />
                  
                  <DTCScanner 
                    sendCommand={sendRawCommand}
                    isConnected={isReady || isReading}
                    addLog={addLog}
                    stopPolling={stopPolling}
                    isPolling={isPolling}
                    onSpeakAlert={jarvisSettings.aiModeEnabled ? speak : undefined}
                  />
                  
                  {/* Log Panel also visible in mechanic tab */}
                  <LogPanel logs={logs} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Financeiro Tab (Taxímetro) */}
            <TabsContent value="financeiro" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              {/* Status da corrida automática */}
              {tripCalculator.settings.autoRideEnabled && (
                <div className="flex justify-center">
                  <RideStatusBadge status={autoRide.rideStatus} />
                </div>
              )}

              {/* Trip Monitor - Main Display */}
              <TripMonitor 
                tripData={tripCalculator.tripData} 
                currentSpeed={speed}
              />

              {/* Trip Controls */}
              <TripControls
                tripData={tripCalculator.tripData}
                onStart={tripCalculator.startTrip}
                onPause={tripCalculator.pauseTrip}
                onResume={tripCalculator.resumeTrip}
                onReset={tripCalculator.resetTrip}
                onSave={tripCalculator.saveTrip}
                onVoiceReport={handleVoiceReport}
                isSpeaking={isSpeaking}
              />

              {/* Histórico de Hoje (Auto-Ride) */}
              {tripCalculator.settings.autoRideEnabled && (
                <TodayRides
                  summary={autoRide.dailySummary}
                  onClear={autoRide.clearTodayRides}
                  onVoiceReport={handleDailyReport}
                  isSpeaking={isSpeaking}
                />
              )}

              {/* Quick Settings */}
              <QuickSettings
                settings={tripCalculator.settings}
                onUpdateSettings={tripCalculator.updateSettings}
              />

              {/* Trip History */}
              <TripHistory
                history={tripCalculator.history}
                onClearHistory={tripCalculator.clearHistory}
              />
            </TabsContent>

            {/* Ajustes Tab (Settings) */}
            <TabsContent value="ajustes" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <Card>
                <CardContent className="p-4 sm:p-6 text-center space-y-4">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-lg">Configurações do Jarvis</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Acesse as configurações do assistente de voz, alertas e perfil do motor.
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    className="gap-2"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    <Settings className="h-5 w-5" />
                    Abrir Configurações
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Financial Settings */}
              <QuickSettings
                settings={tripCalculator.settings}
                onUpdateSettings={tripCalculator.updateSettings}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto safe-area-bottom">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <p className="text-center text-[10px] sm:text-xs text-muted-foreground">
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
      
      {/* AuthModal removido - login agora é página dedicada via /login */}
      
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
          />
        </div>
      )}
      
      {/* Resultado da Análise de Combustível */}
      {refuelMonitor.mode === 'completed' && refuelMonitor.currentRefuel && (
        <div className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto">
          <RefuelResult
            refuel={refuelMonitor.currentRefuel}
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
              onStart={() => {
                refuelMonitor.startRefuelMode();
                setIsRefuelModalOpen(true);
              }}
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
    </div>
  );
};

export default Index;
