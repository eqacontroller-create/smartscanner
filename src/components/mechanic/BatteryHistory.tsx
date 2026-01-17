/**
 * Componente para exibir histórico de testes de bateria
 * Com gráfico de tendência e previsão de substituição
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Battery, 
  BatteryWarning, 
  BatteryFull, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  Trash2,
  Calendar,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useBatteryHistory } from '@/hooks/useBatteryHistory';
import { BatteryTestRecord, BatteryTrend } from '@/services/supabase/BatteryTestService';

// Trend badge component
function TrendBadge({ trend }: { trend: BatteryTrend['healthTrend'] }) {
  const config = {
    improving: { 
      icon: TrendingUp, 
      label: 'Melhorando', 
      variant: 'default' as const,
      className: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
    stable: { 
      icon: Minus, 
      label: 'Estável', 
      variant: 'secondary' as const,
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    declining: { 
      icon: TrendingDown, 
      label: 'Degradando', 
      variant: 'destructive' as const,
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    },
    critical: { 
      icon: AlertTriangle, 
      label: 'Crítico', 
      variant: 'destructive' as const,
      className: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
  };

  const { icon: Icon, label, className } = config[trend];

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

// Status badge for individual tests
function StatusBadge({ status }: { status: BatteryTestRecord['battery_status'] }) {
  const config = {
    excellent: { 
      icon: BatteryFull, 
      label: 'Excelente',
      className: 'bg-green-500/20 text-green-400'
    },
    good: { 
      icon: Battery, 
      label: 'Boa',
      className: 'bg-blue-500/20 text-blue-400'
    },
    weak: { 
      icon: BatteryWarning, 
      label: 'Fraca',
      className: 'bg-yellow-500/20 text-yellow-400'
    },
    critical: { 
      icon: AlertTriangle, 
      label: 'Crítica',
      className: 'bg-red-500/20 text-red-400'
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

// Chart tooltip
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(2)}V
        </p>
      ))}
    </div>
  );
}

// Trend analysis card
function TrendAnalysisCard({ trend }: { trend: BatteryTrend }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Análise de Tendência
          </CardTitle>
          <TrendBadge trend={trend.healthTrend} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Voltagem Média em Repouso</p>
            <p className="text-lg font-bold">{trend.averageRestingVoltage}V</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mínima Média na Partida</p>
            <p className="text-lg font-bold">{trend.averageMinCranking}V</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Declínio por Mês</p>
            <p className={`text-lg font-bold ${trend.voltageDeclinePerMonth > 0.1 ? 'text-yellow-400' : ''}`}>
              {trend.voltageDeclinePerMonth > 0 ? '-' : '+'}{Math.abs(trend.voltageDeclinePerMonth).toFixed(3)}V
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Previsão de Vida</p>
            <p className="text-lg font-bold flex items-center gap-1">
              {trend.estimatedMonthsRemaining !== null ? (
                <>
                  <Clock className="h-4 w-4" />
                  ~{trend.estimatedMonthsRemaining} meses
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Saudável
                </>
              )}
            </p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
          <p className="text-sm">{trend.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Test history item
function TestHistoryItem({ 
  test, 
  onDelete,
  expanded,
  onToggle
}: { 
  test: BatteryTestRecord;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-card/30 rounded-lg border border-border/50 overflow-hidden">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {format(new Date(test.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            {test.vehicle_brand && (
              <span className="text-xs text-muted-foreground mt-0.5">
                {test.vehicle_brand} {test.vehicle_model}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={test.battery_status} />
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/30 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/20 rounded p-2">
              <p className="text-xs text-muted-foreground">Repouso</p>
              <p className="font-bold">{test.resting_voltage.toFixed(2)}V</p>
            </div>
            <div className="bg-muted/20 rounded p-2">
              <p className="text-xs text-muted-foreground">Mínima</p>
              <p className={`font-bold ${test.min_cranking_voltage < 9.6 ? 'text-yellow-400' : ''}`}>
                {test.min_cranking_voltage.toFixed(2)}V
              </p>
            </div>
            <div className="bg-muted/20 rounded p-2">
              <p className="text-xs text-muted-foreground">Alternador</p>
              <p className="font-bold">
                {test.alternator_voltage ? `${test.alternator_voltage.toFixed(2)}V` : '-'}
              </p>
            </div>
          </div>

          {test.battery_message && (
            <p className="text-xs text-muted-foreground">{test.battery_message}</p>
          )}

          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Remover
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover teste?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O teste será removido permanentemente do histórico.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(test.id)}>
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading skeleton
function HistorySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[200px] w-full" />
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

// Main component
export function BatteryHistory() {
  const { tests, trend, loading, deleteTest } = useBatteryHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return <HistorySkeleton />;
  }

  if (tests.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-8 text-center">
          <Battery className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">Nenhum teste salvo</h3>
          <p className="text-sm text-muted-foreground">
            Execute o teste de bateria e salve os resultados para acompanhar a saúde ao longo do tempo.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data (most recent 10 tests, reversed for chronological order)
  const chartData = tests
    .slice(0, 10)
    .reverse()
    .map(test => ({
      date: format(new Date(test.created_at), 'dd/MM', { locale: ptBR }),
      restingVoltage: test.resting_voltage,
      minCranking: test.min_cranking_voltage,
      alternator: test.alternator_voltage || null,
    }));

  return (
    <div className="space-y-4">
      {/* Trend Analysis */}
      {trend && <TrendAnalysisCard trend={trend} />}

      {/* Voltage Chart */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Evolução da Voltagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorResting" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  domain={[8, 15]} 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `${v}V`}
                />
                <Tooltip content={<ChartTooltip />} />
                
                {/* Reference lines for thresholds */}
                <ReferenceLine y={12.6} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={9.6} stroke="#eab308" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={9.0} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                
                <Area 
                  type="monotone" 
                  dataKey="restingVoltage" 
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorResting)" 
                  name="Repouso"
                />
                <Line 
                  type="monotone" 
                  dataKey="minCranking" 
                  stroke="#eab308" 
                  strokeWidth={2}
                  dot={{ fill: '#eab308', strokeWidth: 0, r: 3 }}
                  name="Mín. Partida"
                />
                <Line 
                  type="monotone" 
                  dataKey="alternator" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                  name="Alternador"
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500 rounded" />
              <span className="text-muted-foreground">Repouso</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-yellow-500 rounded" />
              <span className="text-muted-foreground">Mín. Partida</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-blue-500 rounded" />
              <span className="text-muted-foreground">Alternador</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test History List */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Histórico de Testes
            </span>
            <Badge variant="secondary">{tests.length} testes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-2">
              {tests.map(test => (
                <TestHistoryItem
                  key={test.id}
                  test={test}
                  onDelete={deleteTest}
                  expanded={expandedId === test.id}
                  onToggle={() => setExpandedId(expandedId === test.id ? null : test.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
