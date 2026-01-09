import { useState, useCallback, useRef, useEffect } from 'react';

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

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Inicializar reconhecimento de voz
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
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
        onResult?.(trimmedText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignorar erros de "no-speech" e "aborted" quando parado manualmente
      if (event.error === 'no-speech' || event.error === 'aborted') {
        if (!isManuallyStoppedRef.current && autoRestart && shouldRestartRef.current) {
          // Reiniciar automaticamente se configurado
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                // Ignorar erro se já estiver escutando
              }
            }
          }, 100);
        }
        return;
      }
      
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      onError?.(errorMessage);
      setIsListening(false);
      shouldRestartRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Auto-restart se configurado e não foi parado manualmente
      if (autoRestart && shouldRestartRef.current && !isManuallyStoppedRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Ignorar erro se já estiver escutando
            }
          }
        }, 100);
      }
      
      isManuallyStoppedRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      recognition.abort();
    };
  }, [isSupported, continuous, interimResults, language, onResult, onError, autoRestart]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    
    // Se já está escutando, não fazer nada
    if (isListening) return;
    
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    isManuallyStoppedRef.current = false;
    shouldRestartRef.current = autoRestart;
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Erro ao iniciar reconhecimento:', err);
      setError('Erro ao iniciar reconhecimento de voz');
    }
  }, [isSupported, isListening, autoRestart]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    isManuallyStoppedRef.current = true;
    shouldRestartRef.current = false;
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
