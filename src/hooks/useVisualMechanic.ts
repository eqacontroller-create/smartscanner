/**
 * useVisualMechanic - Hook para gerenciar diagnóstico visual por IA
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { VisionService } from '@/services/ai/VisionService';
import { PROGRESS_MESSAGES } from '@/types/visionTypes';
import type { VisionAnalysisResult, AnalysisType, VehicleContextForVision } from '@/types/visionTypes';
import { toast } from 'sonner';

export interface UseVisualMechanicReturn {
  // Estado
  isCapturing: boolean;
  isAnalyzing: boolean;
  mediaPreview: string | null;
  mediaFile: File | null;
  analysisType: AnalysisType | null;
  result: VisionAnalysisResult | null;
  error: string | null;
  progressMessage: string;
  
  // Ações
  startCapture: (type: AnalysisType) => void;
  handleFileSelect: (file: File) => void;
  analyzeMedia: (vehicleContext?: VehicleContextForVision) => Promise<void>;
  reset: () => void;
}

export function useVisualMechanic(): UseVisualMechanicReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cicla mensagens de progresso durante análise
  useEffect(() => {
    if (isAnalyzing) {
      let index = 0;
      setProgressMessage(PROGRESS_MESSAGES[0]);
      
      progressIntervalRef.current = setInterval(() => {
        index = (index + 1) % PROGRESS_MESSAGES.length;
        setProgressMessage(PROGRESS_MESSAGES[index]);
      }, 2000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgressMessage('');
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isAnalyzing]);
  
  // Inicia captura de mídia
  const startCapture = useCallback((type: AnalysisType) => {
    setAnalysisType(type);
    setIsCapturing(true);
    setResult(null);
    setError(null);
  }, []);
  
  // Processa arquivo selecionado
  const handleFileSelect = useCallback((file: File) => {
    // Valida tipo de arquivo
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast.error('Formato não suportado. Use JPG, PNG ou MP4.');
      return;
    }
    
    // Valida tamanho
    const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB vídeo, 5MB imagem
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Máximo: ${isVideo ? '10MB' : '5MB'}`);
      return;
    }
    
    setMediaFile(file);
    setIsCapturing(false);
    
    // Cria preview
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
    
    // Define tipo de análise baseado no arquivo
    if (!analysisType) {
      setAnalysisType(isVideo ? 'video' : 'photo');
    }
  }, [analysisType]);
  
  // Analisa mídia com IA
  const analyzeMedia = useCallback(async (vehicleContext?: VehicleContextForVision) => {
    if (!mediaFile) {
      toast.error('Nenhuma mídia selecionada');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const isVideo = mediaFile.type.startsWith('video/');
      
      const analysisResult = isVideo
        ? await VisionService.analyzeVideo(mediaFile, undefined, vehicleContext)
        : await VisionService.analyzeImage(mediaFile, undefined, vehicleContext);
      
      setResult(analysisResult);
      
      // Toast baseado no nível de risco
      if (analysisResult.riskLevel === 'danger') {
        toast.error('⚠️ Problema grave detectado!', {
          description: 'Veja o diagnóstico completo abaixo.',
          duration: 5000,
        });
      } else if (analysisResult.riskLevel === 'attention') {
        toast.warning('Atenção necessária', {
          description: 'Veja as recomendações abaixo.',
          duration: 4000,
        });
      } else {
        toast.success('Tudo parece normal!', {
          description: 'Veja os detalhes abaixo.',
          duration: 3000,
        });
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao analisar mídia';
      setError(message);
      toast.error('Falha na análise', { description: message });
    } finally {
      setIsAnalyzing(false);
    }
  }, [mediaFile]);
  
  // Reseta estado
  const reset = useCallback(() => {
    // Limpa URL do preview
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    
    setIsCapturing(false);
    setIsAnalyzing(false);
    setMediaPreview(null);
    setMediaFile(null);
    setAnalysisType(null);
    setResult(null);
    setError(null);
    setProgressMessage('');
  }, [mediaPreview]);
  
  return {
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
  };
}
