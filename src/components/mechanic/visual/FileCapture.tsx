/**
 * FileCapture - Componente para captura de arquivo via input
 */

import { useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Video, Upload, X } from 'lucide-react';
import type { AnalysisType } from '@/types/visionTypes';

interface FileCaptureProps {
  analysisType: AnalysisType;
  onFileSelect: (file: File) => void;
  onCancel: () => void;
}

export function FileCapture({ analysisType, onFileSelect, onCancel }: FileCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const isVideo = analysisType === 'video';
  const accept = isVideo ? 'video/*' : 'image/*';
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);
  
  const openFilePicker = () => {
    inputRef.current?.click();
  };
  
  const openCamera = () => {
    cameraInputRef.current?.click();
  };
  
  return (
    <Card className="border-2 border-dashed border-primary/30">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          <div className="p-4 rounded-full bg-primary/10">
            {isVideo ? (
              <Video className="h-10 w-10 text-primary" />
            ) : (
              <Camera className="h-10 w-10 text-primary" />
            )}
          </div>
          
          {/* Title */}
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-lg">
              {isVideo ? 'Grave um vídeo do motor' : 'Tire uma foto'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isVideo 
                ? 'Vídeo curto de até 10 segundos do motor funcionando'
                : 'Foto da luz do painel ou peça do motor'
              }
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Button onClick={openCamera} className="flex-1 gap-2">
              {isVideo ? <Video className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              {isVideo ? 'Gravar agora' : 'Tirar foto'}
            </Button>
            
            <Button variant="outline" onClick={openFilePicker} className="flex-1 gap-2">
              <Upload className="h-4 w-4" />
              Da galeria
            </Button>
          </div>
          
          {/* Cancel button */}
          <Button variant="ghost" onClick={onCancel} className="gap-2 text-muted-foreground">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          
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
            capture={isVideo ? 'environment' : 'environment'}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
