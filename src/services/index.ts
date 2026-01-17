// Services Index
// Re-exporta todos os services para imports simplificados

// OBD Services
export * from './obd/OBDProtocol';
export * from './obd/OBDParser';
export { parseDTCResponse, parseUDSResponse, isNoErrorsResponse, isNegativeResponse, getNegativeResponseCode, type ParsedDTC } from './obd/DTCParser';
export { FREEZE_FRAME_PIDS, parseFreezeFrameResponse, formatFreezeFrameValue, getPIDName as getFreezeFramePIDName, type FreezeFrameData } from './obd/FreezeFrameParser';
export { LIVE_DATA_PIDS, parseLiveDataResponse, getPIDInfo, type LivePID } from './obd/LiveDataParser';

// Supabase Services
export { ProfileService } from './supabase/ProfileService';
export { RidesService } from './supabase/RidesService';
export { VehicleService } from './supabase/VehicleService';
export { ScanHistoryService } from './supabase/ScanHistoryService';
export { VehicleHealthService } from './supabase/VehicleHealthService';

// AI Services
export { JarvisService } from './ai/JarvisService';
export { TTSService } from './ai/TTSService';
export { VisionService } from './ai/VisionService';
export { DTCEstimateService, getDTCEstimate } from './ai/DTCEstimateService';
export { analyzeDTC, type AIProvider } from './ai/DTCAnalyzerService';

// Battery Services
export * from './battery/BatteryForensicsService';
export { BatteryTestService } from './supabase/BatteryTestService';
export type { BatteryTestRecord, CreateBatteryTest, BatteryTrend } from './supabase/BatteryTestService';

// Report Services
export { generateDTCReportPDF, downloadPDF } from './report/DTCScanReportService';

// Re-export types
export type { ProfileData } from './supabase/ProfileService';
export type { RideData } from './supabase/RidesService';
export type { VehicleData } from './supabase/VehicleService';
export type { ScanHistoryEntry, VINInfo } from './supabase/ScanHistoryService';
export type { VehicleContext, Message, TripData, JarvisRequest, JarvisResponse } from './ai/JarvisService';
export type { TTSOptions, OpenAITTSOptions } from './ai/TTSService';
export type { ParseResult, VINInfo as OBDVINInfo } from './obd/OBDParser';
export type { PIDDefinition } from './obd/OBDProtocol';
export type { DTCEstimate, DTCEstimateRequest } from './ai/DTCEstimateService';
