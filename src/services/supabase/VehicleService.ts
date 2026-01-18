// Vehicle Service
// Operações CRUD para veículos no Supabase

import { supabase } from '@/integrations/supabase/client';

export interface VehicleData {
  id: string;
  vin: string;
  manufacturer?: string | null;
  country?: string | null;
  model_year?: string | null;
  manufacturer_group?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const VehicleService = {
  /**
   * Busca veículo por VIN para um usuário específico
   */
  async getByVIN(vin: string, userId?: string): Promise<VehicleData | null> {
    let query = supabase
      .from('vehicles')
      .select('*')
      .eq('vin', vin);

    // Filtrar por usuário se fornecido
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[VehicleService] Error fetching vehicle:', error);
      throw error;
    }

    return data as VehicleData | null;
  },

  /**
   * Busca veículo por ID
   */
  async getById(id: string): Promise<VehicleData | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[VehicleService] Error fetching vehicle by ID:', error);
      throw error;
    }

    return data as VehicleData | null;
  },

  /**
   * Cria novo veículo com user_id obrigatório
   */
  async create(
    vehicle: Omit<VehicleData, 'id' | 'created_at' | 'updated_at'>,
    userId: string
  ): Promise<string | null> {
    if (!userId) {
      console.error('[VehicleService] user_id is required to create vehicle');
      return null;
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert({ ...vehicle, user_id: userId } as any)
      .select('id')
      .single();

    if (error) {
      console.error('[VehicleService] Error creating vehicle:', error);
      throw error;
    }

    return data?.id || null;
  },

  /**
   * Atualiza veículo existente
   */
  async update(id: string, updates: Partial<VehicleData>): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .update(updates as any)
      .eq('id', id);

    if (error) {
      console.error('[VehicleService] Error updating vehicle:', error);
      throw error;
    }
  },

  /**
   * Obtém ou cria veículo pelo VIN para um usuário específico
   */
  async getOrCreate(
    vehicleInfo: {
      vin: string;
      manufacturer?: string | null;
      country?: string | null;
      modelYear?: string | null;
      manufacturerGroup?: string | null;
    },
    userId: string
  ): Promise<string | null> {
    if (!userId) {
      console.error('[VehicleService] user_id is required');
      return null;
    }

    try {
      // Tentar encontrar veículo existente para este usuário
      const existing = await this.getByVIN(vehicleInfo.vin, userId);
      
      if (existing) {
        return existing.id;
      }

      // Criar novo veículo para este usuário
      return await this.create({
        vin: vehicleInfo.vin,
        manufacturer: vehicleInfo.manufacturer,
        country: vehicleInfo.country,
        model_year: vehicleInfo.modelYear,
        manufacturer_group: vehicleInfo.manufacturerGroup,
      }, userId);
    } catch (error) {
      console.error('[VehicleService] Error in getOrCreate:', error);
      return null;
    }
  },

  /**
   * Lista todos os veículos do usuário
   */
  async listByUser(userId: string): Promise<VehicleData[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[VehicleService] Error listing vehicles:', error);
      return [];
    }

    return (data || []) as VehicleData[];
  },
};
