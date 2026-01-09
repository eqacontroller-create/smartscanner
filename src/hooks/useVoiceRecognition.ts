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
  language?: string;
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
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
    language = 'pt-BR'
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isManuallyStoppedRef = useRef(false);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Inicializar reconhecimento de voz
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    recognition.continuous = continuous;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const text = lastResult[0].transcript.trim();
        setTranscript(text);
        onResult?.(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignorar erros de "no-speech" e "aborted" quando parado manualmente
      if (event.error === 'no-speech' || event.error === 'aborted') {
        if (!isManuallyStoppedRef.current) {
          setError('Nenhuma fala detectada');
        }
        return;
      }
      
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      onError?.(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      isManuallyStoppedRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported, continuous, language, onResult, onError]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || isListening) return;
    
    setTranscript('');
    setError(null);
    isManuallyStoppedRef.current = false;
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Erro ao iniciar reconhecimento:', err);
      setError('Erro ao iniciar reconhecimento de voz');
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    isManuallyStoppedRef.current = true;
    recognitionRef.current.stop();
  }, [isListening]);

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
