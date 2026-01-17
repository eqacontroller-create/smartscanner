// Tipos para Forensics Fuel Analysis - State Machine Científica
// Diferencia troca legítima de combustível de adulteração

/**
 * Estados da máquina de estados de combustível
 * - stable: Combustível normal, sem mudanças detectadas
 * - adapting: ECU aprendendo novo combustível (troca Flex)
 * - suspicious: Anomalia detectada, investigando
 * - contaminated: Combustível adulterado confirmado
 * - mechanical: Problema mecânico (não é combustível)
 */
export type FuelState = 
  | 'stable'        // Combustível normal
  | 'adapting'      // ECU aprendendo novo combustível
  | 'suspicious'    // Anomalia em investigação
  | 'contaminated'  // Combustível adulterado confirmado
  | 'mechanical';   // Problema mecânico detectado

/**
 * Status do Sistema de Combustível (PID 03)
 * Indica se a ECU está em Open Loop ou Closed Loop
 */
export type FuelSystemStatus = 
  | 'motor_off'        // 0 - Motor desligado
  | 'open_loop_cold'   // 1 - Open Loop (motor frio, aquecendo)
  | 'closed_loop'      // 2 - Closed Loop (usando O2 para feedback) ✅
  | 'open_loop_load'   // 4 - Open Loop (carga alta/desaceleração)
  | 'open_loop_fail'   // 8 - Open Loop (falha no sistema)
  | 'closed_loop_fault'; // 16 - Closed Loop com falha no sistema

/**
 * Decodifica o valor bruto do PID 03 para FuelSystemStatus
 */
export function decodeFuelSystemStatus(value: number): FuelSystemStatus {
  switch (value) {
    case 0: return 'motor_off';
    case 1: return 'open_loop_cold';
    case 2: return 'closed_loop';
    case 4: return 'open_loop_load';
    case 8: return 'open_loop_fail';
    case 16: return 'closed_loop_fault';
    default: 
      // Se valor desconhecido, assume Open Loop por segurança
      console.warn('[FuelForensics] Unknown fuel system status:', value);
      return 'open_loop_cold';
  }
}

/**
 * Verifica se o sistema está em Closed Loop (dados de Fuel Trim são confiáveis)
 */
export function isClosedLoop(status: FuelSystemStatus): boolean {
  return status === 'closed_loop' || status === 'closed_loop_fault';
}

/**
 * Labels para exibição do status do sistema de combustível
 */
export const FUEL_SYSTEM_LABELS: Record<FuelSystemStatus, string> = {
  motor_off: 'Motor Desligado',
  open_loop_cold: 'Aguardando Aquecimento',
  closed_loop: 'Closed Loop (Normal)',
  open_loop_load: 'Aceleração/Corte',
  open_loop_fail: 'Falha no Sistema',
  closed_loop_fault: 'Closed Loop (c/ Falha)',
};

/**
 * Cores para o status do sistema de combustível
 */
export const FUEL_SYSTEM_COLORS: Record<FuelSystemStatus, string> = {
  motor_off: 'text-gray-500',
  open_loop_cold: 'text-orange-500',
  closed_loop: 'text-green-500',
  open_loop_load: 'text-blue-500',
  open_loop_fail: 'text-red-500',
  closed_loop_fault: 'text-yellow-500',
};

export const FUEL_SYSTEM_BG_COLORS: Record<FuelSystemStatus, string> = {
  motor_off: 'bg-gray-500/10',
  open_loop_cold: 'bg-orange-500/10',
  closed_loop: 'bg-green-500/10',
  open_loop_load: 'bg-blue-500/10',
  open_loop_fail: 'bg-red-500/10',
  closed_loop_fault: 'bg-yellow-500/10',
};

/**
 * Contexto informado pelo usuário sobre o abastecimento
 * - same_fuel: Manteve o mesmo tipo de combustível
 * - gas_to_ethanol: Trocou de Gasolina para Etanol
 * - ethanol_to_gas: Trocou de Etanol para Gasolina
 * - unknown: Usuário não tem certeza
 */
export type FuelChangeContext = 
  | 'same_fuel'       // Mantive o mesmo combustível
  | 'gas_to_ethanol'  // Troquei Gasolina → Etanol
  | 'ethanol_to_gas'  // Troquei Etanol → Gasolina
  | 'unknown';        // Não tenho certeza

/**
 * Leitura do sensor O2 (Sonda Lambda)
 * Usado para validação cruzada da análise
 */
export interface O2SensorReading {
  voltage: number;     // Voltagem (0-1.275V)
  timestamp: number;   // Timestamp da leitura
  isLean: boolean;     // Mistura pobre (< 0.2V)
  isRich: boolean;     // Mistura rica (> 0.8V)
}

/**
 * Dados acumulados durante monitoramento
 */
export interface FuelMonitoringData {
  stftCurrent: number;         // STFT atual
  stftAverage: number;         // Média do STFT
  stftSamples: number[];       // Todas as amostras de STFT
  ltftInitial: number | null;  // LTFT no início do monitoramento
  ltftCurrent: number | null;  // LTFT atual
  ltftDelta: number;           // Variação do LTFT (final - inicial)
  o2Readings: O2SensorReading[]; // Histórico de leituras O2
  o2Average: number | null;    // Voltagem média O2
  distanceMonitored: number;   // Distância percorrida (km)
  monitoringStartTime: number; // Timestamp de início
  monitoringDuration: number;  // Duração em segundos
}

