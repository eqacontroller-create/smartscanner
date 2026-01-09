import { useState, useCallback, useRef, useEffect } from 'react';
import { useVoiceRecognition } from './useVoiceRecognition';
import { useJarvis } from './useJarvis';
import { JarvisSettings, defaultJarvisSettings } from '@/types/jarvisSettings';
import { supabase } from '@/integrations/supabase/client';

interface VehicleContext {
  rpm: number | null;
  speed: number | null;
  temperature: number | null;
  isConnected: boolean;
  isPolling: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseJarvisAIOptions {
  settings?: JarvisSettings;
  vehicleContext: VehicleContext;
}

interface UseJarvisAIReturn {
  // Estado
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  lastTranscript: string;
  lastResponse: string;
  conversationHistory: Message[];
  error: string | null;
  
  // Ações
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  clearHistory: () => void;
  
  // Suporte
  isSupported: boolean;
  isVoiceSupported: boolean;
}

export function useJarvisAI(options: UseJarvisAIOptions): UseJarvisAIReturn {
  const { settings = defaultJarvisSettings, vehicleContext } = options;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const vehicleContextRef = useRef(vehicleContext);
  const isProcessingRef = useRef(false);
  
  // Atualizar ref do contexto quando mudar
  useEffect(() => {
    vehicleContextRef.current = vehicleContext;
  }, [vehicleContext]);

  // Hook de síntese de voz (TTS)
  const { speak, isSpeaking, isSupported: isTTSSupported, stopSpeaking } = useJarvis({ settings });

  // Processar resposta da IA
  const processWithAI = useCallback(async (userMessage: string) => {
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    setAiError(null);
    
    try {
      // Adicionar mensagem do usuário ao histórico
      const newUserMessage: Message = { role: 'user', content: userMessage };
      setConversationHistory(prev => [...prev, newUserMessage]);
      
      const { data, error } = await supabase.functions.invoke('jarvis-ai', {
        body: {
          message: userMessage,
          vehicleContext: vehicleContextRef.current,
          conversationHistory: conversationHistory.slice(-6),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const aiResponse = data?.response || 'Desculpe, não entendi.';
      setLastResponse(aiResponse);
      
      // Adicionar resposta ao histórico
      const newAssistantMessage: Message = { role: 'assistant', content: aiResponse };
      setConversationHistory(prev => [...prev, newAssistantMessage]);
      
      // Falar a resposta
      speak(aiResponse);
      
    } catch (err) {
      console.error('Erro ao processar com IA:', err);
      const errorMessage = 'Desculpe, houve um erro ao processar sua solicitação.';
      setAiError(errorMessage);
      speak(errorMessage);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [conversationHistory, speak]);

  // Callback quando reconhecimento detecta fala
  const handleVoiceResult = useCallback((transcript: string) => {
    if (!transcript.trim() || !settings.aiModeEnabled) return;
    processWithAI(transcript);
  }, [processWithAI, settings.aiModeEnabled]);

  // Hook de reconhecimento de voz (STT)
  const { 
    isListening, 
    isSupported: isSTTSupported, 
    transcript: lastTranscript,
    error: voiceError,
    startListening,
    stopListening,
    toggleListening,
  } = useVoiceRecognition({
    onResult: handleVoiceResult,
    language: 'pt-BR',
    continuous: false,
  });

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLastResponse('');
  }, []);

  // Combinar erros
  const combinedError = aiError || voiceError;

  return {
    isListening,
    isProcessing,
    isSpeaking,
    lastTranscript,
    lastResponse,
    conversationHistory,
    error: combinedError,
    startListening,
    stopListening,
    toggleListening,
    clearHistory,
    isSupported: isSTTSupported && isTTSSupported,
    isVoiceSupported: isSTTSupported,
  };
}
