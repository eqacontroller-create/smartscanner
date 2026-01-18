import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleVIN } from '@/components/dashboard/VehicleVIN';
import { VehicleInfoCard } from '@/components/dashboard/VehicleInfoCard';
import { MaintenanceCard } from '@/components/dashboard/MaintenanceCard';
import { LogPanel } from '@/components/dashboard/LogPanel';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ScannerSkeleton, LiveDataSkeleton, VisualMechanicSkeleton, BatteryTestSkeleton } from '@/components/mechanic/ScannerSkeleton';
import { AlertTriangle, Activity, Wrench, Car, Calendar, Eye, Battery } from 'lucide-react';
import type { VehicleProfile, VehicleBrand } from '@/lib/vehicleProfiles';
import type { UseVehicleBenefitsReturn } from '@/hooks/useVehicleBenefits';
import type { VehicleContextForVision } from '@/types/visionTypes';
import type { useMaintenanceSchedule } from '@/hooks/useMaintenanceSchedule';

// Lazy load heavy components
const DTCScanner = lazy(() => import('@/components/mechanic/DTCScanner').then(m => ({ default: m.DTCScanner })));
const LiveDataMonitor = lazy(() => import('@/components/mechanic/LiveDataMonitor').then(m => ({ default: m.LiveDataMonitor })));
const VisualMechanic = lazy(() => import('@/components/mechanic/visual/VisualMechanic'));
const BatteryHealthTest = lazy(() => import('@/components/mechanic/BatteryHealthTest'));
interface MechanicTabProps {
  sendCommand: (cmd: string) => Promise<string>;
  isConnected: boolean;
  isPolling: boolean;
  addLog: (msg: string) => void;
  stopPolling: () => void;
  logs: string[];
  themeVehicle: {
    brand: VehicleBrand;
    profile: VehicleProfile;
    modelYear?: string;
  } | null;
  currentProfile: VehicleProfile;
  vehicleBenefits: UseVehicleBenefitsReturn;
  maintenanceSchedule: ReturnType<typeof useMaintenanceSchedule>;
  currentMileage: number;
  speak: (text: string) => void;
  isSpeaking: boolean;
  aiModeEnabled: boolean;
  vehicleContext?: VehicleContextForVision;
  userId?: string;
}

export function MechanicTab({
  sendCommand,
  isConnected,
  isPolling,
  addLog,
  stopPolling,
  logs,
  themeVehicle,
  currentProfile,
  vehicleBenefits,
  maintenanceSchedule,
  currentMileage,
  speak,
  isSpeaking,
  aiModeEnabled,
  vehicleContext,
  userId,
}: MechanicTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6 tab-content-enter">
      <div className="animate-fade-in">
        <SectionHeader
          icon={Wrench}
          title="Central Mecânica"
          description="Diagnóstico completo e manutenção do veículo"
        />
      </div>

      <Tabs defaultValue="visual" className="w-full animate-fade-in stagger-1">
        <TabsList className="grid w-full grid-cols-6 h-auto tabs-scroll glass">
          <TabsTrigger value="visual" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row press-effect">
            <Eye className="h-4 w-4" />
            <span className="hidden xs:inline">Visual</span>
          </TabsTrigger>
          <TabsTrigger value="diagnostico" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row press-effect">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden xs:inline">DTCs</span>
          </TabsTrigger>
          <TabsTrigger value="bateria" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row press-effect">
            <Battery className="h-4 w-4" />
            <span className="hidden xs:inline">Bateria</span>
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row press-effect">
            <Activity className="h-4 w-4" />
            <span className="hidden xs:inline">Sensores</span>
          </TabsTrigger>
          <TabsTrigger value="manutencao" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row press-effect">
            <Calendar className="h-4 w-4" />
            <span className="hidden xs:inline">Revisão</span>
          </TabsTrigger>
          <TabsTrigger value="veiculo" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row press-effect">
            <Car className="h-4 w-4" />
            <span className="hidden xs:inline">Veículo</span>
          </TabsTrigger>
        </TabsList>

        {/* Visual Mechanic - Diagnóstico por Foto/Vídeo */}
        <TabsContent value="visual" className="space-y-4 mt-4 tab-content-enter">
          <div className="card-hover rounded-xl">
            <Suspense fallback={<VisualMechanicSkeleton />}>
              <VisualMechanic
                onSpeak={aiModeEnabled ? speak : undefined}
                isSpeaking={isSpeaking}
                vehicleContext={vehicleContext}
              />
            </Suspense>
          </div>
        </TabsContent>

        {/* Diagnóstico (DTCs) */}
        <TabsContent value="diagnostico" className="space-y-4 mt-4 tab-content-enter">
          <div className="card-hover rounded-xl">
            <Suspense fallback={<ScannerSkeleton />}>
              <DTCScanner 
                sendCommand={sendCommand}
                isConnected={isConnected}
                addLog={addLog}
                stopPolling={stopPolling}
                isPolling={isPolling}
                onSpeakAlert={aiModeEnabled ? speak : undefined}
                userId={userId}
              />
            </Suspense>
          </div>
          <div className="animate-fade-in stagger-1">
            <LogPanel logs={logs} />
          </div>
        </TabsContent>

        {/* Battery Health Test */}
        <TabsContent value="bateria" className="space-y-4 mt-4 tab-content-enter">
          <div className="card-hover rounded-xl">
            <Suspense fallback={<BatteryTestSkeleton />}>
              <BatteryHealthTest
                sendCommand={sendCommand}
                isConnected={isConnected}
                isPolling={isPolling}
                stopPolling={stopPolling}
                addLog={addLog}
                onSpeak={aiModeEnabled ? speak : undefined}
              />
            </Suspense>
          </div>
        </TabsContent>

        {/* Live Data (Sensores) */}
        <TabsContent value="live" className="space-y-4 mt-4 tab-content-enter">
          <div className="card-hover rounded-xl">
            <Suspense fallback={<LiveDataSkeleton />}>
              <LiveDataMonitor
                sendCommand={sendCommand}
                isConnected={isConnected}
                addLog={addLog}
                stopPolling={stopPolling}
                isPolling={isPolling}
              />
            </Suspense>
          </div>
          <div className="animate-fade-in stagger-1">
            <LogPanel logs={logs} />
          </div>
        </TabsContent>

        {/* Manutenção */}
        <TabsContent value="manutencao" className="space-y-4 mt-4 tab-content-enter">
          <div className="card-hover rounded-xl">
            <MaintenanceCard
              alerts={maintenanceSchedule.alerts}
              intervals={maintenanceSchedule.intervals}
              currentMileage={currentMileage}
              brandName={currentProfile.displayName}
              onRecordMaintenance={maintenanceSchedule.recordMaintenance}
              onSpeakAlerts={() => {
                const message = maintenanceSchedule.getVoiceMessage();
                if (message) speak(message);
              }}
              isSpeaking={isSpeaking}
            />
          </div>
        </TabsContent>

        {/* Veículo */}
        <TabsContent value="veiculo" className="space-y-4 mt-4 tab-content-enter">
          <div className="animate-fade-in card-hover rounded-xl">
            <VehicleVIN
              sendCommand={sendCommand}
              isConnected={isConnected}
              addLog={addLog}
            />
          </div>
          {themeVehicle && (
            <div className="animate-fade-in stagger-1 card-hover rounded-xl">
              <VehicleInfoCard
                brand={themeVehicle.brand}
                profile={currentProfile}
                modelYear={themeVehicle.modelYear}
                benefits={vehicleBenefits}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
