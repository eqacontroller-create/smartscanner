/**
 * Parasitic Draw Test Component
 * 30-minute voltage monitoring test to detect parasitic battery drain
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Power,
  Play,
  Square,
  RotateCcw,
  Volume2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  AlertTriangle,
  Zap,
  TrendingDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  startParasiticDrawTest,
  generateParasiticDrawMessage,
  type VoltagePoint,
  type ParasiticDrawResult,
} from '@/services/battery/BatteryForensicsService';
import { useWakeLock } from '@/hooks/useWakeLock';

// ============= TYPES =============

type TestPhase = 
  | 'idle'
  | 'monitoring'
  | 'complete'
  | 'cancelled'
  | 'error';

interface ParasiticDrawTestProps {
  sendCommand: (cmd: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  addLog: (msg: string) => void;
  onSpeak?: (text: string) => void;
}

// ============= COMPONENT =============

export function ParasiticDrawTest({
  sendCommand,
  isConnected,
  addLog,
  onSpeak,
}: ParasiticDrawTestProps) {
  // Test state
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [statusMessage, setStatusMessage] = useState('Selecione a duração e inicie o teste.');
  const [error, setError] = useState<string | null>(null);
  
  // Test settings
  const [testDuration, setTestDuration] = useState<10 | 30 | 60>(30);
  
  // Progress
  const [progress, setProgress] = useState(0);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  
  // Captured data
  const [voltageData, setVoltageData] = useState<VoltagePoint[]>([]);
  const [result, setResult] = useState<ParasiticDrawResult | null>(null);
  const [currentVoltage, setCurrentVoltage] = useState<number | null>(null);
  
  // Wake lock to keep screen on during long test
  const [isTestActive, setIsTestActive] = useState(false);
  const { requestWakeLock, releaseWakeLock } = useWakeLock({
    enabled: isTestActive,
    isConnected: isTestActive, // Use test active state instead of OBD connection
  });
  
  // Abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      releaseWakeLock();
    };
  }, [releaseWakeLock]);
  
  // Start test handler
  const handleStartTest = useCallback(async () => {
    if (!isConnected) {
      setError('Conecte o scanner OBD-II primeiro.');
      setPhase('error');
      return;
    }
    
    // Reset state
    setPhase('monitoring');
    setError(null);
    setVoltageData([]);
    setResult(null);
    setProgress(0);
    setRemainingMinutes(testDuration);
    setIsTestActive(true);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    addLog(`[PARASITIC] Iniciando teste de consumo parasita (${testDuration} minutos)`);
    
    try {
      const testResult = await startParasiticDrawTest({
        sendCommand,
        testDurationMinutes: testDuration,
        samplingIntervalSeconds: 10,
        onVoltageReading: (point) => {
          setVoltageData(prev => [...prev, point]);
          setCurrentVoltage(point.voltage);
        },
        onProgress: (percent, remaining) => {
          setProgress(percent);
          setRemainingMinutes(remaining);
        },
        onStatusMessage: (msg) => {
          setStatusMessage(msg);
          addLog(`[PARASITIC] ${msg}`);
        },
        abortSignal: abortControllerRef.current.signal,
      });
      
      setResult(testResult);
      setPhase('complete');
      
      addLog(`[PARASITIC] Teste concluído: ${testResult.drawLevel} - ${testResult.estimatedDrawMilliamps}mA estimado`);
      
      // Jarvis speaks the result
      if (onSpeak) {
        const message = generateParasiticDrawMessage(testResult);
        onSpeak(message);
      }
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        setPhase('cancelled');
        setStatusMessage('Teste cancelado.');
      } else {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        setPhase('error');
        addLog(`[PARASITIC] Erro: ${message}`);
      }
    } finally {
      setIsTestActive(false);
    }
  }, [isConnected, testDuration, sendCommand, addLog, onSpeak]);
  
  // Cancel test handler
  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setPhase('cancelled');
    setStatusMessage('Teste cancelado pelo usuário.');
    setIsTestActive(false);
    addLog('[PARASITIC] Teste cancelado pelo usuário');
  }, [addLog]);
  
  // Reset handler
  const handleReset = useCallback(() => {
    setPhase('idle');
    setError(null);
    setVoltageData([]);
    setResult(null);
    setProgress(0);
    setCurrentVoltage(null);
    setStatusMessage('Selecione a duração e inicie o teste.');
  }, []);
  
  // Speak result again
  const handleSpeakResult = useCallback(() => {
    if (result && onSpeak) {
      const message = generateParasiticDrawMessage(result);
      onSpeak(message);
    }
  }, [result, onSpeak]);
  
  // Format time for display
  const formatTime = (minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get status color
  const getStatusColor = (level: ParasiticDrawResult['drawLevel']) => {
    switch (level) {
      case 'normal': return 'text-chart-2';
      case 'moderate': return 'text-chart-3';
      case 'excessive': return 'text-chart-4';
      case 'critical': return 'text-destructive';
    }
  };
  
  // Get status icon
  const getStatusIcon = (level: ParasiticDrawResult['drawLevel']) => {
    switch (level) {
      case 'normal': return <CheckCircle2 className="h-8 w-8 text-chart-2" />;
      case 'moderate': return <Info className="h-8 w-8 text-chart-3" />;
      case 'excessive': return <AlertTriangle className="h-8 w-8 text-chart-4" />;
      case 'critical': return <XCircle className="h-8 w-8 text-destructive" />;
    }
  };
  
  const isTestRunning = phase === 'monitoring';

  return (
    <div className="space-y-4">
      {/* Status Message */}
      <Alert className={phase === 'error' ? 'border-destructive' : 'border-primary/50'}>
        <AlertDescription className="flex items-center gap-2">
          {isTestRunning && <Loader2 className="h-4 w-4 animate-spin" />}
          {phase === 'complete' && <CheckCircle2 className="h-4 w-4 text-chart-2" />}
          {phase === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
          {phase === 'cancelled' && <Info className="h-4 w-4 text-muted-foreground" />}
          <span>{error || statusMessage}</span>
        </AlertDescription>
      </Alert>
      
      {/* Test Duration Selector (only in idle) */}
      {phase === 'idle' && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Duração do teste:</span>
          <Select 
            value={testDuration.toString()} 
            onValueChange={(v) => setTestDuration(parseInt(v) as 10 | 30 | 60)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 minutos (rápido)</SelectItem>
              <SelectItem value="30">30 minutos (padrão)</SelectItem>
              <SelectItem value="60">60 minutos (completo)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Timer Display (during test) */}
      {isTestRunning && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Tempo restante</span>
              </div>
              
              <div className="text-5xl font-mono font-bold text-primary">
                {formatTime(remainingMinutes)}
              </div>
              
              <Progress value={progress} className="w-full h-3" />
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-chart-4" />
                  <span className="font-medium">
                    {currentVoltage?.toFixed(2) ?? '--'}V
                  </span>
                </div>
                {voltageData.length > 1 && (
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Δ {((voltageData[0].voltage - (currentVoltage ?? voltageData[0].voltage)) * 1000).toFixed(0)}mV
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Voltage Chart */}
      {voltageData.length > 0 && (
        <Card className="border-border/30 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Power className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Monitoramento de Voltagem</span>
              {isTestRunning && (
                <Badge variant="outline" className="animate-pulse text-xs">AO VIVO</Badge>
              )}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={voltageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <ReferenceLine 
                  y={voltageData[0]?.voltage} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="3 3"
                  label={{ value: 'Inicial', position: 'right', fontSize: 10 }}
                />
                
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(v) => `${Math.round(v / 60000)}m`}
                  fontSize={10}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `${v.toFixed(1)}V`}
                  width={40}
                  fontSize={10}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(3)}V`, 'Voltagem']}
                  labelFormatter={(label) => `${(Number(label) / 60000).toFixed(1)} min`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                
                <Line
                  type="monotone"
                  dataKey="voltage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Results Section */}
      {result && phase === 'complete' && (
        <Card className="border-border/50">
          <CardContent className="pt-4 space-y-4">
            {/* Status Header */}
            <div className="flex items-center gap-3">
              {getStatusIcon(result.drawLevel)}
              <div>
                <div className={`font-semibold text-lg ${getStatusColor(result.drawLevel)}`}>
                  {result.drawLevel === 'normal' ? 'Consumo Normal' :
                   result.drawLevel === 'moderate' ? 'Consumo Moderado' :
                   result.drawLevel === 'excessive' ? 'Consumo Excessivo' : 'Dreno Crítico'}
                </div>
                <Badge variant={
                  result.drawLevel === 'critical' ? 'destructive' : 
                  result.drawLevel === 'excessive' ? 'secondary' : 'default'
                }>
                  ~{result.estimatedDrawMilliamps}mA
                </Badge>
              </div>
            </div>
            
            {/* Message */}
            <p className="text-sm">{result.message}</p>
            
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voltagem inicial:</span>
                <span className="font-medium">{result.startVoltage.toFixed(2)}V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voltagem final:</span>
                <span className="font-medium">{result.endVoltage.toFixed(2)}V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Queda total:</span>
                <span className="font-medium">{result.totalDropMv}mV</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa horária:</span>
                <span className="font-medium">{result.dropPerHourMv}mV/h</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">Duração do teste:</span>
                <span className="font-medium">{result.testDurationMinutes} minutos</span>
              </div>
            </div>
            
            {/* Recommendation */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {result.recommendation}
              </AlertDescription>
            </Alert>
            
            {/* OBD-II consumption note */}
            <p className="text-xs text-muted-foreground text-center">
              Nota: O scanner OBD-II conectado consome ~50-100mA. O consumo real do veículo pode ser ligeiramente menor.
            </p>
          </CardContent>
        </Card>
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
            Iniciar Teste ({testDuration} min)
          </Button>
        )}
        
        {isTestRunning && (
          <Button 
            onClick={handleCancel} 
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Square className="h-5 w-5" />
            Parar Teste
          </Button>
        )}
        
        {(phase === 'complete' || phase === 'error' || phase === 'cancelled') && (
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
                Ouvir
              </Button>
            )}
          </>
        )}
      </div>
      
      {/* Instructions (idle state) */}
      {phase === 'idle' && (
        <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
          <div className="font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            Como funciona o teste:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Desligue completamente o motor e todos os acessórios</li>
            <li>Aguarde 5 minutos para os módulos entrarem em modo de repouso</li>
            <li>Inicie o teste e <strong>não ligue o carro</strong> durante o monitoramento</li>
            <li>O teste medirá a queda de voltagem para detectar consumo parasita</li>
          </ol>
          <div className="pt-2 text-xs text-muted-foreground">
            💡 Dica: Para melhor precisão, use o teste de 30 ou 60 minutos.
          </div>
        </div>
      )}
    </div>
  );
}

export default ParasiticDrawTest;
