/**
 * Serviço para gerenciar histórico de diagnósticos visuais
 */

import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';

export interface VisualDiagnosis {
  id: string;
  user_id: string;
  created_at: string;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  vehicle_engine: string | null;
  media_type: 'image' | 'video';
  analysis_type: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  title: string;
  description: string;
  recommendation: string | null;
  parts_mentioned: string[];
  thumbnail_url: string | null;
  notes: string | null;
}

export interface CreateVisualDiagnosis {
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: string | null;
  vehicle_engine?: string | null;
  media_type: 'image' | 'video';
  analysis_type: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  title: string;
  description: string;
  recommendation?: string | null;
  parts_mentioned?: string[];
  notes?: string | null;
}

export const VisualDiagnosisService = {
  /**
   * Busca todos os diagnósticos do usuário (filtro explícito por user_id)
   */
  async getAll(userId: string, limit = 50): Promise<VisualDiagnosis[]> {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('visual_diagnoses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Erro ao buscar diagnósticos:', error);
      throw error;
    }

    return (data || []).map(d => ({
      ...d,
      media_type: d.media_type as 'image' | 'video',
      risk_level: d.risk_level as VisualDiagnosis['risk_level'],
      parts_mentioned: (d.parts_mentioned as string[]) || [],
    }));
  },

  /**
   * Busca um diagnóstico por ID
   */
  async getById(id: string): Promise<VisualDiagnosis | null> {
    const { data, error } = await supabase
      .from('visual_diagnoses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('Erro ao buscar diagnóstico:', error);
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      media_type: data.media_type as 'image' | 'video',
      risk_level: data.risk_level as VisualDiagnosis['risk_level'],
      parts_mentioned: (data.parts_mentioned as string[]) || [],
    };
  },

  /**
   * Cria um novo diagnóstico
   */
  async create(userId: string, diagnosis: CreateVisualDiagnosis): Promise<VisualDiagnosis> {
    const { data, error } = await supabase
      .from('visual_diagnoses')
      .insert({
        user_id: userId,
        vehicle_brand: diagnosis.vehicle_brand,
        vehicle_model: diagnosis.vehicle_model,
        vehicle_year: diagnosis.vehicle_year,
        vehicle_engine: diagnosis.vehicle_engine,
        media_type: diagnosis.media_type,
        analysis_type: diagnosis.analysis_type,
        risk_level: diagnosis.risk_level,
        title: diagnosis.title,
        description: diagnosis.description,
        recommendation: diagnosis.recommendation,
        parts_mentioned: diagnosis.parts_mentioned || [],
        notes: diagnosis.notes,
      })
      .select()
      .single();

    if (error) {
      logger.error('Erro ao criar diagnóstico:', error);
      throw error;
    }

    return {
      ...data,
      media_type: data.media_type as 'image' | 'video',
      risk_level: data.risk_level as VisualDiagnosis['risk_level'],
      parts_mentioned: (data.parts_mentioned as string[]) || [],
    };
  },

  /**
   * Adiciona nota a um diagnóstico
   */
  async addNote(id: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('visual_diagnoses')
      .update({ notes })
      .eq('id', id);

    if (error) {
      logger.error('Erro ao atualizar nota:', error);
      throw error;
    }
  },

  /**
   * Remove um diagnóstico
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('visual_diagnoses')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Erro ao remover diagnóstico:', error);
      throw error;
    }
  },

  /**
   * Busca diagnósticos por veículo (filtro explícito por user_id)
   */
  async getByVehicle(userId: string, brand: string, model?: string): Promise<VisualDiagnosis[]> {
    if (!userId) return [];
    
    let query = supabase
      .from('visual_diagnoses')
      .select('*')
      .eq('user_id', userId)
      .eq('vehicle_brand', brand);

    if (model) {
      query = query.eq('vehicle_model', model);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      logger.error('Erro ao buscar diagnósticos por veículo:', error);
      throw error;
    }

    return (data || []).map(d => ({
      ...d,
      media_type: d.media_type as 'image' | 'video',
      risk_level: d.risk_level as VisualDiagnosis['risk_level'],
      parts_mentioned: (d.parts_mentioned as string[]) || [],
    }));
  },
};
