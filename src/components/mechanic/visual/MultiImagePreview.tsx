/**
 * MultiImagePreview - Grid premium para preview de múltiplas imagens
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, RotateCcw, Sparkles, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_IMAGES } from '@/types/visionTypes';

interface MultiImagePreviewProps {
  files: File[];
  previews: string[];
  onRemove: (index: number) => void;
  onAddMore: () => void;
  onAnalyze: () => void;
  onReset: () => void;
  canAddMore: boolean;
  isAnalyzing: boolean;
  isOnline: boolean;
}

export function MultiImagePreview({
  files,
  previews,
  onRemove,
  onAddMore,
  onAnalyze,
  onReset,
  canAddMore,
  isAnalyzing,
  isOnline,
}: MultiImagePreviewProps) {
  return (
    <Card className="overflow-hidden border-2 border-border/50 bg-card/80 backdrop-blur-sm animate-scale-in">
      <CardContent className="p-4 space-y-4">
        {/* Image counter badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm">
              <span className="font-semibold text-foreground">{files.length}/{MAX_IMAGES}</span>
              <span className="text-muted-foreground ml-1">fotos</span>
            </div>
          </div>
          
          {canAddMore && (
            <p className="text-xs text-muted-foreground animate-fade-in">
              Adicione mais ângulos para diagnóstico mais preciso
            </p>
          )}
        </div>
        
        {/* Image grid - 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {previews.map((preview, index) => (
            <div 
              key={index} 
              className={cn(
                'relative aspect-square rounded-xl overflow-hidden border-2 bg-black/90',
                index === 0 ? 'border-primary/50' : 'border-border/50',
                'animate-scale-in'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <img
                src={preview}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Primary badge for first image */}
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                  Principal
                </div>
              )}
              
              {/* Photo number */}
              {index > 0 && (
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-xs font-medium">{index + 1}</span>
                </div>
              )}
              
              {/* Viewfinder corners */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary/50 rounded-tl" />
                <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary/50 rounded-tr" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/50 rounded-bl" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/50 rounded-br" />
              </div>
              
              {/* Remove button */}
              <Button
                variant="secondary"
                size="icon"
                onClick={() => onRemove(index)}
                disabled={isAnalyzing}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          
          {/* Add more button - shows when can add */}
          {canAddMore && (
            <button
              onClick={onAddMore}
              disabled={isAnalyzing}
              className={cn(
                'aspect-square rounded-xl border-2 border-dashed border-primary/30',
                'flex flex-col items-center justify-center gap-2',
                'bg-primary/5 hover:bg-primary/10 transition-colors',
                'text-primary/70 hover:text-primary',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'animate-fade-in'
              )}
            >
              <Plus className="h-8 w-8" />
              <span className="text-sm font-medium">Adicionar</span>
            </button>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={isAnalyzing}
            className="flex-1 gap-2 h-11 rounded-xl border-2 hover:bg-secondary/50"
          >
            <RotateCcw className="h-4 w-4" />
            Recomeçar
          </Button>
          
          {isOnline && (
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
              {isAnalyzing ? 'Analisando...' : `Analisar ${files.length} foto${files.length > 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
