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
   * Busca veículo por VIN
   */
  async getByVIN(vin: string): Promise<VehicleData | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vin', vin)
      .maybeSingle();

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
   * Cria novo veículo
   */
  async create(vehicle: Omit<VehicleData, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle as any)
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
   * Obtém ou cria veículo pelo VIN
   */
  async getOrCreate(vehicleInfo: {
    vin: string;
    manufacturer?: string | null;
    country?: string | null;
    modelYear?: string | null;
    manufacturerGroup?: string | null;
  }): Promise<string | null> {
    try {
      // Tentar encontrar veículo existente
      const existing = await this.getByVIN(vehicleInfo.vin);
      
      if (existing) {
        return existing.id;
      }

      // Criar novo veículo
      return await this.create({
        vin: vehicleInfo.vin,
        manufacturer: vehicleInfo.manufacturer,
        country: vehicleInfo.country,
        model_year: vehicleInfo.modelYear,
        manufacturer_group: vehicleInfo.manufacturerGroup,
      });
    } catch (error) {
      console.error('[VehicleService] Error in getOrCreate:', error);
      return null;
    }
  },
};
