// Tipos para o sistema de Saúde Unificada do Veículo

export type HealthLevel = 'excellent' | 'good' | 'warning' | 'critical' | 'unknown';

export interface BatteryHealthStatus {
  level: HealthLevel;
  percent: number | null;        // 0-100 baseado no último teste
  message: string;               // Ex: "Risco de Falha"
  lastTestDate: Date | null;
  alternatorStatus: 'ok' | 'weak' | 'fail' | 'unknown';
  restingVoltage: number | null;
  needsRetest: boolean;          // true se último teste > 30 dias
}

export interface FuelHealthStatus {
  level: HealthLevel;
  message: string;               // Ex: "Adulterado Detectado"
  lastRefuelDate: Date | null;
  lastQuality: string | null;    // 'good', 'warning', 'critical'
  anomalyDetected: boolean;
  stftAverage: number | null;
}

export interface DTCHealthStatus {
  level: HealthLevel;
  count: number;                 // Número de DTCs ativos
  message: string;               // Ex: "3 Erros Ativos"
  lastScanDate: Date | null;
  codes: string[];               // ['P0171', 'P0420', ...]
}

export interface VehicleHealthSnapshot {
  battery: BatteryHealthStatus;
  fuel: FuelHealthStatus;
  dtc: DTCHealthStatus;
  overallLevel: HealthLevel;     // Pior dos 3
  lastUpdated: Date;
  vin: string | null;
}

// Valores padrão para quando não há dados
export const defaultBatteryHealth: BatteryHealthStatus = {
  level: 'unknown',
  percent: null,
  message: 'Sem teste',
  lastTestDate: null,
  alternatorStatus: 'unknown',
  restingVoltage: null,
  needsRetest: false,
};

export const defaultFuelHealth: FuelHealthStatus = {
  level: 'unknown',
  message: 'Sem dados',
  lastRefuelDate: null,
  lastQuality: null,
  anomalyDetected: false,
  stftAverage: null,
};

export const defaultDTCHealth: DTCHealthStatus = {
  level: 'unknown',
  count: 0,
  message: 'Sem scan',
  lastScanDate: null,
  codes: [],
};

export const defaultHealthSnapshot: VehicleHealthSnapshot = {
  battery: defaultBatteryHealth,
  fuel: defaultFuelHealth,
  dtc: defaultDTCHealth,
  overallLevel: 'unknown',
  lastUpdated: new Date(),
  vin: null,
};

// Helper para calcular nível geral (pior dos 3)
export function calculateOverallLevel(
  battery: HealthLevel,
  fuel: HealthLevel,
  dtc: HealthLevel
): HealthLevel {
  const levels: HealthLevel[] = [battery, fuel, dtc];
  
  if (levels.includes('critical')) return 'critical';
  if (levels.includes('warning')) return 'warning';
  if (levels.includes('good')) return 'good';
  if (levels.includes('excellent')) return 'excellent';
  return 'unknown';
}

// Helper para cor do nível
export function getHealthLevelColor(level: HealthLevel): string {
  switch (level) {
    case 'excellent': return 'text-green-500';
    case 'good': return 'text-green-400';
    case 'warning': return 'text-yellow-500';
    case 'critical': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
}

// Helper para cor de fundo
export function getHealthLevelBgColor(level: HealthLevel): string {
  switch (level) {
    case 'excellent': return 'bg-green-500/10';
    case 'good': return 'bg-green-400/10';
    case 'warning': return 'bg-yellow-500/10';
    case 'critical': return 'bg-red-500/10';
    default: return 'bg-muted';
  }
}
