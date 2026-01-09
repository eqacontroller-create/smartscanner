import { Check, Loader2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Escaneando...</span>
          <span className="text-xs text-muted-foreground">
            {(elapsedTime / 1000).toFixed(1)}s
          </span>
        </div>
        
        <div className="space-y-2">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-2 text-sm">
              {step.status === 'done' && (
                <Check className="h-4 w-4 text-green-500" />
              )}
              {step.status === 'running' && (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              )}
              {step.status === 'pending' && (
                <Circle className="h-4 w-4 text-muted-foreground/50" />
              )}
              {step.status === 'error' && (
                <Circle className="h-4 w-4 text-destructive" />
              )}
              <span className={step.status === 'pending' ? 'text-muted-foreground/50' : ''}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
