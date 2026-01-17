import { useState, useCallback, useRef, useEffect } from 'react';
import logger from '@/lib/logger';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseVoiceRecognitionOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  autoRestart?: boolean;
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}): UseVoiceRecognitionReturn {
  const {
    onResult,
    onError,
    continuous = false,
    interimResults = false,
    language = 'pt-BR',
    autoRestart = false,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isManuallyStoppedRef = useRef(false);
  const shouldRestartRef = useRef(false);
  const isStartingRef = useRef(false);
  
  // Usar refs para options que podem mudar - evita reinicialização do recognition
  const continuousRef = useRef(continuous);
  const interimResultsRef = useRef(interimResults);
  const autoRestartRef = useRef(autoRestart);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  
  // Atualizar refs quando options mudam
  useEffect(() => {
    continuousRef.current = continuous;
    interimResultsRef.current = interimResults;
    autoRestartRef.current = autoRestart;
    onResultRef.current = onResult;
    onErrorRef.current = onError;
    
    // Atualizar propriedades do recognition existente sem reinstanciar
    if (recognitionRef.current) {
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
    }
  }, [continuous, interimResults, autoRestart, onResult, onError]);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Inicializar reconhecimento de voz - apenas uma vez
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    recognition.continuous = continuousRef.current;
    recognition.interimResults = interimResultsRef.current;
    recognition.lang = language;

    recognition.onstart = () => {
      isStartingRef.current = false;
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      
      if (interimText) {
        setInterimTranscript(interimText);
      }
      
      if (finalText) {
        const trimmedText = finalText.trim();
        setTranscript(trimmedText);
        setInterimTranscript('');
        onResultRef.current?.(trimmedText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      isStartingRef.current = false;
      
      // Ignorar erros de "no-speech" e "aborted" quando parado manualmente
      if (event.error === 'no-speech' || event.error === 'aborted') {
        if (!isManuallyStoppedRef.current && autoRestartRef.current && shouldRestartRef.current) {
          // Reiniciar automaticamente se configurado
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current && !isStartingRef.current) {
              try {
                isStartingRef.current = true;
                recognitionRef.current.start();
              } catch (e) {
                isStartingRef.current = false;
                // Ignorar erro se já estiver escutando
              }
            }
          }, 300);
        }
        return;
      }
      
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
      setIsListening(false);
      shouldRestartRef.current = false;
    };

    recognition.onend = () => {
      isStartingRef.current = false;
      setIsListening(false);
      
      // Auto-restart se configurado e não foi parado manualmente
      if (autoRestartRef.current && shouldRestartRef.current && !isManuallyStoppedRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current && recognitionRef.current && !isStartingRef.current) {
            try {
              isStartingRef.current = true;
              recognitionRef.current.start();
            } catch (e) {
              isStartingRef.current = false;
              // Ignorar erro se já estiver escutando
            }
          }
        }, 300);
      }
      
      isManuallyStoppedRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      isStartingRef.current = false;
      recognition.abort();
    };
  }, [isSupported, language]); // Removido continuous, interimResults, autoRestart, onResult, onError

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    
    // Se já está escutando ou iniciando, não fazer nada
    if (isListening || isStartingRef.current) return;
    
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    isManuallyStoppedRef.current = false;
    shouldRestartRef.current = autoRestartRef.current;
    
    try {
      isStartingRef.current = true;
      recognitionRef.current.start();
    } catch (err) {
      isStartingRef.current = false;
      logger.error('Erro ao iniciar reconhecimento:', err);
      setError('Erro ao iniciar reconhecimento de voz');
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    isManuallyStoppedRef.current = true;
    shouldRestartRef.current = false;
    isStartingRef.current = false;
    recognitionRef.current.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
      return 'Permissão de microfone negada';
    case 'no-speech':
      return 'Nenhuma fala detectada';
    case 'audio-capture':
      return 'Microfone não encontrado';
    case 'network':
      return 'Erro de rede';
    case 'service-not-allowed':
      return 'Serviço de reconhecimento não disponível';
    default:
      return `Erro de reconhecimento: ${error}`;
  }
}
