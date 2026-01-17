// Tipos unificados de contexto para componentes
// Agrupa dados relacionados para reduzir prop drilling

import type { VehicleData } from '@/contexts/OBDContext';
import type { DetectedVehicle, VehicleProfile } from '@/lib/vehicleProfiles';
import type { JarvisSettings } from '@/types/jarvisSettings';
import type { TripData, TripSettings, TripHistoryEntry, RideStatus, DailySummary, RideEntry } from '@/types/tripSettings';
import type { RefuelSettings, RefuelEntry, RefuelMode, RefuelFlowType, FuelTrimSample } from '@/types/refuelTypes';
import type { FuelChangeContext, FuelDiagnosticResult, FuelMonitoringData, O2SensorReading, FuelSystemStatus } from '@/types/fuelForensics';

// Interface simplificada para evitar importação circular
export interface OfflineRefuelEntryBase {
  timestamp: number;
  pricePerLiter: number;
  litersAdded: number;
  totalPaid: number;
  fuelLevelBefore: number | null;
  fuelLevelAfter: number | null;
  tankCapacity: number;
  stationName?: string;
  quality: string;
  stftAverage: number;
  ltftDelta: number;
  distanceMonitored: number;
  anomalyDetected: boolean;
  anomalyDetails?: string;
  pumpAccuracyPercent?: number;
  ltftFinal?: number;
  o2Avg?: number;
  fuelContext?: string;
  fuelState?: string;
  adaptationComplete?: boolean;
}

// Contexto da sessão do veículo
export interface SessionContext {
  // Dados OBD
  vehicleData: VehicleData;
  status: 'disconnected' | 'connecting' | 'ready' | 'reading' | 'error';
  isPolling: boolean;
  isConnected: boolean;
  isSupported: boolean;
  error: string | null;
  logs: string[];
  hasLastDevice: boolean;
  
  // Veículo detectado
  themeVehicle: DetectedVehicle | null;
  currentProfile: VehicleProfile;
  
  // Autenticação
  isAuthenticated: boolean;
  user: { id: string; email?: string } | null;
  
  // Ações
  connect: () => Promise<void>;
  disconnect: () => void;
  startPolling: () => void;
  stopPolling: () => void;
  sendRawCommand: (cmd: string, timeout?: number) => Promise<string>;
  addLog: (msg: string) => void;
  reconnect: () => Promise<boolean>;
}

// Contexto do Jarvis AI
export interface JarvisContext {
  // Settings
  settings: JarvisSettings;
  updateSetting: <K extends keyof JarvisSettings>(key: K, value: JarvisSettings[K]) => void;
  resetToDefaults: () => void;
  
  // TTS
  speak: (text: string, options?: { priority?: number; interrupt?: boolean }) => Promise<void>;
  testAudio: () => void;
  isSpeaking: boolean;
  isTTSSupported: boolean;
  
  // AI Conversacional
  isListening: boolean;
  isProcessing: boolean;
  isContinuousMode: boolean;
  isWakeWordDetected: boolean;
  isSpeakingAI: boolean;
  isAISupported: boolean;
  aiError: string | null;
  lastTranscript: string;
  interimTranscript: string;
  lastResponse: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  
  // Ações AI
  toggleListening: () => void;
  toggleContinuousMode: () => void;
  clearHistory: () => void;
  
  // Vozes
  availableVoices: SpeechSynthesisVoice[];
  portugueseVoices: SpeechSynthesisVoice[];
}

// Contexto de viagem/trip
export interface TripContext {
  tripData: TripData;
  settings: TripSettings;
  history: TripHistoryEntry[];
  
  // Ações
  startTrip: () => void;
  pauseTrip: () => void;
  resumeTrip: () => void;
  resetTrip: () => void;
  saveTrip: () => void;
  clearHistory: () => void;
  updateSettings: (settings: Partial<TripSettings>) => void;
  getVoiceReport: () => string;
}

// Contexto de corridas automáticas
export interface AutoRideContext {
  rideStatus: RideStatus;
  currentRide: RideEntry | null;
  todayRides: RideEntry[];
  dailySummary: DailySummary;
  isModalOpen: boolean;
  finishedRide: RideEntry | null;
  pendingRecovery: RideEntry | null;
  
  // Ações
  closeModal: () => void;
  saveRideWithAmount: (amount: number) => void;
  skipAmountEntry: () => void;
  clearTodayRides: () => void;
  getVoiceReport: () => string;
  recoverRide: () => void;
  discardRecovery: () => void;
}

// Contexto de abastecimento
export interface RefuelContext {
  // Monitor
  mode: RefuelMode;
  flowType: RefuelFlowType | null;
  currentRefuel: Partial<RefuelEntry> | null;
  fuelTrimHistory: FuelTrimSample[];
  fuelLevelSupported: boolean | null;
  stftSupported: boolean | null;
  currentSTFT: number | null;
  currentLTFT: number | null;
  currentFuelLevel: number | null;
  currentO2: number | null;
  distanceMonitored: number;
  anomalyActive: boolean;
  anomalyDuration: number;
  frozenSettings: RefuelSettings | null;
  
  // Fuel State Machine
  fuelContext: FuelChangeContext;
  setFuelContext: (context: FuelChangeContext) => void;
  forensicResult: FuelDiagnosticResult | null;
  monitoringData: FuelMonitoringData | null;
  
  // O2 Sensor data for real-time monitor
  o2Readings: O2SensorReading[];
  o2FrozenDuration: number;
  
  // Fuel System Status (Closed Loop detection)
  fuelSystemStatus: FuelSystemStatus;
  isClosedLoopActive: boolean;
  
  // Settings
  settings: RefuelSettings;
  isSyncing: boolean;
  
  // Offline
  isOnline: boolean;
  pendingOfflineCount: number;
  saveOffline: (entry: OfflineRefuelEntryBase) => void;
  syncOffline: () => Promise<void>;
  
  // Ações Monitor
  startRefuelMode: () => void;
  startQuickTest: () => void;
  confirmRefuel: (pricePerLiter: number, litersAdded: number, stationName?: string) => void;
  cancelRefuel: () => void;
  checkPIDSupport: () => Promise<void>;
  
  // Ações Settings
  updateSettings: (settings: Partial<RefuelSettings>) => void;
  resetToDefaults: () => void;
}

// Estado dos modais
export interface ModalsState {
  settings: boolean;
  flowSelector: boolean;
  refuel: boolean;
}
