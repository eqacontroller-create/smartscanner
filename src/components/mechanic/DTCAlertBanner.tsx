import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getDTCSeverity } from '@/lib/dtcNotifications';

interface DTCAlertBannerProps {
  comparison: {
    new: string[];
    resolved: string[];
    persistent: string[];
  } | null;
  onDismiss?: () => void;
}

export function DTCAlertBanner({ comparison, onDismiss }: DTCAlertBannerProps) {
  if (!comparison) return null;
  
  const hasNew = comparison.new.length > 0;
  const hasResolved = comparison.resolved.length > 0;
  
  // Se não há mudanças, não mostrar banner
  if (!hasNew && !hasResolved) return null;
  
  // Verificar se há códigos críticos entre os novos
  const criticalNew = comparison.new.filter(code => getDTCSeverity(code) === 'critical');
  const hasCritical = criticalNew.length > 0;
  
  return (
    <div className="space-y-2">
      {/* Banner de novos erros */}
      {hasNew && (
        <Alert 
          variant={hasCritical ? 'destructive' : 'default'}
          className={hasCritical 
            ? 'border-destructive/50 bg-destructive/10 animate-pulse' 
            : 'border-amber-500/50 bg-amber-500/10'
          }
        >
          <AlertTriangle className={`h-4 w-4 ${hasCritical ? 'text-destructive' : 'text-amber-500'}`} />
          <AlertTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {comparison.new.length} Novo{comparison.new.length > 1 ? 's' : ''} Erro{comparison.new.length > 1 ? 's' : ''} Detectado{comparison.new.length > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {comparison.new.map(code => {
                const severity = getDTCSeverity(code);
                return (
                  <Badge 
                    key={code}
                    variant="outline"
                    className={`font-mono text-xs ${
                      severity === 'critical' 
                        ? 'bg-destructive/20 border-destructive text-destructive' 
                        : severity === 'warning'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-600'
                        : 'bg-muted'
                    }`}
                  >
                    {code}
                  </Badge>
                );
              })}
            </div>
            {hasCritical && (
              <p className="text-xs mt-2 text-destructive font-medium">
                ⚠️ {criticalNew.length} código{criticalNew.length > 1 ? 's' : ''} crítico{criticalNew.length > 1 ? 's' : ''} detectado{criticalNew.length > 1 ? 's' : ''} - verificar imediatamente!
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Banner de erros resolvidos */}
      {hasResolved && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="flex items-center gap-2 text-green-600">
            <TrendingDown className="h-4 w-4" />
            {comparison.resolved.length} Erro{comparison.resolved.length > 1 ? 's' : ''} Resolvido{comparison.resolved.length > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {comparison.resolved.map(code => (
                <Badge 
                  key={code}
                  variant="outline"
                  className="font-mono text-xs bg-green-500/10 border-green-500/30 text-green-600 line-through"
                >
                  {code}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Resumo de persistentes (se houver mudanças) */}
      {(hasNew || hasResolved) && comparison.persistent.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 bg-muted/30 rounded-lg">
          <ArrowRight className="h-3.5 w-3.5" />
          <span>
            {comparison.persistent.length} código{comparison.persistent.length > 1 ? 's' : ''} persistente{comparison.persistent.length > 1 ? 's' : ''}: 
          </span>
          <span className="font-mono">
            {comparison.persistent.slice(0, 5).join(', ')}
            {comparison.persistent.length > 5 && ` +${comparison.persistent.length - 5}`}
          </span>
        </div>
      )}
    </div>
  );
}
