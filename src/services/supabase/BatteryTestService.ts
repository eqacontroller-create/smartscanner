/**
 * Service para gerenciar histórico de testes de bateria
 */

import { supabase } from '@/integrations/supabase/client';

export interface BatteryTestRecord {
  id: string;
  user_id: string;
  created_at: string;
  
  // Vehicle info
  vin: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  ambient_temp_celsius: number | null;
  
  // Cranking metrics
  resting_voltage: number;
  min_cranking_voltage: number;
  cranking_duration_ms: number;
  voltage_recovery_ms: number | null;
  
  // Post-start metrics
  post_start_voltage: number | null;
  alternator_voltage: number | null;
  
  // Diagnoses
  battery_status: 'excellent' | 'good' | 'weak' | 'critical';
  battery_message: string | null;
  alternator_status: 'excellent' | 'good' | 'weak' | 'not_charging' | null;
  alternator_message: string | null;
  
  // Raw data
  voltage_samples: { timestamp: number; voltage: number }[];
  
  // Notes
  notes: string | null;
}

export interface CreateBatteryTest {
  vin?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  ambient_temp_celsius?: number;
  resting_voltage: number;
  min_cranking_voltage: number;
  cranking_duration_ms: number;
  voltage_recovery_ms?: number;
  post_start_voltage?: number;
  alternator_voltage?: number;
  battery_status: 'excellent' | 'good' | 'weak' | 'critical';
  battery_message?: string;
  alternator_status?: 'excellent' | 'good' | 'weak' | 'not_charging';
  alternator_message?: string;
  voltage_samples?: { timestamp: number; voltage: number }[];
  notes?: string;
}

export interface BatteryTrend {
  averageRestingVoltage: number;
  averageMinCranking: number;
  voltageDeclinePerMonth: number;
  estimatedMonthsRemaining: number | null;
  healthTrend: 'improving' | 'stable' | 'declining' | 'critical';
  recommendation: string;
}

export const BatteryTestService = {
  /**
   * Salva um novo teste de bateria
   */
  async create(userId: string, data: CreateBatteryTest): Promise<BatteryTestRecord> {
    const { data: result, error } = await supabase
      .from('battery_tests')
      .insert({
        user_id: userId,
        vin: data.vin || null,
        vehicle_brand: data.vehicle_brand || null,
        vehicle_model: data.vehicle_model || null,
        ambient_temp_celsius: data.ambient_temp_celsius || null,
        resting_voltage: data.resting_voltage,
        min_cranking_voltage: data.min_cranking_voltage,
        cranking_duration_ms: data.cranking_duration_ms,
        voltage_recovery_ms: data.voltage_recovery_ms || null,
        post_start_voltage: data.post_start_voltage || null,
        alternator_voltage: data.alternator_voltage || null,
        battery_status: data.battery_status,
        battery_message: data.battery_message || null,
        alternator_status: data.alternator_status || null,
        alternator_message: data.alternator_message || null,
        voltage_samples: data.voltage_samples || [],
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return result as unknown as BatteryTestRecord;
  },

  /**
   * Busca todos os testes do usuário
   */
  async getAll(limit = 50): Promise<BatteryTestRecord[]> {
    const { data, error } = await supabase
      .from('battery_tests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as unknown as BatteryTestRecord[];
  },

  /**
   * Busca testes por VIN
   */
  async getByVIN(vin: string, limit = 20): Promise<BatteryTestRecord[]> {
    const { data, error } = await supabase
      .from('battery_tests')
      .select('*')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as unknown as BatteryTestRecord[];
  },

  /**
   * Deleta um teste
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('battery_tests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Calcula tendência de degradação da bateria
   */
  calculateTrend(tests: BatteryTestRecord[]): BatteryTrend | null {
    if (tests.length < 2) {
      return null;
    }

    // Ordenar por data (mais antigo primeiro)
    const sorted = [...tests].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Calcular médias
    const avgResting = sorted.reduce((sum, t) => sum + t.resting_voltage, 0) / sorted.length;
    const avgMinCranking = sorted.reduce((sum, t) => sum + t.min_cranking_voltage, 0) / sorted.length;

    // Calcular declínio por mês usando regressão linear
    const firstTest = sorted[0];
    const lastTest = sorted[sorted.length - 1];
    const monthsBetween = 
      (new Date(lastTest.created_at).getTime() - new Date(firstTest.created_at).getTime()) / 
      (1000 * 60 * 60 * 24 * 30);

    const voltageDecline = firstTest.min_cranking_voltage - lastTest.min_cranking_voltage;
    const declinePerMonth = monthsBetween > 0 ? voltageDecline / monthsBetween : 0;

    // Estimar meses restantes até voltagem crítica (9.0V)
    const currentMinVoltage = lastTest.min_cranking_voltage;
    const criticalVoltage = 9.0;
    const voltageUntilCritical = currentMinVoltage - criticalVoltage;
    
    let estimatedMonths: number | null = null;
    if (declinePerMonth > 0.01) {
      estimatedMonths = Math.round(voltageUntilCritical / declinePerMonth);
    }

    // Determinar tendência
    let healthTrend: 'improving' | 'stable' | 'declining' | 'critical';
    let recommendation: string;

    if (currentMinVoltage < 9.0) {
      healthTrend = 'critical';
      recommendation = 'Bateria em estado crítico. Substitua imediatamente para evitar ficar na mão.';
    } else if (declinePerMonth > 0.15) {
      healthTrend = 'declining';
      recommendation = `Bateria degradando rapidamente. Estimativa de ${estimatedMonths || '?'} meses até falha. Planeje a troca.`;
    } else if (declinePerMonth > 0.05) {
      healthTrend = 'declining';
      recommendation = 'Degradação normal detectada. Continue monitorando a cada 3 meses.';
    } else if (declinePerMonth < -0.02) {
      healthTrend = 'improving';
      recommendation = 'Voltagens melhorando - pode indicar carregamento recente ou troca de bateria.';
    } else {
      healthTrend = 'stable';
      recommendation = 'Bateria estável. Continue os testes periódicos para acompanhamento.';
    }

    return {
      averageRestingVoltage: Math.round(avgResting * 100) / 100,
      averageMinCranking: Math.round(avgMinCranking * 100) / 100,
      voltageDeclinePerMonth: Math.round(declinePerMonth * 1000) / 1000,
      estimatedMonthsRemaining: estimatedMonths,
      healthTrend,
      recommendation,
    };
  },
};
