import { memo } from 'react';
import { ConnectionStatus } from '@/contexts/OBDContext';
import { BluetoothOff, Loader2, CheckCircle, AlertCircle, Gauge } from 'lucide-react';

interface StatusIndicatorProps {
  status: ConnectionStatus;
}

const statusConfig: Record<ConnectionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  disconnected: {
    label: 'Desconectado',
    color: 'text-muted-foreground',
    icon: <BluetoothOff className="h-5 w-5" />
  },
  connecting: {
    label: 'Conectando...',
    color: 'text-accent',
    icon: <Loader2 className="h-5 w-5 animate-spin" />
  },
  initializing: {
    label: 'Inicializando...',
    color: 'text-accent',
    icon: <Loader2 className="h-5 w-5 animate-spin" />
  },
  ready: {
    label: 'Pronto',
    color: 'text-primary',
    icon: <CheckCircle className="h-5 w-5" />
  },
  reading: {
    label: 'Lendo...',
    color: 'text-primary',
    icon: <Gauge className="h-5 w-5 animate-pulse" />
  },
  error: {
    label: 'Erro',
    color: 'text-destructive',
    icon: <AlertCircle className="h-5 w-5" />
  }
};

export const StatusIndicator = memo(function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 ${config.color}`}>
      {config.icon}
      <span className="text-sm font-medium">{config.label}</span>
      {(status === 'ready' || status === 'reading') && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
      )}
    </div>
  );
});
