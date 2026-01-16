/**
 * VisualMechanic - Container principal do diagnóstico visual
 * UX inclusiva para público leigo + modo offline + contexto do veículo
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CaptureButton } from './CaptureButton';
import { FileCapture } from './FileCapture';
import { MediaPreview } from './MediaPreview';
import { AnalysisProgress } from './AnalysisProgress';
import { DiagnosisCard } from './DiagnosisCard';
import { OfflineQueue } from './OfflineQueue';
import { ProcessedResults } from './ProcessedResults';
import { useVisualMechanic } from '@/hooks/useVisualMechanic';
import { useOfflineVision } from '@/hooks/useOfflineVision';
import { Eye, WifiOff, CloudOff, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VehicleContextForVision } from '@/types/visionTypes';

interface VisualMechanicProps {
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  vehicleContext?: VehicleContextForVision;
}

export function VisualMechanic({ onSpeak, isSpeaking, vehicleContext }: VisualMechanicProps) {
  const {
    isCapturing,
    isAnalyzing,
    mediaPreview,
    mediaFile,
    analysisType,
    result,
    error,
    progressMessage,
    startCapture,
    handleFileSelect,
    analyzeMedia,
    reset,
  } = useVisualMechanic();
  
  const {
    pendingItems,
    processedResults,
    isOnline,
    isSyncing,
    syncProgress,
    saveForLater,
    processQueue,
    removeFromQueue,
    clearProcessedResults,
    getItemPreview,
  } = useOfflineVision();
  
  // Verifica se tem veículo configurado
  const hasVehicle = vehicleContext && (vehicleContext.brand || vehicleContext.model);
  const vehicleDisplayName = hasVehicle 
    ? [
        vehicleContext.brand?.charAt(0).toUpperCase() + vehicleContext.brand?.slice(1),
        vehicleContext.model,
        vehicleContext.year
      ].filter(Boolean).join(' ')
    : null;
  
  // Salva foto para análise posterior quando offline
  const handleSaveForLater = async () => {
    if (mediaFile && analysisType) {
      await saveForLater(mediaFile, analysisType);
      reset();
    }
  };
  
  // Wrapper para análise com contexto do veículo
  const handleAnalyze = () => {
    analyzeMedia(vehicleContext);
  };
  
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
          
          {/* Vehicle badge - mostra veículo conectado */}
          {vehicleDisplayName && (
            <div className="flex items-center justify-center gap-2 mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20 w-fit mx-auto">
              <Car className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {vehicleDisplayName}
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Offline info - agora permite salvar para depois */}
          {!isOnline && !mediaPreview && (
            <Alert className="mb-4 border-amber-500/30 bg-amber-500/10">
              <CloudOff className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700">
                Modo offline: tire a foto agora e ela será analisada quando a conexão retornar.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error display */}
          {error && !result && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Initial state - Show capture buttons (agora funciona offline) */}
          {!isCapturing && !mediaPreview && !result && !isAnalyzing && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CaptureButton
                type="photo"
                onClick={() => startCapture('photo')}
              />
              <CaptureButton
                type="video"
                onClick={() => startCapture('video')}
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
          
          {/* Preview state - Show media preview com opção de salvar offline */}
          {mediaPreview && !result && !isAnalyzing && analysisType && (
            <div className="space-y-4">
              <MediaPreview
                mediaUrl={mediaPreview}
                analysisType={analysisType}
                onAnalyze={isOnline ? handleAnalyze : undefined}
                onRetry={() => startCapture(analysisType)}
                onCancel={reset}
                isAnalyzing={isAnalyzing}
              />
              
              {/* Botão para salvar offline quando não tem conexão */}
              {!isOnline && (
                <Button
                  onClick={handleSaveForLater}
                  className="w-full gap-2"
                  variant="secondary"
                >
                  <CloudOff className="h-4 w-4" />
                  Salvar para Analisar Depois
                </Button>
              )}
            </div>
          )}
          
          {/* Analyzing state - Show progress */}
          {isAnalyzing && (
            <AnalysisProgress message={progressMessage} />
          )}
        </CardContent>
      </Card>
      
      {/* Result card - Show diagnosis with vehicle context */}
      {result && (
        <DiagnosisCard
          result={result}
          mediaUrl={mediaPreview || undefined}
          vehicleContext={vehicleContext}
          onSpeak={onSpeak}
          onReset={reset}
          isSpeaking={isSpeaking}
        />
      )}
      
      {/* Fila de fotos offline pendentes */}
      {pendingItems.length > 0 && !result && !isAnalyzing && !mediaPreview && (
        <OfflineQueue
          items={pendingItems}
          isOnline={isOnline}
          isSyncing={isSyncing}
          syncProgress={syncProgress}
          onProcess={processQueue}
          onRemove={removeFromQueue}
          getPreview={getItemPreview}
        />
      )}
      
      {/* Histórico de diagnósticos offline processados */}
      {processedResults.length > 0 && !result && !isAnalyzing && !mediaPreview && (
        <ProcessedResults
          results={processedResults}
          onClear={clearProcessedResults}
          onSpeak={onSpeak}
        />
      )}
      
      {/* Tips for first-time users */}
      {!isCapturing && !mediaPreview && !result && !isAnalyzing && pendingItems.length === 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong>Dica:</strong> Fotografe luzes acesas no painel, 
              vazamentos, peças com aspecto estranho ou qualquer coisa que 
              você não reconheça. Nosso mecânico virtual vai explicar tudo!
              {hasVehicle && (
                <span className="block mt-1 text-primary">
                  Diagnóstico personalizado para seu {vehicleDisplayName}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VisualMechanic;
