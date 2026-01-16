import { useState, useCallback, useRef, useEffect } from 'react';
import { JarvisSettings, defaultJarvisSettings } from '@/types/jarvisSettings';
import { TTSService } from '@/services/ai/TTSService';

interface UseJarvisOptions {
  settings?: JarvisSettings;
}

interface SpeakOptions {
  priority?: number;    // Maior = mais prioritário (default: 0)
  interrupt?: boolean;  // Se true, cancela fala atual e limpa fila
}

interface QueuedMessage {
  text: string;
  priority: number;
  resolve: () => void;
}

interface UseJarvisReturn {
  speak: (text: string, options?: SpeakOptions) => Promise<void>;
  stopSpeaking: () => void;
  testAudio: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  queueLength: number;
}

export function useJarvis(options: UseJarvisOptions = {}): UseJarvisReturn {
  const { settings = defaultJarvisSettings } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Sistema de fila de voz
  const speechQueueRef = useRef<QueuedMessage[]>([]);
  const isProcessingQueueRef = useRef(false);
  const currentSpeakPromiseRef = useRef<Promise<void> | null>(null);

  const isSupported = TTSService.isBrowserTTSSupported();

  // Atualizar contador da fila
  const updateQueueLength = useCallback(() => {
    setQueueLength(speechQueueRef.current.length);
  }, []);

  // Usa TTS da OpenAI (voz premium) - retorna Promise que resolve quando termina
  const speakWithOpenAI = useCallback(async (text: string): Promise<boolean> => {
    if (!settings.openaiApiKey || !settings.openaiTTSEnabled) {
      return false;
    }

    try {
      setIsSpeaking(true);

      // Para áudio anterior se existir
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = await TTSService.speakWithOpenAI(text, {
        apiKey: settings.openaiApiKey,
        voice: settings.openaiVoice || 'onyx',
        rate: settings.rate,
        volume: settings.volume,
      });

      audioRef.current = audio;

      return new Promise<boolean>((resolve) => {
        audio.onended = () => {
          setIsSpeaking(false);
          audioRef.current = null;
          resolve(true);
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          audioRef.current = null;
          resolve(false);
        };

        audio.play().catch(() => {
          setIsSpeaking(false);
          resolve(false);
        });
      });
    } catch (error) {
      console.error('[Jarvis] Erro no OpenAI TTS:', error);
      setIsSpeaking(false);
      return false;
    }
  }, [settings.openaiApiKey, settings.openaiTTSEnabled, settings.openaiVoice, settings.rate, settings.volume]);

  // Usa Web Speech API (voz de robô) - retorna Promise que resolve quando termina
  const speakWithBrowser = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isSupported) {
        console.warn('[Jarvis] Speech Synthesis não é suportado neste navegador');
        resolve();
        return;
      }

      // Cancelar fala anterior
      TTSService.stopBrowserSpeech();

      const utterance = TTSService.speakWithBrowser(text, {
        voice: settings.selectedVoiceURI || undefined,
        rate: settings.rate,
        pitch: settings.pitch,
        volume: settings.volume,
      });

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (event) => {
        console.error('[Jarvis] Erro na síntese de voz:', event.error);
        setIsSpeaking(false);
        resolve();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, [isSupported, settings.rate, settings.pitch, settings.volume, settings.selectedVoiceURI]);

  // Função interna que fala e espera terminar
  const speakAndWait = useCallback(async (text: string): Promise<void> => {
    console.log('[Jarvis] Falando:', text.substring(0, 50) + '...');
    
    // Se IA Avançada está configurada, tenta usar OpenAI TTS
    if (settings.aiProvider === 'openai' && settings.openaiTTSEnabled && settings.openaiApiKey) {
      const success = await speakWithOpenAI(text);
      if (success) return;
      // Se falhar, cai para o navegador
      console.log('[Jarvis] Fallback para Web Speech API');
    }

    // Fallback: usa Web Speech API (voz de robô)
    await speakWithBrowser(text);
  }, [settings.aiProvider, settings.openaiTTSEnabled, settings.openaiApiKey, speakWithOpenAI, speakWithBrowser]);

  // Processar fila de mensagens
  const processQueue = useCallback(async () => {
    if (speechQueueRef.current.length === 0) {
      isProcessingQueueRef.current = false;
      updateQueueLength();
      return;
    }

    isProcessingQueueRef.current = true;
    
    // Pegar próxima mensagem da fila
    const message = speechQueueRef.current.shift();
    updateQueueLength();
    
    if (!message) {
      isProcessingQueueRef.current = false;
      return;
    }

    console.log(`[Jarvis] Processando fila - Mensagem: "${message.text.substring(0, 30)}..." | Restantes: ${speechQueueRef.current.length}`);
    
    // Falar e esperar terminar
    await speakAndWait(message.text);
    
    // Resolver promise da mensagem
    message.resolve();
    
    // Pequeno delay entre mensagens para naturalidade
    await new Promise(r => setTimeout(r, 300));
    
    // Processar próxima da fila (recursivo)
    processQueue();
  }, [speakAndWait, updateQueueLength]);

  // Função para parar fala
  const stopSpeaking = useCallback(() => {
    // Para OpenAI audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Para Web Speech
    TTSService.stopBrowserSpeech();
    
    setIsSpeaking(false);
  }, []);

  // Função principal de fala com sistema de fila
  const speak = useCallback(async (text: string, options: SpeakOptions = {}): Promise<void> => {
    const { priority = 0, interrupt = false } = options;

    if (interrupt) {
      // Limpa fila e para fala atual
      console.log('[Jarvis] Interrompendo fila para mensagem prioritária');
      speechQueueRef.current.forEach(msg => msg.resolve()); // Resolve pendentes
      speechQueueRef.current = [];
      stopSpeaking();
      isProcessingQueueRef.current = false;
      updateQueueLength();
      
      // Fala imediatamente
      await speakAndWait(text);
      return;
    }

    return new Promise((resolve) => {
      // Adiciona à fila
      speechQueueRef.current.push({ text, priority, resolve });
      
      // Ordena por prioridade (maior primeiro)
      speechQueueRef.current.sort((a, b) => b.priority - a.priority);
      
      updateQueueLength();
      console.log(`[Jarvis] Mensagem adicionada à fila - Total: ${speechQueueRef.current.length}`);
      
      // Inicia processamento se não estiver processando
      if (!isProcessingQueueRef.current) {
        processQueue();
      }
    });
  }, [speakAndWait, processQueue, updateQueueLength, stopSpeaking]);

  // Função de teste de áudio
  const testAudio = useCallback(() => {
    const message = settings.aiProvider === 'openai' && settings.openaiTTSEnabled && settings.openaiApiKey
      ? 'Modo premium ativado. Jarvis operacional com voz de alta qualidade.'
      : 'Sistema de áudio sincronizado. Jarvis operacional, piloto.';
    speak(message, { interrupt: true }); // Interrompe qualquer fala atual para teste
  }, [speak, settings.aiProvider, settings.openaiTTSEnabled, settings.openaiApiKey]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      speechQueueRef.current.forEach(msg => msg.resolve());
      speechQueueRef.current = [];
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    speak,
    stopSpeaking,
    testAudio,
    isSpeaking,
    isSupported,
    queueLength
  };
}
