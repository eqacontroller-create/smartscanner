/**
 * useOfflineVision - Hook para diagnósticos visuais offline
 * Salva fotos localmente e sincroniza quando a conexão retornar
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VisionService, fileToBase64, resizeImage } from '@/services/ai/VisionService';
import type { VisionAnalysisResult, AnalysisType } from '@/types/visionTypes';
import { toast } from 'sonner';
import logger from '@/lib/logger';

const OFFLINE_QUEUE_KEY = 'vision-offline-queue';
const PROCESSED_RESULTS_KEY = 'vision-processed-results';

export interface OfflineVisionItem {
  id: string;
  mediaBase64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'video/mp4' | 'video/webm';
  analysisType: AnalysisType;
  createdAt: number;
  fileName: string;
  thumbnailBase64?: string;
}

export interface ProcessedVisionResult {
  id: string;
  originalId: string;
  result: VisionAnalysisResult;
  mediaPreviewUrl: string;
  processedAt: number;
}

export interface UseOfflineVisionReturn {
  // Estado
  pendingItems: OfflineVisionItem[];
  processedResults: ProcessedVisionResult[];
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: { current: number; total: number } | null;
  
  // Ações
  saveForLater: (file: File, analysisType: AnalysisType) => Promise<string>;
  processQueue: () => Promise<void>;
  removeFromQueue: (id: string) => void;
  clearProcessedResults: () => void;
  getItemPreview: (item: OfflineVisionItem) => string;
}

// Gera ID único
function generateId(): string {
  return `vision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Carrega fila do localStorage
function loadQueue(): OfflineVisionItem[] {
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Salva fila no localStorage
function saveQueue(queue: OfflineVisionItem[]) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Erro ao salvar fila de visão offline:', error);
    // Se localStorage estiver cheio, tenta limpar itens antigos
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      toast.error('Armazenamento cheio. Limpe fotos antigas para continuar.');
    }
  }
}

// Carrega resultados processados
function loadProcessedResults(): ProcessedVisionResult[] {
  try {
    const stored = localStorage.getItem(PROCESSED_RESULTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Salva resultados processados
function saveProcessedResults(results: ProcessedVisionResult[]) {
  try {
    // Mantém apenas os últimos 10 resultados para não encher o storage
    const trimmed = results.slice(-10);
    localStorage.setItem(PROCESSED_RESULTS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Erro ao salvar resultados processados:', error);
  }
}

// Cria thumbnail pequeno para preview
async function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (file.type.startsWith('video/')) {
      // Para vídeos, usa primeiro frame (simplificado)
      resolve('');
      return;
    }
    
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      const maxSize = 100;
      
      let { width, height } = img;
      if (width > height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      } else {
        resolve('');
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    
    img.src = url;
  });
}

export function useOfflineVision(): UseOfflineVisionReturn {
  const [pendingItems, setPendingItems] = useState<OfflineVisionItem[]>([]);
  const [processedResults, setProcessedResults] = useState<ProcessedVisionResult[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const processingRef = useRef(false);

  // Carrega dados do localStorage ao montar
  useEffect(() => {
    setPendingItems(loadQueue());
    setProcessedResults(loadProcessedResults());
  }, []);

  // Monitora status online/offline
  useEffect(() => {
    const handleOnline = () => {
      logger.log('📶 Conexão restaurada - Verificando fotos pendentes');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      logger.log('📴 Sem conexão - Modo offline ativado');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Processa fila automaticamente quando volta online
  useEffect(() => {
    if (isOnline && pendingItems.length > 0 && !processingRef.current) {
      // Pequeno delay para dar tempo da conexão estabilizar
      const timer = setTimeout(() => {
        if (pendingItems.length > 0) {
          toast.info(`${pendingItems.length} foto(s) aguardando análise`, {
            description: 'Toque para analisar agora',
            action: {
              label: 'Analisar',
              onClick: () => processQueue(),
            },
            duration: 10000,
          });
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingItems.length]);

  // Salva mídia para análise posterior
  const saveForLater = useCallback(async (file: File, analysisType: AnalysisType): Promise<string> => {
    const id = generateId();
    
    try {
      // Redimensiona imagem para economizar espaço
      let processedFile = file;
      if (file.type.startsWith('image/')) {
        const resizedBlob = await resizeImage(file, 800); // Menor para offline
        processedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
      }
      
      const mediaBase64 = await fileToBase64(processedFile);
      const thumbnailBase64 = await createThumbnail(file);
      
      const newItem: OfflineVisionItem = {
        id,
        mediaBase64,
        mediaType: processedFile.type as OfflineVisionItem['mediaType'],
        analysisType,
        createdAt: Date.now(),
        fileName: file.name,
        thumbnailBase64,
      };
      
      setPendingItems(prev => {
        const updated = [...prev, newItem];
        saveQueue(updated);
        return updated;
      });
      
      toast.success('Foto salva para análise', {
        description: 'Será analisada quando a conexão retornar',
        duration: 4000,
      });
      
      logger.log(`📷 Mídia salva offline: ${id}`);
      return id;
      
    } catch (error) {
      console.error('Erro ao salvar mídia offline:', error);
      toast.error('Não foi possível salvar a foto');
      throw error;
    }
  }, []);

  // Processa fila de diagnósticos pendentes
  const processQueue = useCallback(async () => {
    if (!isOnline || processingRef.current || pendingItems.length === 0) {
      if (!isOnline) {
        toast.error('Sem conexão com a internet');
      }
      return;
    }
    
    processingRef.current = true;
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: pendingItems.length });
    
    logger.log(`🔄 Processando ${pendingItems.length} diagnóstico(s) pendente(s)`);
    
    const successIds: string[] = [];
    const newResults: ProcessedVisionResult[] = [];
    
    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      setSyncProgress({ current: i + 1, total: pendingItems.length });
      
      try {
        // Recria o File a partir do Base64
        const byteCharacters = atob(item.mediaBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: item.mediaType });
        const file = new File([blob], item.fileName, { type: item.mediaType });
        
        // Analisa com a IA
        const result = item.analysisType === 'video'
          ? await VisionService.analyzeVideo(file)
          : await VisionService.analyzeImage(file);
        
        // Cria URL para preview do resultado
        const mediaPreviewUrl = `data:${item.mediaType};base64,${item.mediaBase64}`;
        
        const processedResult: ProcessedVisionResult = {
          id: generateId(),
          originalId: item.id,
          result,
          mediaPreviewUrl,
          processedAt: Date.now(),
        };
        
        newResults.push(processedResult);
        successIds.push(item.id);
        
        logger.log(`✅ Diagnóstico ${item.id} processado com sucesso`);
        
      } catch (error) {
        console.error(`❌ Erro ao processar diagnóstico ${item.id}:`, error);
        // Continua tentando os próximos
      }
    }
    
    // Remove itens processados com sucesso da fila
    if (successIds.length > 0) {
      setPendingItems(prev => {
        const remaining = prev.filter(item => !successIds.includes(item.id));
        saveQueue(remaining);
        return remaining;
      });
      
      // Adiciona novos resultados aos processados
      setProcessedResults(prev => {
        const updated = [...prev, ...newResults];
        saveProcessedResults(updated);
        return updated;
      });
      
      if (successIds.length === pendingItems.length) {
        toast.success('Todas as fotos foram analisadas!', {
          description: 'Veja os diagnósticos na aba Visual',
        });
      } else {
        toast.info(`${successIds.length} de ${pendingItems.length} fotos analisadas`);
      }
    } else if (pendingItems.length > 0) {
      toast.error('Falha ao analisar fotos', {
        description: 'Tente novamente mais tarde',
      });
    }
    
    processingRef.current = false;
    setIsSyncing(false);
    setSyncProgress(null);
  }, [isOnline, pendingItems]);

  // Remove item específico da fila
  const removeFromQueue = useCallback((id: string) => {
    setPendingItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveQueue(updated);
      return updated;
    });
    toast.success('Foto removida da fila');
  }, []);

  // Limpa resultados processados
  const clearProcessedResults = useCallback(() => {
    setProcessedResults([]);
    localStorage.removeItem(PROCESSED_RESULTS_KEY);
    toast.success('Histórico limpo');
  }, []);

  // Obtém preview URL de um item
  const getItemPreview = useCallback((item: OfflineVisionItem): string => {
    if (item.thumbnailBase64) {
      return item.thumbnailBase64;
    }
    return `data:${item.mediaType};base64,${item.mediaBase64}`;
  }, []);

  return {
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
  };
}
