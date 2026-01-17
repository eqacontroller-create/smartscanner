// Profile Service
// Operações CRUD para perfis de usuário no Supabase

import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';

export interface ProfileData {
  id: string;
  // Vehicle
  vin?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  model_year?: string | null;
  vehicle_engine?: string | null;
  vehicle_transmission?: string | null;
  vehicle_nickname?: string | null;
  // Fuel/Trip
  fuel_price?: number | null;
  average_consumption?: number | null;
  vehicle_cost_per_km?: number | null;
  fuel_type?: string | null;
  // Auto-ride
  auto_ride_enabled?: boolean | null;
  auto_start_delay?: number | null;
  auto_stop_delay?: number | null;
  speed_threshold?: number | null;
  // Jarvis settings
  redline_rpm?: number | null;
  high_temp_threshold?: number | null;
  speed_limit?: number | null;
  low_voltage_threshold?: number | null;
  current_mileage?: number | null;
  // Alerts
  welcome_enabled?: boolean | null;
  high_rpm_alert_enabled?: boolean | null;
  high_temp_alert_enabled?: boolean | null;
  speed_alert_enabled?: boolean | null;
  low_voltage_alert_enabled?: boolean | null;
  maintenance_alert_enabled?: boolean | null;
  shift_light_enabled?: boolean | null;
  lugging_alert_enabled?: boolean | null;
  ai_mode_enabled?: boolean | null;
  keep_awake_enabled?: boolean | null;
  // Voice
  voice_volume?: number | null;
  voice_rate?: number | null;
  voice_pitch?: number | null;
  selected_voice_uri?: string | null;
  // AI
  ai_provider?: string | null;
  openai_api_key?: string | null;
  openai_voice?: string | null;
  openai_tts_enabled?: boolean | null;
  // Refuel
  refuel_settings?: Record<string, unknown> | null;
  // Timestamps
  created_at?: string | null;
  updated_at?: string | null;
}

export const ProfileService = {
  /**
   * Busca perfil por ID do usuário
   */
  async getById(userId: string): Promise<ProfileData | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      logger.error('[ProfileService] Error fetching profile:', error);
      throw error;
    }
    
    return data as ProfileData | null;
  },

  /**
   * Cria ou atualiza perfil (upsert)
   */
  async upsert(profile: ProfileData): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .upsert(profile as any);
    
    if (error) {
      logger.error('[ProfileService] Error upserting profile:', error);
      throw error;
    }
  },

  /**
   * Insere novo perfil
   */
  async insert(profile: ProfileData): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .insert(profile as any);
    
    if (error) {
      logger.error('[ProfileService] Error inserting profile:', error);
      throw error;
    }
  },

  /**
   * Atualiza perfil existente
   */
  async update(userId: string, updates: Partial<ProfileData>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(updates as any)
      .eq('id', userId);
    
    if (error) {
      logger.error('[ProfileService] Error updating profile:', error);
      throw error;
    }
  },
};
