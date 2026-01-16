// Tipos para Auditoria de Abastecimento
// Detecta combustível adulterado analisando Fuel Trim

// Tipo de fluxo de monitoramento
export type RefuelFlowType = 'refuel' | 'quick-test';

// Status do modo abastecimento
export type RefuelMode = 'inactive' | 'waiting' | 'waiting-quick' | 'monitoring' | 'analyzing' | 'completed';

// Qualidade do combustível detectada
export type FuelQuality = 'unknown' | 'ok' | 'warning' | 'critical';

// Registro de abastecimento
export interface RefuelEntry {
  id: string;
  timestamp: number;
  pricePerLiter: number;         // R$/L
  litersAdded: number;           // Litros abastecidos
  totalPaid: number;             // Total pago R$
  fuelLevelBefore: number | null; // % antes (se disponível)
  fuelLevelAfter: number | null;  // % depois (se disponível)
  tankCapacity: number;           // Capacidade do tanque (config)
  
  // Resultados da análise
  quality: FuelQuality;
  stftAverage: number;            // Média do STFT durante monitoramento
  ltftDelta: number;              // Variação do LTFT
  distanceMonitored: number;      // km rodados durante análise
  anomalyDetected: boolean;
  anomalyDetails?: string;
  pumpAccuracyPercent?: number;   // % de precisão da bomba
}

// Histórico de Fuel Trim para gráfico
export interface FuelTrimSample {
  timestamp: number;
  stft: number;  // Short Term Fuel Trim %
  ltft: number;  // Long Term Fuel Trim %
  distance: number; // km desde abastecimento
}

// Configurações do modo abastecimento
export interface RefuelSettings {
  tankCapacity: number;           // Capacidade do tanque em litros
  monitoringDistance: number;     // km para monitorar (default: 5)
  stftWarningThreshold: number;   // % para alerta amarelo (default: 15)
  stftCriticalThreshold: number;  // % para alerta vermelho (default: 25)
  anomalyDurationWarning: number; // segundos para disparar alerta (default: 30)
  anomalyDurationCritical: number; // segundos para crítico (default: 60)
}

// Valores padrão
export const defaultRefuelSettings: RefuelSettings = {
  tankCapacity: 50,
  monitoringDistance: 5,
  stftWarningThreshold: 15,
  stftCriticalThreshold: 25,
  anomalyDurationWarning: 30,
  anomalyDurationCritical: 60,
};

// Estado inicial para novo abastecimento
export const initialRefuelEntry: Omit<RefuelEntry, 'id' | 'timestamp'> = {
  pricePerLiter: 0,
  litersAdded: 0,
  totalPaid: 0,
  fuelLevelBefore: null,
  fuelLevelAfter: null,
  tankCapacity: 50,
  quality: 'unknown',
  stftAverage: 0,
  ltftDelta: 0,
  distanceMonitored: 0,
  anomalyDetected: false,
};

// Helper para formatar qualidade
export function getQualityLabel(quality: FuelQuality): string {
  switch (quality) {
    case 'ok': return 'Combustível OK';
    case 'warning': return 'Combustível Suspeito';
    case 'critical': return 'Anomalia Grave';
    default: return 'Analisando...';
  }
}

// Helper para cor da qualidade
export function getQualityColor(quality: FuelQuality): string {
  switch (quality) {
    case 'ok': return 'text-green-500';
    case 'warning': return 'text-yellow-500';
    case 'critical': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
}

// Helper para ícone da qualidade
export function getQualityIcon(quality: FuelQuality): 'check' | 'alert' | 'warning' | 'help' {
  switch (quality) {
    case 'ok': return 'check';
    case 'warning': return 'alert';
    case 'critical': return 'warning';
    default: return 'help';
  }
}
