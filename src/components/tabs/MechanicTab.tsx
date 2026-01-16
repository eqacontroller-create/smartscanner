import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DTCScanner } from '@/components/mechanic/DTCScanner';
import { LiveDataMonitor } from '@/components/mechanic/LiveDataMonitor';
import { VehicleVIN } from '@/components/dashboard/VehicleVIN';
import { VehicleInfoCard } from '@/components/dashboard/VehicleInfoCard';
import { MaintenanceCard } from '@/components/dashboard/MaintenanceCard';
import { LogPanel } from '@/components/dashboard/LogPanel';
import { SectionHeader } from '@/components/common/SectionHeader';
import { AlertTriangle, Activity, Wrench, Car, Calendar } from 'lucide-react';
import { VehicleProfile, VehicleBrand } from '@/lib/vehicleProfiles';
import { MaintenanceAlert, MaintenanceInterval } from '@/types/maintenanceTypes';

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
  vehicleBenefits: any;
  maintenanceSchedule: {
    alerts: MaintenanceAlert[];
    intervals: MaintenanceInterval[];
    recordMaintenance: (type: string) => void;
    getVoiceMessage: () => string | null;
  };
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <SectionHeader
        icon={Wrench}
        title="Central Mecânica"
        description="Diagnóstico completo e manutenção do veículo"
      />

      <Tabs defaultValue="diagnostico" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto tabs-scroll">
          <TabsTrigger value="diagnostico" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden xs:inline">DTCs</span>
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row">
            <Activity className="h-4 w-4" />
            <span className="hidden xs:inline">Sensores</span>
          </TabsTrigger>
          <TabsTrigger value="manutencao" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row">
            <Calendar className="h-4 w-4" />
            <span className="hidden xs:inline">Revisão</span>
          </TabsTrigger>
          <TabsTrigger value="veiculo" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row">
            <Car className="h-4 w-4" />
            <span className="hidden xs:inline">Veículo</span>
          </TabsTrigger>
        </TabsList>

        {/* Diagnóstico (DTCs) */}
        <TabsContent value="diagnostico" className="space-y-4 mt-4 animate-fade-in">
          <DTCScanner 
            sendCommand={sendCommand}
            isConnected={isConnected}
            addLog={addLog}
            stopPolling={stopPolling}
            isPolling={isPolling}
            onSpeakAlert={aiModeEnabled ? speak : undefined}
          />
          <LogPanel logs={logs} />
        </TabsContent>

        {/* Live Data (Sensores) */}
        <TabsContent value="live" className="space-y-4 mt-4 animate-fade-in">
          <LiveDataMonitor
            sendCommand={sendCommand}
            isConnected={isConnected}
            addLog={addLog}
            stopPolling={stopPolling}
            isPolling={isPolling}
          />
          <LogPanel logs={logs} />
        </TabsContent>

        {/* Manutenção */}
        <TabsContent value="manutencao" className="space-y-4 mt-4 animate-fade-in">
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
        </TabsContent>

        {/* Veículo */}
        <TabsContent value="veiculo" className="space-y-4 mt-4 animate-fade-in">
          <VehicleVIN
            sendCommand={sendCommand}
            isConnected={isConnected}
            addLog={addLog}
          />
          {themeVehicle && (
            <VehicleInfoCard
              brand={themeVehicle.brand}
              profile={currentProfile}
              modelYear={themeVehicle.modelYear}
              benefits={vehicleBenefits}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
