// Cards de ação para iniciar monitoramento de combustível

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Fuel, Zap, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FuelActionCardsProps {
  isConnected: boolean;
  isAuthenticated: boolean;
  stftSupported: boolean | null;
  onStartRefuel: () => void;
  onStartQuickTest: () => void;
}

export function FuelActionCards({
  isConnected,
  isAuthenticated,
  stftSupported,
  onStartRefuel,
  onStartQuickTest,
}: FuelActionCardsProps) {
  if (!isConnected) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-6 text-center">
          <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-3">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-base mb-1">Conecte o Scanner</h3>
          <p className="text-sm text-muted-foreground">
            Para monitorar a qualidade do combustível, conecte-se ao adaptador OBD-II primeiro.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Card Vou Abastecer */}
      <Card 
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-lg group',
          'border-primary/30 hover:border-primary/60 bg-gradient-to-br from-primary/5 to-transparent'
        )}
        onClick={onStartRefuel}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Fuel className="h-6 w-6 text-primary" />
            </div>
            {isAuthenticated ? (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Cloud className="h-3 w-3" />
                Salva
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                <CloudOff className="h-3 w-3" />
                Local
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
            Vou Abastecer
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Registra o abastecimento completo com preço, litros e análise de qualidade
          </p>
          
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px] font-normal">
              💰 Registra preço
            </Badge>
            <Badge variant="outline" className="text-[10px] font-normal">
              📊 Audita bomba
            </Badge>
            <Badge variant="outline" className="text-[10px] font-normal">
              🧪 Analisa qualidade
            </Badge>
          </div>
          
          <Button 
            className="w-full mt-4 gap-2"
            variant="default"
          >
            <Fuel className="h-4 w-4" />
            Iniciar
          </Button>
        </CardContent>
      </Card>

      {/* Card Teste Rápido */}
      <Card 
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-lg group',
          'border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-br from-blue-500/5 to-transparent',
          !stftSupported && 'opacity-60 cursor-not-allowed'
        )}
        onClick={stftSupported ? onStartQuickTest : undefined}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Zap className="h-6 w-6 text-blue-500" />
            </div>
            <Badge variant="secondary" className="text-xs">
              Sem registro
            </Badge>
          </div>
          
          <h3 className="font-semibold text-base mb-1 group-hover:text-blue-500 transition-colors">
            Teste Rápido
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Verifica apenas a qualidade do combustível atual sem registrar dados
          </p>
          
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px] font-normal">
              ⚡ Rápido
            </Badge>
            <Badge variant="outline" className="text-[10px] font-normal">
              🔍 Só qualidade
            </Badge>
            <Badge variant="outline" className="text-[10px] font-normal">
              🚗 Enquanto dirige
            </Badge>
          </div>
          
          <Button 
            className="w-full mt-4 gap-2 bg-blue-500 hover:bg-blue-600"
            disabled={!stftSupported}
          >
            <Zap className="h-4 w-4" />
            {stftSupported ? 'Iniciar' : 'STFT Indisponível'}
          </Button>
          
          {!stftSupported && (
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Seu veículo não suporta leitura de Fuel Trim
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
