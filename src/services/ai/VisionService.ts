/**
 * VisionService - Serviço de diagnóstico visual por IA
 * Analisa fotos e vídeos de peças do motor e luzes do painel
 */

import type { VisionAnalysisResult, VisionRequest, VisionResponse, MediaType } from '@/types/visionTypes';

const VISION_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vision-mechanic`;

/**
 * Converte File para Base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo data:type;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona imagem para max 1024px mantendo proporção
 */
export async function resizeImage(file: File, maxSize = 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let { width, height } = img;
      
      // Calcula novo tamanho mantendo proporção
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      
      // Cria canvas e desenha imagem redimensionada
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível criar contexto de canvas'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Não foi possível converter imagem'));
        },
        'image/jpeg',
        0.85
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível carregar imagem'));
    };
    
    img.src = url;
  });
}

/**
 * Analisa imagem de peça ou luz do painel
 */
export async function analyzeImage(
  file: File,
  userQuestion?: string
): Promise<VisionAnalysisResult> {
  // Redimensiona imagem para economizar bandwidth
  const resizedBlob = await resizeImage(file);
  const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
  
  const mediaBase64 = await fileToBase64(resizedFile);
  
  const request: VisionRequest = {
    mediaBase64,
    mediaType: 'image/jpeg',
    analysisType: 'photo',
    userQuestion,
  };
  
  const response = await fetch(VISION_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ${response.status}`);
  }
  
  const data: VisionResponse = await response.json();
  
  if (!data.success || !data.result) {
    throw new Error(data.error || 'Falha na análise');
  }
  
  return data.result;
}

/**
 * Analisa vídeo curto do motor funcionando
 */
export async function analyzeVideo(
  file: File,
  userQuestion?: string
): Promise<VisionAnalysisResult> {
  // Verifica tamanho do vídeo (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Vídeo muito grande. Máximo permitido: 10MB');
  }
  
  const mediaBase64 = await fileToBase64(file);
  const mediaType = file.type as MediaType;
  
  const request: VisionRequest = {
    mediaBase64,
    mediaType,
    analysisType: 'video',
    userQuestion,
  };
  
  const response = await fetch(VISION_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ${response.status}`);
  }
  
  const data: VisionResponse = await response.json();
  
  if (!data.success || !data.result) {
    throw new Error(data.error || 'Falha na análise');
  }
  
  return data.result;
}

/**
 * Gera link de busca no Google Shopping para a peça
 */
export function generateShoppingLink(partName: string): string {
  const query = encodeURIComponent(`${partName} peça carro`);
  return `https://www.google.com/search?tbm=shop&q=${query}`;
}

/**
 * Gera link de busca contextualizado com veículo
 */
export function generateVehicleShoppingLink(
  partName: string,
  vehicle: { brand?: string | null; model?: string | null; year?: string | null }
): string {
  const parts = [partName];
  if (vehicle.brand) parts.push(vehicle.brand);
  if (vehicle.model) parts.push(vehicle.model);
  if (vehicle.year) parts.push(vehicle.year);
  
  const query = encodeURIComponent(parts.join(' '));
  return `https://www.google.com/search?tbm=shop&q=${query}`;
}

/**
 * Gera link de busca no Google Imagens para referência
 */
export function generateImageSearchLink(partName: string): string {
  const query = encodeURIComponent(`${partName} carro`);
  return `https://www.google.com/search?tbm=isch&q=${query}`;
}

// Export como objeto para compatibilidade com padrão de serviços
export const VisionService = {
  fileToBase64,
  resizeImage,
  analyzeImage,
  analyzeVideo,
  generateShoppingLink,
  generateVehicleShoppingLink,
  generateImageSearchLink,
};
