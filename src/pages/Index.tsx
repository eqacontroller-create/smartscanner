import { useEffect, useRef, useState } from 'react';
import { useBluetooth } from '@/hooks/useBluetooth';
import { useJarvis } from '@/hooks/useJarvis';
import { useJarvisSettings } from '@/hooks/useJarvisSettings';
import { useJarvisAI } from '@/hooks/useJarvisAI';
import { useVehicleTheme } from '@/hooks/useVehicleTheme';
import { useShiftLight } from '@/hooks/useShiftLight';
import { useTripCalculator } from '@/hooks/useTripCalculator';
import { useAutoRide } from '@/hooks/useAutoRide';
import { useAuth } from '@/hooks/useAuth';
import { useSyncedRides } from '@/hooks/useSyncedRides';
import { getShiftPoints } from '@/types/jarvisSettings';
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
import { AuthModal } from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Car, AlertTriangle, Home, DollarSign, Settings, Gauge, Wrench, Activity, HelpCircle, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const {
    status,
    rpm,
    speed,
    temperature,
    voltage,
    fuelLevel,
    engineLoad,
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
    isSupported
  } = useBluetooth();

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
  
  // Hook de calculadora de viagem (Taxímetro)
  const tripCalculator = useTripCalculator({ speed });
  
  // Hook de detecção automática de corridas
  const autoRide = useAutoRide({
    speed,
    rpm,
    settings: tripCalculator.settings,
    speak: jarvisSettings.aiModeEnabled ? speak : undefined,
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
    },
    tripData: tripCalculator.tripData,
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mainTab, setMainTab] = useState('painel');
  
  // Hooks de autenticação e sincronização
  const { isAuthenticated } = useAuth();
  const syncedRides = useSyncedRides();
  
  // Hook de Shift Light Adaptativo
  useShiftLight({
    rpm,
    redlineRPM: jarvisSettings.redlineRPM,
    ecoEnabled: jarvisSettings.ecoShiftEnabled,
    sportEnabled: jarvisSettings.sportShiftEnabled,
    shiftLightEnabled: jarvisSettings.shiftLightEnabled,
    speak,
  });
  
  // Refs para controlar cooldowns dos alertas
  const lastHighRpmAlertRef = useRef<number>(0);
  const lastHighTempAlertRef = useRef<number>(0);
  const lastSpeedAlertRef = useRef<number>(0);
  const lastLowVoltageAlertRef = useRef<number>(0);
  const lastLuggingAlertRef = useRef<number>(0);
  // Ref para controlar se já deu boas-vindas nesta conexão
  const hasWelcomedRef = useRef<boolean>(false);

  const isReady = status === 'ready';
  const isReading = status === 'reading';

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

  // Protocolo de Boas-vindas ao conectar (inclui lembretes de manutenção e voltagem real)
  useEffect(() => {
    if (status === 'ready' && !hasWelcomedRef.current && jarvisSettings.welcomeEnabled) {
      hasWelcomedRef.current = true;
      
      // Aguardar 4 segundos para dar tempo de ler a voltagem
      const timer = setTimeout(() => {
        const temp = temperature !== null ? temperature : 'desconhecida';
        
        // Nome da marca detectada
        const brandName = currentProfile.displayName;
        
        // Status da bateria baseado na voltagem real
        let batteryStatus: string;
        if (voltage === null) {
          batteryStatus = 'Aguardando leitura da bateria';
        } else if (voltage < 12.5) {
          batteryStatus = `Atenção, tensão da bateria baixa em ${voltage} volts. Verifique o alternador`;
        } else {
          batteryStatus = `Tensão da bateria estável em ${voltage} volts. Alternador operando`;
        }
        
        let maintenanceWarning = '';
        
        // Verificar lembretes de manutenção
        if (jarvisSettings.maintenanceAlertEnabled && jarvisSettings.currentMileage > 0) {
          const kmToOilChange = jarvisSettings.nextOilChange - jarvisSettings.currentMileage;
          const kmToInspection = jarvisSettings.nextInspection - jarvisSettings.currentMileage;
          
          if (kmToOilChange <= 0) {
            maintenanceWarning += ' Atenção: quilometragem da troca de óleo ultrapassada. Agende a manutenção.';
          } else if (kmToOilChange <= 1000) {
            maintenanceWarning += ` Lembrete: troca de óleo em ${kmToOilChange} quilômetros.`;
          }
          
          if (kmToInspection <= 0) {
            maintenanceWarning += ' Atenção: quilometragem da revisão ultrapassada. Agende a manutenção.';
          } else if (kmToInspection <= 2000) {
            maintenanceWarning += ` Revisão programada em ${kmToInspection} quilômetros.`;
          }
        }
        
        speak(`Sistema do veículo conectado, piloto. Motor a ${temp} graus. ${batteryStatus}.${maintenanceWarning} Pronto para rodar.`);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
    
    // Reset welcome flag quando desconectar
    if (status === 'disconnected') {
      hasWelcomedRef.current = false;
    }
  }, [status, temperature, voltage, speak, jarvisSettings, currentProfile]);

  // Monitor de "Pé Pesado" - Proteção do Motor
  useEffect(() => {
    if (!jarvisSettings.highRpmAlertEnabled) return;
    
    const now = Date.now();
    const cooldown = 15000; // 15 segundos entre alertas
    
    if (
      temperature !== null && 
      temperature < 60 && 
      rpm !== null && 
      rpm > 2500 &&
      now - lastHighRpmAlertRef.current > cooldown
    ) {
      lastHighRpmAlertRef.current = now;
      speak('Cuidado, piloto. O motor ainda está frio. Evite altas rotações para proteger o motor.');
    }
  }, [rpm, temperature, speak, jarvisSettings.highRpmAlertEnabled]);

  // Monitor de Lugging (Sobrecarga do Motor)
  useEffect(() => {
    if (!jarvisSettings.luggingAlertEnabled) return;
    
    const now = Date.now();
    const cooldown = 30000; // 30 segundos entre alertas de lugging
    const { luggingPoint } = getShiftPoints(jarvisSettings.redlineRPM);
    
    // Detectar lugging: RPM baixo + carga alta
    if (
      rpm !== null &&
      rpm > 0 && // Motor ligado
      rpm < luggingPoint && // RPM muito baixo para o motor
      engineLoad !== null &&
      engineLoad > 80 && // Pedal fundo (alta demanda)
      now - lastLuggingAlertRef.current > cooldown
    ) {
      lastLuggingAlertRef.current = now;
      speak('Motor em esforço excessivo, piloto. Reduza a marcha para proteger o motor.');
    }
  }, [rpm, engineLoad, speak, jarvisSettings.luggingAlertEnabled, jarvisSettings.redlineRPM]);

  // Monitor de Temperatura Alta - Alerta de Superaquecimento
  useEffect(() => {
    if (!jarvisSettings.highTempAlertEnabled) return;
    
    const now = Date.now();
    const cooldown = 60000; // 60 segundos entre alertas
    
    if (
      temperature !== null && 
      temperature > jarvisSettings.highTempThreshold &&
      now - lastHighTempAlertRef.current > cooldown
    ) {
      lastHighTempAlertRef.current = now;
      speak(`Atenção, piloto! Temperatura do motor em ${temperature} graus. Risco de superaquecimento. Reduza a velocidade ou pare o veículo.`);
    }
  }, [temperature, speak, jarvisSettings.highTempAlertEnabled, jarvisSettings.highTempThreshold]);

  // Monitor de Velocidade - Alerta acima do limite
  useEffect(() => {
    if (!jarvisSettings.speedAlertEnabled) return;
    
    const now = Date.now();
    const cooldown = 30000; // 30 segundos entre alertas
    
    if (
      speed !== null && 
      speed > jarvisSettings.speedLimit &&
      now - lastSpeedAlertRef.current > cooldown
    ) {
      lastSpeedAlertRef.current = now;
      speak(`Velocidade acima do limite configurado, piloto. Você está a ${speed} quilômetros por hora.`);
    }
  }, [speed, speak, jarvisSettings.speedAlertEnabled, jarvisSettings.speedLimit]);

  // Monitor de Voltagem Baixa - Alerta de Bateria
  useEffect(() => {
    if (!jarvisSettings.lowVoltageAlertEnabled) return;
    
    const now = Date.now();
    const cooldown = 120000; // 2 minutos entre alertas de bateria
    
    if (
      voltage !== null && 
      voltage > 0 && // Evitar falsos positivos
      voltage < jarvisSettings.lowVoltageThreshold &&
      now - lastLowVoltageAlertRef.current > cooldown
    ) {
      lastLowVoltageAlertRef.current = now;
      
      if (voltage < 12.0) {
        speak(`Alerta crítico, piloto! Tensão da bateria em ${voltage} volts. Verifique o sistema elétrico imediatamente.`);
      } else {
        speak(`Atenção, piloto. Tensão da bateria baixa em ${voltage} volts. Recomendo verificar o alternador.`);
      }
    }
  }, [voltage, speak, jarvisSettings.lowVoltageAlertEnabled, jarvisSettings.lowVoltageThreshold]);

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
                onLoginClick={() => setIsAuthModalOpen(true)} 
              />
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
              <JarvisSettingsButton 
                onClick={() => setIsSettingsOpen(true)} 
                disabled={!isJarvisSupported} 
              />
              <JarvisTestButton 
                onTest={testAudio} 
                isSpeaking={isSpeaking} 
                isSupported={isJarvisSupported} 
              />
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
      />
      
      {/* Modal de fim de corrida automática */}
      <RideEndModal
        isOpen={autoRide.isModalOpen}
        ride={autoRide.finishedRide}
        onClose={autoRide.closeModal}
        onSave={autoRide.saveRideWithAmount}
        onSkip={autoRide.skipAmountEntry}
      />
      
      {/* Modal de Autenticação */}
      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />
    </div>
  );
};

export default Index;
