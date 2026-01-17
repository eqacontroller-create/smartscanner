// Service para agregação de saúde do veículo
// Busca dados de battery_tests, refuel_entries e dtc_scans

import { supabase } from '@/integrations/supabase/client';
import type {
  VehicleHealthSnapshot,
  BatteryHealthStatus,
  FuelHealthStatus,
  DTCHealthStatus,
  HealthLevel,
} from '@/types/vehicleHealth';
import {
  defaultBatteryHealth,
  defaultFuelHealth,
  defaultDTCHealth,
  calculateOverallLevel,
} from '@/types/vehicleHealth';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Mapear battery_status do DB para HealthLevel
function mapBatteryStatus(status: string | null): HealthLevel {
  switch (status?.toLowerCase()) {
    case 'excellent': return 'excellent';
    case 'good': return 'good';
    case 'weak': return 'warning';
    case 'critical': return 'critical';
    default: return 'unknown';
  }
}

// Mapear alternator_status do DB
function mapAlternatorStatus(status: string | null): 'ok' | 'weak' | 'fail' | 'unknown' {
  switch (status?.toLowerCase()) {
    case 'ok':
    case 'excellent':
    case 'good': return 'ok';
    case 'weak':
    case 'warning': return 'weak';
    case 'fail':
    case 'critical': return 'fail';
    default: return 'unknown';
  }
}

// Calcular percentual de saúde da bateria baseado em voltagem de repouso
function calculateBatteryPercent(restingVoltage: number | null, status: string | null): number | null {
  if (status === 'critical') return 30;
  if (status === 'weak') return 50;
  if (status === 'good') return 75;
  if (status === 'excellent') return 95;
  
  // Fallback baseado em voltagem
  if (restingVoltage === null) return null;
  if (restingVoltage >= 12.6) return 100;
  if (restingVoltage >= 12.4) return 85;
  if (restingVoltage >= 12.2) return 70;
  if (restingVoltage >= 12.0) return 55;
  if (restingVoltage >= 11.8) return 40;
  return 25;
}

// Mensagem baseada no status
function getBatteryMessage(level: HealthLevel, percent: number | null): string {
  if (level === 'critical') return 'Risco de Falha';
  if (level === 'warning') return 'Atenção Necessária';
  if (level === 'good') return 'Boa Condição';
  if (level === 'excellent') return 'Excelente';
  return 'Sem teste recente';
}

