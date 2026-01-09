export interface JarvisSettings {
  // Alertas
  welcomeEnabled: boolean;
  highRpmAlertEnabled: boolean;
  
  // Configurações de Voz
  volume: number;       // 0.0 a 1.0
  rate: number;         // 0.5 a 2.0 (velocidade)
  pitch: number;        // 0.5 a 2.0 (tom)
  selectedVoiceURI: string | null;
}

export const defaultJarvisSettings: JarvisSettings = {
  welcomeEnabled: true,
  highRpmAlertEnabled: true,
  volume: 1.0,
  rate: 0.9,
  pitch: 0.95,
  selectedVoiceURI: null, // Auto-seleciona pt-BR
};
