// Seção de telemetria com gauge de RPM e estatísticas do veículo

import { RPMGauge } from '@/components/dashboard/RPMGauge';
import { VehicleStats } from '@/components/dashboard/VehicleStats';
import { RPMCard } from '@/components/dashboard/RPMCard';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import type { VehicleData } from '@/contexts/OBDContext';

interface TelemetrySectionProps {
  vehicleData: VehicleData;
  redlineRPM: number;
  isReady: boolean;
  isReading: boolean;
  isPolling: boolean;
  onStartPolling: () => void;
  onStopPolling: () => void;
}

export function TelemetrySection({
  vehicleData,
  redlineRPM,
  isReady,
  isReading,
  isPolling,
  onStartPolling,
  onStopPolling,
}: TelemetrySectionProps) {
  const { rpm, speed, temperature, voltage, fuelLevel, engineLoad } = vehicleData;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Gauge Section */}
      <div className="flex flex-col items-center gap-4 sm:gap-6 animate-fade-in">
        <RPMGauge value={rpm} redlineRPM={redlineRPM} />
        
        {/* Polling Toggle Button */}
        {(isReady || isReading) && (
          <Button
            size="lg"
            onClick={isPolling ? onStopPolling : onStartPolling}
            className={`gap-2 min-h-[48px] px-6 touch-target press-effect transition-all duration-300 ${
              isPolling 
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
    </div>
  );
}
