// Services Index
// Re-exporta todos os services para imports simplificados

// OBD Services
export * from './obd/OBDProtocol';
export * from './obd/OBDParser';

// Supabase Services
export { ProfileService } from './supabase/ProfileService';
export { RidesService } from './supabase/RidesService';
export { VehicleService } from './supabase/VehicleService';
export { ScanHistoryService } from './supabase/ScanHistoryService';

// AI Services
export { JarvisService } from './ai/JarvisService';
export { TTSService } from './ai/TTSService';

// Re-export types
export type { ProfileData } from './supabase/ProfileService';
export type { RideData } from './supabase/RidesService';
export type { VehicleData } from './supabase/VehicleService';
export type { ScanHistoryEntry, VINInfo } from './supabase/ScanHistoryService';
export type { VehicleContext, Message, TripData, JarvisRequest, JarvisResponse } from './ai/JarvisService';
export type { TTSOptions, OpenAITTSOptions } from './ai/TTSService';
export type { ParseResult, VINInfo as OBDVINInfo } from './obd/OBDParser';
export type { PIDDefinition } from './obd/OBDProtocol';
