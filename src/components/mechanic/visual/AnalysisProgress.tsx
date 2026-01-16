/**
 * AnalysisProgress - Loading animado com mensagens tranquilizadoras
 */

import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Wrench } from 'lucide-react';

interface AnalysisProgressProps {
  message: string;
}

export function AnalysisProgress({ message }: AnalysisProgressProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Animated icon */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative p-4 rounded-full bg-primary/10">
              <Wrench className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          
          {/* Spinner and message */}
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground animate-pulse">
              {message}
            </p>
          </div>
          
          {/* Reassuring text */}
          <p className="text-sm text-muted-foreground max-w-xs">
            Nosso mecânico virtual está analisando com cuidado. 
            Isso pode levar alguns segundos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