export const VehicleHealthService = {
  /**
   * Busca o último teste de bateria do usuário
   */
  async getLatestBatteryHealth(userId: string, vin?: string | null): Promise<BatteryHealthStatus> {
    try {
      let query = supabase
        .from('battery_tests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (vin) {
        query = query.eq('vin', vin);
      }
      
      const { data, error } = await query.single();
      
      if (error || !data) {
        return defaultBatteryHealth;
      }
      
      const testDate = new Date(data.created_at);
      const needsRetest = Date.now() - testDate.getTime() > THIRTY_DAYS_MS;
      const level = mapBatteryStatus(data.battery_status);
      const percent = calculateBatteryPercent(data.resting_voltage, data.battery_status);
      
      // Override: se percentual < 40, é crítico
      const finalLevel = percent !== null && percent < 40 ? 'critical' : level;
      
      return {
        level: finalLevel,
        percent,
        message: getBatteryMessage(finalLevel, percent),
        lastTestDate: testDate,
        alternatorStatus: mapAlternatorStatus(data.alternator_status),
        restingVoltage: data.resting_voltage,
        needsRetest,
      };
    } catch (err) {
      console.error('[VehicleHealthService] Error fetching battery health:', err);
      return defaultBatteryHealth;
    }
  },

  /**
   * Busca o último abastecimento do usuário
   */
  async getLatestFuelHealth(userId: string): Promise<FuelHealthStatus> {
    try {
      const { data, error } = await supabase
        .from('refuel_entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        return defaultFuelHealth;
      }
      
      const anomalyDetected = data.anomaly_detected === true;
      const quality = data.quality as string | null;
      
      // Determinar nível
      let level: HealthLevel = 'unknown';
      let message = 'Sem dados';
      
      if (anomalyDetected && quality === 'critical') {
        level = 'critical';
        message = 'Adulterado Detectado';
      } else if (anomalyDetected && quality === 'warning') {
        level = 'warning';
        message = 'Qualidade Suspeita';
      } else if (quality === 'good' || !anomalyDetected) {
        level = 'good';
        message = 'Combustível OK';
      }
      
      return {
        level,
        message,
        lastRefuelDate: new Date(data.timestamp),
        lastQuality: quality,
        anomalyDetected,
        stftAverage: data.stft_average,
      };
    } catch (err) {
      console.error('[VehicleHealthService] Error fetching fuel health:', err);
      return defaultFuelHealth;
    }
  },

  /**
   * Busca DTCs do último scan
   */
  async getActiveDTCs(userId: string, vin?: string | null): Promise<DTCHealthStatus> {
    try {
      // Primeiro, buscar o último scan
      let scanQuery = supabase
        .from('dtc_scans')
        .select('id, scan_date, total_dtcs')
        .order('scan_date', { ascending: false })
        .limit(1);
      
      if (vin) {
        scanQuery = scanQuery.eq('vin', vin);
      }
      
      const { data: scanData, error: scanError } = await scanQuery.single();
      
      if (scanError || !scanData) {
        return defaultDTCHealth;
      }
      
      // Se não há DTCs, retornar limpo
      if (scanData.total_dtcs === 0) {
        return {
          level: 'good',
          count: 0,
          message: 'Nenhum Erro',
          lastScanDate: new Date(scanData.scan_date),
          codes: [],
        };
      }
      
      // Buscar os códigos do scan
      const { data: findings, error: findingsError } = await supabase
        .from('dtc_findings')
        .select('dtc_code')
        .eq('scan_id', scanData.id);
      
      const codes = findings?.map(f => f.dtc_code) || [];
      const count = codes.length || scanData.total_dtcs;
      
      // Determinar nível
      let level: HealthLevel = 'warning';
      if (count > 5) level = 'critical';
      
      // Verificar se há códigos P0xxx (emissão/motor - geralmente críticos)
      const hasCriticalCodes = codes.some(code => 
        code.startsWith('P0') || code.startsWith('P1')
      );
      if (hasCriticalCodes) level = 'critical';
      
      return {
        level,
        count,
        message: count === 1 ? '1 Erro Ativo' : `${count} Erros Ativos`,
        lastScanDate: new Date(scanData.scan_date),
        codes,
      };
    } catch (err) {
      console.error('[VehicleHealthService] Error fetching DTC health:', err);
      return defaultDTCHealth;
    }
  },

  /**
   * Agrega todos os dados de saúde em um snapshot
   */
  async getHealthSnapshot(userId: string, vin?: string | null): Promise<VehicleHealthSnapshot> {
    try {
      // Buscar tudo em paralelo
      const [battery, fuel, dtc] = await Promise.all([
        this.getLatestBatteryHealth(userId, vin),
        this.getLatestFuelHealth(userId),
        this.getActiveDTCs(userId, vin),
      ]);
      
      const overallLevel = calculateOverallLevel(battery.level, fuel.level, dtc.level);
      
      return {
        battery,
        fuel,
        dtc,
        overallLevel,
        lastUpdated: new Date(),
        vin: vin || null,
      };
    } catch (err) {
      console.error('[VehicleHealthService] Error fetching health snapshot:', err);
      return {
        battery: defaultBatteryHealth,
        fuel: defaultFuelHealth,
        dtc: defaultDTCHealth,
        overallLevel: 'unknown',
        lastUpdated: new Date(),
        vin: vin || null,
      };
    }
  },
};
