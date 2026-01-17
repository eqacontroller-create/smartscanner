import { Gauge, Thermometer, Battery, Fuel, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  SemanticStatus, 
  getTemperatureStatus, 
  getVoltageStatus, 
  getFuelStatus, 
  getEngineLoadStatus,
  getSpeedStatus 
} from '@/components/dashboard/SemanticStatus';
import type { BatteryHealthStatus, FuelHealthStatus } from '@/types/vehicleHealth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VehicleStatsProps {
  speed: number | null;
  temperature: number | null;
  voltage: number | null;
  fuelLevel?: number | null;
  engineLoad?: number | null;
  isReading: boolean;
  // Health overrides from diagnostics
  batteryHealthOverride?: BatteryHealthStatus;
  fuelHealthOverride?: FuelHealthStatus;
}

export function VehicleStats({ 
  speed, 
  temperature, 
  voltage, 
  fuelLevel, 
  engineLoad, 
  isReading,
  batteryHealthOverride,
  fuelHealthOverride,
}: VehicleStatsProps) {
  // Status semânticos para modo didático
  const tempStatus = getTemperatureStatus(isReading ? temperature : null);
  const speedStatus = getSpeedStatus(isReading ? speed : null);
  const loadStatus = getEngineLoadStatus(isReading ? (engineLoad ?? null) : null);
  
  // Status de voltagem - pode ser overriden por diagnóstico de bateria
  const realTimeVoltStatus = getVoltageStatus(isReading ? voltage : null);
  const hasBatteryOverride = batteryHealthOverride && batteryHealthOverride.level !== 'unknown' && batteryHealthOverride.level === 'critical';
  const voltStatus = hasBatteryOverride 
    ? { level: 'critical' as const, text: batteryHealthOverride.message }
    : realTimeVoltStatus;
  
  // Status de combustível - pode ser overriden por diagnóstico de adulteração
  const realTimeFuelStatus = getFuelStatus(isReading ? (fuelLevel ?? null) : null);
  const hasFuelOverride = fuelHealthOverride && fuelHealthOverride.level !== 'unknown' && fuelHealthOverride.level === 'critical';
  const fuelStatus = hasFuelOverride
    ? { level: 'critical' as const, text: fuelHealthOverride.message }
    : realTimeFuelStatus;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Velocidade Grande - Destaque com Status Semântico e Glassmorphism */}
      <Card className="glass border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 card-hover">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20 backdrop-blur-sm">
                <Gauge className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <span className="text-sm sm:text-base font-medium text-muted-foreground">Velocidade</span>
            </div>
            {/* Status Semântico da Velocidade */}
            <span className={`text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${
              speedStatus.level === 'ok' ? 'bg-green-500/20 text-green-500' :
              speedStatus.level === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
              speedStatus.level === 'critical' ? 'bg-red-500/20 text-red-500' :
              'bg-muted/80 text-muted-foreground'
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

        {/* Bateria/Voltagem - Com Override de Diagnóstico */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <SemanticStatus
                  label="Bateria"
                  value={isReading ? voltage : null}
                  unit="V"
                  status={voltStatus.level}
                  statusText={voltStatus.text}
                  icon={<Battery className="h-4 w-4" />}
                  showValue={isReading && voltage !== null}
                />
                {hasBatteryOverride && (
                  <div className="absolute -top-1 -right-1">
                    <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                  </div>
                )}
              </div>
            </TooltipTrigger>
            {hasBatteryOverride && batteryHealthOverride.lastTestDate && (
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  ⚠️ Baseado no teste de bateria de {format(batteryHealthOverride.lastTestDate, "dd/MM/yyyy", { locale: ptBR })}.
                  {batteryHealthOverride.percent !== null && (
                    <span className="block mt-1 font-bold text-destructive">
                      Saúde: {batteryHealthOverride.percent}%
                    </span>
                  )}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Combustível - Com Override de Diagnóstico */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <SemanticStatus
                  label="Combustível"
                  value={isReading ? (fuelLevel ?? null) : null}
                  unit="%"
                  status={fuelStatus.level}
                  statusText={fuelStatus.text}
                  icon={<Fuel className="h-4 w-4" />}
                  showValue={isReading && fuelLevel !== null && fuelLevel !== undefined}
                />
                {hasFuelOverride && (
                  <div className="absolute -top-1 -right-1">
                    <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                  </div>
                )}
              </div>
            </TooltipTrigger>
            {hasFuelOverride && fuelHealthOverride.lastRefuelDate && (
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  ⚠️ Detectado no abastecimento de {format(fuelHealthOverride.lastRefuelDate, "dd/MM/yyyy", { locale: ptBR })}.
                  <span className="block mt-1 font-bold text-destructive">
                    {fuelHealthOverride.message}
                  </span>
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

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
        <Card className="glass card-hover">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 rounded-md bg-primary/20 backdrop-blur-sm">
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Esforço do Motor</span>
              </div>
              <span className={`text-sm sm:text-base font-bold value-transition ${
                engineLoad <= 30 ? 'text-green-500' :
                engineLoad <= 60 ? 'text-yellow-500' :
                'text-red-500'
              }`}>{engineLoad}%</span>
            </div>
            <div className="h-3 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className={`h-full transition-all duration-300 ease-out rounded-full ${
                  engineLoad <= 30 ? 'bg-gradient-to-r from-green-500/80 to-green-400' :
                  engineLoad <= 60 ? 'bg-gradient-to-r from-yellow-500/80 to-yellow-400' :
                  'bg-gradient-to-r from-red-500/80 to-red-400'
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
