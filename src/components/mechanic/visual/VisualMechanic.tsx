/**
 * VisualMechanic - Container principal do diagnóstico visual
 * UX premium inclusiva para público leigo + modo offline + contexto do veículo + histórico
 * Suporta múltiplas imagens para diagnóstico mais preciso
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaptureButton } from './CaptureButton';
import { FileCapture } from './FileCapture';
import { MediaPreview } from './MediaPreview';
import { MultiImagePreview } from './MultiImagePreview';
import { AnalysisProgress } from './AnalysisProgress';
import { DiagnosisCard } from './DiagnosisCard';
import { OfflineQueue } from './OfflineQueue';
import { ProcessedResults } from './ProcessedResults';
import { DiagnosisHistory } from './DiagnosisHistory';
import { useVisualMechanic } from '@/hooks/useVisualMechanic';
import { useOfflineVision } from '@/hooks/useOfflineVision';
import { useDiagnosisHistory } from '@/hooks/useDiagnosisHistory';
import { useAuth } from '@/hooks/useAuth';
import { Eye, WifiOff, CloudOff, Car, Camera, History, Sparkles, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VehicleContextForVision } from '@/types/visionTypes';
import { MAX_IMAGES } from '@/types/visionTypes';

interface VisualMechanicProps {
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  vehicleContext?: VehicleContextForVision;
}

export function VisualMechanic({ onSpeak, isSpeaking, vehicleContext }: VisualMechanicProps) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('capture');
  const [isSaved, setIsSaved] = useState(false);
  
  const {
    isCapturing,
    isAnalyzing,
    mediaPreviews,
    mediaFiles,
    analysisType,
    result,
    error,
    progressMessage,
    canAddMore,
    startCapture,
    stopCapturing,
    handleFileSelect,
    addFile,
    removeFile,
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
  
  const {
    diagnoses,
    loading: historyLoading,
    saving: historySaving,
    saveDiagnosis,
    deleteDiagnosis,
    refresh: refreshHistory,
  } = useDiagnosisHistory();
  
  // Helper para capitalizar primeira letra com safe navigation
  const capitalizeFirst = (str?: string | null) => 
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  // Verifica se tem veículo configurado
  const hasVehicle = vehicleContext && (vehicleContext.brand || vehicleContext.model);
  const vehicleDisplayName = hasVehicle 
    ? [
        capitalizeFirst(vehicleContext?.brand),
        vehicleContext?.model,
        vehicleContext?.year
      ].filter(Boolean).join(' ')
    : null;
  
  // Verifica se tem múltiplas imagens
  const hasMultipleImages = mediaFiles.length > 1;
  
  // Salva foto para análise posterior quando offline
  const handleSaveForLater = async () => {
    if (mediaFiles.length > 0 && analysisType) {
      // Salva a primeira imagem para análise offline
      await saveForLater(mediaFiles[0], analysisType);
      reset();
    }
  };
  
  // Handler para adicionar mais imagens
  const handleAddMore = () => {
    if (analysisType === 'photo') {
      startCapture('photo');
    }
  };
  
  // Wrapper para análise com contexto do veículo
  const handleAnalyze = () => {
    setIsSaved(false);
    analyzeMedia(vehicleContext);
  };
  
  // Reset com limpeza do estado de salvo
  const handleReset = useCallback(() => {
    setIsSaved(false);
    reset();
  }, [reset]);
  
  // Mapeia riskLevel da aplicação para o formato do banco
  const mapRiskLevelForDb = (level: string): 'low' | 'medium' | 'high' | 'critical' | 'unknown' => {
    switch (level) {
      case 'safe': return 'low';
      case 'attention': return 'medium';
      case 'danger': return 'critical';
      default: return 'unknown';
    }
  };
  
  // Salvar diagnóstico no histórico
  const handleSaveDiagnosis = useCallback(async () => {
    if (!result) return;
    
    const saved = await saveDiagnosis({
      vehicle_brand: vehicleContext?.brand || null,
      vehicle_model: vehicleContext?.model || null,
      vehicle_year: vehicleContext?.year || null,
      vehicle_engine: vehicleContext?.engine || null,
      media_type: analysisType === 'video' ? 'video' : 'image',
      analysis_type: 'diagnosis',
      risk_level: mapRiskLevelForDb(result.riskLevel),
      title: result.identification,
      description: result.diagnosis,
      recommendation: result.action,
      parts_mentioned: result.technicalName ? [result.technicalName] : [],
    });
    
    if (saved) {
      setIsSaved(true);
    }
  }, [result, vehicleContext, analysisType, saveDiagnosis]);
  
  return (
    <div className="space-y-4">
      {/* Premium Tabs with sliding indicator */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="relative p-1.5 bg-secondary/50 backdrop-blur-sm rounded-2xl border border-border/50 grid w-full grid-cols-2 gap-1">
          {/* Sliding indicator */}
          <div 
            className={cn(
              'absolute h-[calc(100%-12px)] top-1.5 rounded-xl bg-background shadow-lg transition-all duration-300 ease-out',
              activeTab === 'capture' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[calc(50%+1.5px)] w-[calc(50%-6px)]'
            )} 
          />
          
          <TabsTrigger 
            value="capture" 
            className="relative z-10 gap-2 py-2.5 rounded-xl data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors"
          >
            <Camera className={cn('h-4 w-4 transition-colors', activeTab === 'capture' && 'text-primary')} />
            <span className={cn('font-medium', activeTab === 'capture' && 'text-primary')}>Analisar</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="history" 
            className="relative z-10 gap-2 py-2.5 rounded-xl data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors"
          >
            <History className={cn('h-4 w-4 transition-colors', activeTab === 'history' && 'text-primary')} />
            <span className={cn('font-medium', activeTab === 'history' && 'text-primary')}>Histórico</span>
            {diagnoses.length > 0 && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium transition-colors',
                activeTab === 'history' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {diagnoses.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="capture" className="mt-4 space-y-4 animate-fade-in">
          {/* Premium Hero Section */}
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            {/* Decorative orb */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
            
            {/* Scanner line animation during analysis */}
            {isAnalyzing && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
              </div>
            )}
            
            <CardHeader className="relative text-center pb-2">
              {/* Animated icon with glow */}
              <div className="relative mx-auto w-fit mb-3">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <Eye className="h-8 w-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                </div>
              </div>
              
              <CardTitle className="text-xl sm:text-2xl font-bold">
                O que está acontecendo?
              </CardTitle>
              <CardDescription className="text-base">
                Tire uma foto ou grave um vídeo curto e descubra o que significa
              </CardDescription>
              
              {/* Multi-image tip */}
              {!mediaPreviews.length && !result && !isAnalyzing && (
                <div className="flex items-center justify-center gap-2 mt-3 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs text-muted-foreground">
                    <Images className="h-3.5 w-3.5 text-accent-foreground" />
                    <span>Até {MAX_IMAGES} fotos para diagnóstico mais preciso</span>
                  </div>
                </div>
              )}
              
              {/* Premium Vehicle badge */}
              {vehicleDisplayName && (
                <div className="flex items-center justify-center gap-2 mt-4 animate-fade-in">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 backdrop-blur-sm">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {vehicleDisplayName}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      Diagnóstico específico
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="relative">
              {/* Offline info - agora permite salvar para depois */}
              {!isOnline && !mediaPreviews.length && (
                <Alert className="mb-4 border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
                  <CloudOff className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-700">
                    Modo offline: tire a foto agora e ela será analisada quando a conexão retornar.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Error display */}
              {error && !result && (
                <Alert variant="destructive" className="mb-4 backdrop-blur-sm">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Initial state - Show capture buttons */}
              {!isCapturing && !mediaPreviews.length && !result && !isAnalyzing && (
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
                  onFileSelect={mediaFiles.length > 0 ? addFile : handleFileSelect}
                  onCancel={mediaFiles.length > 0 ? stopCapturing : handleReset}
                  isAddingMore={mediaFiles.length > 0}
                />
              )}
              
              {/* Preview state - Show media preview com opção de salvar offline */}
              {mediaPreviews.length > 0 && !result && !isAnalyzing && !isCapturing && analysisType && (
                <div className="space-y-4">
                  {hasMultipleImages ? (
                    // Multi-image grid
                    <MultiImagePreview
                      files={mediaFiles}
                      previews={mediaPreviews}
                      onRemove={removeFile}
                      onAddMore={handleAddMore}
                      onAnalyze={handleAnalyze}
                      onReset={handleReset}
                      canAddMore={canAddMore}
                      isAnalyzing={isAnalyzing}
                      isOnline={isOnline}
                    />
                  ) : (
                    // Single image preview
                    <MediaPreview
                      mediaUrl={mediaPreviews[0]}
                      analysisType={analysisType}
                      onAnalyze={isOnline ? handleAnalyze : undefined}
                      onRetry={() => startCapture(analysisType)}
                      onCancel={handleReset}
                      isAnalyzing={isAnalyzing}
                      canAddMore={canAddMore && analysisType === 'photo'}
                      onAddMore={handleAddMore}
                    />
                  )}
                  
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
                <AnalysisProgress 
                  message={progressMessage} 
                  imageCount={mediaFiles.length}
                />
              )}
            </CardContent>
          </Card>
          
          {/* Result card - Show diagnosis with vehicle context */}
          {result && (
            <div className="animate-scale-in">
              <DiagnosisCard
                result={result}
                mediaUrl={mediaPreviews[0] || undefined}
                vehicleContext={vehicleContext}
                onSpeak={onSpeak}
                onReset={handleReset}
                onSave={isAuthenticated ? handleSaveDiagnosis : undefined}
                isSpeaking={isSpeaking}
                isSaving={historySaving}
                isSaved={isSaved}
              />
            </div>
          )}
          
          {/* Fila de fotos offline pendentes */}
          {pendingItems.length > 0 && !result && !isAnalyzing && !mediaPreviews.length && (
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
          {processedResults.length > 0 && !result && !isAnalyzing && !mediaPreviews.length && (
            <ProcessedResults
              results={processedResults}
              onClear={clearProcessedResults}
              onSpeak={onSpeak}
            />
          )}
          
          {/* Premium Tips for first-time users */}
          {!isCapturing && !mediaPreviews.length && !result && !isAnalyzing && pendingItems.length === 0 && (
            <Card className="relative overflow-hidden border-dashed border-muted-foreground/20 bg-muted/30 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
              <CardContent className="relative p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Dica do mecânico</p>
                    <p className="text-sm text-muted-foreground">
                      Fotografe luzes acesas no painel, vazamentos, peças com aspecto estranho 
                      ou qualquer coisa que você não reconheça. <strong>Use até {MAX_IMAGES} fotos de ângulos diferentes</strong> para um diagnóstico mais preciso!
                    </p>
                    {hasVehicle && (
                      <p className="text-sm text-primary font-medium pt-1">
                        Diagnóstico personalizado para seu {vehicleDisplayName}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="mt-4 animate-fade-in">
          {isAuthenticated ? (
            <DiagnosisHistory
              diagnoses={diagnoses}
              loading={historyLoading}
              onDelete={deleteDiagnosis}
              onRefresh={refreshHistory}
            />
          ) : (
            <Card className="border-dashed bg-muted/30 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="p-4 rounded-2xl bg-muted mb-4">
                  <History className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-base font-medium">Faça login para ver seu histórico</p>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Seus diagnósticos serão salvos automaticamente
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default VisualMechanic;
