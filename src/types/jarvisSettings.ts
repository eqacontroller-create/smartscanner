export interface JarvisSettings {
  // Alertas
  welcomeEnabled: boolean;
  highRpmAlertEnabled: boolean;
  highTempAlertEnabled: boolean;
  highTempThreshold: number;        // Limite em Celsius (padrão: 100)
  speedAlertEnabled: boolean;
  speedLimit: number;               // Limite em km/h (padrão: 120)
  maintenanceAlertEnabled: boolean;
  currentMileage: number;           // Quilometragem atual (entrada manual)
  nextOilChange: number;            // Próxima troca de óleo (km)
  nextInspection: number;           // Próxima revisão (km)
  
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
  maintenanceAlertEnabled: true,
  currentMileage: 0,
  nextOilChange: 15000,
  nextInspection: 30000,
  aiModeEnabled: true,
  aiResponseLength: 'short',
  continuousListening: false,
  wakeWord: 'jarvis',
  volume: 1.0,
  rate: 0.9,
  pitch: 0.95,
  selectedVoiceURI: null,
};
