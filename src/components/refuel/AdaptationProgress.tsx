// Componente visual para exibir progresso de adaptação Flex
// Mostra quando a ECU está aprendendo novo combustível (Gasolina ↔ Etanol)

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, TrendingDown, Zap, Clock } from 'lucide-react';
import type { FuelAdaptationProgress, FuelChangeContext } from '@/types/fuelForensics';
import { FUEL_CONTEXT_LABELS } from '@/types/fuelForensics';
import { cn } from '@/lib/utils';

interface AdaptationProgressProps {
  progress: FuelAdaptationProgress;
  context: FuelChangeContext;
  stftCurrent: number;
  ltftDelta: number;
  className?: string;
}

export function AdaptationProgress({
  progress,
  context,
  stftCurrent,
  ltftDelta,
  className,
}: AdaptationProgressProps) {
  // Ícone baseado na direção
  const DirectionIcon = progress.actualDirection === 'positive' ? TrendingUp :
                        progress.actualDirection === 'negative' ? TrendingDown : Zap;
  
  // Verificar se direção está correta
  const isDirectionCorrect = progress.actualDirection === progress.expectedDirection ||
                             progress.actualDirection === 'neutral';
  
  // Formatar tempo restante
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Concluindo...';
    if (seconds < 60) return `~${Math.ceil(seconds)}s`;
    return `~${Math.ceil(seconds / 60)}min`;
  };
  
  // Status visual
  const getStatusColor = () => {
    if (progress.progressPercent >= 90) return 'text-green-500';
    if (progress.ltftAbsorbing) return 'text-blue-500';
    return 'text-yellow-500';
  };
  
  return (
    <Card className={cn(
      'border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/5 to-cyan-500/5',
      className
    )}>
      <CardContent className="pt-4 space-y-4">
        {/* Header com ícone animado */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-10 w-10 text-blue-500" />
            {/* Pulso de "pensando" */}
            <div className="absolute inset-0 animate-ping opacity-30">
              <Brain className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-blue-500">ECU Adaptando</h3>
            <p className="text-sm text-muted-foreground">
              Aprendendo novo combustível
            </p>
          </div>
          
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
            {FUEL_CONTEXT_LABELS[context]}
          </Badge>
        </div>
        
        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso da adaptação</span>
            <span className={cn('font-medium', getStatusColor())}>
              {Math.round(progress.progressPercent)}%
            </span>
          </div>
          
          <Progress 
            value={progress.progressPercent} 
            className="h-3"
          />
          
          {/* Tempo estimado */}
          {progress.estimatedTimeRemaining > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTimeRemaining(progress.estimatedTimeRemaining)}</span>
            </div>
          )}
        </div>
        
        {/* Métricas atuais */}
        <div className="grid grid-cols-2 gap-3">
          {/* STFT Atual */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <DirectionIcon className={cn('h-3 w-3', isDirectionCorrect ? 'text-blue-500' : 'text-yellow-500')} />
              STFT Atual
            </div>
            <div className={cn(
              'text-lg font-mono font-bold',
              isDirectionCorrect ? 'text-blue-500' : 'text-yellow-500'
            )}>
              {stftCurrent > 0 ? '+' : ''}{stftCurrent.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {progress.expectedDirection === 'positive' ? 'Esperado: subir' : 'Esperado: descer'}
            </div>
          </div>
          
          {/* LTFT Delta */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              {progress.ltftAbsorbing ? (
                <Zap className="h-3 w-3 text-green-500" />
              ) : (
                <Clock className="h-3 w-3 text-yellow-500" />
              )}
              LTFT Absorvendo
            </div>
            <div className={cn(
              'text-lg font-mono font-bold',
              progress.ltftAbsorbing ? 'text-green-500' : 'text-yellow-500'
            )}>
              {ltftDelta > 0 ? '+' : ''}{ltftDelta.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {progress.ltftAbsorbing ? 'ECU memorizando' : 'Aguardando...'}
            </div>
          </div>
        </div>
        
        {/* Explicação contextual */}
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <p className="text-sm text-blue-500/80">
            {context === 'gas_to_ethanol' ? (
              <>
                O etanol tem <strong>menos energia</strong> que a gasolina. 
                A ECU está aumentando a injeção (STFT sobe) para compensar. 
                Isso é <strong>normal</strong> e levará alguns quilômetros.
              </>
            ) : context === 'ethanol_to_gas' ? (
              <>
                A gasolina tem <strong>mais energia</strong> que o etanol. 
                A ECU está reduzindo a injeção (STFT desce) para compensar. 
                Isso é <strong>normal</strong> e levará alguns quilômetros.
              </>
            ) : (
              <>
                A ECU está ajustando a mistura ar-combustível. 
                Quando o STFT voltar para perto de 0% e o LTFT assumir, 
                a adaptação estará <strong>completa</strong>.
              </>
            )}
          </p>
        </div>
        
        {/* Status final */}
        {progress.progressPercent >= 90 && (
          <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Adaptação quase concluída!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
