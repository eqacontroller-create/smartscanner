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
}: BatteryHealthTestProps) {
  // Test state
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [statusMessage, setStatusMessage] = useState(PHASE_INSTRUCTIONS.idle);
  const [error, setError] = useState<string | null>(null);
  
  // Captured data
  const [voltageData, setVoltageData] = useState<VoltagePoint[]>([]);
  const [result, setResult] = useState<CrankingTestResult | null>(null);
  const [currentVoltage, setCurrentVoltage] = useState<number | null>(null);
  
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
        },
        onStatusMessage: (msg) => {
          setStatusMessage(msg);
          addLog(`[BATTERY] ${msg}`);
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
  }, []);
  
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
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Teste de Saúde da Bateria</CardTitle>
        </div>
        <CardDescription>
          Análise de queda de tensão durante a partida para prever vida útil da bateria
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
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
              
              {phase === 'complete' && onSpeak && (
                <Button 
                  onClick={handleSpeakResult} 
                  variant="secondary"
                  size="lg"
                  className="gap-2"
                >
                  <Volume2 className="h-5 w-5" />
                  Ouvir Diagnóstico
                </Button>
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
      </CardContent>
    </Card>
  );
}

export default BatteryHealthTest;
