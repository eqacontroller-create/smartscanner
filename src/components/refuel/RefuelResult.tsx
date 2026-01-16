// Card de resultado final da análise de combustível
// Suporta dois fluxos: Abastecimento completo e Teste Rápido

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Fuel,
  TrendingUp,
  TrendingDown,
  Gauge,
  X,
  FlaskConical
} from 'lucide-react';
import { RefuelEntry, RefuelFlowType, getQualityLabel } from '@/types/refuelTypes';
import { formatCurrency } from '@/types/tripSettings';
import { cn } from '@/lib/utils';
import { TankLevelCheck } from './TankLevelCheck';

interface RefuelResultProps {
  refuel: Partial<RefuelEntry>;
  flowType?: RefuelFlowType | null;
  onClose: () => void;
}

export function RefuelResult({ refuel, flowType, onClose }: RefuelResultProps) {
  const quality = refuel.quality || 'unknown';
  const isQuickTest = flowType === 'quick-test';
  
  // Ícone e cor baseados na qualidade
  const getQualityVisual = () => {
    switch (quality) {
      case 'ok':
        return {
          Icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/50',
        };
      case 'warning':
        return {
          Icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/50',
        };
      case 'critical':
        return {
          Icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/50',
        };
      default:
        return {
          Icon: Fuel,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-muted',
        };
    }
  };
  
  const visual = getQualityVisual();
  const Icon = visual.Icon;
  
  return (
    <Card className={cn('border-2', visual.borderColor)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {isQuickTest ? (
              <FlaskConical className="h-5 w-5 text-blue-500" />
            ) : (
              <Fuel className="h-5 w-5 text-primary" />
            )}
            {isQuickTest ? 'Resultado do Teste' : 'Resultado da Análise'}
            {isQuickTest && (
              <Badge variant="secondary" className="text-xs">Teste Rápido</Badge>
            )}
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status principal */}
        <div className={cn('p-4 rounded-lg flex flex-col items-center gap-2', visual.bgColor)}>
          <Icon className={cn('h-12 w-12', visual.color)} />
          <span className={cn('text-lg font-bold', visual.color)}>
            {getQualityLabel(quality)}
          </span>
        </div>
        
        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3">
          {/* STFT Médio */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {(refuel.stftAverage || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              STFT Médio
            </div>
            <div className={cn(
              'text-xl font-mono font-bold',
              Math.abs(refuel.stftAverage || 0) <= 10 ? 'text-green-500' :
              Math.abs(refuel.stftAverage || 0) <= 15 ? 'text-yellow-500' : 'text-red-500'
            )}>
              {refuel.stftAverage !== undefined 
                ? `${refuel.stftAverage > 0 ? '+' : ''}${refuel.stftAverage.toFixed(1)}%`
                : '--'
              }
            </div>
          </div>
          
          {/* Distância Monitorada */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              Distância Analisada
            </div>
            <div className="text-xl font-mono font-bold">
              {refuel.distanceMonitored?.toFixed(1) || '0'} km
            </div>
          </div>
        </div>
        
        {/* Verificação da Bomba - Card Completo (apenas para abastecimento) */}
        {!isQuickTest && refuel.fuelLevelBefore !== null && 
         refuel.fuelLevelBefore !== undefined &&
         refuel.fuelLevelAfter !== null && 
         refuel.fuelLevelAfter !== undefined && 
         refuel.litersAdded && 
         refuel.tankCapacity && (
          <TankLevelCheck
            fuelLevelBefore={refuel.fuelLevelBefore}
            fuelLevelAfter={refuel.fuelLevelAfter}
            litersAdded={refuel.litersAdded}
            tankCapacity={refuel.tankCapacity}
          />
        )}
        
        {/* Fallback: Mostrar apenas precisão quando não há dados de nível completos (apenas para abastecimento) */}
        {!isQuickTest && refuel.pumpAccuracyPercent !== undefined && 
         (refuel.fuelLevelBefore === null || refuel.fuelLevelBefore === undefined ||
          refuel.fuelLevelAfter === null || refuel.fuelLevelAfter === undefined) && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              Verificação da Bomba
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Precisão estimada:</span>
              <Badge variant={refuel.pumpAccuracyPercent >= 90 ? 'default' : 'destructive'}>
                {refuel.pumpAccuracyPercent}%
              </Badge>
            </div>
          </div>
        )}
        
        {/* Detalhes da anomalia */}
        {refuel.anomalyDetected && refuel.anomalyDetails && (
          <div className={cn('p-3 rounded-lg', visual.bgColor)}>
            <p className="text-sm">{refuel.anomalyDetails}</p>
          </div>
        )}
        
        {/* Recomendação */}
        <div className="text-center text-sm text-muted-foreground">
          {quality === 'ok' && 'Combustível dentro dos parâmetros normais.'}
          {quality === 'warning' && 'Considere abastecer em outro posto no próximo tanque.'}
          {quality === 'critical' && 'Recomendado trocar de posto imediatamente.'}
        </div>
        
        {/* Dados do abastecimento (apenas para fluxo completo) */}
        {!isQuickTest && (refuel.litersAdded ?? 0) > 0 && (
          <div className="pt-2 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {refuel.litersAdded?.toFixed(1)}L a {formatCurrency(refuel.pricePerLiter || 0)}/L
            </span>
            <span className="font-medium text-primary">
              {formatCurrency(refuel.totalPaid || 0)}
            </span>
          </div>
        )}
        
        {/* Nota para teste rápido */}
        {isQuickTest && (
          <div className="pt-2 border-t text-center text-xs text-muted-foreground">
            Este teste não foi salvo no histórico
          </div>
        )}
        
        {/* Botão fechar */}
        <Button onClick={onClose} className="w-full">
          Concluído
        </Button>
      </CardContent>
    </Card>
  );
}
