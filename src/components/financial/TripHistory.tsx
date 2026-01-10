import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TripHistoryEntry, formatCurrency, formatDuration } from '@/types/tripSettings';
import { History, Trash2, MapPin, Clock } from 'lucide-react';

interface TripHistoryProps {
  history: TripHistoryEntry[];
  onClearHistory: () => void;
}

export function TripHistory({ history, onClearHistory }: TripHistoryProps) {
  if (history.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma viagem registrada ainda.</p>
          <p className="text-xs mt-1">Clique em "Salvar" ao final de cada viagem.</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular totais
  const totals = history.reduce(
    (acc, entry) => ({
      distance: acc.distance + entry.distance,
      cost: acc.cost + entry.cost,
      duration: acc.duration + entry.duration,
    }),
    { distance: 0, cost: 0, duration: 0 }
  );

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Histórico de Viagens
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onClearHistory}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totais */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-money/5 rounded-lg border border-money/20">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total KM</p>
            <p className="font-semibold text-money">{totals.distance.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Gasto</p>
            <p className="font-semibold text-money">{formatCurrency(totals.cost)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Viagens</p>
            <p className="font-semibold">{history.length}</p>
          </div>
        </div>

        {/* Lista de viagens */}
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {history.map((entry) => {
              const date = new Date(entry.date);
              const formattedDate = date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={entry.id}
                  className="p-3 bg-secondary/30 rounded-lg border border-border/30"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-muted-foreground">{formattedDate}</span>
                    <span className="font-semibold text-money">{formatCurrency(entry.cost)}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {entry.distance.toFixed(1)} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(entry.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
