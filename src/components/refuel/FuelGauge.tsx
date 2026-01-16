// Gauge visual para valores de Fuel Trim (STFT/LTFT)

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FuelGaugeProps {
  label: string;
  sublabel?: string;
  value: number | null;
  status: 'success' | 'warning' | 'danger' | 'muted';
  statusText: string;
  trend?: 'up' | 'down' | 'neutral';
  thresholds: {
    warning: number;
    critical: number;
  };
}

export function FuelGauge({
  label,
  sublabel,
  value,
  status,
  statusText,
  trend = 'neutral',
  thresholds,
}: FuelGaugeProps) {
  const colors = {
    success: {
      text: 'text-green-500',
      bg: 'bg-green-500',
      bgLight: 'bg-green-500/10',
      border: 'border-green-500/30',
    },
    warning: {
      text: 'text-yellow-500',
      bg: 'bg-yellow-500',
      bgLight: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
    },
    danger: {
      text: 'text-red-500',
      bg: 'bg-red-500',
      bgLight: 'bg-red-500/10',
      border: 'border-red-500/30',
    },
    muted: {
      text: 'text-muted-foreground',
      bg: 'bg-muted-foreground',
      bgLight: 'bg-muted/50',
      border: 'border-muted-foreground/30',
    },
  };

  const currentColors = colors[status];
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Calcular posição da barra (0 = centro, -30 a +30 = range)
  const barPosition = value !== null ? Math.min(Math.abs(value), 30) / 30 * 50 : 0;
  const barDirection = value !== null && value < 0 ? 'right' : 'left';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'p-3 rounded-xl border transition-all duration-300',
            currentColors.bgLight,
            currentColors.border
          )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold text-foreground">{label}</span>
                {sublabel && (
                  <span className="text-[10px] text-muted-foreground block">{sublabel}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <TrendIcon className={cn('h-3 w-3', currentColors.text)} />
                <span className={cn('text-[10px] font-medium', currentColors.text)}>
                  {statusText}
                </span>
              </div>
            </div>

            {/* Value */}
            <div className={cn(
              'text-2xl font-mono font-bold mb-2 transition-colors flex items-center gap-2',
              currentColors.text
            )}>
              {value !== null ? (
                `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
              ) : (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-lg">--</span>
                </span>
              )}
            </div>

            {/* Visual Bar */}
            <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
              {/* Center line */}
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-foreground/20 z-10" />
              
              {/* Warning zones */}
              <div 
                className="absolute inset-y-0 left-0 bg-yellow-500/20"
                style={{ width: `${(1 - thresholds.warning / 30) * 50}%` }}
              />
              <div 
                className="absolute inset-y-0 right-0 bg-yellow-500/20"
                style={{ width: `${(1 - thresholds.warning / 30) * 50}%` }}
              />
              
              {/* Value bar */}
              {value !== null && (
                <div 
                  className={cn(
                    'absolute inset-y-0 transition-all duration-500 rounded-full',
                    currentColors.bg,
                    barDirection === 'left' ? 'left-1/2' : 'right-1/2'
                  )}
                  style={{ 
                    width: `${barPosition}%`,
                  }}
                />
              )}

              {/* Threshold markers */}
              <div 
                className="absolute inset-y-0 w-px bg-yellow-500/50"
                style={{ left: `${50 + (thresholds.warning / 30 * 50)}%` }}
              />
              <div 
                className="absolute inset-y-0 w-px bg-yellow-500/50"
                style={{ left: `${50 - (thresholds.warning / 30 * 50)}%` }}
              />
            </div>

            {/* Scale labels */}
            <div className="flex justify-between mt-1 text-[8px] text-muted-foreground">
              <span>-30%</span>
              <span>0</span>
              <span>+30%</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <p className="text-xs">
            <strong>{label}</strong>: {sublabel}
            <br />
            <span className="text-muted-foreground">
              Valor normal: -10% a +10%
              <br />
              Alerta: ±{thresholds.warning}%
              <br />
              Crítico: ±{thresholds.critical}%
            </span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
