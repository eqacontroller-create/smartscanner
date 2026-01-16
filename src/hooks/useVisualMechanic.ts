/**
 * useVisualMechanic - Hook para gerenciar diagnóstico visual por IA
 * Suporta múltiplas imagens para diagnóstico mais preciso
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { VisionService } from '@/services/ai/VisionService';
import { PROGRESS_MESSAGES, MULTI_IMAGE_PROGRESS_MESSAGES, MAX_IMAGES } from '@/types/visionTypes';
import type { VisionAnalysisResult, AnalysisType, VehicleContextForVision } from '@/types/visionTypes';
import { toast } from 'sonner';

export interface UseVisualMechanicReturn {
  // Estado
  isCapturing: boolean;
  isAnalyzing: boolean;
  mediaPreviews: string[];
  mediaFiles: File[];
  analysisType: AnalysisType | null;
  result: VisionAnalysisResult | null;
  error: string | null;
  progressMessage: string;
  canAddMore: boolean;
  
  // Ações
  startCapture: (type: AnalysisType) => void;
  handleFileSelect: (file: File) => void;
  addFile: (file: File) => void;
  removeFile: (index: number) => void;
  analyzeMedia: (vehicleContext?: VehicleContextForVision) => Promise<void>;
  reset: () => void;
}

export function useVisualMechanic(): UseVisualMechanicReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Verifica se pode adicionar mais imagens
  const canAddMore = mediaFiles.length < MAX_IMAGES && analysisType === 'photo';
  
  // Cicla mensagens de progresso durante análise
  useEffect(() => {
    if (isAnalyzing) {
      const messages = mediaFiles.length > 1 ? MULTI_IMAGE_PROGRESS_MESSAGES : PROGRESS_MESSAGES;
      let index = 0;
      setProgressMessage(messages[0]);
      
      progressIntervalRef.current = setInterval(() => {
        index = (index + 1) % messages.length;
        setProgressMessage(messages[index]);
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
  }, [isAnalyzing, mediaFiles.length]);
  
  // Inicia captura de mídia
  const startCapture = useCallback((type: AnalysisType) => {
    setAnalysisType(type);
    setIsCapturing(true);
    setResult(null);
    setError(null);
  }, []);
  
  // Valida e adiciona arquivo
  const validateAndAddFile = useCallback((file: File): boolean => {
    // Valida tipo de arquivo
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast.error('Formato não suportado. Use JPG, PNG ou MP4.');
      return false;
    }
    
    // Valida tamanho
    const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB vídeo, 5MB imagem
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Máximo: ${isVideo ? '10MB' : '5MB'}`);
      return false;
    }
    
    return true;
  }, []);
  
  // Processa arquivo selecionado (primeira imagem)
  const handleFileSelect = useCallback((file: File) => {
    if (!validateAndAddFile(file)) return;
    
    const isVideo = file.type.startsWith('video/');
    
    // Limpa previews anteriores
    mediaPreviews.forEach(url => URL.revokeObjectURL(url));
    
    setMediaFiles([file]);
    setIsCapturing(false);
    
    // Cria preview
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviews([previewUrl]);
    
    // Define tipo de análise baseado no arquivo
    if (!analysisType) {
      setAnalysisType(isVideo ? 'video' : 'photo');
    }
  }, [analysisType, validateAndAddFile, mediaPreviews]);
  
  // Adiciona mais uma imagem (até MAX_IMAGES)
  const addFile = useCallback((file: File) => {
    if (mediaFiles.length >= MAX_IMAGES) {
      toast.error(`Máximo de ${MAX_IMAGES} fotos permitidas`);
      return;
    }
    
    if (!validateAndAddFile(file)) return;
    
    const isVideo = file.type.startsWith('video/');
    if (isVideo) {
      toast.error('Para análise de vídeo, use apenas um arquivo.');
      return;
    }
    
    setMediaFiles(prev => [...prev, file]);
    setIsCapturing(false);
    
    // Cria preview
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviews(prev => [...prev, previewUrl]);
    
    toast.success(`Foto ${mediaFiles.length + 1} adicionada`);
  }, [mediaFiles.length, validateAndAddFile]);
  
  // Remove imagem por índice
  const removeFile = useCallback((index: number) => {
    // Revoga URL da preview
    if (mediaPreviews[index]) {
      URL.revokeObjectURL(mediaPreviews[index]);
    }
    
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  }, [mediaPreviews]);
  
  // Analisa mídia com IA
  const analyzeMedia = useCallback(async (vehicleContext?: VehicleContextForVision) => {
    if (mediaFiles.length === 0) {
      toast.error('Nenhuma mídia selecionada');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      let analysisResult: VisionAnalysisResult;
      
      if (mediaFiles.length === 1) {
        // Análise de uma única imagem/vídeo
        const file = mediaFiles[0];
        const isVideo = file.type.startsWith('video/');
        
        analysisResult = isVideo
          ? await VisionService.analyzeVideo(file, undefined, vehicleContext)
          : await VisionService.analyzeImage(file, undefined, vehicleContext);
      } else {
        // Análise de múltiplas imagens
        analysisResult = await VisionService.analyzeMultipleImages(
          mediaFiles,
          undefined,
          vehicleContext
        );
      }
      
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
  }, [mediaFiles]);
  
  // Reseta estado
  const reset = useCallback(() => {
    // Limpa URLs das previews
    mediaPreviews.forEach(url => URL.revokeObjectURL(url));
    
    setIsCapturing(false);
    setIsAnalyzing(false);
    setMediaPreviews([]);
    setMediaFiles([]);
    setAnalysisType(null);
    setResult(null);
    setError(null);
    setProgressMessage('');
  }, [mediaPreviews]);
  
  return {
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
    handleFileSelect,
    addFile,
    removeFile,
    analyzeMedia,
    reset,
  };
}
