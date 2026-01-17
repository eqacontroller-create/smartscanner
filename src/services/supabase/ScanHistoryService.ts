// Scan History Service
// Operações CRUD para histórico de scans DTC no Supabase

import { supabase } from '@/integrations/supabase/client';
import { VehicleService } from './VehicleService';
import type { ParsedDTC } from '@/services/obd/DTCParser';

export interface ScanHistoryEntry {
  id: string;
  vin: string | null;
  vehicleInfo?: {
    manufacturer: string;
    country: string;
    modelYear: string;
  };
  scanDate: Date;
  totalDtcs: number;
  modulesScanned: number;
  scanDurationMs: number | null;
  dtcs: {
    code: string;
    moduleName: string | null;
  }[];
}

export interface VINInfo {
  vin: string;
  manufacturer?: string | null;
  country?: string | null;
  modelYear?: string | null;
  manufacturerGroup?: string | null;
}

export const ScanHistoryService = {
  /**
   * Salva resultado do scan
   */
  async saveScanResult(
    dtcs: ParsedDTC[],
    vinInfo: VINInfo | null,
    modulesScanned: number,
    scanDurationMs: number
  ): Promise<string | null> {
    try {
      let vehicleId: string | null = null;

      // Se temos VIN, obter ou criar veículo
      if (vinInfo) {
        vehicleId = await VehicleService.getOrCreate(vinInfo);
      }

      // Criar registro do scan
      const { data: scan, error: scanError } = await supabase
        .from('dtc_scans')
        .insert({
          vehicle_id: vehicleId,
          vin: vinInfo?.vin || null,
          total_dtcs: dtcs.length,
          modules_scanned: modulesScanned,
          scan_duration_ms: scanDurationMs,
        })
        .select('id')
        .single();

      if (scanError) {
        console.error('[ScanHistoryService] Error creating scan:', scanError);
        return null;
      }

      // Se há DTCs, salvar cada um
      if (dtcs.length > 0) {
        const findings = dtcs.map(dtc => ({
          scan_id: scan.id,
          dtc_code: dtc.code,
          raw_code: dtc.raw,
          module_id: dtc.module?.id || null,
          module_name: dtc.module?.name || null,
          status_byte: dtc.status || null,
        }));

        const { error: findingsError } = await supabase
          .from('dtc_findings')
          .insert(findings);

        if (findingsError) {
          console.error('[ScanHistoryService] Error saving findings:', findingsError);
        }
      }

      return scan.id;
    } catch (error) {
      console.error('[ScanHistoryService] Error in saveScanResult:', error);
      return null;
    }
  },

  /**
   * Busca histórico de scans por VIN
   */
  async getByVIN(vin: string): Promise<ScanHistoryEntry[]> {
    try {
      const { data: scans, error } = await supabase
        .from('dtc_scans')
        .select(`
          id,
          vin,
          scan_date,
          total_dtcs,
          modules_scanned,
          scan_duration_ms,
          vehicle:vehicles!dtc_scans_vehicle_id_fkey (
            manufacturer,
            country,
            model_year
          ),
          dtc_findings (
            dtc_code,
            module_name
          )
        `)
        .eq('vin', vin)
        .order('scan_date', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[ScanHistoryService] Error fetching by VIN:', error);
        return [];
      }

      return mapScansToHistory(scans);
    } catch (error) {
      console.error('[ScanHistoryService] Exception in getByVIN:', error);
      return [];
    }
  },

  /**
   * Busca scans recentes
   */
  async getRecent(limit = 10): Promise<ScanHistoryEntry[]> {
    try {
      const { data: scans, error } = await supabase
        .from('dtc_scans')
        .select(`
          id,
          vin,
          scan_date,
          total_dtcs,
          modules_scanned,
          scan_duration_ms,
          vehicle:vehicles!dtc_scans_vehicle_id_fkey (
            manufacturer,
            country,
            model_year
          ),
          dtc_findings (
            dtc_code,
            module_name
          )
        `)
        .order('scan_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[ScanHistoryService] Error fetching recent:', error);
        return [];
      }

      return mapScansToHistory(scans);
    } catch (error) {
      console.error('[ScanHistoryService] Exception in getRecent:', error);
      return [];
    }
  },

  /**
   * Compara dois scans
   */
  compareScanResults(
    previousScan: ScanHistoryEntry,
    currentScan: ScanHistoryEntry
  ): { new: string[]; resolved: string[]; persistent: string[] } {
    const previousCodes = new Set(previousScan.dtcs.map(d => d.code));
    const currentCodes = new Set(currentScan.dtcs.map(d => d.code));

    return {
      new: [...currentCodes].filter(code => !previousCodes.has(code)),
      resolved: [...previousCodes].filter(code => !currentCodes.has(code)),
      persistent: [...currentCodes].filter(code => previousCodes.has(code)),
    };
  },
};

// Função auxiliar para mapear resultados do Supabase
function mapScansToHistory(scans: any[] | null): ScanHistoryEntry[] {
  if (!scans || scans.length === 0) {
    return [];
  }

  return scans.map(scan => {
    const vehicle = Array.isArray(scan.vehicle) 
      ? scan.vehicle[0] 
      : scan.vehicle;

    return {
      id: scan.id,
      vin: scan.vin,
      vehicleInfo: vehicle ? {
        manufacturer: vehicle.manufacturer || 'Desconhecido',
        country: vehicle.country || 'Desconhecido',
        modelYear: vehicle.model_year || 'N/A',
      } : undefined,
      scanDate: new Date(scan.scan_date),
      totalDtcs: scan.total_dtcs ?? 0,
      modulesScanned: scan.modules_scanned ?? 0,
      scanDurationMs: scan.scan_duration_ms,
      dtcs: (scan.dtc_findings || []).map((f: any) => ({
        code: f.dtc_code || 'UNKNOWN',
        moduleName: f.module_name || null,
      })),
    };
  });
}
