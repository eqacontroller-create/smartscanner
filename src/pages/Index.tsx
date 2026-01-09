import { useEffect, useRef, useState } from 'react';
import { useBluetooth } from '@/hooks/useBluetooth';
import { useJarvis } from '@/hooks/useJarvis';
import { useJarvisSettings } from '@/hooks/useJarvisSettings';
import { StatusIndicator } from '@/components/dashboard/StatusIndicator';
import { ConnectionButton } from '@/components/dashboard/ConnectionButton';
import { JarvisTestButton } from '@/components/dashboard/JarvisTestButton';
import { JarvisSettingsButton } from '@/components/dashboard/JarvisSettingsButton';
import { JarvisSettingsSheet } from '@/components/dashboard/JarvisSettingsSheet';
import { RPMGauge } from '@/components/dashboard/RPMGauge';
import { RPMCard } from '@/components/dashboard/RPMCard';
import { VehicleStats } from '@/components/dashboard/VehicleStats';
import { VehicleVIN } from '@/components/dashboard/VehicleVIN';
import { LogPanel } from '@/components/dashboard/LogPanel';
import { DTCScanner } from '@/components/mechanic/DTCScanner';
import { LiveDataMonitor } from '@/components/mechanic/LiveDataMonitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Car, AlertTriangle, Gauge, Wrench, Activity } from 'lucide-react';

const Index = () => {
  const {
    status,
    rpm,
    speed,
    temperature,
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
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Refs para controlar cooldowns dos alertas
  const lastHighRpmAlertRef = useRef<number>(0);
  const lastHighTempAlertRef = useRef<number>(0);
  const lastSpeedAlertRef = useRef<number>(0);
  // Ref para controlar se já deu boas-vindas nesta conexão
  const hasWelcomedRef = useRef<boolean>(false);

  const isReady = status === 'ready';
  const isReading = status === 'reading';

  // Protocolo de Boas-vindas ao conectar (inclui lembretes de manutenção)
  useEffect(() => {
    if (status === 'ready' && !hasWelcomedRef.current && jarvisSettings.welcomeEnabled) {
      hasWelcomedRef.current = true;
      
      const timer = setTimeout(() => {
        const temp = temperature !== null ? temperature : 'desconhecida';
        let motorStatus: string;
        
        if (temperature === null) {
          motorStatus = 'Aguardando leitura de temperatura';
        } else if (temperature < 60) {
          motorStatus = 'Motor frio, injeção ajustada';
        } else if (temperature < 90) {
          motorStatus = 'Motor em aquecimento';
        } else {
          motorStatus = 'Motor na temperatura ideal de operação';
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
        
        speak(`Sistema Ford conectado. Temperatura do motor em ${temp} graus. ${motorStatus}. Tensão da bateria estável.${maintenanceWarning} Pronto para partir, piloto.`);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    // Reset welcome flag quando desconectar
    if (status === 'disconnected') {
      hasWelcomedRef.current = false;
    }
  }, [status, temperature, speak, jarvisSettings]);

  // Monitor de "Pé Pesado" - Proteção do Motor Sigma
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
      speak('Cuidado. O motor ainda está frio. Evite altas rotações para proteger o motor Sigma.');
    }
  }, [rpm, temperature, speak, jarvisSettings.highRpmAlertEnabled]);

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
      speak(`Atenção! Temperatura do motor em ${temperature} graus. Risco de superaquecimento. Reduza a velocidade ou pare o veículo.`);
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
      speak(`Velocidade acima do limite configurado. Você está a ${speed} quilômetros por hora.`);
    }
  }, [speed, speak, jarvisSettings.speedAlertEnabled, jarvisSettings.speedLimit]);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-y">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 safe-area-top">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <Car className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-foreground truncate">OBD-II Scanner</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">Diagnóstico Automotivo via Bluetooth</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
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

          {/* Connection Section */}
          <div className="flex justify-center">
            <ConnectionButton
              status={status}
              onConnect={connect}
              onDisconnect={disconnect}
              disabled={!isSupported}
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="dashboard" className="gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm touch-target">
                <Gauge className="h-4 w-4" />
                <span className="hidden xs:inline">Painel</span>
              </TabsTrigger>
              <TabsTrigger value="live" className="gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm touch-target">
                <Activity className="h-4 w-4" />
                <span className="hidden xs:inline">Live Data</span>
              </TabsTrigger>
              <TabsTrigger value="mechanic" className="gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm touch-target">
                <Wrench className="h-4 w-4" />
                <span className="hidden xs:inline">Diagnóstico</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              {/* Gauge Section */}
              <div className="flex flex-col items-center gap-4 sm:gap-6">
                <RPMGauge value={rpm} />
                
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
                isReading={isReading} 
              />

              {/* RPM Card */}
              <RPMCard value={rpm} isReading={isReading} />

              {/* Log Panel */}
              <LogPanel logs={logs} />
            </TabsContent>

            {/* Live Data Tab */}
            <TabsContent value="live" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <LiveDataMonitor
                sendCommand={sendRawCommand}
                isConnected={isReady || isReading}
                addLog={addLog}
              />
              
              {/* Log Panel */}
              <LogPanel logs={logs} />
            </TabsContent>

            {/* Mechanic/Diagnostics Tab */}
            <TabsContent value="mechanic" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
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
              />
              
              {/* Log Panel also visible in mechanic tab */}
              <LogPanel logs={logs} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto safe-area-bottom">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <p className="text-center text-[10px] sm:text-xs text-muted-foreground">
            Compatível com adaptadores ELM327 via Bluetooth Low Energy
          </p>
        </div>
      </footer>

      {/* Jarvis Settings Sheet */}
      <JarvisSettingsSheet
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={jarvisSettings}
        onUpdateSetting={updateSetting}
        onResetToDefaults={resetToDefaults}
        onTestVoice={testAudio}
        availableVoices={availableVoices}
        portugueseVoices={portugueseVoices}
        isSpeaking={isSpeaking}
      />
    </div>
  );
};

export default Index;
