// Re-export from ScanHistoryService for backward compatibility
// This file can be deprecated in favor of direct service imports

import { ScanHistoryService, type ScanHistoryEntry } from '@/services/supabase/ScanHistoryService';
import type { ParsedDTC } from '@/services/obd/DTCParser';
import type { VINInfo } from '@/lib/vinDecoder';

// Re-export types
export type { ScanHistoryEntry };

// Re-export functions with original names for backward compatibility
export async function getOrCreateVehicle(vinInfo: VINInfo): Promise<string | null> {
  // This is now handled internally by ScanHistoryService.saveScanResult
  // Keeping for backward compatibility but delegating to VehicleService
  const { VehicleService } = await import('@/services/supabase/VehicleService');
  return VehicleService.getOrCreate({
    vin: vinInfo.vin,
    manufacturer: vinInfo.manufacturer,
    country: vinInfo.country,
    modelYear: vinInfo.modelYear,
  });
}

export async function saveScanResult(
  dtcs: ParsedDTC[],
  vinInfo: VINInfo | null,
  modulesScanned: number,
  scanDurationMs: number
): Promise<string | null> {
  return ScanHistoryService.saveScanResult(dtcs, vinInfo, modulesScanned, scanDurationMs);
}

export async function getScanHistoryByVIN(vin: string): Promise<ScanHistoryEntry[]> {
  return ScanHistoryService.getByVIN(vin);
}

export async function getRecentScans(limit = 10): Promise<ScanHistoryEntry[]> {
  return ScanHistoryService.getRecent(limit);
}

export function compareScanResults(
  previousScan: ScanHistoryEntry,
  currentScan: ScanHistoryEntry
): { new: string[]; resolved: string[]; persistent: string[] } {
  return ScanHistoryService.compareScanResults(previousScan, currentScan);
}
