import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Play, Square, Settings2, Gauge, Thermometer, Zap, Circle, Download, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { LIVE_DATA_PIDS, DEFAULT_MONITORING_PIDS, parseLiveDataResponse, getPIDInfo, type LivePID } from '@/services/obd/LiveDataParser';
import { useOBD } from '@/hooks/useOBD';
import { toast } from 'sonner';

// ============= MUTEX CONSTANTS =============
const MUTEX_OWNER = 'live-data-monitor';
const MUTEX_PRIORITY = 2 as const; // Baixa prioridade (monitoramento manual)
const MUTEX_TIMEOUT_MS = 30000; // 30s para adquirir lock

interface LiveDataMonitorProps {
  sendCommand: (command: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  addLog: (message: string) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

interface SensorReading {
  pid: string;
  value: number;
  timestamp: number;
}

interface ChartDataPoint {
  time: number;
  [key: string]: number;
}

interface RecordedDataPoint {
  timestamp: string;
  elapsedSeconds: number;
  [key: string]: string | number;
}

const CHART_MAX_POINTS = 60; // 60 segundos de histórico
const UPDATE_INTERVAL = 500; // 500ms entre leituras

const getIconForPID = (pid: string) => {
  switch (pid.toUpperCase()) {
    case '0C': return <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
    case '05':
    case '0F': return <Thermometer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
    case '0D': return <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
    default: return <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
  }
};

const getColorForPID = (pid: string): string => {
  const colors: Record<string, string> = {
    '0C': '#3b82f6', // blue - RPM
    '0D': '#22c55e', // green - Speed
    '05': '#ef4444', // red - Coolant temp
    '04': '#f59e0b', // amber - Engine load
    '0F': '#8b5cf6', // purple - Intake temp
    '11': '#06b6d4', // cyan - Throttle
    '10': '#ec4899', // pink - MAF
    '0B': '#14b8a6', // teal - MAP
  };
  return colors[pid.toUpperCase()] || '#6b7280';
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function LiveDataMonitor({ sendCommand, isConnected, addLog, stopPolling, isPolling }: LiveDataMonitorProps) {
  // === MUTEX GLOBAL ===
  const { acquireOBDLock, releaseOBDLock, isOBDBusy, obdLockOwner } = useOBD();
  const hasLockRef = useRef(false);
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedPIDs, setSelectedPIDs] = useState<string[]>(DEFAULT_MONITORING_PIDS);
  const [currentValues, setCurrentValues] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [updateRate, setUpdateRate] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState<RecordedDataPoint[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const monitoringRef = useRef(false);
  const recordingRef = useRef(false);
  const startTimeRef = useRef(0);
  
  // Cleanup on unmount - liberar lock se necessário
  useEffect(() => {
    return () => {
      if (hasLockRef.current) {
        releaseOBDLock(MUTEX_OWNER);
        hasLockRef.current = false;
      }
    };
  }, [releaseOBDLock]);

  const readSensorData = useCallback(async () => {
    if (!monitoringRef.current || selectedPIDs.length === 0) return;

    const newValues: Record<string, number> = { ...currentValues };
    let successCount = 0;

    for (const pid of selectedPIDs) {
      if (!monitoringRef.current) break;

      try {
        const response = await sendCommand(`01 ${pid}`, 2000);
        const value = parseLiveDataResponse(pid, response);
        
        if (value !== null) {
          newValues[pid] = value;
          successCount++;
        }
      } catch {
        // Ignorar erros individuais
      }
    }

    if (monitoringRef.current && successCount > 0) {
      setCurrentValues(newValues);
      
      // Adicionar ponto ao gráfico
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      const newPoint: ChartDataPoint = { time: elapsed };
      selectedPIDs.forEach(pid => {
        if (newValues[pid] !== undefined) {
          newPoint[pid] = newValues[pid];
        }
      });
      
      setChartData(prev => {
        const updated = [...prev, newPoint];
        // Manter apenas os últimos CHART_MAX_POINTS
        if (updated.length > CHART_MAX_POINTS) {
          return updated.slice(-CHART_MAX_POINTS);
        }
        return updated;
      });

      // Gravar dados se estiver em modo de gravação
      if (recordingRef.current) {
        const recordPoint: RecordedDataPoint = {
          timestamp: new Date().toISOString(),
          elapsedSeconds: elapsed,
        };
        selectedPIDs.forEach(pid => {
          const pidInfo = getPIDInfo(pid);
          if (newValues[pid] !== undefined && pidInfo) {
            recordPoint[`${pidInfo.shortName} (${pidInfo.unit})`] = newValues[pid];
          }
        });
        setRecordedData(prev => [...prev, recordPoint]);
      }

      setUpdateRate(successCount);
    }
  }, [selectedPIDs, sendCommand, currentValues]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isMonitoring && isConnected) {
      monitoringRef.current = true;
      startTimeRef.current = Date.now();
      
      // Primeira leitura imediata
      readSensorData();
      
      // Leituras subsequentes
      intervalId = setInterval(() => {
        if (monitoringRef.current) {
          readSensorData();
        }
      }, UPDATE_INTERVAL);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMonitoring, isConnected, readSensorData]);

  const handleStartMonitoring = async () => {
    if (!isConnected || selectedPIDs.length === 0) return;
    
    // === ADQUIRIR MUTEX GLOBAL ===
    addLog('[LIVE] 🔒 Aguardando acesso exclusivo ao barramento...');
    
    const hasLock = await acquireOBDLock(MUTEX_OWNER, MUTEX_PRIORITY, MUTEX_TIMEOUT_MS);
    
    if (!hasLock) {
      addLog('[LIVE] ❌ Não foi possível obter acesso exclusivo');
      toast.error('Barramento ocupado', {
        description: `Em uso por: ${obdLockOwner || 'outro componente'}`,
      });
      return;
    }
    
    hasLockRef.current = true;
    addLog('[LIVE] 🔓 Acesso exclusivo obtido');
    
    // Parar polling do painel primeiro para evitar conflitos
    if (isPolling) {
      stopPolling();
      addLog('⏸️ Pausando leitura do painel...');
      await delay(500); // Aguardar ELM327 estabilizar
    }
    
    addLog('📊 Iniciando monitoramento de dados ao vivo...');
    
    // Reconfigurar ELM327 para leituras limpas
    try {
      await sendCommand('AT Z', 2000); // Reset
      await delay(300);
      await sendCommand('AT E0', 2000); // Sem echo
      await sendCommand('AT H0', 2000); // Sem headers
      await sendCommand('AT SP 0', 2000); // Auto protocolo
      await sendCommand('AT ST 32', 2000); // Timeout curto
    } catch {
      // Continuar mesmo com erro de configuração
    }
    
    setChartData([]);
    setCurrentValues({});
    setIsMonitoring(true);
    addLog(`✅ Monitorando ${selectedPIDs.length} sensor(es)`);
  };

  const handleStopMonitoring = () => {
    monitoringRef.current = false;
    setIsMonitoring(false);
    if (isRecording) {
      handleStopRecording();
    }
    
    // === LIBERAR MUTEX ===
    if (hasLockRef.current) {
      releaseOBDLock(MUTEX_OWNER);
      hasLockRef.current = false;
      addLog('[LIVE] 🔓 Barramento liberado');
    }
    
    addLog('⏹️ Monitoramento parado');
  };

  const handleStartRecording = () => {
    setRecordedData([]);
    setRecordingStartTime(new Date());
    recordingRef.current = true;
    setIsRecording(true);
    addLog('🔴 Gravação iniciada');
  };

  const handleStopRecording = () => {
    recordingRef.current = false;
    setIsRecording(false);
    addLog(`⏹️ Gravação parada - ${recordedData.length} pontos gravados`);
  };

  const handleExportCSV = () => {
    if (recordedData.length === 0) {
      addLog('⚠️ Nenhum dado gravado para exportar');
      return;
    }

    // Criar cabeçalhos CSV
    const headers = Object.keys(recordedData[0]);
    const csvRows = [headers.join(',')];

    // Adicionar linhas de dados
    for (const row of recordedData) {
      const values = headers.map(header => {
        const val = row[header];
        // Escapar strings com vírgulas
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Criar nome do arquivo com data/hora
    const dateStr = recordingStartTime 
      ? recordingStartTime.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_')
      : new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    const filename = `obd2_livedata_${dateStr}.csv`;

    // Download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addLog(`📥 Arquivo exportado: ${filename}`);
  };

  const togglePID = (pid: string) => {
    setSelectedPIDs(prev => 
      prev.includes(pid) 
        ? prev.filter(p => p !== pid)
        : [...prev, pid]
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="truncate">Dados ao Vivo</span>
          </CardTitle>
          
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {isMonitoring && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-[10px] sm:text-xs px-1.5 sm:px-2">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse mr-1 sm:mr-2" />
                <span className="hidden xs:inline">{updateRate} leituras/ciclo</span>
                <span className="xs:hidden">{updateRate}</span>
              </Badge>
            )}
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isMonitoring} className="h-8 w-8 sm:h-9 sm:w-9 touch-target">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] sm:h-auto sm:max-h-[85vh]">
                <SheetHeader>
                  <SheetTitle>Selecionar Sensores</SheetTitle>
                  <SheetDescription>
                    Escolha quais sensores monitorar em tempo real
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 overflow-y-auto max-h-[60vh] sm:max-h-[50vh]">
                  {LIVE_DATA_PIDS.map(pid => (
                    <div key={pid.pid} className="flex items-center space-x-3 touch-target py-1">
                      <Checkbox
                        id={pid.pid}
                        checked={selectedPIDs.includes(pid.pid)}
                        onCheckedChange={() => togglePID(pid.pid)}
                        className="h-5 w-5"
                      />
                      <Label htmlFor={pid.pid} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          {getIconForPID(pid.pid)}
                          <span className="text-sm sm:text-base">{pid.shortName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {pid.name} ({pid.unit})
                        </p>
                      </Label>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Controles */}
        <div className="flex flex-wrap gap-2">
          {!isMonitoring ? (
            <Button
              onClick={handleStartMonitoring}
              disabled={!isConnected || selectedPIDs.length === 0}
              className="gap-2 min-h-[44px] touch-target text-sm sm:text-base"
            >
              <Play className="h-4 w-4" />
              <span className="hidden xs:inline">Iniciar Monitoramento</span>
              <span className="xs:hidden">Iniciar</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={handleStopMonitoring}
                variant="destructive"
                className="gap-2 min-h-[44px] touch-target text-sm sm:text-base"
              >
                <Square className="h-4 w-4" />
                Parar
              </Button>
              
              {/* Botão de Gravação */}
              {!isRecording ? (
                <Button
                  onClick={handleStartRecording}
                  variant="outline"
                  className="gap-2 min-h-[44px] touch-target text-sm sm:text-base border-red-500/50 text-red-500 hover:bg-red-500/10"
                >
                  <Circle className="h-4 w-4 fill-current" />
                  <span className="hidden xs:inline">Gravar</span>
                </Button>
              ) : (
                <Button
                  onClick={handleStopRecording}
                  variant="outline"
                  className="gap-2 min-h-[44px] touch-target text-sm sm:text-base bg-red-500/10 border-red-500 text-red-500"
                >
                  <Circle className="h-4 w-4 fill-current animate-pulse" />
                  <span className="hidden xs:inline">{recordedData.length} pts</span>
                  <span className="xs:hidden">{recordedData.length}</span>
                </Button>
              )}
            </>
          )}
          
          {/* Botão de Exportar (aparece quando há dados gravados) */}
          {recordedData.length > 0 && !isRecording && (
            <Button
              onClick={handleExportCSV}
              variant="secondary"
              className="gap-2 min-h-[44px] touch-target text-sm sm:text-base"
            >
              <Download className="h-4 w-4" />
              <span className="hidden xs:inline">Exportar CSV</span>
              <span className="xs:hidden">CSV</span>
            </Button>
          )}
        </div>
        
        {/* Indicador de Gravação */}
        {isRecording && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-md">
            <Circle className="h-3 w-3 fill-current animate-pulse" />
            <span>Gravando dados... {recordedData.length} pontos coletados</span>
          </div>
        )}

        {!isConnected && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Conecte-se ao scanner OBD-II primeiro.
          </p>
        )}

        {/* Valores atuais */}
        {(isMonitoring || Object.keys(currentValues).length > 0) && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {selectedPIDs.map(pid => {
              const pidInfo = getPIDInfo(pid);
              const value = currentValues[pid];
              
              if (!pidInfo) return null;
              
              return (
                <Card 
                  key={pid} 
                  className="bg-muted/30"
                  style={{ borderLeftColor: getColorForPID(pid), borderLeftWidth: 3 }}
                >
                  <CardContent className="p-2 sm:p-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
                      {getIconForPID(pid)}
                      <span className="truncate">{pidInfo.shortName}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold tabular-nums">
                      {value !== undefined ? value : '--'}
                      <span className="text-[10px] sm:text-sm font-normal text-muted-foreground ml-0.5 sm:ml-1">
                        {pidInfo.unit}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Gráfico */}
        {chartData.length > 1 && (
          <Card className="bg-muted/20">
            <CardContent className="p-2 sm:p-4">
              <div className="h-36 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 9 }}
                      tickFormatter={(value) => `${value}s`}
                    />
                    <YAxis 
                      tick={{ fontSize: 9 }}
                      width={32}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      labelFormatter={(value) => `Tempo: ${value}s`}
                      formatter={(value: number, name: string) => {
                        const pidInfo = getPIDInfo(name);
                        return [`${value} ${pidInfo?.unit || ''}`, pidInfo?.shortName || name];
                      }}
                    />
                    {selectedPIDs.map(pid => (
                      <Line
                        key={pid}
                        type="monotone"
                        dataKey={pid}
                        stroke={getColorForPID(pid)}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legenda */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 justify-center">
                {selectedPIDs.map(pid => {
                  const pidInfo = getPIDInfo(pid);
                  return (
                    <div key={pid} className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                      <div 
                        className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" 
                        style={{ backgroundColor: getColorForPID(pid) }}
                      />
                      <span className="text-muted-foreground">{pidInfo?.shortName}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedPIDs.length === 0 && (
          <div className="text-center py-4 sm:py-6 text-muted-foreground">
            <Settings2 className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">Selecione os sensores para monitorar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
