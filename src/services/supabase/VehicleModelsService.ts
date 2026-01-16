/**
 * VehicleModelsService - CRUD para modelos de veículos
 */

import { supabase } from '@/integrations/supabase/client';

export interface EngineOption {
  name: string;
  displacement?: string;
  fuel?: string;
}

export interface CommonIssue {
  title: string;
  severity: 'info' | 'warning' | 'critical';
  description?: string;
}

export interface VehicleModelData {
  id: string;
  brand: string;
  model_name: string;
  model_code?: string | null;
  years_available: string;
  engine_options: string[] | EngineOption[];
  popular_parts: Record<string, string>;
  common_issues: CommonIssue[];
  maintenance_schedule?: Record<string, number>;
  created_at?: string;
  updated_at?: string;
}

export const VehicleModelsService = {
  /**
   * Lista todas as marcas disponíveis
   */
  async getBrands(): Promise<string[]> {
    const { data, error } = await supabase
      .from('vehicle_models')
      .select('brand')
      .order('brand');
    
    if (error) {
      console.error('[VehicleModelsService] Error fetching brands:', error);
      throw error;
    }
    
    // Remove duplicados
    const brands = [...new Set((data || []).map(d => d.brand))];
    return brands;
  },

  /**
   * Lista modelos de uma marca
   */
  async getModelsByBrand(brand: string): Promise<VehicleModelData[]> {
    const { data, error } = await supabase
      .from('vehicle_models')
      .select('*')
      .eq('brand', brand.toLowerCase())
      .order('model_name');
    
    if (error) {
      console.error('[VehicleModelsService] Error fetching models:', error);
      throw error;
    }
    
    return (data || []) as unknown as VehicleModelData[];
  },

  /**
   * Busca modelo por marca e nome
   */
  async getModel(brand: string, modelName: string): Promise<VehicleModelData | null> {
    const { data, error } = await supabase
      .from('vehicle_models')
      .select('*')
      .eq('brand', brand.toLowerCase())
      .eq('model_name', modelName)
      .maybeSingle();
    
    if (error) {
      console.error('[VehicleModelsService] Error fetching model:', error);
      throw error;
    }
    
    return data as unknown as VehicleModelData | null;
  },

  /**
   * Busca modelo por ID
   */
  async getById(id: string): Promise<VehicleModelData | null> {
    const { data, error } = await supabase
      .from('vehicle_models')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('[VehicleModelsService] Error fetching model by ID:', error);
      throw error;
    }
    
    return data as unknown as VehicleModelData | null;
  },

  /**
   * Gera range de anos a partir do years_available
   */
  parseYearsRange(yearsAvailable: string): number[] {
    const [start, end] = yearsAvailable.split('-').map(y => parseInt(y.trim()));
    const years: number[] = [];
    const currentYear = new Date().getFullYear();
    const endYear = end || currentYear;
    
    for (let year = start; year <= endYear; year++) {
      years.push(year);
    }
    
    return years.reverse(); // Mais recentes primeiro
  },

  /**
   * Extrai motores do modelo
   */
  parseEngineOptions(engineOptions: string[] | EngineOption[]): string[] {
    if (!Array.isArray(engineOptions)) return [];
    
    return engineOptions.map(opt => {
      if (typeof opt === 'string') return opt;
      return opt.name;
    });
  },
};
