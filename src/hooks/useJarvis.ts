import { useState, useCallback, useRef } from 'react';
import { JarvisSettings, defaultJarvisSettings } from '@/types/jarvisSettings';

interface UseJarvisOptions {
  settings?: JarvisSettings;
}

interface UseJarvisReturn {
  speak: (text: string) => void;
  stopSpeaking: () => void;
  testAudio: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useJarvis(options: UseJarvisOptions = {}): UseJarvisReturn {
  const { settings = defaultJarvisSettings } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      console.warn('Speech Synthesis não é suportado neste navegador');
      return;
    }

    // Cancelar fala anterior
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    // Usar voz selecionada ou encontrar uma em português brasileiro
    const voices = window.speechSynthesis.getVoices();
    
    if (settings.selectedVoiceURI) {
      const selectedVoice = voices.find(voice => voice.voiceURI === settings.selectedVoiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // Auto-selecionar voz pt-BR
      const ptBRVoice = voices.find(voice => 
        voice.lang === 'pt-BR' || 
        voice.lang.startsWith('pt-BR') ||
        voice.lang === 'pt_BR'
      );
      
      if (ptBRVoice) {
        utterance.voice = ptBRVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Erro na síntese de voz:', event.error);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, settings.rate, settings.pitch, settings.volume, settings.selectedVoiceURI]);

  const stopSpeaking = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const testAudio = useCallback(() => {
    speak('Sistema de áudio sincronizado. Jarvis operacional, piloto.');
  }, [speak]);

  return {
    speak,
    stopSpeaking,
    testAudio,
    isSpeaking,
    isSupported
  };
}
