import { Card, CardContent } from '@/components/ui/card';
import { Gauge } from 'lucide-react';

interface RPMCardProps {
  value: number | null;
  isReading: boolean;
}

export function RPMCard({ value, isReading }: RPMCardProps) {
  const displayValue = value !== null ? value.toLocaleString() : '---';

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Gauge className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rotação do Motor</p>
              <p className="text-xs text-muted-foreground/70">PID: 010C</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-bold tracking-tight ${isReading ? 'animate-pulse' : ''} ${value !== null ? 'text-primary neon-glow' : 'text-muted-foreground'}`}>
              {displayValue}
            </p>
            <p className="text-sm text-muted-foreground">RPM</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
