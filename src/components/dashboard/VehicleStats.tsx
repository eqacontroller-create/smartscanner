import { Gauge, Thermometer, Battery, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface VehicleStatsProps {
  speed: number | null;
  temperature: number | null;
  voltage: number | null;
  isReading: boolean;
}

export function VehicleStats({ speed, temperature, voltage, isReading }: VehicleStatsProps) {
  const getTemperatureColor = (temp: number | null) => {
    if (temp === null) return 'text-muted-foreground';
    if (temp < 70) return 'text-blue-500';
    if (temp <= 100) return 'text-green-500';
    return 'text-destructive';
  };

  const getTemperatureStatus = (temp: number | null) => {
    if (temp === null) return 'Aguardando...';
    if (temp < 70) return 'Aquecendo';
    if (temp <= 100) return 'Normal';
    return 'SUPERAQUECENDO!';
  };

  const getVoltageColor = (v: number | null) => {
    if (v === null) return 'text-muted-foreground';
    if (v < 12.0 || v > 15.0) return 'text-destructive';
    if (v < 12.5) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getVoltageStatus = (v: number | null) => {
    if (v === null) return 'Aguardando...';
    if (v < 12.0) return 'BATERIA CRÍTICA!';
    if (v < 12.5) return 'Bateria Baixa';
    if (v > 15.0) return 'SOBRECARGA!';
    return 'Alternador OK';
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Velocidade Grande - Destaque */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gauge className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-sm sm:text-base font-medium text-muted-foreground">Velocidade</span>
          </div>
          <div className="flex items-baseline justify-center gap-1 sm:gap-2">
            <span className="text-5xl sm:text-7xl font-mono font-bold text-foreground value-transition tabular-nums">
              {isReading && speed !== null ? speed.toString().padStart(3, '0') : '---'}
            </span>
            <span className="text-lg sm:text-xl text-muted-foreground">km/h</span>
          </div>
        </CardContent>
      </Card>

      {/* Temperatura e Voltagem lado a lado */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* Temperatura */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <Thermometer className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${getTemperatureColor(temperature)}`} />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Temp. Motor</span>
            </div>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className={`text-2xl sm:text-3xl font-bold value-transition ${getTemperatureColor(temperature)}`}>
                {isReading && temperature !== null ? temperature : '--'}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">°C</span>
            </div>
            <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${getTemperatureColor(temperature)}`}>
              {isReading ? getTemperatureStatus(temperature) : 'Parado'}
            </p>
          </CardContent>
        </Card>

        {/* Voltagem */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <Battery className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${getVoltageColor(voltage)}`} />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Bateria</span>
            </div>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className={`text-2xl sm:text-3xl font-bold value-transition tabular-nums ${getVoltageColor(voltage)}`}>
                {isReading && voltage !== null ? voltage.toFixed(1) : '--.-'}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">V</span>
            </div>
            <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${getVoltageColor(voltage)}`}>
              {isReading ? getVoltageStatus(voltage) : 'Parado'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
