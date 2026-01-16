/**
 * MediaPreview - Preview da imagem/vídeo capturado
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, RotateCcw, Sparkles } from 'lucide-react';
import type { AnalysisType } from '@/types/visionTypes';

interface MediaPreviewProps {
  mediaUrl: string;
  analysisType: AnalysisType;
  onAnalyze: () => void;
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
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Media display */}
        <div className="relative aspect-video bg-muted">
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
          
          {/* Cancel button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={onCancel}
            disabled={isAnalyzing}
            className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur-sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Action buttons */}
        <div className="p-4 flex gap-3">
          <Button
            variant="outline"
            onClick={onRetry}
            disabled={isAnalyzing}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Tirar outra
          </Button>
          
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="flex-1"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analisando...' : 'Analisar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
