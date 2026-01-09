import { useBluetooth } from '@/hooks/useBluetooth';
import { StatusIndicator } from '@/components/dashboard/StatusIndicator';
import { ConnectionButton } from '@/components/dashboard/ConnectionButton';
import { RPMGauge } from '@/components/dashboard/RPMGauge';
import { RPMCard } from '@/components/dashboard/RPMCard';
import { VehicleStats } from '@/components/dashboard/VehicleStats';
import { LogPanel } from '@/components/dashboard/LogPanel';
import { DTCScanner } from '@/components/mechanic/DTCScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Car, AlertTriangle, Gauge, Wrench } from 'lucide-react';

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

  const isReady = status === 'ready';
  const isReading = status === 'reading';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">OBD-II Scanner</h1>
                <p className="text-xs text-muted-foreground">Diagnóstico Automotivo via Bluetooth</p>
              </div>
            </div>
            <StatusIndicator status={status} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Browser Support Warning */}
          {!isSupported && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Navegador não suportado</p>
                  <p className="text-sm text-muted-foreground mt-1">
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
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Erro de Conexão</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard" className="gap-2">
                <Gauge className="h-4 w-4" />
                Painel
              </TabsTrigger>
              <TabsTrigger value="mechanic" className="gap-2">
                <Wrench className="h-4 w-4" />
                Mecânico IA
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6 mt-6">
              {/* Gauge Section */}
              <div className="flex flex-col items-center gap-6">
                <RPMGauge value={rpm} />
                
                {/* Polling Toggle Button */}
                {(isReady || isReading) && (
                  <Button
                    size="lg"
                    onClick={isPolling ? stopPolling : startPolling}
                    className={`gap-2 ${isPolling 
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                      : 'bg-accent text-accent-foreground hover:bg-accent/90'
                    }`}
                  >
                    {isPolling ? (
                      <>
                        <Square className="h-5 w-5" />
                        Parar Leitura
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        Iniciar Leitura
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

            {/* Mechanic IA Tab */}
            <TabsContent value="mechanic" className="space-y-6 mt-6">
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
      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-muted-foreground">
            Compatível com adaptadores ELM327 via Bluetooth Low Energy
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
