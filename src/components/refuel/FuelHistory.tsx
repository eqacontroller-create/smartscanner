// Histórico de abastecimentos e análises de combustível

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  Fuel, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Calendar,
  CloudOff,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FuelQuality, getQualityLabel, getQualityColor } from '@/types/refuelTypes';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RefuelHistoryEntry {
  id: string;
  timestamp: string;
  price_per_liter: number;
  liters_added: number;
  total_paid: number;
  quality: string | null;
  stft_average: number | null;
  distance_monitored: number | null;
  pump_accuracy_percent: number | null;
}

interface FuelHistoryProps {
  userId?: string;
  isAuthenticated: boolean;
}

export function FuelHistory({ userId, isAuthenticated }: FuelHistoryProps) {
  const [entries, setEntries] = useState<RefuelHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && isAuthenticated) {
      loadHistory();
    }
  }, [userId, isAuthenticated]);

  const loadHistory = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('refuel_entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;
      setEntries(data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError('Não foi possível carregar o histórico');
    } finally {
      setIsLoading(false);
    }
  };

  const getQualityIcon = (quality: string | null) => {
    switch (quality) {
      case 'ok':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Fuel className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <CloudOff className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium text-base mb-1">Histórico na Nuvem</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Faça login para salvar e visualizar seu histórico de abastecimentos.
          </p>
          <Badge variant="outline" className="text-xs">
            Seus dados ficam salvos e sincronizados
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Histórico de Abastecimentos
          </span>
          {entries.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {entries.length} registros
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={loadHistory}>
              Tentar novamente
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-6">
            <Fuel className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum abastecimento registrado ainda.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Use "Vou Abastecer" para registrar seu primeiro.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-3">
              {entries.map((entry) => (
                <div 
                  key={entry.id}
                  className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getQualityIcon(entry.quality)}
                      <div>
                        <span className={cn(
                          'text-sm font-medium',
                          getQualityColor(entry.quality as FuelQuality)
                        )}>
                          {getQualityLabel(entry.quality as FuelQuality)}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(entry.timestamp), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {entry.liters_added.toFixed(1)}L
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-1.5 rounded bg-muted/50">
                      <span className="text-muted-foreground block">Preço</span>
                      <span className="font-mono font-medium">
                        R$ {entry.price_per_liter.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-center p-1.5 rounded bg-muted/50">
                      <span className="text-muted-foreground block">Total</span>
                      <span className="font-mono font-medium">
                        R$ {entry.total_paid.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-center p-1.5 rounded bg-muted/50">
                      <span className="text-muted-foreground block">STFT</span>
                      <span className="font-mono font-medium">
                        {entry.stft_average !== null 
                          ? `${entry.stft_average > 0 ? '+' : ''}${entry.stft_average.toFixed(1)}%`
                          : '--'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {entry.pump_accuracy_percent !== null && entry.pump_accuracy_percent < 98 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-yellow-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>Bomba: {entry.pump_accuracy_percent.toFixed(1)}% precisão</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
