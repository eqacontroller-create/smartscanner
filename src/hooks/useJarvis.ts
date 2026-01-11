import { useState, useCallback, useRef } from 'react';
import { JarvisSettings, defaultJarvisSettings } from '@/types/jarvisSettings';
import { decryptApiKey } from '@/lib/encryption';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Usa TTS da OpenAI (voz premium)
  const speakWithOpenAI = useCallback(async (text: string): Promise<boolean> => {
    if (!settings.openaiApiKey || !settings.openaiTTSEnabled) {
      return false;
    }

    try {
      const decryptedKey = decryptApiKey(settings.openaiApiKey);
      
      if (!decryptedKey) {
        console.warn('OpenAI API key inválida');
        return false;
      }

      setIsSpeaking(true);

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${decryptedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: settings.openaiVoice || 'onyx',
          input: text,
          speed: settings.rate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Para áudio anterior se existir
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audio.volume = settings.volume;
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
      return true;
    } catch (error) {
      console.error('Erro no OpenAI TTS:', error);
      setIsSpeaking(false);
      return false;
    }
  }, [settings.openaiApiKey, settings.openaiTTSEnabled, settings.openaiVoice, settings.rate, settings.volume]);

  // Usa Web Speech API (voz de robô)
  const speakWithBrowser = useCallback((text: string) => {
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

  // Função principal de fala (híbrida)
  const speak = useCallback(async (text: string) => {
    // Se IA Avançada está configurada, tenta usar OpenAI TTS
    if (settings.aiProvider === 'openai' && settings.openaiTTSEnabled && settings.openaiApiKey) {
      const success = await speakWithOpenAI(text);
      if (success) return;
      // Se falhar, cai para o navegador
      console.log('Fallback para Web Speech API');
    }

    // Fallback: usa Web Speech API (voz de robô)
    speakWithBrowser(text);
  }, [settings.aiProvider, settings.openaiTTSEnabled, settings.openaiApiKey, speakWithOpenAI, speakWithBrowser]);

  const stopSpeaking = useCallback(() => {
    // Para OpenAI audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Para Web Speech
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  }, [isSupported]);

  const testAudio = useCallback(() => {
    const message = settings.aiProvider === 'openai' && settings.openaiTTSEnabled && settings.openaiApiKey
      ? 'Modo premium ativado. Jarvis operacional com voz de alta qualidade.'
      : 'Sistema de áudio sincronizado. Jarvis operacional, piloto.';
    speak(message);
  }, [speak, settings.aiProvider, settings.openaiTTSEnabled, settings.openaiApiKey]);

  return {
    speak,
    stopSpeaking,
    testAudio,
    isSpeaking,
    isSupported
  };
}
