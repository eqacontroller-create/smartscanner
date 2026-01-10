import { useState, useCallback, useRef, useEffect } from 'react';
import { useVoiceRecognition } from './useVoiceRecognition';
import { useJarvis } from './useJarvis';
import { JarvisSettings, defaultJarvisSettings } from '@/types/jarvisSettings';
import { TripData } from '@/types/tripSettings';
import { supabase } from '@/integrations/supabase/client';

interface VehicleContext {
  rpm: number | null;
  speed: number | null;
  temperature: number | null;
  voltage: number | null;
  fuelLevel: number | null;
  engineLoad: number | null;
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
  tripData?: TripData;
}

interface UseJarvisAIReturn {
  // Estado
  isListening: boolean;
  isContinuousMode: boolean;
  isWakeWordDetected: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  lastTranscript: string;
  interimTranscript: string;
  lastResponse: string;
  conversationHistory: Message[];
  error: string | null;
  
  // Ações
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  toggleContinuousMode: () => void;
  clearHistory: () => void;
  
  // Suporte
  isSupported: boolean;
  isVoiceSupported: boolean;
}

// Detectar wake word no texto
function detectWakeWord(text: string, wakeWord: string): { detected: boolean; command: string } {
  const lowerText = text.toLowerCase().trim();
  const lowerWakeWord = wakeWord.toLowerCase().trim();
  
  // Verificar se contém a wake word
  const wakeWordIndex = lowerText.indexOf(lowerWakeWord);
  
  if (wakeWordIndex === -1) {
    return { detected: false, command: '' };
  }
  
  // Extrair o comando após a wake word
  const afterWakeWord = text.substring(wakeWordIndex + wakeWord.length).trim();
  
  // Remover vírgulas ou pontuação inicial
  const command = afterWakeWord.replace(/^[,\s]+/, '').trim();
  
  return { detected: true, command };
}

export function useJarvisAI(options: UseJarvisAIOptions): UseJarvisAIReturn {
  const { settings = defaultJarvisSettings, vehicleContext, tripData } = options;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [isWakeWordDetected, setIsWakeWordDetected] = useState(false);
  const [displayTranscript, setDisplayTranscript] = useState('');
  
  const vehicleContextRef = useRef(vehicleContext);
  const tripDataRef = useRef(tripData);
  const isProcessingRef = useRef(false);
  const wakeWordCooldownRef = useRef(false);
  const settingsRef = useRef(settings);
  
  // Atualizar refs quando mudarem
  useEffect(() => {
    vehicleContextRef.current = vehicleContext;
  }, [vehicleContext]);
  
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  
  useEffect(() => {
    tripDataRef.current = tripData;
  }, [tripData]);

  // Hook de síntese de voz (TTS)
  const { speak, isSpeaking, isSupported: isTTSSupported } = useJarvis({ settings });

  // Processar resposta da IA
  const processWithAI = useCallback(async (userMessage: string) => {
    if (isProcessingRef.current || !userMessage.trim()) return;
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    setAiError(null);
    setDisplayTranscript(userMessage);
    
    try {
      // Adicionar mensagem do usuário ao histórico
      const newUserMessage: Message = { role: 'user', content: userMessage };
      setConversationHistory(prev => [...prev, newUserMessage]);
      
      const { data, error } = await supabase.functions.invoke('jarvis-ai', {
        body: {
          message: userMessage,
          vehicleContext: vehicleContextRef.current,
          tripData: tripDataRef.current,
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
      setIsWakeWordDetected(false);
      
      // Cooldown para evitar reativação imediata pela própria fala
      wakeWordCooldownRef.current = true;
      setTimeout(() => {
        wakeWordCooldownRef.current = false;
      }, 2000);
    }
  }, [conversationHistory, speak]);

  // Callback quando reconhecimento detecta fala
  const handleVoiceResult = useCallback((transcript: string) => {
    if (!transcript.trim() || !settingsRef.current.aiModeEnabled) return;
    
    // Modo contínuo: verificar wake word
    if (isContinuousMode && settingsRef.current.continuousListening) {
      // Ignorar durante cooldown (evitar capturar própria fala)
      if (wakeWordCooldownRef.current) return;
      
      const { detected, command } = detectWakeWord(transcript, settingsRef.current.wakeWord);
      
      if (detected) {
        setIsWakeWordDetected(true);
        setDisplayTranscript(transcript);
        
        // Se há um comando após a wake word, processar
        if (command) {
          processWithAI(command);
        } else {
          // Wake word detectada, mas sem comando - dar feedback
          speak('Sim?');
          setIsWakeWordDetected(false);
        }
      }
    } else {
      // Modo normal: processar diretamente
      processWithAI(transcript);
    }
  }, [processWithAI, isContinuousMode, speak]);

  // Hook de reconhecimento de voz (STT)
  const { 
    isListening, 
    isSupported: isSTTSupported, 
    transcript: lastTranscript,
    interimTranscript,
    error: voiceError,
    startListening: startVoiceListening,
    stopListening: stopVoiceListening,
    toggleListening: toggleVoiceListening,
  } = useVoiceRecognition({
    onResult: handleVoiceResult,
    language: 'pt-BR',
    continuous: isContinuousMode && settings.continuousListening,
    interimResults: isContinuousMode && settings.continuousListening,
    autoRestart: isContinuousMode && settings.continuousListening,
  });

  // Sincronizar modo contínuo com configurações
  useEffect(() => {
    if (!settings.continuousListening && isContinuousMode) {
      setIsContinuousMode(false);
      stopVoiceListening();
    }
  }, [settings.continuousListening, isContinuousMode, stopVoiceListening]);

  // Toggle do modo contínuo
  const toggleContinuousMode = useCallback(() => {
    if (!settings.continuousListening) return;
    
    if (isContinuousMode) {
      setIsContinuousMode(false);
      stopVoiceListening();
    } else {
      setIsContinuousMode(true);
      startVoiceListening();
    }
  }, [isContinuousMode, settings.continuousListening, startVoiceListening, stopVoiceListening]);

  // Wrapper para toggle de escuta
  const toggleListening = useCallback(() => {
    if (settings.continuousListening) {
      toggleContinuousMode();
    } else {
      toggleVoiceListening();
    }
  }, [settings.continuousListening, toggleContinuousMode, toggleVoiceListening]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLastResponse('');
    setDisplayTranscript('');
  }, []);

  // Combinar erros
  const combinedError = aiError || voiceError;

  return {
    isListening,
    isContinuousMode,
    isWakeWordDetected,
    isProcessing,
    isSpeaking,
    lastTranscript: displayTranscript || lastTranscript,
    interimTranscript,
    lastResponse,
    conversationHistory,
    error: combinedError,
    startListening: isContinuousMode ? toggleContinuousMode : startVoiceListening,
    stopListening: stopVoiceListening,
    toggleListening,
    toggleContinuousMode,
    clearHistory,
    isSupported: isSTTSupported && isTTSSupported,
    isVoiceSupported: isSTTSupported,
  };
}
