export type FuelType = 'gasoline' | 'ethanol' | 'diesel';

export interface JarvisSettings {
  // Alertas
  welcomeEnabled: boolean;
  highRpmAlertEnabled: boolean;
  highTempAlertEnabled: boolean;
  highTempThreshold: number;        // Limite em Celsius (padrão: 100)
  speedAlertEnabled: boolean;
  speedLimit: number;               // Limite em km/h (padrão: 120)
  lowVoltageAlertEnabled: boolean;  // Alerta de bateria baixa
  lowVoltageThreshold: number;      // Limite de voltagem (padrão: 12.5V)
  maintenanceAlertEnabled: boolean;
  currentMileage: number;           // Quilometragem atual (entrada manual)
  nextOilChange: number;            // Próxima troca de óleo (km)
  nextInspection: number;           // Próxima revisão (km)
  
  // Perfil do Motor
  fuelType: FuelType;               // Tipo de combustível
  redlineRPM: number;               // Limite de giro (Redline)
  
  // Shift Light Adaptativo
  shiftLightEnabled: boolean;       // Ativar luz de troca
  ecoShiftEnabled: boolean;         // Bip suave em modo eco (40%)
  sportShiftEnabled: boolean;       // Bip agudo em modo sport (90%)
  
  // Alerta de Sobrecarga (Lugging)
  luggingAlertEnabled: boolean;     // Alerta de motor sofrendo
  
  // IA Conversacional
  aiModeEnabled: boolean;           // Ativar modo IA conversacional
  aiResponseLength: 'short' | 'medium' | 'detailed';  // Tamanho das respostas
  continuousListening: boolean;     // Modo escuta contínua
  wakeWord: string;                 // Palavra de ativação (padrão: "jarvis")
  
  // Configurações de Voz
  volume: number;       // 0.0 a 1.0
  rate: number;         // 0.5 a 2.0 (velocidade)
  pitch: number;        // 0.5 a 2.0 (tom)
  selectedVoiceURI: string | null;
}

export const defaultJarvisSettings: JarvisSettings = {
  welcomeEnabled: true,
  highRpmAlertEnabled: true,
  highTempAlertEnabled: true,
  highTempThreshold: 100,
  speedAlertEnabled: true,
  speedLimit: 120,
  lowVoltageAlertEnabled: true,
  lowVoltageThreshold: 12.5,
  maintenanceAlertEnabled: true,
  currentMileage: 0,
  nextOilChange: 15000,
  nextInspection: 30000,
  // Perfil do Motor
  fuelType: 'gasoline',
  redlineRPM: 6500,
  // Shift Light
  shiftLightEnabled: true,
  ecoShiftEnabled: true,
  sportShiftEnabled: true,
  // Lugging
  luggingAlertEnabled: true,
  // IA
  aiModeEnabled: true,
  aiResponseLength: 'short',
  continuousListening: false,
  wakeWord: 'jarvis',
  volume: 1.0,
  rate: 0.9,
  pitch: 0.95,
  selectedVoiceURI: null,
};

// Helper para obter redline padrão por tipo de combustível
export function getDefaultRedlineForFuelType(fuelType: FuelType): number {
  switch (fuelType) {
    case 'diesel':
      return 4500;
    case 'gasoline':
    case 'ethanol':
    default:
      return 6500;
  }
}

// Helper para calcular pontos de shift
export function getShiftPoints(redlineRPM: number) {
  return {
    ecoPoint: Math.round(redlineRPM * 0.4),    // 40% do limite
    sportPoint: Math.round(redlineRPM * 0.9),  // 90% do limite
    luggingPoint: Math.round(redlineRPM * 0.25), // 25% do limite (muito baixo)
  };
}
