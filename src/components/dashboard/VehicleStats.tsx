import { Gauge, Thermometer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface VehicleStatsProps {
  speed: number | null;
  temperature: number | null;
  isReading: boolean;
}

export function VehicleStats({ speed, temperature, isReading }: VehicleStatsProps) {
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

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      {/* Velocidade */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Velocidade</span>
          </div>
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-foreground">
              {isReading && speed !== null ? speed : '--'}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground">km/h</span>
          </div>
        </CardContent>
      </Card>

      {/* Temperatura */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Thermometer className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${getTemperatureColor(temperature)}`} />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Temp. Motor</span>
          </div>
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className={`text-2xl sm:text-3xl font-bold ${getTemperatureColor(temperature)}`}>
              {isReading && temperature !== null ? temperature : '--'}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground">°C</span>
          </div>
          <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${getTemperatureColor(temperature)}`}>
            {isReading ? getTemperatureStatus(temperature) : 'Parado'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
