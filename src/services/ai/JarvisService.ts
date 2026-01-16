// Jarvis AI Service
// Chamadas à Edge Function jarvis-ai

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

export const JarvisService = {
  /**
   * Envia mensagem para o Jarvis AI
   */
  async chat(request: JarvisRequest): Promise<JarvisResponse> {
    const { data, error } = await supabase.functions.invoke('jarvis-ai', {
      body: {
        message: request.message,
        vehicleContext: request.vehicleContext,
        tripData: request.tripData,
        conversationHistory: request.conversationHistory,
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
};
