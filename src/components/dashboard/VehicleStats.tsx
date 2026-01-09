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
    <div className="grid grid-cols-2 gap-4">
      {/* Velocidade */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Velocidade</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              {isReading && speed !== null ? speed : '--'}
            </span>
            <span className="text-sm text-muted-foreground">km/h</span>
          </div>
        </CardContent>
      </Card>

      {/* Temperatura */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className={`h-4 w-4 ${getTemperatureColor(temperature)}`} />
            <span className="text-sm font-medium text-muted-foreground">Temp. Motor</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold ${getTemperatureColor(temperature)}`}>
              {isReading && temperature !== null ? temperature : '--'}
            </span>
            <span className="text-sm text-muted-foreground">°C</span>
          </div>
          <p className={`text-xs mt-1 ${getTemperatureColor(temperature)}`}>
            {isReading ? getTemperatureStatus(temperature) : 'Parado'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
