import { lazy, Suspense } from 'react';
import { Home, Wrench, DollarSign, Settings, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { DetectedVehicle, VehicleProfile } from '@/lib/vehicleProfiles';
import type { VehicleData, ConnectionStatus } from '@/contexts/OBDContext';
import type { JarvisSettings } from '@/types/jarvisSettings';
import type { TripData, TripSettings, TripHistoryEntry, RideStatus, DailySummary } from '@/types/tripSettings';
import type { RefuelSettings, RefuelMode, RefuelFlowType, FuelTrimSample, RefuelEntry } from '@/types/refuelTypes';
import type { UseVehicleBenefitsReturn } from '@/hooks/useVehicleBenefits';
import type { UseMaintenanceScheduleReturn } from '@/hooks/useMaintenanceSchedule';
import type { VehicleContextForVision } from '@/types/visionTypes';
import type { O2SensorReading, FuelChangeContext, FuelDiagnosticResult, FuelSystemStatus } from '@/types/fuelForensics';
import type { BatteryHealthStatus, FuelHealthStatus, DTCHealthStatus } from '@/types/vehicleHealth';

// Lazy load tab components for better initial load performance
const DashboardTab = lazy(() => import('@/components/tabs/DashboardTab').then(m => ({ default: m.DashboardTab })));
const MechanicTab = lazy(() => import('@/components/tabs/MechanicTab').then(m => ({ default: m.MechanicTab })));
const FinancialTab = lazy(() => import('@/components/tabs/FinancialTab').then(m => ({ default: m.FinancialTab })));
const SettingsTab = lazy(() => import('@/components/tabs/SettingsTab').then(m => ({ default: m.SettingsTab })));

// Re-export interface for external use
export type { UseMaintenanceScheduleReturn };

// Loading fallback component
function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

interface MainTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  vehicleData: VehicleData;
  status: ConnectionStatus;
  isPolling: boolean;
  logs: string[];
  themeVehicle: DetectedVehicle | null;
  currentProfile: VehicleProfile;
  onStartPolling: () => void;
  onStopPolling: () => void;
  sendRawCommand: (command: string, timeout?: number) => Promise<string>;
  addLog: (message: string) => void;
  jarvisSettings: JarvisSettings;
  isSpeaking: boolean;
  speak: (message: string) => void;
  availableVoices: SpeechSynthesisVoice[];
  portugueseVoices: SpeechSynthesisVoice[];
  onUpdateJarvisSetting: <K extends keyof JarvisSettings>(key: K, value: JarvisSettings[K]) => void;
  onResetJarvisSettings: () => void;
  onTestVoice: () => void;
  isWakeLockActive: boolean;
  tripData: TripData;
  tripSettings: TripSettings;
  tripHistory: TripHistoryEntry[];
  onStartTrip: () => void;
  onPauseTrip: () => void;
  onResumeTrip: () => void;
  onResetTrip: () => void;
  onSaveTrip: () => void;
  onClearTripHistory: () => void;
  onUpdateTripSettings: (settings: Partial<TripSettings>) => void;
  onVoiceReport: () => void;
  rideStatus: RideStatus;
  dailySummary: DailySummary;
  onClearTodayRides: () => void;
  onDailyReport: () => void;
  refuelMode: RefuelMode;
  refuelFlowType: RefuelFlowType | null;
  distanceMonitored: number;
  currentSTFT: number | null;
  currentLTFT: number | null;
  currentO2: number | null;
  o2Readings: O2SensorReading[];
  o2FrozenDuration?: number;
  anomalyActive: boolean;
  anomalyDuration: number;
  fuelTrimHistory: FuelTrimSample[];
  refuelSettings: RefuelSettings;
  frozenSettings: RefuelSettings | null;
  currentRefuel: Partial<RefuelEntry> | null;
  isSyncing: boolean;
  stftSupported: boolean | null;
  isAuthenticated: boolean;
  onStartRefuelMode: () => void;
  onStartQuickTest: () => void;
  onCancelRefuel: () => void;
  onOpenRefuelModal: () => void;
  onUpdateRefuelSettings: (settings: Partial<RefuelSettings>) => void;
  onResetRefuelSettings: () => void;
  vehicleBenefits: UseVehicleBenefitsReturn;
  maintenanceSchedule: UseMaintenanceScheduleReturn;
  vehicleContext?: VehicleContextForVision;
  // User ID for sync
  userId?: string;
  // Forensic State Machine
  forensicResult?: FuelDiagnosticResult | null;
  fuelContext?: FuelChangeContext;
  // Closed Loop detection
  fuelSystemStatus?: FuelSystemStatus;
  isClosedLoopActive?: boolean;
  // Vehicle Setup integration
  vehicleInfo?: {
    vin: string | null;
    vehicleBrand: string | null;
    vehicleModel: string | null;
    modelYear: string | null;
    vehicleEngine: string | null;
    vehicleTransmission: string | null;
    vehicleNickname: string | null;
  };
  onUpdateVehicle?: (vehicle: Partial<{
    vin: string | null;
    vehicleBrand: string | null;
    vehicleModel: string | null;
    modelYear: string | null;
    vehicleEngine: string | null;
    vehicleTransmission: string | null;
    vehicleNickname: string | null;
  }>) => Promise<void>;
  // Vehicle Health Overrides
  batteryHealthOverride?: BatteryHealthStatus;
  fuelHealthOverride?: FuelHealthStatus;
  dtcHealthOverride?: DTCHealthStatus;
}

