/**
 * Battery Health Test Component
 * Visual interface for the cranking voltage analysis test
 * 
 * Shows real-time voltage graph (ECG style) and provides
 * detailed battery and alternator diagnosis.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Battery,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Zap,
  Play,
  RotateCcw,
  Volume2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Info,
  Save,
  Power,
  History,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  Tooltip,
} from 'recharts';
import {
  startBurstCapture,
  generateJarvisMessage,
  type VoltagePoint,
  type CrankingTestResult,
} from '@/services/battery/BatteryForensicsService';
import { useBatteryHistory } from '@/hooks/useBatteryHistory';
import { BatteryHistory } from './BatteryHistory';
import { ParasiticDrawTest } from './ParasiticDrawTest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// ============= TYPES =============

type TestPhase = 
  | 'idle'           // Waiting to start
  | 'preparing'      // Checking connection and RPM
  | 'waiting_start'  // Waiting for user to crank
  | 'capturing'      // Capturing data
  | 'post_start'     // Engine running, checking alternator
  | 'complete'       // Showing results
  | 'error';         // Error state

interface BatteryHealthTestProps {
  sendCommand: (cmd: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  isPolling: boolean;
  stopPolling: () => void;
  addLog: (msg: string) => void;
  onSpeak?: (text: string) => void;
  vehicleInfo?: {
    vin?: string;
    brand?: string;
    model?: string;
  };
}

// ============= CONSTANTS =============

const PHASE_INSTRUCTIONS: Record<TestPhase, string> = {
  idle: 'Conecte o scanner e desligue o motor para iniciar o teste de bateria.',
  preparing: 'Verificando conexão e configurando scanner...',
  waiting_start: '✅ Pronto! Dê a partida no motor quando quiser. Estou monitorando.',
  capturing: '📊 Capturando dados... Aguarde o motor estabilizar.',
  post_start: '🔍 Motor ligado! Verificando alternador...',
  complete: '✅ Análise completa! Veja o diagnóstico abaixo.',
  error: '❌ Ocorreu um erro. Tente novamente.',
};

// ============= COMPONENT =============

export function BatteryHealthTest({
  sendCommand,
  isConnected,
  isPolling,
  stopPolling,
  addLog,
  onSpeak,
  vehicleInfo,
}: BatteryHealthTestProps) {
  // Test state
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [statusMessage, setStatusMessage] = useState(PHASE_INSTRUCTIONS.idle);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'test' | 'parasitic' | 'history'>('test');
  const [isSaved, setIsSaved] = useState(false);
  
  // Post-start progress state
  const [postStartProgress, setPostStartProgress] = useState<number>(0);
  const [postStartSecondsLeft, setPostStartSecondsLeft] = useState<number>(10);
  
  // Captured data
  const [voltageData, setVoltageData] = useState<VoltagePoint[]>([]);
  const [result, setResult] = useState<CrankingTestResult | null>(null);
  const [currentVoltage, setCurrentVoltage] = useState<number | null>(null);
  
  // Battery history hook
  const { saveTest, saving } = useBatteryHistory();
  
  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);
  
  // Update instruction when phase changes
  useEffect(() => {
    if (phase !== 'error') {
      setStatusMessage(PHASE_INSTRUCTIONS[phase]);
    }
  }, [phase]);
  
  // Start test handler
  const handleStartTest = useCallback(async () => {
    if (!isConnected) {
      setError('Conecte o scanner OBD-II primeiro.');
      setPhase('error');
      return;
    }
    
    // Stop polling if active
    if (isPolling) {
      stopPolling();
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Reset state
    setPhase('preparing');
    setError(null);
    setVoltageData([]);
    setResult(null);
    setCurrentVoltage(null);
    setPostStartProgress(0);
    setPostStartSecondsLeft(10);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    addLog('[BATTERY] Iniciando teste de saúde da bateria');
    
    try {
      const testResult = await startBurstCapture({
        sendCommand,
        onVoltageReading: (point) => {
          setVoltageData(prev => [...prev, point]);
          setCurrentVoltage(point.voltage);
        },
        onPhaseChange: (newPhase) => {
          setPhase(newPhase);
          // Reset progress when entering post_start
          if (newPhase === 'post_start') {
            setPostStartProgress(0);
            setPostStartSecondsLeft(10);
          }
        },
        onStatusMessage: (msg) => {
          setStatusMessage(msg);
          addLog(`[BATTERY] ${msg}`);
        },
        onPostStartProgress: (elapsedMs, totalMs) => {
          const percent = Math.round((elapsedMs / totalMs) * 100);
          const secondsLeft = Math.ceil((totalMs - elapsedMs) / 1000);
          setPostStartProgress(Math.min(percent, 100));
          setPostStartSecondsLeft(Math.max(secondsLeft, 0));
        },
        abortSignal: abortControllerRef.current.signal,
      });
      
      setResult(testResult);
      setPhase('complete');
      
      addLog(`[BATTERY] Teste concluído: Bateria ${testResult.batteryHealthPercent}% - ${testResult.batteryStatus}`);
      
      // Jarvis speaks the result
      if (onSpeak) {
        const message = generateJarvisMessage(testResult);
        onSpeak(message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setPhase('error');
      addLog(`[BATTERY] Erro: ${message}`);
    }
  }, [isConnected, isPolling, stopPolling, sendCommand, addLog, onSpeak]);
  
  // Cancel test handler
  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setPhase('idle');
    setStatusMessage(PHASE_INSTRUCTIONS.idle);
    addLog('[BATTERY] Teste cancelado pelo usuário');
  }, [addLog]);
  
  // Reset for new test
  const handleReset = useCallback(() => {
    setPhase('idle');
    setError(null);
    setVoltageData([]);
    setResult(null);
    setCurrentVoltage(null);
    setStatusMessage(PHASE_INSTRUCTIONS.idle);
    setIsSaved(false);
  }, []);

  // Save test to history
  const handleSaveTest = useCallback(async () => {
    if (!result) return;
    
    // Calculate cranking duration from timestamps
    const crankingDuration = (result.crankingStartMs && result.engineStartMs)
      ? result.engineStartMs - result.crankingStartMs
      : result.recoveryTimeMs;
    
    const saved = await saveTest({
      vin: vehicleInfo?.vin,
      vehicle_brand: vehicleInfo?.brand,
      vehicle_model: vehicleInfo?.model,
      resting_voltage: result.preStartVoltage,
      min_cranking_voltage: result.minVoltage,
      cranking_duration_ms: crankingDuration,
      voltage_recovery_ms: result.recoveryTimeMs,
      post_start_voltage: result.postStartVoltage,
      alternator_voltage: result.alternatorVoltage ?? undefined,
      battery_status: result.batteryStatus,
      battery_message: result.batteryMessage,
      alternator_status: result.alternatorStatus === 'ok' ? 'excellent' : 
                         result.alternatorStatus === 'weak' ? 'weak' : 
                         result.alternatorStatus === 'fail' ? 'not_charging' : undefined,
      alternator_message: result.alternatorMessage,
      voltage_samples: voltageData.map(p => ({ timestamp: p.timestamp, voltage: p.voltage })),
    });

    if (saved) {
      setIsSaved(true);
    }
  }, [result, voltageData, saveTest, vehicleInfo]);
  
  // Speak result again
  const handleSpeakResult = useCallback(() => {
    if (result && onSpeak) {
      const message = generateJarvisMessage(result);
      onSpeak(message);
    }
  }, [result, onSpeak]);
  
  // Get battery icon based on status
  const getBatteryIcon = (status: CrankingTestResult['batteryStatus'] | null) => {
    switch (status) {
      case 'excellent': return <BatteryFull className="h-8 w-8 text-chart-2" />;
      case 'good': return <BatteryMedium className="h-8 w-8 text-chart-2" />;
      case 'weak': return <BatteryLow className="h-8 w-8 text-chart-4" />;
      case 'critical': return <BatteryWarning className="h-8 w-8 text-destructive" />;
      default: return <Battery className="h-8 w-8 text-muted-foreground" />;
    }
  };
  
  // Get alternator icon based on status
  const getAlternatorIcon = (status: CrankingTestResult['alternatorStatus'] | null) => {
    switch (status) {
      case 'ok': return <CheckCircle2 className="h-6 w-6 text-chart-2" />;
      case 'weak': return <AlertTriangle className="h-6 w-6 text-chart-4" />;
      case 'fail': return <XCircle className="h-6 w-6 text-destructive" />;
      default: return <Info className="h-6 w-6 text-muted-foreground" />;
    }
  };
  
  const isTestRunning = phase === 'preparing' || phase === 'waiting_start' || phase === 'capturing' || phase === 'post_start';
  
  // Find min voltage point for chart highlight
  const minVoltagePoint = voltageData.length > 0 
    ? voltageData.reduce((min, p) => p.voltage < min.voltage ? p : min, voltageData[0])
    : null;

  return (
    <Card className="glass border-border/50">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Teste de Saúde da Bateria</CardTitle>
        </div>
        <CardDescription>
          Análise de queda de tensão durante a partida para prever vida útil da bateria
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tabs for Test vs Parasitic vs History */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'test' | 'parasitic' | 'history')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="test" className="gap-1.5 text-xs sm:text-sm">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Partida</span>
              <span className="sm:hidden">Partida</span>
            </TabsTrigger>
            <TabsTrigger value="parasitic" className="gap-1.5 text-xs sm:text-sm">
              <Power className="h-4 w-4" />
              <span className="hidden sm:inline">Parasita</span>
              <span className="sm:hidden">Parasita</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
              <span className="sm:hidden">Hist.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4">
            <BatteryHistory />
          </TabsContent>

          <TabsContent value="parasitic" className="mt-4">
            <ParasiticDrawTest
              sendCommand={sendCommand}
              isConnected={isConnected}
              addLog={addLog}
              onSpeak={onSpeak}
            />
          </TabsContent>

          <TabsContent value="test" className="mt-4 space-y-6">
        {/* Status Message */}
        <Alert className={phase === 'error' ? 'border-destructive' : 'border-primary/50'}>
          <AlertDescription className="flex items-center gap-2">
            {isTestRunning && <Loader2 className="h-4 w-4 animate-spin" />}
            {phase === 'complete' && <CheckCircle2 className="h-4 w-4 text-chart-2" />}
            {phase === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
            <span>{error || statusMessage}</span>
          </AlertDescription>
        </Alert>
        
        {/* Current Voltage Display */}
        {currentVoltage !== null && isTestRunning && (
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{currentVoltage.toFixed(1)}V</div>
              <div className="text-sm text-muted-foreground">Voltagem Atual</div>
            </div>
          </div>
        )}

        {/* Post-Start Progress Indicator */}
        {phase === 'post_start' && (
          <div className="space-y-2 p-4 bg-primary/10 rounded-lg border border-primary/30">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary animate-pulse" />
                Verificando alternador...
              </span>
              <span className="font-mono font-bold text-primary text-lg">
                {postStartSecondsLeft}s
              </span>
            </div>
            <Progress value={postStartProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Aguardando alternador estabilizar a carga
            </p>
          </div>
        )}
        
        {/* Real-time Voltage Chart (ECG Style) */}
        {voltageData.length > 0 && (
          <div className="bg-card/50 rounded-lg p-4 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Gráfico de Tensão</span>
              {isTestRunning && (
                <Badge variant="outline" className="animate-pulse">AO VIVO</Badge>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={voltageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                {/* Reference areas for voltage zones */}
                <ReferenceArea y1={13.5} y2={15} fill="hsl(var(--chart-2))" fillOpacity={0.1} />
                <ReferenceArea y1={10.5} y2={13} fill="hsl(var(--chart-2))" fillOpacity={0.1} />
                <ReferenceArea y1={9.0} y2={10.5} fill="hsl(var(--chart-4))" fillOpacity={0.15} />
                <ReferenceArea y1={7} y2={9.0} fill="hsl(var(--destructive))" fillOpacity={0.15} />
                
                {/* Reference lines */}
                <ReferenceLine y={12.6} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <ReferenceLine y={9.6} stroke="hsl(var(--chart-4))" strokeDasharray="3 3" />
                <ReferenceLine y={13.5} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" />
                
                <XAxis dataKey="timestamp" hide />
                <YAxis 
                  domain={[7, 15]} 
                  tickFormatter={(v) => `${v}V`}
                  width={35}
                  fontSize={10}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}V`, 'Voltagem']}
                  labelFormatter={(label) => `${(label / 1000).toFixed(1)}s`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                
                {/* Voltage line */}
                <Line
                  type="monotone"
                  dataKey="voltage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                
                {/* Min voltage point highlight */}
                {minVoltagePoint && !isTestRunning && (
                  <ReferenceDot
                    x={minVoltagePoint.timestamp}
                    y={minVoltagePoint.voltage}
                    r={6}
                    fill="hsl(var(--destructive))"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-between text-xs text-muted-foreground mt-1 px-2">
              <span>0s</span>
              <span>Tempo (segundos)</span>
              <span>{((voltageData[voltageData.length - 1]?.timestamp || 0) / 1000).toFixed(0)}s</span>
            </div>
          </div>
        )}
        
        {/* Results Section */}
        {result && phase === 'complete' && (
          <div className="space-y-4">
            {/* Battery and Alternator Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Battery Card */}
              <Card className="border-border/50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {getBatteryIcon(result.batteryStatus)}
                    <div>
                      <div className="font-semibold">Bateria</div>
                      <Badge 
                        variant={result.batteryStatus === 'critical' ? 'destructive' : 
                                result.batteryStatus === 'weak' ? 'secondary' : 'default'}
                      >
                        {result.batteryStatus === 'excellent' ? 'Excelente' :
                         result.batteryStatus === 'good' ? 'Boa' :
                         result.batteryStatus === 'weak' ? 'Fraca' : 'Crítica'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Saúde</span>
                      <span className="font-medium">{result.batteryHealthPercent}%</span>
                    </div>
                    <Progress 
                      value={result.batteryHealthPercent} 
                      className="h-2"
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {result.batteryMessage}
                  </p>
                </CardContent>
              </Card>
              
              {/* Alternator Card */}
              <Card className="border-border/50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Zap className="h-8 w-8 text-chart-4" />
                    <div>
                      <div className="font-semibold">Alternador</div>
                      <div className="flex items-center gap-1.5">
                        {getAlternatorIcon(result.alternatorStatus)}
                        <span className="text-sm">
                          {result.alternatorStatus === 'ok' ? 'OK' :
                           result.alternatorStatus === 'weak' ? 'Atenção' :
                           result.alternatorStatus === 'fail' ? 'Falha' : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {result.alternatorVoltage && (
                    <div className="text-2xl font-bold text-center">
                      {result.alternatorVoltage.toFixed(1)}V
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground">
                    {result.alternatorMessage}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Detailed Metrics */}
            <Card className="border-border/30 bg-muted/30">
              <CardContent className="pt-4">
                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Métricas Detalhadas
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Voltagem em repouso:</span>
                    <span className="font-medium">{result.preStartVoltage.toFixed(2)}V</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mínimo na partida:</span>
                    <span className="font-medium text-destructive">{result.minVoltage.toFixed(2)}V</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Queda de tensão:</span>
                    <span className="font-medium">{result.voltageDrop.toFixed(2)}V</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tempo de recuperação:</span>
                    <span className="font-medium">{(result.recoveryTimeMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {phase === 'idle' && (
            <Button 
              onClick={handleStartTest} 
              disabled={!isConnected}
              size="lg"
              className="gap-2"
            >
              <Play className="h-5 w-5" />
              Iniciar Teste
            </Button>
          )}
          
          {isTestRunning && (
            <Button 
              onClick={handleCancel} 
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <XCircle className="h-5 w-5" />
              Cancelar
            </Button>
          )}
          
          {(phase === 'complete' || phase === 'error') && (
            <>
              <Button 
                onClick={handleReset} 
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                Novo Teste
              </Button>
              
              {phase === 'complete' && (
                <>
                  {onSpeak && (
                    <Button 
                      onClick={handleSpeakResult} 
                      variant="secondary"
                      size="lg"
                      className="gap-2"
                    >
                      <Volume2 className="h-5 w-5" />
                      Ouvir
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleSaveTest} 
                    variant="default"
                    size="lg"
                    className="gap-2"
                    disabled={saving || isSaved}
                  >
                    {saving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isSaved ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    {isSaved ? 'Salvo' : 'Salvar'}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
        
        {/* Instructions */}
        {phase === 'idle' && (
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <div className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Como funciona o teste:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Desligue o motor (mantenha a chave na posição ligada)</li>
              <li>Clique em "Iniciar Teste"</li>
              <li>Dê a partida no motor quando solicitado</li>
              <li>Aguarde o resultado da análise</li>
            </ol>
          </div>
        )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default BatteryHealthTest;
