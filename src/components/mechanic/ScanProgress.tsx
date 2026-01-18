import { useState, useEffect } from 'react';
import { Check, Loader2, Circle, Fuel, Activity, Battery, Brain, Settings, Thermometer, Wind, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type ScanStep = {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
};

interface ScanProgressProps {
  steps: ScanStep[];
  elapsedTime: number;
}

// Mensagens narrativas que mudam a cada 2 segundos
const SCAN_NARRATIVES = [
  { message: 'Verificando sistema de injeção...', Icon: Fuel },
  { message: 'Consultando sensores de oxigênio...', Icon: Activity },
  { message: 'Validando voltagem da bateria...', Icon: Battery },
  { message: 'IA analisando padrões de risco...', Icon: Brain },
  { message: 'Verificando módulo de transmissão...', Icon: Settings },
  { message: 'Monitorando temperatura do motor...', Icon: Thermometer },
  { message: 'Analisando sistema de emissões...', Icon: Wind },
  { message: 'Checando sensores críticos...', Icon: Wrench },
];

export function ScanProgress({ steps, elapsedTime }: ScanProgressProps) {
  const [narrativeIndex, setNarrativeIndex] = useState(0);
  const completedSteps = steps.filter(s => s.status === 'done').length;
  const progress = (completedSteps / steps.length) * 100;
  const currentStep = steps.find(s => s.status === 'running');

  // Cicla mensagens narrativas a cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setNarrativeIndex(prev => (prev + 1) % SCAN_NARRATIVES.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const currentNarrative = SCAN_NARRATIVES[narrativeIndex];
  const NarrativeIcon = currentNarrative.Icon;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        {/* Mensagem Narrativa com animação */}
        <div 
          key={narrativeIndex}
          className={cn(
            "flex items-center gap-2 mb-3 p-2 rounded-lg bg-primary/10",
            "animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
          )}
        >
          <NarrativeIcon className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">
            {currentNarrative.message}
          </span>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {currentStep ? currentStep.label : 'Escaneando...'}
          </span>
          <span className="text-xs text-muted-foreground">
            {(elapsedTime / 1000).toFixed(1)}s
          </span>
        </div>

        <Progress value={progress} className="h-2 mb-3" />
        
        <div className="text-xs text-muted-foreground mb-3">
          {completedSteps} de {steps.length} etapas concluídas
        </div>
        
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-2 text-xs">
              {step.status === 'done' && (
                <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
              )}
              {step.status === 'running' && (
                <Loader2 className="h-3 w-3 text-primary animate-spin flex-shrink-0" />
              )}
              {step.status === 'pending' && (
                <Circle className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
              )}
              {step.status === 'error' && (
                <Circle className="h-3 w-3 text-destructive flex-shrink-0" />
              )}
              <span className={step.status === 'pending' ? 'text-muted-foreground/40' : 'text-muted-foreground'}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