export function MainTabs(props: MainTabsProps) {
  const { vehicleData, status, jarvisSettings, dtcHealthOverride } = props;
  const isReady = status === 'ready';
  const isReading = status === 'reading';
  const isConnected = isReady || isReading;
  const { rpm, speed, temperature, voltage, fuelLevel, engineLoad } = vehicleData;
  
  // Número de DTCs ativos para badge
  const dtcCount = dtcHealthOverride?.count ?? 0;

  return (
    <Tabs value={props.value} onValueChange={props.onValueChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-auto tabs-scroll">
        <TabsTrigger value="painel" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row">
          <Home className="h-4 w-4" /><span className="hidden xs:inline">Painel</span>
        </TabsTrigger>
        <TabsTrigger value="mecanica" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row relative">
          <div className="relative">
            <Wrench className="h-4 w-4" />
            {dtcCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold animate-pulse">
                {dtcCount > 9 ? '9+' : dtcCount}
              </span>
            )}
          </div>
          <span className="hidden xs:inline">Mecânica</span>
        </TabsTrigger>
        <TabsTrigger value="financas" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row">
          <DollarSign className="h-4 w-4" /><span className="hidden xs:inline">Finanças</span>
        </TabsTrigger>
        <TabsTrigger value="config" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row">
          <Settings className="h-4 w-4" /><span className="hidden xs:inline">Config</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="painel" className="mt-4 sm:mt-6">
        <Suspense fallback={<TabSkeleton />}>
          <DashboardTab rpm={rpm} speed={speed} temperature={temperature} voltage={voltage} fuelLevel={fuelLevel} engineLoad={engineLoad} redlineRPM={jarvisSettings.redlineRPM} isReady={isReady} isReading={isReading} isPolling={props.isPolling} logs={props.logs} onStartPolling={props.onStartPolling} onStopPolling={props.onStopPolling} batteryHealthOverride={props.batteryHealthOverride} fuelHealthOverride={props.fuelHealthOverride} />
        </Suspense>
      </TabsContent>

      <TabsContent value="mecanica" className="mt-4 sm:mt-6">
        <Suspense fallback={<TabSkeleton />}>
          <MechanicTab sendCommand={props.sendRawCommand} isConnected={isConnected} isPolling={props.isPolling} addLog={props.addLog} stopPolling={props.onStopPolling} logs={props.logs} themeVehicle={props.themeVehicle} currentProfile={props.currentProfile} vehicleBenefits={props.vehicleBenefits} maintenanceSchedule={props.maintenanceSchedule} currentMileage={jarvisSettings.currentMileage} speak={props.speak} isSpeaking={props.isSpeaking} aiModeEnabled={jarvisSettings.aiModeEnabled} vehicleContext={props.vehicleContext} userId={props.userId} />
        </Suspense>
      </TabsContent>

      <TabsContent value="financas" className="mt-4 sm:mt-6">
        <Suspense fallback={<TabSkeleton />}>
          <FinancialTab tripData={props.tripData} tripSettings={props.tripSettings} tripHistory={props.tripHistory} onStartTrip={props.onStartTrip} onPauseTrip={props.onPauseTrip} onResumeTrip={props.onResumeTrip} onResetTrip={props.onResetTrip} onSaveTrip={props.onSaveTrip} onClearHistory={props.onClearTripHistory} onUpdateSettings={props.onUpdateTripSettings} onVoiceReport={props.onVoiceReport} currentSpeed={speed} isSpeaking={props.isSpeaking} autoRideEnabled={props.tripSettings.autoRideEnabled} rideStatus={props.rideStatus} dailySummary={props.dailySummary} onClearTodayRides={props.onClearTodayRides} onDailyReport={props.onDailyReport} refuelMode={props.refuelMode} refuelFlowType={props.refuelFlowType} distanceMonitored={props.distanceMonitored} currentSTFT={props.currentSTFT} currentLTFT={props.currentLTFT} currentO2={props.currentO2} o2Readings={props.o2Readings} o2FrozenDuration={props.o2FrozenDuration} anomalyActive={props.anomalyActive} anomalyDuration={props.anomalyDuration} fuelTrimHistory={props.fuelTrimHistory} refuelSettings={props.refuelSettings} frozenSettings={props.frozenSettings} currentRefuel={props.currentRefuel} isSyncing={props.isSyncing} stftSupported={props.stftSupported} isConnected={isConnected} isAuthenticated={props.isAuthenticated} onStartRefuelMode={props.onStartRefuelMode} onStartQuickTest={props.onStartQuickTest} onCancelRefuel={props.onCancelRefuel} onOpenRefuelModal={props.onOpenRefuelModal} onUpdateRefuelSettings={props.onUpdateRefuelSettings} onResetRefuelSettings={props.onResetRefuelSettings} userId={props.userId} forensicResult={props.forensicResult} fuelContext={props.fuelContext} fuelSystemStatus={props.fuelSystemStatus} isClosedLoopActive={props.isClosedLoopActive} />
        </Suspense>
      </TabsContent>

      <TabsContent value="config" className="mt-4 sm:mt-6">
        <Suspense fallback={<TabSkeleton />}>
          <SettingsTab jarvisSettings={jarvisSettings} tripSettings={props.tripSettings} refuelSettings={props.refuelSettings} vehicleInfo={props.vehicleInfo} onUpdateJarvisSetting={props.onUpdateJarvisSetting} onUpdateTripSettings={props.onUpdateTripSettings} onUpdateRefuelSettings={props.onUpdateRefuelSettings} onUpdateVehicle={props.onUpdateVehicle} onResetJarvisSettings={props.onResetJarvisSettings} onResetRefuelSettings={props.onResetRefuelSettings} onTestVoice={props.onTestVoice} availableVoices={props.availableVoices} portugueseVoices={props.portugueseVoices} isSpeaking={props.isSpeaking} isWakeLockActive={props.isWakeLockActive} />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
