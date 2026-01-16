/**
 * VisualMechanic - Container principal do diagnóstico visual
 * UX inclusiva para público leigo
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CaptureButton } from './CaptureButton';
import { FileCapture } from './FileCapture';
import { MediaPreview } from './MediaPreview';
import { AnalysisProgress } from './AnalysisProgress';
import { DiagnosisCard } from './DiagnosisCard';
import { useVisualMechanic } from '@/hooks/useVisualMechanic';
import { Eye, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VisualMechanicProps {
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export function VisualMechanic({ onSpeak, isSpeaking }: VisualMechanicProps) {
  const {
    isCapturing,
    isAnalyzing,
    mediaPreview,
    analysisType,
    result,
    error,
    progressMessage,
    startCapture,
    handleFileSelect,
    analyzeMedia,
    reset,
  } = useVisualMechanic();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
            <Eye className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">
            O que está acontecendo?
          </CardTitle>
          <CardDescription className="text-base">
            Tire uma foto ou grave um vídeo curto e descubra o que significa
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Offline warning */}
          {!isOnline && (
            <Alert variant="destructive" className="mb-4">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                Sem conexão com a internet. Conecte-se para usar esta função.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error display */}
          {error && !result && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Initial state - Show capture buttons */}
          {!isCapturing && !mediaPreview && !result && !isAnalyzing && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CaptureButton
                type="photo"
                onClick={() => startCapture('photo')}
                disabled={!isOnline}
              />
              <CaptureButton
                type="video"
                onClick={() => startCapture('video')}
                disabled={!isOnline}
              />
            </div>
          )}
          
          {/* Capturing state - Show file picker */}
          {isCapturing && analysisType && (
            <FileCapture
              analysisType={analysisType}
              onFileSelect={handleFileSelect}
              onCancel={reset}
            />
          )}
          
          {/* Preview state - Show media preview */}
          {mediaPreview && !result && !isAnalyzing && analysisType && (
            <MediaPreview
              mediaUrl={mediaPreview}
              analysisType={analysisType}
              onAnalyze={analyzeMedia}
              onRetry={() => startCapture(analysisType)}
              onCancel={reset}
              isAnalyzing={isAnalyzing}
            />
          )}
          
          {/* Analyzing state - Show progress */}
          {isAnalyzing && (
            <AnalysisProgress message={progressMessage} />
          )}
        </CardContent>
      </Card>
      
      {/* Result card - Show diagnosis */}
      {result && (
        <DiagnosisCard
          result={result}
          mediaUrl={mediaPreview || undefined}
          onSpeak={onSpeak}
          onReset={reset}
          isSpeaking={isSpeaking}
        />
      )}
      
      {/* Tips for first-time users */}
      {!isCapturing && !mediaPreview && !result && !isAnalyzing && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong>Dica:</strong> Fotografe luzes acesas no painel, 
              vazamentos, peças com aspecto estranho ou qualquer coisa que 
              você não reconheça. Nosso mecânico virtual vai explicar tudo!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VisualMechanic;
