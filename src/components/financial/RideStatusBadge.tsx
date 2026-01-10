import { Badge } from '@/components/ui/badge';
import { RideStatus } from '@/types/tripSettings';
import { Car, Clock, CheckCircle, Pause } from 'lucide-react';

interface RideStatusBadgeProps {
  status: RideStatus;
  className?: string;
}

const statusConfig: Record<RideStatus, { 
  label: string; 
  icon: typeof Car; 
  className: string;
}> = {
  idle: {
    label: 'AGUARDANDO',
    icon: Pause,
    className: 'bg-muted text-muted-foreground',
  },
  detecting: {
    label: 'DETECTANDO...',
    icon: Clock,
    className: 'bg-yellow-500/20 text-yellow-400 animate-pulse border-yellow-500/50',
  },
  in_ride: {
    label: 'EM CORRIDA',
    icon: Car,
    className: 'bg-green-500/20 text-green-400 ride-pulse border-green-500/50',
  },
  finishing: {
    label: 'FINALIZANDO...',
    icon: CheckCircle,
    className: 'bg-blue-500/20 text-blue-400 animate-pulse border-blue-500/50',
  },
};

export function RideStatusBadge({ status, className = '' }: RideStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={`gap-1.5 py-1.5 px-3 text-xs font-semibold ${config.className} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
