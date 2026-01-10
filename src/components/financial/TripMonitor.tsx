import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TripData, formatCurrency, formatDistance, formatDuration } from '@/types/tripSettings';
import { DollarSign, MapPin, Clock, Gauge, TrendingUp } from 'lucide-react';

interface TripMonitorProps {
  tripData: TripData;
  currentSpeed: number | null;
}

export function TripMonitor({ tripData, currentSpeed }: TripMonitorProps) {
  return (
    <div className="space-y-4">
      {/* Card Principal - Custo da Viagem */}
      <Card className="border-money/30 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <DollarSign className="h-4 w-4" />
            CUSTO DA VIAGEM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <span className="text-5xl sm:text-6xl font-bold text-money money-glow tabular-nums">
              {formatCurrency(tripData.cost)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cards Secundários */}
      <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 sm:gap-3">
        {/* Distância */}
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <MapPin className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground mb-1">Distância</p>
            <p className="text-lg font-semibold text-money tabular-nums">
              {tripData.distance.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">km</p>
          </CardContent>
        </Card>

        {/* Tempo */}
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground mb-1">Tempo</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {formatDuration(tripData.duration)}
            </p>
          </CardContent>
        </Card>

        {/* Velocidade Média */}
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Gauge className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground mb-1">V. Média</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {tripData.averageSpeed.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">km/h</p>
          </CardContent>
        </Card>
      </div>

      {/* Custo por KM */}
      <Card className="border-money/20 bg-money/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-money" />
            <span className="text-sm font-medium">Custo por KM</span>
          </div>
          <span className="text-xl font-bold text-money tabular-nums">
            {formatCurrency(tripData.costPerKm)}
          </span>
        </CardContent>
      </Card>

      {/* Velocidade Atual */}
      {currentSpeed !== null && tripData.isActive && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">Velocidade Atual</span>
            </div>
            <span className="text-xl font-bold text-accent tabular-nums">
              {currentSpeed} km/h
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
