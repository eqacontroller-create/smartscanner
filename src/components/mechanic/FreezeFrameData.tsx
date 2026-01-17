import { useState } from 'react';
import { Snowflake, Loader2, Gauge, Thermometer, Activity, Wind, Fuel, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FREEZE_FRAME_PIDS, parseFreezeFrameResponse, formatFreezeFrameValue, getPIDName } from '@/services/obd/FreezeFrameParser';

interface FreezeFrameDataProps {
  dtcCode: string;
  sendCommand: (command: string, timeout?: number) => Promise<string>;
  addLog: (message: string) => void;
}

interface FreezeFrameValues {
  [pid: string]: {
    value: number | string | null;
    name: string;
  };
}

const getIconForPID = (pid: string) => {
  switch (pid.toUpperCase()) {
    case '0C': return <Gauge className="h-4 w-4" />;
    case '05':
    case '0F': return <Thermometer className="h-4 w-4" />;
    case '0D': return <Activity className="h-4 w-4" />;
    case '10': return <Wind className="h-4 w-4" />;
    case '06':
    case '07':
    case '0A': return <Fuel className="h-4 w-4" />;
    case '1F':
    case '21': return <Clock className="h-4 w-4" />;
    default: return <Snowflake className="h-4 w-4" />;
  }
};

export function FreezeFrameData({ dtcCode, sendCommand, addLog }: FreezeFrameDataProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [freezeData, setFreezeData] = useState<FreezeFrameValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readFreezeFrame = async () => {
    setIsLoading(true);
    setError(null);
    setFreezeData(null);
    
    addLog(`❄️ Lendo Freeze Frame para ${dtcCode}...`);
    
    try {
      // Resetar para modo broadcast
      await sendCommand('AT SH 7DF', 2000);
      await sendCommand('AT CRA', 2000);
      
      const values: FreezeFrameValues = {};
      
      // PIDs prioritários para leitura (mais relevantes)
      const priorityPIDs = ['04', '05', '0C', '0D', '0F', '11', '06', '07', '1F'];
      
      for (const pid of priorityPIDs) {
        try {
          // Modo 02 + PID + Frame 00
          const command = `02 ${pid} 00`;
          addLog(`📤 ${command}`);
          
          const response = await sendCommand(command, 3000);
          
          if (response.includes('NODATA') || response.includes('NO DATA')) {
            continue;
          }
          
          const value = parseFreezeFrameResponse(pid, response);
          
          if (value !== null) {
            values[pid] = {
              value,
              name: getPIDName(pid),
            };
            addLog(`📥 ${getPIDName(pid)}: ${formatFreezeFrameValue(pid, value)}`);
          }
          
          // Pequena pausa entre comandos
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch {
          // Ignorar erros individuais e continuar
        }
      }
      
      if (Object.keys(values).length === 0) {
        setError('Freeze Frame não disponível para este DTC');
        addLog('⚠️ Freeze Frame não disponível');
      } else {
        setFreezeData(values);
        addLog(`✅ Freeze Frame lido: ${Object.keys(values).length} parâmetros`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      addLog(`❌ Erro ao ler Freeze Frame: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!freezeData && !error && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Snowflake className="h-8 w-8 text-blue-400" />
          <p className="text-sm text-muted-foreground text-center">
            Freeze Frame mostra as condições do motor no momento em que o código <strong>{dtcCode}</strong> foi registrado.
          </p>
          <Button
            onClick={readFreezeFrame}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Lendo dados...
              </>
            ) : (
              <>
                <Snowflake className="h-4 w-4" />
                Ler Freeze Frame
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-muted/50 border text-center">
          <Snowflake className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            onClick={readFreezeFrame}
            variant="ghost"
            size="sm"
            className="mt-2"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {freezeData && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Snowflake className="h-4 w-4" />
            Condições no momento do erro
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {/* RPM */}
            {freezeData['0C'] && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Gauge className="h-3 w-3" />
                    RPM
                  </div>
                  <p className="text-lg font-bold">
                    {formatFreezeFrameValue('0C', freezeData['0C'].value)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Velocidade */}
            {freezeData['0D'] && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Activity className="h-3 w-3" />
                    Velocidade
                  </div>
                  <p className="text-lg font-bold">
                    {formatFreezeFrameValue('0D', freezeData['0D'].value)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Temperatura do motor */}
            {freezeData['05'] && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Thermometer className="h-3 w-3" />
                    Temp. Motor
                  </div>
                  <p className="text-lg font-bold">
                    {formatFreezeFrameValue('05', freezeData['05'].value)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Carga do motor */}
            {freezeData['04'] && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Gauge className="h-3 w-3" />
                    Carga Motor
                  </div>
                  <p className="text-lg font-bold">
                    {formatFreezeFrameValue('04', freezeData['04'].value)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Outros parâmetros em lista */}
          <div className="space-y-1">
            {Object.entries(freezeData)
              .filter(([pid]) => !['0C', '0D', '05', '04'].includes(pid))
              .map(([pid, data]) => (
                <div 
                  key={pid}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2 text-sm">
                    {getIconForPID(pid)}
                    <span className="text-muted-foreground">{data.name}</span>
                  </div>
                  <span className="font-medium">
                    {formatFreezeFrameValue(pid, data.value)}
                  </span>
                </div>
              ))}
          </div>

          <Button
            onClick={readFreezeFrame}
            variant="ghost"
            size="sm"
            className="w-full gap-2"
          >
            <Snowflake className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      )}
    </div>
  );
}
