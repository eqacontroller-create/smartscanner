import { Button } from '@/components/ui/button';
import { ConnectionStatus } from '@/contexts/OBDContext';
import { Bluetooth, BluetoothOff, Loader2 } from 'lucide-react';

interface ConnectionButtonProps {
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  disabled?: boolean;
}

export function ConnectionButton({ status, onConnect, onDisconnect, disabled }: ConnectionButtonProps) {
  const isConnecting = status === 'connecting' || status === 'initializing';
  const isConnected = status === 'ready' || status === 'reading';

  if (isConnected) {
    return (
      <Button
        variant="outline"
        onClick={onDisconnect}
        className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive min-h-[44px] px-4 sm:px-6 touch-target"
      >
        <BluetoothOff className="h-4 w-4" />
        <span className="text-sm sm:text-base">Desconectar</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={onConnect}
      disabled={disabled || isConnecting}
      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] px-4 sm:px-6 touch-target"
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bluetooth className="h-4 w-4" />
      )}
      <span className="text-sm sm:text-base">{isConnecting ? 'Conectando...' : 'Conectar ao Scanner'}</span>
    </Button>
  );
}
