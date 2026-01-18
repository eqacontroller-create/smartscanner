// Jarvis AI Service
// Chamadas à Edge Function jarvis-ai com suporte a streaming

import { supabase } from '@/integrations/supabase/client';

export interface VehicleContext {
  rpm: number | null;
  speed: number | null;
  temperature: number | null;
  voltage: number | null;
  fuelLevel: number | null;
  engineLoad: number | null;
  isConnected: boolean;
  isPolling: boolean;
  brand?: string;
  brandCharacteristics?: string;
  modelYear?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface TripData {
  distance: number;
  cost: number;
  duration: number;
  averageSpeed: number;
  costPerKm: number;
}

export interface JarvisRequest {
  message: string;
  vehicleContext: VehicleContext;
  tripData?: TripData;
  conversationHistory?: Message[];
}

export interface JarvisResponse {
  response: string;
  error?: string;
}

// URL base do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const JarvisService = {
  /**
   * Envia mensagem para o Jarvis AI (non-streaming)
   */
  async chat(request: JarvisRequest): Promise<JarvisResponse> {
    const { data, error } = await supabase.functions.invoke('jarvis-ai', {
      body: {
        message: request.message,
        vehicleContext: request.vehicleContext,
        tripData: request.tripData,
        conversationHistory: request.conversationHistory,
        stream: false,
      },
    });

    if (error) {
      console.error('[JarvisService] Error calling jarvis-ai:', error);
      throw new Error(error.message);
    }

    return {
      response: data?.response || 'Desculpe, não entendi.',
      error: data?.error,
    };
  },

  /**
   * Streaming chat - retorna tokens progressivamente
   */
  async streamChat(
    request: JarvisRequest,
    onDelta: (text: string) => void,
    onDone: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/jarvis-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          message: request.message,
          vehicleContext: request.vehicleContext,
          tripData: request.tripData,
          conversationHistory: request.conversationHistory,
          stream: true,
        }),
      });

      // Verificar erros HTTP
      if (!response.ok) {
        if (response.status === 429) {
          onError('Muitas solicitações. Aguarde alguns segundos.');
          onDone();
          return;
        }
        if (response.status === 402) {
          onError('Limite de uso atingido.');
          onDone();
          return;
        }
        onError('Erro ao processar solicitação.');
        onDone();
        return;
      }

      if (!response.body) {
        onError('Resposta vazia.');
        onDone();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        // Processar linha por linha
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          // Handle CRLF
          if (line.endsWith('\r')) line = line.slice(0, -1);
          
          // Ignorar comentários SSE e linhas vazias
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              onDelta(content);
            }
          } catch {
            // JSON incompleto - guardar para próxima iteração
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Processar buffer restante
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch {
            // Ignorar JSON incompleto no final
          }
        }
      }

      onDone();
    } catch (error) {
      console.error('[JarvisService] Stream error:', error);
      onError('Erro de conexão. Tente novamente.');
      onDone();
    }
  },
};
