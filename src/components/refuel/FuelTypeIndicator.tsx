// Indicador visual do tipo de combustível detectado via LTFT

import { Badge } from '@/components/ui/badge';
import { Fuel, Leaf, FlaskConical, HelpCircle } from 'lucide-react';
import type { FuelTypeDetection } from '@/types/fuelForensics';
import { 
  INFERRED_FUEL_LABELS, 
  INFERRED_FUEL_COLORS,
  INFERRED_FUEL_BG_COLORS 
} from '@/types/fuelForensics';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FuelTypeIndicatorProps {
  detection: FuelTypeDetection | null | undefined;
  showPercentage?: boolean;
  compact?: boolean;
}

export function FuelTypeIndicator({ 
  detection, 
  showPercentage = true, 
  compact = false 
}: FuelTypeIndicatorProps) {
  if (!detection || detection.inferredType === 'unknown') {
    return null;
  }
  
  const getIcon = () => {
    switch (detection.inferredType) {
      case 'gasoline': 
        return <Fuel className="h-4 w-4" />;
      case 'gasoline_e27': 
        return <Fuel className="h-4 w-4" />;
      case 'ethanol_mix': 
        return <FlaskConical className="h-4 w-4" />;
      case 'ethanol_pure': 
        return <Leaf className="h-4 w-4" />;
      default: 
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getBorderColor = () => {
    switch (detection.inferredType) {
      case 'gasoline': return 'border-amber-500/50';
      case 'gasoline_e27': return 'border-orange-500/50';
      case 'ethanol_mix': return 'border-green-500/50';
      case 'ethanol_pure': return 'border-emerald-500/50';
      default: return 'border-muted';
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center gap-2 p-2 rounded-lg border',
            INFERRED_FUEL_BG_COLORS[detection.inferredType],
            getBorderColor()
          )}>
            <span className={cn('shrink-0', INFERRED_FUEL_COLORS[detection.inferredType])}>
              {getIcon()}
            </span>
            <div className={compact ? 'hidden' : 'flex-1 min-w-0'}>
              <div className={cn('text-sm font-medium truncate', INFERRED_FUEL_COLORS[detection.inferredType])}>
                {INFERRED_FUEL_LABELS[detection.inferredType]}
              </div>
              {showPercentage && (
                <div className="text-xs text-muted-foreground">
                  ~{detection.estimatedEthanolPercent}% etanol
                </div>
              )}
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {detection.confidence === 'high' ? 'Alta' : 
               detection.confidence === 'medium' ? 'Média' : 'Baixa'}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px]">
          <p className="text-xs">{detection.reason}</p>
          <p className="text-xs text-muted-foreground mt-1">
            LTFT: {detection.ltftValue > 0 ? '+' : ''}{detection.ltftValue.toFixed(1)}%
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
