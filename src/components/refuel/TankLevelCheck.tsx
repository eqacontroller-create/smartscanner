// Card de verificação do nível do tanque
// Compara litros inseridos com variação real do sensor

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fuel, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TankLevelCheckProps {
  fuelLevelBefore: number;
  fuelLevelAfter: number;
  litersAdded: number;
  tankCapacity: number;
}

export function TankLevelCheck({
  fuelLevelBefore,
  fuelLevelAfter,
  litersAdded,
  tankCapacity,
}: TankLevelCheckProps) {
  // CORREÇÃO 3: Validação de dados - verificar se faz sentido
  if (fuelLevelAfter <= fuelLevelBefore) {
    return (
      <Card className="border border-yellow-500/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="text-sm">
              Dados de nível inconsistentes. O nível depois ({fuelLevelAfter}%) não é maior que antes ({fuelLevelBefore}%).
              Verifique se o sensor atualizou corretamente.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calcular expectativa vs realidade
  const actualIncrease = fuelLevelAfter - fuelLevelBefore;
  const expectedIncrease = (litersAdded / tankCapacity) * 100;
  const expectedLiters = litersAdded;
  const actualLiters = (actualIncrease / 100) * tankCapacity;
  const difference = actualLiters - expectedLiters;
  
  // Validação adicional para evitar divisão por zero
  const accuracy = expectedIncrease > 0 
    ? Math.round((actualIncrease / expectedIncrease) * 100)
    : 100;
  
  // Limitar accuracy a valores razoáveis (50% a 150%)
  const displayAccuracy = Math.max(50, Math.min(150, accuracy));
  
  // Determinar status
  const isAccurate = displayAccuracy >= 85 && displayAccuracy <= 115;
  const isLow = displayAccuracy < 85;
  
  return (
    <Card className={cn(
      'border',
      isAccurate ? 'border-green-500/30' : 'border-yellow-500/50'
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-primary" />
            Verificação da Bomba
          </span>
          <Badge variant={isAccurate ? 'default' : 'destructive'} className="text-xs">
            {displayAccuracy}% precisão
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Níveis */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Antes</div>
            <div className="text-lg font-bold">{fuelLevelBefore}%</div>
          </div>
          <div className="flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Depois</div>
            <div className="text-lg font-bold text-primary">{fuelLevelAfter}%</div>
          </div>
        </div>
        
        {/* Barra de comparação */}
        <div className="space-y-1">
          <div className="h-3 bg-muted rounded-full overflow-hidden relative">
            {/* Nível antes */}
            <div 
              className="absolute inset-y-0 left-0 bg-muted-foreground/30"
              style={{ width: `${fuelLevelBefore}%` }}
            />
            {/* Nível depois */}
            <div 
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
              style={{ width: `${fuelLevelAfter}%` }}
            />
          </div>
        </div>
        
        {/* Comparação */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 rounded bg-muted/50">
            <div className="text-xs text-muted-foreground">Você disse</div>
            <div className="font-medium">{litersAdded.toFixed(1)}L</div>
          </div>
          <div className={cn(
            'p-2 rounded',
            isAccurate ? 'bg-green-500/10' : 'bg-yellow-500/10'
          )}>
            <div className="text-xs text-muted-foreground">Sensor viu</div>
            <div className="font-medium">~{actualLiters.toFixed(1)}L</div>
          </div>
        </div>
        
        {/* Alerta se diferença significativa */}
        {!isAccurate && (
          <div className={cn(
            'p-2 rounded-lg flex items-center gap-2 text-xs',
            isLow ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
          )}>
            {isLow ? (
              <>
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Diferença de ~{Math.abs(difference).toFixed(1)}L ({100 - displayAccuracy}%). 
                  Possível imprecisão na bomba.
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Sensor mostra mais que o esperado. Pode ser calibração do sensor.
                </span>
              </>
            )}
          </div>
        )}
        
        {isAccurate && (
          <div className="p-2 rounded-lg bg-green-500/10 flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Quantidade entregue confere com o sensor.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
