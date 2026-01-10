import { Gauge, Thermometer, Battery, Fuel, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  SemanticStatus, 
  getTemperatureStatus, 
  getVoltageStatus, 
  getFuelStatus, 
  getEngineLoadStatus,
  getSpeedStatus 
} from '@/components/dashboard/SemanticStatus';

interface VehicleStatsProps {
  speed: number | null;
  temperature: number | null;
  voltage: number | null;
  fuelLevel?: number | null;
  engineLoad?: number | null;
  isReading: boolean;
}

export function VehicleStats({ speed, temperature, voltage, fuelLevel, engineLoad, isReading }: VehicleStatsProps) {
  // Status semânticos para modo didático
  const tempStatus = getTemperatureStatus(isReading ? temperature : null);
  const voltStatus = getVoltageStatus(isReading ? voltage : null);
  const fuelStatus = getFuelStatus(isReading ? (fuelLevel ?? null) : null);
  const loadStatus = getEngineLoadStatus(isReading ? (engineLoad ?? null) : null);
  const speedStatus = getSpeedStatus(isReading ? speed : null);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Velocidade Grande - Destaque com Status Semântico */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-sm sm:text-base font-medium text-muted-foreground">Velocidade</span>
            </div>
            {/* Status Semântico da Velocidade */}
            <span className={`text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-full ${
              speedStatus.level === 'ok' ? 'bg-green-500/20 text-green-500' :
              speedStatus.level === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
              speedStatus.level === 'critical' ? 'bg-red-500/20 text-red-500' :
              'bg-muted text-muted-foreground'
            }`}>
              {speedStatus.text}
            </span>
          </div>
          <div className="flex items-baseline justify-center gap-1 sm:gap-2">
            <span className="text-5xl sm:text-7xl font-mono font-bold text-foreground value-transition tabular-nums">
              {isReading && speed !== null ? speed.toString().padStart(3, '0') : '---'}
            </span>
            <span className="text-lg sm:text-xl text-muted-foreground">km/h</span>
          </div>
        </CardContent>
      </Card>

      {/* Status Semânticos - Cards Grandes e Claros */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Temperatura */}
        <SemanticStatus
          label="Temperatura"
          value={isReading ? temperature : null}
          unit="°C"
          status={tempStatus.level}
          statusText={tempStatus.text}
          icon={<Thermometer className="h-4 w-4" />}
          showValue={isReading && temperature !== null}
        />

        {/* Bateria/Voltagem */}
        <SemanticStatus
          label="Bateria"
          value={isReading ? voltage : null}
          unit="V"
          status={voltStatus.level}
          statusText={voltStatus.text}
          icon={<Battery className="h-4 w-4" />}
          showValue={isReading && voltage !== null}
        />

        {/* Combustível */}
        <SemanticStatus
          label="Combustível"
          value={isReading ? (fuelLevel ?? null) : null}
          unit="%"
          status={fuelStatus.level}
          statusText={fuelStatus.text}
          icon={<Fuel className="h-4 w-4" />}
          showValue={isReading && fuelLevel !== null && fuelLevel !== undefined}
        />

        {/* Carga do Motor */}
        <SemanticStatus
          label="Carga Motor"
          value={isReading ? (engineLoad ?? null) : null}
          unit="%"
          status={loadStatus.level}
          statusText={loadStatus.text}
          icon={<Zap className="h-4 w-4" />}
          showValue={isReading && engineLoad !== null && engineLoad !== undefined}
        />
      </div>

      {/* Barra de Carga do Motor (visual adicional) */}
      {engineLoad !== null && engineLoad !== undefined && isReading && (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Esforço do Motor</span>
              </div>
              <span className={`text-sm sm:text-base font-bold ${
                engineLoad <= 30 ? 'text-green-500' :
                engineLoad <= 60 ? 'text-yellow-500' :
                'text-red-500'
              }`}>{engineLoad}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ease-out rounded-full ${
                  engineLoad <= 30 ? 'bg-green-500' :
                  engineLoad <= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, engineLoad)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {engineLoad <= 30 ? '💡 Motor relaxado - economia de combustível' :
               engineLoad <= 60 ? '⚡ Esforço moderado - condução normal' :
               engineLoad <= 80 ? '🔥 Alta demanda - subida ou aceleração' :
               '⚠️ Esforço máximo - evite manter por muito tempo'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
