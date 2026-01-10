import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SemanticLevel = 'ok' | 'warning' | 'critical' | 'unknown';

interface SemanticStatusProps {
  label: string;
  value: number | null;
  unit: string;
  status: SemanticLevel;
  statusText: string;
  icon?: React.ReactNode;
  showValue?: boolean;
  className?: string;
}

/**
 * Componente de Status Semântico para usuários leigos
 * Exibe informações de forma clara com cores intuitivas
 * Verde = OK, Amarelo = Atenção, Vermelho = Crítico
 */
export function SemanticStatus({ 
  label, 
  value, 
  unit, 
  status, 
  statusText,
  icon,
  showValue = true,
  className 
}: SemanticStatusProps) {
  const statusConfig = {
    ok: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-500',
      icon: <CheckCircle className="h-5 w-5" />,
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-500',
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-500',
      icon: <XCircle className="h-5 w-5" />,
    },
    unknown: {
      bg: 'bg-muted/50',
      border: 'border-muted',
      text: 'text-muted-foreground',
      icon: <HelpCircle className="h-5 w-5" />,
    },
  };

  const config = statusConfig[status];

  return (
    <div 
      className={cn(
        'rounded-lg border p-4 transition-all duration-300',
        config.bg,
        config.border,
        className
      )}
    >
      {/* Header com ícone e label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className={config.text}>{icon}</span>}
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <span className={config.text}>{config.icon}</span>
      </div>

      {/* Status grande e visível */}
      <div className={cn('text-xl font-bold', config.text)}>
        {statusText}
      </div>

      {/* Valor numérico (se habilitado) */}
      {showValue && value !== null && (
        <div className="mt-1 text-sm text-muted-foreground">
          {value} {unit}
        </div>
      )}
    </div>
  );
}

// Funções auxiliares para determinar status semântico

export function getTemperatureStatus(temp: number | null): { level: SemanticLevel; text: string } {
  if (temp === null) return { level: 'unknown', text: 'Aguardando...' };
  if (temp < 50) return { level: 'warning', text: 'FRIO' };
  if (temp < 70) return { level: 'warning', text: 'AQUECENDO' };
  if (temp <= 100) return { level: 'ok', text: 'NORMAL' };
  if (temp <= 110) return { level: 'warning', text: 'QUENTE' };
  return { level: 'critical', text: 'SUPERAQUECENDO!' };
}

export function getVoltageStatus(voltage: number | null): { level: SemanticLevel; text: string } {
  if (voltage === null) return { level: 'unknown', text: 'Aguardando...' };
  if (voltage < 11.5) return { level: 'critical', text: 'BATERIA CRÍTICA!' };
  if (voltage < 12.5) return { level: 'warning', text: 'BATERIA BAIXA' };
  if (voltage > 15.0) return { level: 'critical', text: 'SOBRECARGA!' };
  if (voltage >= 13.5 && voltage <= 14.5) return { level: 'ok', text: 'OK' };
  return { level: 'ok', text: 'NORMAL' };
}

export function getFuelStatus(fuel: number | null): { level: SemanticLevel; text: string } {
  if (fuel === null) return { level: 'unknown', text: 'Indisponível' };
  if (fuel <= 10) return { level: 'critical', text: 'RESERVA!' };
  if (fuel <= 20) return { level: 'warning', text: 'BAIXO' };
  if (fuel >= 80) return { level: 'ok', text: 'CHEIO' };
  return { level: 'ok', text: 'OK' };
}

export function getEngineLoadStatus(load: number | null): { level: SemanticLevel; text: string } {
  if (load === null) return { level: 'unknown', text: 'Aguardando...' };
  if (load <= 30) return { level: 'ok', text: 'LEVE' };
  if (load <= 60) return { level: 'ok', text: 'MODERADA' };
  if (load <= 80) return { level: 'warning', text: 'ALTA' };
  return { level: 'critical', text: 'ESFORÇO MÁXIMO!' };
}

export function getSpeedStatus(speed: number | null, limit: number = 120): { level: SemanticLevel; text: string } {
  if (speed === null) return { level: 'unknown', text: 'Aguardando...' };
  if (speed === 0) return { level: 'ok', text: 'PARADO' };
  if (speed <= 60) return { level: 'ok', text: 'URBANO' };
  if (speed <= limit) return { level: 'ok', text: 'ESTRADA' };
  return { level: 'warning', text: 'ACIMA DO LIMITE' };
}

export function getRPMStatus(rpm: number | null, temp: number | null): { level: SemanticLevel; text: string } {
  if (rpm === null) return { level: 'unknown', text: 'Aguardando...' };
  
  const isColdEngine = temp !== null && temp < 60;
  
  if (rpm === 0) return { level: 'ok', text: 'DESLIGADO' };
  if (rpm < 800) return { level: 'warning', text: 'MARCHA LENTA BAIXA' };
  if (rpm <= 1200) return { level: 'ok', text: 'MARCHA LENTA' };
  if (rpm <= 3000) {
    if (isColdEngine && rpm > 2500) {
      return { level: 'warning', text: 'ALTO (MOTOR FRIO)' };
    }
    return { level: 'ok', text: 'NORMAL' };
  }
  if (rpm <= 5000) {
    if (isColdEngine) {
      return { level: 'critical', text: 'ALTO! MOTOR FRIO!' };
    }
    return { level: 'warning', text: 'ALTO' };
  }
  return { level: 'critical', text: 'ZONA VERMELHA!' };
}
