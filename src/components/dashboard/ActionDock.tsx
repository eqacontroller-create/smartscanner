// Barra de ações principais do dashboard

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bluetooth, BluetoothOff, Fuel, RotateCcw, Settings } from 'lucide-react';

interface ActionDockProps {
  isConnected: boolean;
  isSupported: boolean;
  refuelActive: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenRefuel: () => void;
  onOpenSettings: () => void;
  onResetTrip: () => void;
}

export function ActionDock({
  isConnected,
  isSupported,
  refuelActive,
  onConnect,
  onDisconnect,
  onOpenRefuel,
  onOpenSettings,
  onResetTrip,
}: ActionDockProps) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-center gap-3">
          {/* Botão Conexão */}
          <Button
            variant={isConnected ? 'destructive' : 'default'}
            size="lg"
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={!isSupported}
            className="gap-2 min-h-[48px] flex-1 max-w-[160px] touch-target press-effect"
          >
            {isConnected ? (
              <>
                <BluetoothOff className="h-5 w-5" />
                <span>Desconectar</span>
              </>
            ) : (
              <>
                <Bluetooth className="h-5 w-5" />
                <span>Conectar</span>
              </>
            )}
          </Button>

          {/* Botão Abastecimento */}
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenRefuel}
            disabled={!isConnected}
            className={`h-12 w-12 touch-target press-effect ${
              refuelActive ? 'border-primary bg-primary/10' : ''
            }`}
          >
            <Fuel className={`h-5 w-5 ${refuelActive ? 'text-primary' : ''}`} />
          </Button>

          {/* Botão Zerar Viagem */}
          <Button
            variant="outline"
            size="icon"
            onClick={onResetTrip}
            className="h-12 w-12 touch-target press-effect"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          {/* Botão Configurações */}
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenSettings}
            className="h-12 w-12 touch-target press-effect"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
