import { supabase } from '@/integrations/supabase/client';
import type { ParsedDTC } from '@/lib/dtcParser';
import type { VINInfo } from '@/lib/vinDecoder';

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

// Salvar ou obter veículo pelo VIN
export async function getOrCreateVehicle(vinInfo: VINInfo): Promise<string | null> {
  try {
    // Tentar encontrar veículo existente
    const { data: existing } = await supabase
      .from('vehicles')
      .select('id')
      .eq('vin', vinInfo.vin)
      .maybeSingle();

    if (existing) {
      return existing.id;
    }

    // Criar novo veículo
    const { data: created, error } = await supabase
      .from('vehicles')
      .insert({
        vin: vinInfo.vin,
        manufacturer: vinInfo.manufacturer,
        country: vinInfo.country,
        model_year: vinInfo.modelYear,
        manufacturer_group: vinInfo.manufacturerGroup,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating vehicle:', error);
      return null;
    }

    return created.id;
  } catch (error) {
    console.error('Error in getOrCreateVehicle:', error);
    return null;
  }
}

// Salvar resultado do scan
export async function saveScanResult(
  dtcs: ParsedDTC[],
  vinInfo: VINInfo | null,
  modulesScanned: number,
  scanDurationMs: number
): Promise<string | null> {
  try {
    let vehicleId: string | null = null;

    // Se temos VIN, obter ou criar veículo
    if (vinInfo) {
      vehicleId = await getOrCreateVehicle(vinInfo);
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
      console.error('Error creating scan:', scanError);
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
        console.error('Error saving findings:', findingsError);
      }
    }

    return scan.id;
  } catch (error) {
    console.error('Error in saveScanResult:', error);
    return null;
  }
}

// Obter histórico de scans por VIN
export async function getScanHistoryByVIN(vin: string): Promise<ScanHistoryEntry[]> {
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
        vehicles (
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
      console.error('Error fetching scan history:', error);
      return [];
    }

    return (scans || []).map(scan => ({
      id: scan.id,
      vin: scan.vin,
      vehicleInfo: scan.vehicles ? {
        manufacturer: (scan.vehicles as any).manufacturer,
        country: (scan.vehicles as any).country,
        modelYear: (scan.vehicles as any).model_year,
      } : undefined,
      scanDate: new Date(scan.scan_date),
      totalDtcs: scan.total_dtcs,
      modulesScanned: scan.modules_scanned,
      scanDurationMs: scan.scan_duration_ms,
      dtcs: (scan.dtc_findings || []).map((f: any) => ({
        code: f.dtc_code,
        moduleName: f.module_name,
      })),
    }));
  } catch (error) {
    console.error('Error in getScanHistoryByVIN:', error);
    return [];
  }
}

// Obter todos os scans recentes
export async function getRecentScans(limit = 10): Promise<ScanHistoryEntry[]> {
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
        vehicles (
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
      console.error('Error fetching recent scans:', error);
      return [];
    }

    return (scans || []).map(scan => ({
      id: scan.id,
      vin: scan.vin,
      vehicleInfo: scan.vehicles ? {
        manufacturer: (scan.vehicles as any).manufacturer,
        country: (scan.vehicles as any).country,
        modelYear: (scan.vehicles as any).model_year,
      } : undefined,
      scanDate: new Date(scan.scan_date),
      totalDtcs: scan.total_dtcs,
      modulesScanned: scan.modules_scanned,
      scanDurationMs: scan.scan_duration_ms,
      dtcs: (scan.dtc_findings || []).map((f: any) => ({
        code: f.dtc_code,
        moduleName: f.module_name,
      })),
    }));
  } catch (error) {
    console.error('Error in getRecentScans:', error);
    return [];
  }
}

// Comparar dois scans
export function compareScanResults(
  previousScan: ScanHistoryEntry,
  currentScan: ScanHistoryEntry
): { new: string[]; resolved: string[]; persistent: string[] } {
  const previousCodes = new Set(previousScan.dtcs.map(d => d.code));
  const currentCodes = new Set(currentScan.dtcs.map(d => d.code));

  const newCodes = [...currentCodes].filter(code => !previousCodes.has(code));
  const resolvedCodes = [...previousCodes].filter(code => !currentCodes.has(code));
  const persistentCodes = [...currentCodes].filter(code => previousCodes.has(code));

  return {
    new: newCodes,
    resolved: resolvedCodes,
    persistent: persistentCodes,
  };
}
