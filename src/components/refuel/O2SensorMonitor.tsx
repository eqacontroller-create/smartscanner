// Monitor de Sensor O2 em tempo real
// Mostra voltagem oscilando com gráfico e indicadores visuais

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ReferenceLine, 
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { Zap, AlertTriangle, Activity, ThermometerSun } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { O2SensorReading } from '@/types/fuelForensics';
import { DEFAULT_FUEL_THRESHOLDS } from '@/types/fuelForensics';

interface O2SensorMonitorProps {
  currentO2: number | null;
  o2Readings: O2SensorReading[];
  frozenDuration?: number;
  className?: string;
}

export function O2SensorMonitor({
  currentO2,
  o2Readings,
  frozenDuration = 0,
  className,
}: O2SensorMonitorProps) {
  // Preparar dados para o gráfico (últimas 60 leituras)
  const chartData = useMemo(() => {
    const recentReadings = o2Readings.slice(-60);
    return recentReadings.map((reading, index) => ({
      index,
      voltage: reading.voltage,
      isLean: reading.isLean,
      isRich: reading.isRich,
      time: new Date(reading.timestamp).toLocaleTimeString('pt-BR', { 
        minute: '2-digit', 
        second: '2-digit' 
      }),
    }));
  }, [o2Readings]);
  
  // Determinar status da sonda
  const getO2Status = () => {
    if (currentO2 === null) {
      return { 
        status: 'waiting', 
        label: 'Aguardando...', 
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
        description: 'Lendo sensor O2...'
      };
    }
    
    // Verificar se está travado
    if (frozenDuration >= DEFAULT_FUEL_THRESHOLDS.o2FrozenDuration) {
      const isLean = currentO2 < DEFAULT_FUEL_THRESHOLDS.o2LeanThreshold;
      return {
        status: 'frozen',
        label: isLean ? 'Travado Pobre' : 'Travado Rico',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        description: `Sonda travada há ${frozenDuration.toFixed(0)}s - possível problema!`
      };
    }
    
    // Verificar faixa normal de oscilação
    if (currentO2 < DEFAULT_FUEL_THRESHOLDS.o2LeanThreshold) {
      return {
        status: 'lean',
        label: 'Pobre',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        description: 'Mistura pobre - menos combustível'
      };
    }
    
    if (currentO2 > DEFAULT_FUEL_THRESHOLDS.o2RichThreshold) {
      return {
        status: 'rich',
        label: 'Rica',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        description: 'Mistura rica - mais combustível'
      };
    }
    
    return {
      status: 'normal',
      label: 'Oscilando',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      description: 'Sonda funcionando normalmente'
    };
  };
  
  const o2Status = getO2Status();
  
  // Calcular estatísticas
  const stats = useMemo(() => {
    if (o2Readings.length === 0) {
      return { avg: null, min: null, max: null, oscillations: 0 };
    }
    
    const voltages = o2Readings.map(r => r.voltage);
    const avg = voltages.reduce((a, b) => a + b, 0) / voltages.length;
    const min = Math.min(...voltages);
    const max = Math.max(...voltages);
    
    // Contar oscilações (cruzamentos do ponto médio 0.45V)
    let oscillations = 0;
    let lastAboveMid = voltages[0] > 0.45;
    for (let i = 1; i < voltages.length; i++) {
      const aboveMid = voltages[i] > 0.45;
      if (aboveMid !== lastAboveMid) {
        oscillations++;
        lastAboveMid = aboveMid;
      }
    }
    
    return { avg, min, max, oscillations };
  }, [o2Readings]);

  return (
    <Card className={cn('border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Sensor O2 (Sonda Lambda)
          </span>
          <Badge 
            variant="outline" 
            className={cn('text-xs', o2Status.color, o2Status.bgColor)}
          >
            {o2Status.status === 'frozen' && (
              <AlertTriangle className="h-3 w-3 mr-1" />
            )}
            {o2Status.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Voltagem atual com indicador visual */}
        <div className="flex items-center gap-4">
          {/* Gauge visual */}
          <div className="flex-1 h-8 relative rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-green-500 to-orange-500">
            {/* Marcadores de zona */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/50"
              style={{ left: `${(DEFAULT_FUEL_THRESHOLDS.o2LeanThreshold / 1.275) * 100}%` }}
            />
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/50"
              style={{ left: `${(DEFAULT_FUEL_THRESHOLDS.o2RichThreshold / 1.275) * 100}%` }}
            />
            
            {/* Ponteiro */}
            {currentO2 !== null && (
              <div 
                className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg transition-all duration-300"
                style={{ left: `${Math.min((currentO2 / 1.275) * 100, 100)}%` }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
              </div>
            )}
          </div>
          
          {/* Valor numérico */}
          <div className="text-right min-w-[60px]">
            <div className={cn('text-xl font-mono font-bold', o2Status.color)}>
              {currentO2 !== null ? `${currentO2.toFixed(2)}V` : '--'}
            </div>
          </div>
        </div>
        
        {/* Descrição do status */}
        <p className="text-xs text-muted-foreground text-center">
          {o2Status.description}
        </p>
        
        {/* Gráfico de oscilação */}
        {chartData.length > 5 && (
          <div className="h-32 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                {/* Zona Rica (acima de 0.8V) */}
                <defs>
                  <linearGradient id="o2Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                
                <XAxis 
                  dataKey="index" 
                  tick={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  domain={[0, 1.0]}
                  ticks={[0.2, 0.45, 0.8]}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(v) => `${v}V`}
                />
                
                {/* Zonas de referência */}
                <ReferenceLine 
                  y={DEFAULT_FUEL_THRESHOLDS.o2LeanThreshold} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <ReferenceLine 
                  y={DEFAULT_FUEL_THRESHOLDS.o2RichThreshold} 
                  stroke="hsl(212 95% 60%)" 
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <ReferenceLine 
                  y={0.45} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="2 2"
                  strokeOpacity={0.3}
                />
                
                {/* Área preenchida */}
                <Area
                  type="monotone"
                  dataKey="voltage"
                  stroke="none"
                  fill="url(#o2Gradient)"
                />
                
                {/* Linha principal */}
                <Line
                  type="monotone"
                  dataKey="voltage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground">Mín</div>
            <div className="text-sm font-mono font-medium text-blue-500">
              {stats.min !== null ? `${stats.min.toFixed(2)}V` : '--'}
            </div>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground">Média</div>
            <div className="text-sm font-mono font-medium">
              {stats.avg !== null ? `${stats.avg.toFixed(2)}V` : '--'}
            </div>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground">Máx</div>
            <div className="text-sm font-mono font-medium text-orange-500">
              {stats.max !== null ? `${stats.max.toFixed(2)}V` : '--'}
            </div>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground">Osc.</div>
            <div className={cn(
              'text-sm font-mono font-medium',
              stats.oscillations > 5 ? 'text-green-500' : 'text-yellow-500'
            )}>
              {stats.oscillations}
            </div>
          </div>
        </div>
        
        {/* Legenda */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1 border-t">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Pobre (&lt;0.2V)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Normal
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            Rica (&gt;0.8V)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
