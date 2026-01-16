import { RPMGauge } from '@/components/dashboard/RPMGauge';
import { VehicleStats } from '@/components/dashboard/VehicleStats';
import { RPMCard } from '@/components/dashboard/RPMCard';
import { LogPanel } from '@/components/dashboard/LogPanel';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

interface DashboardTabProps {
  rpm: number | null;
  speed: number | null;
  temperature: number | null;
  voltage: number | null;
  fuelLevel: number | null;
  engineLoad: number | null;
  redlineRPM: number;
  isReady: boolean;
  isReading: boolean;
  isPolling: boolean;
  logs: string[];
  onStartPolling: () => void;
  onStopPolling: () => void;
}

export function DashboardTab({
  rpm,
  speed,
  temperature,
  voltage,
  fuelLevel,
  engineLoad,
  redlineRPM,
  isReady,
  isReading,
  isPolling,
  logs,
  onStartPolling,
  onStopPolling,
}: DashboardTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6 tab-content-enter">
      {/* Gauge Section */}
      <div className="flex flex-col items-center gap-4 sm:gap-6 animate-fade-in">
        <RPMGauge value={rpm} redlineRPM={redlineRPM} />
        
        {/* Polling Toggle Button */}
        {(isReady || isReading) && (
          <Button
            size="lg"
            onClick={isPolling ? onStopPolling : onStartPolling}
            className={`gap-2 min-h-[48px] px-6 touch-target press-effect transition-all duration-300 ${isPolling 
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
              : 'bg-accent text-accent-foreground hover:bg-accent/90'
            }`}
          >
            {isPolling ? (
              <>
                <Square className="h-5 w-5" />
                <span>Parar Leitura</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Iniciar Leitura</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Vehicle Stats */}
      <div className="animate-fade-in stagger-1">
        <VehicleStats 
          speed={speed} 
          temperature={temperature} 
          voltage={voltage}
          fuelLevel={fuelLevel}
          engineLoad={engineLoad}
          isReading={isReading}
        />
      </div>

      {/* RPM Card */}
      <div className="animate-fade-in stagger-2">
        <RPMCard value={rpm} isReading={isReading} />
      </div>

      {/* Log Panel */}
      <div className="animate-fade-in stagger-3">
        <LogPanel logs={logs} />
      </div>
    </div>
  );
}
