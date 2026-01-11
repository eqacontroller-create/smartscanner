// Tipos para especificações técnicas de veículos

export interface VehicleSpecs {
  typicalRedlineRPM: number;      // RPM máximo típico da marca
  normalTempRange: [number, number]; // [min, max] temperatura normal em °C
  normalVoltageRange: [number, number]; // [min, max] voltagem normal em V
  fuelTrimTolerance: number;      // Tolerância típica de STFT em %
  shiftPointEco: number;          // Ponto de troca econômico em % do redline
  shiftPointSport: number;        // Ponto de troca esportivo em % do redline
}

export interface VehicleTip {
  id: string;
  category: 'combustivel' | 'manutencao' | 'desempenho' | 'seguranca' | 'economia';
  title: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta';
}

export interface KnownIssue {
  id: string;
  title: string;
  description: string;
  symptoms: string[];
  affectedYears?: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface VehicleBenefits {
  // Configurações sugeridas baseadas na marca
  suggestedRedlineRPM: number;
  suggestedTempThreshold: number;
  suggestedVoltageThreshold: number;
  suggestedSpeedLimit: number;
  
  // Alertas específicos da marca
  brandSpecificAlerts: BrandAlert[];
  
  // Dicas contextuais
  currentTips: VehicleTip[];
  
  // Especificações técnicas
  techSpecs: VehicleSpecs;
  
  // Problemas conhecidos
  knownIssues: KnownIssue[];
  
  // Características da marca para o Jarvis
  brandCharacteristics: string;
}

export interface BrandAlert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  condition?: string;
}

export interface DetectedVehicleExtended {
  vin: string | null;
  brand: string;
  manufacturer: string;
  modelYear: string | null;
  country: string | null;
  manufacturerGroup: string | null;
  displayName: string;
  slogan: string;
}
