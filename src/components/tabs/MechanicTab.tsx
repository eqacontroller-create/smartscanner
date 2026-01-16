import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DTCScanner } from '@/components/mechanic/DTCScanner';
import { LiveDataMonitor } from '@/components/mechanic/LiveDataMonitor';
import { VehicleVIN } from '@/components/dashboard/VehicleVIN';
import { VehicleInfoCard } from '@/components/dashboard/VehicleInfoCard';
import { MaintenanceCard } from '@/components/dashboard/MaintenanceCard';
import { LogPanel } from '@/components/dashboard/LogPanel';
import { SectionHeader } from '@/components/common/SectionHeader';
import { AlertTriangle, Activity, Wrench, Car, Calendar } from 'lucide-react';
import type { VehicleProfile, VehicleBrand } from '@/lib/vehicleProfiles';
import type { UseVehicleBenefitsReturn } from '@/hooks/useVehicleBenefits';
import type { useMaintenanceSchedule } from '@/hooks/useMaintenanceSchedule';

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

      <Tabs defaultValue="diagnostico" className="w-full animate-fade-in stagger-1">
        <TabsList className="grid w-full grid-cols-4 h-auto tabs-scroll glass">
          <TabsTrigger value="diagnostico" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row press-effect">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden xs:inline">DTCs</span>
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

        {/* Diagnóstico (DTCs) */}
        <TabsContent value="diagnostico" className="space-y-4 mt-4 tab-content-enter">
          <div className="card-hover rounded-xl">
            <DTCScanner 
              sendCommand={sendCommand}
              isConnected={isConnected}
              addLog={addLog}
              stopPolling={stopPolling}
              isPolling={isPolling}
              onSpeakAlert={aiModeEnabled ? speak : undefined}
            />
          </div>
          <div className="animate-fade-in stagger-1">
            <LogPanel logs={logs} />
          </div>
        </TabsContent>

        {/* Live Data (Sensores) */}
        <TabsContent value="live" className="space-y-4 mt-4 tab-content-enter">
          <div className="card-hover rounded-xl">
            <LiveDataMonitor
              sendCommand={sendCommand}
              isConnected={isConnected}
              addLog={addLog}
              stopPolling={stopPolling}
              isPolling={isPolling}
            />
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
