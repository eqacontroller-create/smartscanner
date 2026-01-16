import { Home, Wrench, DollarSign, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardTab } from '@/components/tabs/DashboardTab';
import { MechanicTab } from '@/components/tabs/MechanicTab';
import { FinancialTab } from '@/components/tabs/FinancialTab';
import { SettingsTab } from '@/components/tabs/SettingsTab';
import type { DetectedVehicle, VehicleProfile } from '@/lib/vehicleProfiles';
import type { VehicleData, ConnectionStatus } from '@/contexts/OBDContext';
import type { JarvisSettings } from '@/types/jarvisSettings';
import type { TripData, TripSettings, TripHistoryEntry, RideStatus, DailySummary } from '@/types/tripSettings';
import type { RefuelSettings, RefuelMode, RefuelFlowType, FuelTrimSample, RefuelEntry } from '@/types/refuelTypes';
import type { UseVehicleBenefitsReturn } from '@/hooks/useVehicleBenefits';
import type { UseMaintenanceScheduleReturn } from '@/hooks/useMaintenanceSchedule';

// Re-export interface for external use
export type { UseMaintenanceScheduleReturn };

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
  anomalyActive: boolean;
  anomalyDuration: number;
  fuelTrimHistory: FuelTrimSample[];
  refuelSettings: RefuelSettings;
  frozenSettings: RefuelSettings | null;
  currentRefuel: Partial<RefuelEntry> | null;
  isSyncing: boolean;
  stftSupported: boolean;
  isAuthenticated: boolean;
  onStartRefuelMode: () => void;
  onStartQuickTest: () => void;
  onCancelRefuel: () => void;
  onOpenRefuelModal: () => void;
  onUpdateRefuelSettings: (settings: Partial<RefuelSettings>) => void;
  onResetRefuelSettings: () => void;
  vehicleBenefits: UseVehicleBenefitsReturn;
  maintenanceSchedule: UseMaintenanceScheduleReturn;
}

export function MainTabs(props: MainTabsProps) {
  const { vehicleData, status, jarvisSettings } = props;
  const isReady = status === 'ready';
  const isReading = status === 'reading';
  const isConnected = isReady || isReading;
  const { rpm, speed, temperature, voltage, fuelLevel, engineLoad } = vehicleData;

  return (
    <Tabs value={props.value} onValueChange={props.onValueChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-auto tabs-scroll">
        <TabsTrigger value="painel" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row">
          <Home className="h-4 w-4" /><span className="hidden xs:inline">Painel</span>
        </TabsTrigger>
        <TabsTrigger value="mecanica" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row">
          <Wrench className="h-4 w-4" /><span className="hidden xs:inline">Mecânica</span>
        </TabsTrigger>
        <TabsTrigger value="financas" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row">
          <DollarSign className="h-4 w-4" /><span className="hidden xs:inline">Finanças</span>
        </TabsTrigger>
        <TabsTrigger value="config" className="gap-1.5 py-2.5 text-xs sm:text-sm touch-target flex-col sm:flex-row">
          <Settings className="h-4 w-4" /><span className="hidden xs:inline">Config</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="painel" className="mt-4 sm:mt-6">
        <DashboardTab rpm={rpm} speed={speed} temperature={temperature} voltage={voltage} fuelLevel={fuelLevel} engineLoad={engineLoad} redlineRPM={jarvisSettings.redlineRPM} isReady={isReady} isReading={isReading} isPolling={props.isPolling} logs={props.logs} onStartPolling={props.onStartPolling} onStopPolling={props.onStopPolling} />
      </TabsContent>

      <TabsContent value="mecanica" className="mt-4 sm:mt-6">
        <MechanicTab sendCommand={props.sendRawCommand} isConnected={isConnected} isPolling={props.isPolling} addLog={props.addLog} stopPolling={props.onStopPolling} logs={props.logs} themeVehicle={props.themeVehicle} currentProfile={props.currentProfile} vehicleBenefits={props.vehicleBenefits} maintenanceSchedule={props.maintenanceSchedule} currentMileage={jarvisSettings.currentMileage} speak={props.speak} isSpeaking={props.isSpeaking} aiModeEnabled={jarvisSettings.aiModeEnabled} />
      </TabsContent>

      <TabsContent value="financas" className="mt-4 sm:mt-6">
        <FinancialTab tripData={props.tripData} tripSettings={props.tripSettings} tripHistory={props.tripHistory} onStartTrip={props.onStartTrip} onPauseTrip={props.onPauseTrip} onResumeTrip={props.onResumeTrip} onResetTrip={props.onResetTrip} onSaveTrip={props.onSaveTrip} onClearHistory={props.onClearTripHistory} onUpdateSettings={props.onUpdateTripSettings} onVoiceReport={props.onVoiceReport} currentSpeed={speed} isSpeaking={props.isSpeaking} autoRideEnabled={props.tripSettings.autoRideEnabled} rideStatus={props.rideStatus} dailySummary={props.dailySummary} onClearTodayRides={props.onClearTodayRides} onDailyReport={props.onDailyReport} refuelMode={props.refuelMode} refuelFlowType={props.refuelFlowType} distanceMonitored={props.distanceMonitored} currentSTFT={props.currentSTFT} currentLTFT={props.currentLTFT} anomalyActive={props.anomalyActive} anomalyDuration={props.anomalyDuration} fuelTrimHistory={props.fuelTrimHistory} refuelSettings={props.refuelSettings} frozenSettings={props.frozenSettings} currentRefuel={props.currentRefuel} isSyncing={props.isSyncing} stftSupported={props.stftSupported} isConnected={isConnected} isAuthenticated={props.isAuthenticated} onStartRefuelMode={props.onStartRefuelMode} onStartQuickTest={props.onStartQuickTest} onCancelRefuel={props.onCancelRefuel} onOpenRefuelModal={props.onOpenRefuelModal} onUpdateRefuelSettings={props.onUpdateRefuelSettings} onResetRefuelSettings={props.onResetRefuelSettings} />
      </TabsContent>

      <TabsContent value="config" className="mt-4 sm:mt-6">
        <SettingsTab jarvisSettings={jarvisSettings} tripSettings={props.tripSettings} refuelSettings={props.refuelSettings} onUpdateJarvisSetting={props.onUpdateJarvisSetting} onUpdateTripSettings={props.onUpdateTripSettings} onUpdateRefuelSettings={props.onUpdateRefuelSettings} onResetJarvisSettings={props.onResetJarvisSettings} onResetRefuelSettings={props.onResetRefuelSettings} onTestVoice={props.onTestVoice} availableVoices={props.availableVoices} portugueseVoices={props.portugueseVoices} isSpeaking={props.isSpeaking} isWakeLockActive={props.isWakeLockActive} />
      </TabsContent>
    </Tabs>
  );
}
