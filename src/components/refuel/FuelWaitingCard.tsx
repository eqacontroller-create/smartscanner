// Card visual para estados de espera antes do monitoramento
// Diferencia entre espera de dados (waiting) e espera de movimento (waiting-quick)

import { Car, Fuel, X, Gauge, Activity, CloudOff, Cloud } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RefuelMode, RefuelFlowType } from '@/types/refuelTypes';

interface FuelWaitingCardProps {
  mode: 'waiting' | 'waiting-quick';
  flowType: RefuelFlowType | null;
  currentSpeed: number | null;
  isAuthenticated?: boolean;
  onCancel: () => void;
  onOpenModal?: () => void;
}

export function FuelWaitingCard({
  mode,
  flowType,
  currentSpeed,
  isAuthenticated = false,
  onCancel,
  onOpenModal,
}: FuelWaitingCardProps) {
  const isQuickTest = mode === 'waiting-quick' || flowType === 'quick-test';
  const speed = currentSpeed ?? 0;
  
  // Configurações visuais por modo
  const config = isQuickTest ? {
    icon: Activity,
    title: 'Teste Rápido de Combustível',
    description: 'Comece a dirigir para iniciar a análise',
    instruction: 'O sistema começará a monitorar automaticamente quando você iniciar o trajeto (velocidade > 5 km/h).',
    color: 'blue',
    bgGradient: 'from-blue-500/10 to-blue-600/5',
    borderColor: 'border-blue-500/50',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
    progressColor: 'bg-blue-500',
  } : {
    icon: Fuel,
    title: 'Modo Abastecimento Ativo',
    description: 'Confirme os dados do abastecimento',
    instruction: 'Preencha os dados do abastecimento (litros e preço) para iniciar o monitoramento de qualidade.',
    color: 'yellow',
    bgGradient: 'from-yellow-500/10 to-orange-500/5',
    borderColor: 'border-yellow-500/50',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-500',
    progressColor: 'bg-yellow-500',
  };
  
  const Icon = config.icon;
  
  return (
    <Card className={cn(
      'border-2 transition-all duration-300 overflow-hidden',
      config.borderColor,
      'animate-fade-in'
    )}>
      {/* Gradient background */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br pointer-events-none',
        config.bgGradient
      )} />
      
      <CardContent className="p-4 relative">
        {/* Header com badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-3 rounded-xl',
              config.iconBg
            )}>
              <Icon className={cn('h-6 w-6', config.iconColor)} />
            </div>
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                {config.title}
                {isAuthenticated ? (
                  <Cloud className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <CloudOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Indicador de velocidade animado */}
        <div className="bg-background/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Velocidade atual</span>
            </div>
            <Badge variant={speed > 0 ? "default" : "secondary"}>
              {speed > 0 ? 'Detectando movimento' : 'Parado'}
            </Badge>
          </div>
          
          <div className="flex items-baseline gap-1 mb-3">
            <span className={cn(
              'text-4xl font-bold tabular-nums transition-all duration-300',
              speed > 0 ? config.iconColor : 'text-muted-foreground'
            )}>
              {speed.toFixed(0)}
            </span>
            <span className="text-sm text-muted-foreground">km/h</span>
          </div>
          
          {/* Barra de progresso pulsante */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                'absolute inset-0 rounded-full animate-pulse',
                config.progressColor,
                speed > 5 ? 'opacity-100' : 'opacity-30'
              )}
              style={{ 
                width: speed > 5 ? '100%' : `${Math.min((speed / 5) * 100, 100)}%`,
                transition: 'width 0.5s ease-out'
              }}
            />
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {speed > 5 
              ? 'Iniciando monitoramento...' 
              : `Aguardando velocidade > 5 km/h (faltam ${Math.max(0, 5 - speed).toFixed(0)} km/h)`
            }
          </p>
        </div>
        
        {/* Instrução detalhada */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            💡 {config.instruction}
          </p>
        </div>
        
        {/* Ícone de carro animado */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Car className={cn(
              'h-12 w-12 transition-all duration-500',
              config.iconColor,
              speed > 0 ? 'animate-bounce' : 'opacity-50'
            )} />
            {speed > 0 && (
              <>
                {/* Linhas de movimento */}
                <div className="absolute left-0 top-1/2 -translate-x-6 -translate-y-1/2 flex gap-1">
                  <div className={cn('h-0.5 w-2 rounded animate-pulse', config.progressColor)} style={{ animationDelay: '0ms' }} />
                  <div className={cn('h-0.5 w-3 rounded animate-pulse', config.progressColor)} style={{ animationDelay: '100ms' }} />
                  <div className={cn('h-0.5 w-4 rounded animate-pulse', config.progressColor)} style={{ animationDelay: '200ms' }} />
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Botões de ação */}
        <div className="flex gap-2">
          {!isQuickTest && onOpenModal && (
            <Button 
              onClick={onOpenModal}
              className="flex-1"
              variant="default"
            >
              <Fuel className="h-4 w-4 mr-2" />
              Preencher Dados
            </Button>
          )}
          <Button 
            onClick={onCancel}
            variant="outline"
            className={isQuickTest ? 'flex-1' : ''}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
