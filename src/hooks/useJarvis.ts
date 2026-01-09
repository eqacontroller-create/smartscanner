import { useState, useCallback, useRef } from 'react';

interface UseJarvisReturn {
  speak: (text: string) => void;
  stopSpeaking: () => void;
  testAudio: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useJarvis(): UseJarvisReturn {
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
    utterance.rate = 0.9; // Velocidade ligeiramente mais lenta para clareza
    utterance.pitch = 0.95; // Tom ligeiramente mais grave, estilo Jarvis
    utterance.volume = 1;

    // Tentar encontrar uma voz em português brasileiro
    const voices = window.speechSynthesis.getVoices();
    const ptBRVoice = voices.find(voice => 
      voice.lang === 'pt-BR' || 
      voice.lang.startsWith('pt-BR') ||
      voice.lang === 'pt_BR'
    );
    
    if (ptBRVoice) {
      utterance.voice = ptBRVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Erro na síntese de voz:', event.error);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stopSpeaking = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const testAudio = useCallback(() => {
    speak('Áudio do sistema sincronizado com o Ford Sync.');
  }, [speak]);

  return {
    speak,
    stopSpeaking,
    testAudio,
    isSpeaking,
    isSupported
  };
}
