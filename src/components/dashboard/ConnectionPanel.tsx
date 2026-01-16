import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ConnectionButton } from '@/components/dashboard/ConnectionButton';
import { VehicleBadge } from '@/components/dashboard/VehicleBadge';
import type { DetectedVehicle } from '@/lib/vehicleProfiles';
import type { ConnectionStatus } from '@/contexts/OBDContext';

interface ConnectionPanelProps {
  status: ConnectionStatus;
  error: string | null;
  isSupported: boolean;
  themeVehicle: DetectedVehicle | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionPanel({ status, error, isSupported, themeVehicle, onConnect, onDisconnect }: ConnectionPanelProps) {
  const isReady = status === 'ready';

  return (
    <>
      {!isSupported && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium text-destructive text-sm sm:text-base">Navegador não suportado</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                A Web Bluetooth API não é suportada neste navegador. Use o Chrome, Edge ou Opera em desktop, ou Chrome no Android.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium text-destructive text-sm sm:text-base">Erro de Conexão</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {themeVehicle && isReady && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <VehicleBadge brand={themeVehicle.brand} profile={themeVehicle.profile} modelYear={themeVehicle.modelYear} />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <ConnectionButton status={status} onConnect={onConnect} onDisconnect={onDisconnect} disabled={!isSupported} />
      </div>
    </>
  );
}
