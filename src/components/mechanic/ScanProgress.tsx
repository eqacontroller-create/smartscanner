import { Check, Loader2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export type ScanStep = {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
};

interface ScanProgressProps {
  steps: ScanStep[];
  elapsedTime: number;
}

export function ScanProgress({ steps, elapsedTime }: ScanProgressProps) {
  const completedSteps = steps.filter(s => s.status === 'done').length;
  const progress = (completedSteps / steps.length) * 100;
  const currentStep = steps.find(s => s.status === 'running');

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
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
