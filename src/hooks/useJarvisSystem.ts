import { useJarvisSettings } from '@/hooks/useJarvisSettings';
import { useJarvis } from '@/hooks/useJarvis';
import { useJarvisAI } from '@/hooks/useJarvisAI';
import type { VehicleData } from '@/contexts/OBDContext';
import type { TripData } from '@/types/tripSettings';

interface UseJarvisSystemOptions {
  vehicleData: VehicleData;
  tripData: TripData;
  isConnected: boolean;
  isPolling: boolean;
  brandDisplayName: string;
  brandCharacteristics?: string;
  modelYear?: string;
}

/**
 * Hook composto que agrupa toda a lógica do sistema Jarvis:
 * - Configurações do Jarvis
 * - Text-to-Speech (TTS)
 * - IA conversacional
 */
export function useJarvisSystem({
  vehicleData,
  tripData,
  isConnected,
  isPolling,
  brandDisplayName,
  brandCharacteristics,
  modelYear,
}: UseJarvisSystemOptions) {
  // Hook de configurações
  const {
    settings,
    updateSetting,
    resetToDefaults,
    availableVoices,
    portugueseVoices,
  } = useJarvisSettings();

  // Hook de TTS
  const { 
    speak, 
    testAudio, 
    isSpeaking, 
    isSupported: isTTSSupported 
  } = useJarvis({ settings });

  // Hook de IA conversacional
  const jarvisAI = useJarvisAI({
    settings,
    vehicleContext: {
      rpm: vehicleData.rpm,
      speed: vehicleData.speed,
      temperature: vehicleData.temperature,
      voltage: vehicleData.voltage,
      fuelLevel: vehicleData.fuelLevel,
      engineLoad: vehicleData.engineLoad,
      isConnected,
      isPolling,
      brand: brandDisplayName,
      brandCharacteristics,
      modelYear,
    },
    tripData,
  });

  return {
    // Configurações
    settings,
    updateSetting,
    resetToDefaults,
    availableVoices,
    portugueseVoices,

    // TTS
    speak,
    testAudio,
    isSpeaking,
    isTTSSupported,

    // IA
    isListening: jarvisAI.isListening,
    isContinuousMode: jarvisAI.isContinuousMode,
    isWakeWordDetected: jarvisAI.isWakeWordDetected,
    isProcessing: jarvisAI.isProcessing,
    isSpeakingAI: jarvisAI.isSpeaking,
    isAISupported: jarvisAI.isSupported,
    aiError: jarvisAI.error,
    lastTranscript: jarvisAI.lastTranscript,
    interimTranscript: jarvisAI.interimTranscript,
    lastResponse: jarvisAI.lastResponse,
    conversationHistory: jarvisAI.conversationHistory,
    toggleListening: jarvisAI.toggleListening,
    toggleContinuousMode: jarvisAI.toggleContinuousMode,
    clearHistory: jarvisAI.clearHistory,
  };
}
