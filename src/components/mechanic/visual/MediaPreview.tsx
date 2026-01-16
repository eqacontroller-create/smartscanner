/**
 * MediaPreview - Preview premium da imagem/vídeo capturado
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisType } from '@/types/visionTypes';

interface MediaPreviewProps {
  mediaUrl: string;
  analysisType: AnalysisType;
  onAnalyze?: () => void;
  onRetry: () => void;
  onCancel: () => void;
  isAnalyzing: boolean;
}

export function MediaPreview({
  mediaUrl,
  analysisType,
  onAnalyze,
  onRetry,
  onCancel,
  isAnalyzing,
}: MediaPreviewProps) {
  return (
    <Card className="overflow-hidden border-2 border-border/50 bg-card/80 backdrop-blur-sm animate-scale-in">
      <CardContent className="p-0">
        {/* Media display with viewfinder */}
        <div className="relative aspect-video bg-black/90">
          {analysisType === 'video' ? (
            <video
              src={mediaUrl}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Prévia da foto"
              className="w-full h-full object-contain"
            />
          )}
          
          {/* Viewfinder corners */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/70 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary/70 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/70 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/70 rounded-br-lg" />
          </div>
          
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          
          {/* Cancel button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={onCancel}
            disabled={isAnalyzing}
            className="absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Action buttons */}
        <div className="p-4 flex gap-3 bg-gradient-to-t from-card to-card/80">
          <Button
            variant="outline"
            onClick={onRetry}
            disabled={isAnalyzing}
            className="flex-1 gap-2 h-11 rounded-xl border-2 hover:bg-secondary/50"
          >
            <RotateCcw className="h-4 w-4" />
            Tirar outra
          </Button>
          
          {onAnalyze && (
            <Button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className={cn(
                'flex-1 gap-2 h-11 rounded-xl',
                'bg-primary hover:bg-primary/90',
                'shadow-[0_0_20px_-5px] shadow-primary/40',
                'hover:shadow-[0_0_30px_-5px] hover:shadow-primary/50',
                'transition-all duration-200'
              )}
            >
              <Sparkles className={cn('h-4 w-4', isAnalyzing && 'animate-spin')} />
              {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