/**
 * Progresso da adaptação Flex
 * Quando o usuário troca de combustível (Gas ↔ Etanol)
 */
export interface FuelAdaptationProgress {
  isAdapting: boolean;           // ECU está adaptando?
  expectedDirection: 'positive' | 'negative'; // Direção esperada do STFT
  actualDirection: 'positive' | 'negative' | 'neutral';
  progressPercent: number;       // 0-100%
  ltftAbsorbing: boolean;        // LTFT está absorvendo a correção?
  estimatedTimeRemaining: number; // Segundos estimados para conclusão
}

/**
 * Resultado da análise forense de combustível
 */
export interface FuelDiagnosticResult {
  state: FuelState;              // Estado final determinado
  confidence: 'low' | 'medium' | 'high'; // Confiança no diagnóstico
  
  // Métricas principais
  stftAverage: number;
  ltftDelta: number;
  o2Average: number | null;
  distanceMonitored: number;
  
  // Contexto do usuário
  userContext: FuelChangeContext;
  
  // Análise de adaptação (quando aplicável)
  adaptationProgress?: FuelAdaptationProgress;
  adaptationComplete: boolean;
  
  // Detalhes da anomalia (quando aplicável)
  anomalyDetected: boolean;
  anomalyType?: 'contamination' | 'mechanical' | 'sensor_fault';
  anomalyDetails?: string;
  
  // Evidências técnicas
  evidence: {
    stftOutOfRange: boolean;
    ltftNotAdapting: boolean;
    o2SensorFrozen: boolean;
    o2FrozenDuration: number;  // Segundos que O2 ficou travado
  };
  
  // Recomendação
  recommendation: string;
  
  // Timestamp
  analyzedAt: number;
}

/**
 * Limiares para análise de combustível
 * Baseados em especificações OBD-II e comportamento Flex
 */
export interface FuelAnalysisThresholds {
  // Limites para "mesmo combustível"
  sameFuelMaxTrim: number;       // ±12% - Desvio máximo aceitável
  sameFuelWarningTrim: number;   // ±8% - Limiar de atenção
  
  // Limites para "troca de combustível" (Flex)
  fuelSwitchExpectedTrim: number; // ±25% - Correção esperada
  fuelSwitchMaxTrim: number;      // ±35% - Limite superior aceitável
  
  // Limites do O2 Sensor
  o2LeanThreshold: number;        // 0.2V - Abaixo = mistura pobre
  o2RichThreshold: number;        // 0.8V - Acima = mistura rica
  o2FrozenDuration: number;       // 5s - Tempo para considerar travado
  
  // Limites de LTFT
  ltftMinDelta: number;           // 3% - Mínimo para considerar "adaptando"
  ltftMaxAdaptation: number;      // 25% - Máximo aceitável de adaptação
  
  // Distância mínima para análise confiável
  minAnalysisDistance: number;    // 2km
  recommendedDistance: number;    // 5km
}

/**
 * Labels para exibição ao usuário
 */
export const FUEL_STATE_LABELS: Record<FuelState, string> = {
  stable: 'Combustível Aprovado',
  adapting: 'ECU Adaptando',
  suspicious: 'Sob Investigação',
  contaminated: 'Combustível Adulterado',
  mechanical: 'Problema Mecânico',
};

export const FUEL_STATE_COLORS: Record<FuelState, string> = {
  stable: 'text-green-500',
  adapting: 'text-blue-500',
  suspicious: 'text-yellow-500',
  contaminated: 'text-red-500',
  mechanical: 'text-gray-500',
};

export const FUEL_STATE_BG_COLORS: Record<FuelState, string> = {
  stable: 'bg-green-500/10',
  adapting: 'bg-blue-500/10',
  suspicious: 'bg-yellow-500/10',
  contaminated: 'bg-red-500/10',
  mechanical: 'bg-gray-500/10',
};

export const FUEL_STATE_BORDER_COLORS: Record<FuelState, string> = {
  stable: 'border-green-500/50',
  adapting: 'border-blue-500/50',
  suspicious: 'border-yellow-500/50',
  contaminated: 'border-red-500/50',
  mechanical: 'border-gray-500/50',
};

export const FUEL_CONTEXT_LABELS: Record<FuelChangeContext, string> = {
  same_fuel: 'Mesmo combustível',
  gas_to_ethanol: 'Gasolina → Etanol',
  ethanol_to_gas: 'Etanol → Gasolina',
  unknown: 'Não sei',
};

/**
 * Limiares padrão para análise
 */
export const DEFAULT_FUEL_THRESHOLDS: FuelAnalysisThresholds = {
  sameFuelMaxTrim: 12,
  sameFuelWarningTrim: 8,
  fuelSwitchExpectedTrim: 25,
  fuelSwitchMaxTrim: 35,
  o2LeanThreshold: 0.2,
  o2RichThreshold: 0.8,
  o2FrozenDuration: 5,
  ltftMinDelta: 3,
  ltftMaxAdaptation: 25,
  minAnalysisDistance: 2,
  recommendedDistance: 5,
};
