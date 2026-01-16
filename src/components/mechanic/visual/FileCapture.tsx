/**
 * FileCapture - Componente premium para captura de arquivo
 */

import { useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Video, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisType } from '@/types/visionTypes';

interface FileCaptureProps {
  analysisType: AnalysisType;
  onFileSelect: (file: File) => void;
  onCancel: () => void;
  isAddingMore?: boolean;
}

export function FileCapture({ analysisType, onFileSelect, onCancel, isAddingMore }: FileCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const isVideo = analysisType === 'video';
  const accept = isVideo ? 'video/*' : 'image/*';
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input value to allow selecting same file again
    e.target.value = '';
  }, [onFileSelect]);
  
  const openFilePicker = () => {
    inputRef.current?.click();
  };
  
  const openCamera = () => {
    cameraInputRef.current?.click();
  };
  
  return (
    <Card className="relative overflow-hidden border-2 border-dashed border-primary/30 bg-card/50 backdrop-blur-sm animate-scale-in">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      <CardContent className="relative p-8">
        <div className="flex flex-col items-center gap-5">
          {/* Animated icon with rings */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-[-8px] rounded-full border border-primary/10" />
            <div className="absolute inset-[-16px] rounded-full border border-primary/5" />
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              {isVideo ? (
                <Video className="h-10 w-10 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
              ) : (
                <Camera className="h-10 w-10 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
              )}
            </div>
          </div>
          
          {/* Title */}
          <div className="text-center space-y-2">
            <h3 className="font-bold text-xl text-foreground">
              {isAddingMore 
                ? 'Adicionar mais uma foto'
                : isVideo 
                  ? 'Grave um vídeo do motor' 
                  : 'Tire uma foto'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {isAddingMore
                ? 'Foto de outro ângulo para diagnóstico mais preciso'
                : isVideo 
                  ? 'Vídeo curto de até 10 segundos do motor funcionando'
                  : 'Foto da luz do painel ou peça do motor'
              }
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Button 
              onClick={openCamera} 
              className={cn(
                'flex-1 gap-2.5 h-12 rounded-xl',
                'bg-primary hover:bg-primary/90',
                'shadow-[0_0_20px_-5px] shadow-primary/40',
                'transition-all duration-200',
                'hover:shadow-[0_0_30px_-5px] hover:shadow-primary/50'
              )}
            >
              {isVideo ? <Video className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              <span className="font-medium">{isVideo ? 'Gravar agora' : 'Tirar foto'}</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={openFilePicker} 
              className="flex-1 gap-2.5 h-12 rounded-xl border-2 hover:bg-secondary/50"
            >
              <Upload className="h-5 w-5" />
              <span className="font-medium">Da galeria</span>
            </Button>
          </div>
          
          {/* Cancel button - only show if not adding more */}
          {!isAddingMore && (
            <Button 
              variant="ghost" 
              onClick={onCancel} 
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          )}
          
          {/* Back button when adding more */}
          {isAddingMore && (
            <Button 
              variant="ghost" 
              onClick={onCancel} 
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              Voltar para as fotos
            </Button>
          )}
          
          {/* Hidden inputs */}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          
          {/* Camera capture input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept={accept}
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
