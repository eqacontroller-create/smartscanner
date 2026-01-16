// Vision AI Types - Diagnóstico Visual por Foto/Vídeo

/**
 * Níveis de risco com semáforo visual
 */
export type RiskLevel = 'safe' | 'attention' | 'danger';

/**
 * Tipo de análise (foto ou vídeo)
 */
export type AnalysisType = 'photo' | 'video';

/**
 * Tipo de mídia suportado
 */
export type MediaType = 'image/jpeg' | 'image/png' | 'video/mp4' | 'video/webm';

/**
 * Resultado da análise de imagem/vídeo
 */
export interface VisionAnalysisResult {
  /** O que é isso? Nome popular da peça/luz */
  identification: string;
  
  /** Nome técnico da peça (para busca) */
  technicalName: string;
  
  /** O que parece errado? Diagnóstico em linguagem simples */
  diagnosis: string;
  
  /** Nível de risco: safe, attention, danger */
  riskLevel: RiskLevel;
  
  /** Mensagem do semáforo de segurança */
  riskMessage: string;
  
  /** O que devo fazer? Ação prática recomendada */
  action: string;
  
  /** Confiança da análise (0-100) */
  confidence: number;
}

/**
 * Request para a Edge Function vision-mechanic
 */
export interface VisionRequest {
  /** Mídia em Base64 */
  mediaBase64: string;
  
  /** Tipo da mídia */
  mediaType: MediaType;
  
  /** Tipo de análise */
  analysisType: AnalysisType;
  
  /** Pergunta adicional do usuário */
  userQuestion?: string;
}

/**
 * Response da Edge Function
 */
export interface VisionResponse {
  success: boolean;
  result?: VisionAnalysisResult;
  error?: string;
}

/**
 * Configurações de risco para UI
 */
export const RISK_CONFIG: Record<RiskLevel, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  label: string;
  message: string;
}> = {
  safe: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '🟢',
    label: 'SEGURO',
    message: 'Pode dirigir tranquilo!'
  },
  attention: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: '🟡',
    label: 'ATENÇÃO',
    message: 'Dirija com cuidado e procure uma oficina essa semana.'
  },
  danger: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: '🔴',
    label: 'PERIGO',
    message: 'Pare o carro imediatamente! Risco de quebra grave.'
  }
};

/**
 * Mensagens de progresso tranquilizadoras
 */
export const PROGRESS_MESSAGES = [
  'Analisando imagem...',
  'Identificando componentes...',
  'Consultando banco de dados mecânico...',
  'Verificando padrões conhecidos...',
  'Preparando diagnóstico...',
];
