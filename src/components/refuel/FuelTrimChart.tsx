// Gráfico de Fuel Trim ao longo da distância

import { useMemo } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
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

interface FuelTrimChartProps {
  data: Array<{ timestamp: number; stft: number; ltft: number; distance: number }>;
  warningThreshold: number;
}

export function FuelTrimChart({ data, warningThreshold }: FuelTrimChartProps) {
  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    return data.map((sample, index) => ({
      index,
      distance: sample.distance.toFixed(2),
      stft: sample.stft,
      ltft: sample.ltft,
    }));
  }, [data]);
  
  // Pegar apenas a cada N pontos para performance
  const sampledData = useMemo(() => {
    if (chartData.length <= 50) return chartData;
    const step = Math.ceil(chartData.length / 50);
    return chartData.filter((_, i) => i % step === 0);
  }, [chartData]);
  
  const chartConfig = {
    stft: {
      label: 'STFT',
      color: 'hsl(var(--primary))',
    },
    ltft: {
      label: 'LTFT',
      color: 'hsl(var(--muted-foreground))',
    },
  };
  
  return (
    <div className="h-[100px] sm:h-[120px] md:h-[140px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ComposedChart data={sampledData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="stftGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <XAxis 
            dataKey="distance" 
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[-30, 30]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          
          {/* Linhas de threshold */}
          <ReferenceLine 
            y={warningThreshold} 
            stroke="hsl(var(--destructive))" 
            strokeDasharray="3 3" 
            strokeOpacity={0.5}
          />
          <ReferenceLine 
            y={-warningThreshold} 
            stroke="hsl(var(--destructive))" 
            strokeDasharray="3 3" 
            strokeOpacity={0.5}
          />
          <ReferenceLine 
            y={0} 
            stroke="hsl(var(--muted-foreground))" 
            strokeOpacity={0.3}
          />
          
          <ChartTooltip
            content={
              <ChartTooltipContent 
                formatter={(value, name) => [
                  `${Number(value) > 0 ? '+' : ''}${value}%`,
                  name === 'stft' ? 'STFT' : 'LTFT'
                ]}
              />
            }
          />
          
          {/* Área do STFT */}
          <Area
            type="monotone"
            dataKey="stft"
            stroke="none"
            fill="url(#stftGradient)"
          />
          
          {/* Linha STFT */}
          <Line
            type="monotone"
            dataKey="stft"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          
          {/* Linha LTFT */}
          <Line
            type="monotone"
            dataKey="ltft"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
