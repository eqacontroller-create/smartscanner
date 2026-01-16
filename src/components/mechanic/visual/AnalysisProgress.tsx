/**
 * AnalysisProgress - Loading premium com animação de brain scan
 */

import { Card, CardContent } from '@/components/ui/card';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisProgressProps {
  message: string;
}

export function AnalysisProgress({ message }: AnalysisProgressProps) {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full bg-primary/10 blur-3xl animate-pulse" />
      </div>
      
      <CardContent className="relative p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Animated brain icon with waves */}
          <div className="relative">
            {/* Expanding rings */}
            <div className="absolute inset-[-12px] rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-[-24px] rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
            <div className="absolute inset-[-36px] rounded-full border border-primary/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.6s' }} />
            
            {/* Circular progress */}
            <svg className="absolute inset-[-16px] w-[calc(100%+32px)] h-[calc(100%+32px)] -rotate-90">
              <circle 
                className="stroke-primary/10" 
                strokeWidth="3" 
                fill="transparent" 
                r="48" 
                cx="50%" 
                cy="50%" 
              />
              <circle 
                className="stroke-primary animate-dash" 
                strokeWidth="3" 
                fill="transparent" 
                r="48" 
                cx="50%" 
                cy="50%"
                strokeDasharray="301"
                strokeLinecap="round"
              />
            </svg>
            
            {/* Central icon */}
            <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Brain className="h-12 w-12 text-primary animate-pulse drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]" />
            </div>
          </div>
          
          {/* Message with smooth transition */}
          <div className="space-y-3 max-w-xs">
            <p className="text-lg font-semibold text-foreground animate-pulse">
              {message}
            </p>
            <p className="text-sm text-muted-foreground">
              Nosso mecânico virtual está analisando com cuidado. 
              Isso pode levar alguns segundos.
            </p>
          </div>
          
          {/* Animated dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full bg-primary',
                  'animate-bounce'
                )}
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
