import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DailySummary, formatCurrency, formatDistance, formatDuration } from '@/types/tripSettings';
import { Calendar, Clock, MapPin, Fuel, TrendingUp, Trash2, AlertCircle, Volume2 } from 'lucide-react';

interface TodayRidesProps {
  summary: DailySummary;
  onClear: () => void;
  onVoiceReport?: () => void;
  isSpeaking?: boolean;
}

export function TodayRides({ summary, onClear, onVoiceReport, isSpeaking }: TodayRidesProps) {
  const hasRides = summary.rides.length > 0;
  
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-money" />
            Histórico de Hoje
          </CardTitle>
          
          <div className="flex items-center gap-1">
            {onVoiceReport && hasRides && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-money hover:text-money hover:bg-money/10"
                onClick={onVoiceReport}
                disabled={isSpeaking}
                title="Ouvir relatório do dia"
              >
                <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
              </Button>
            )}
            {hasRides && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onClear}
                title="Limpar histórico"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!hasRides ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma corrida registrada hoje</p>
            <p className="text-xs mt-1">As corridas serão detectadas automaticamente</p>
          </div>
        ) : (
          <>
            {/* Lista de corridas */}
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {summary.rides.map((ride) => {
                  const time = new Date(ride.startTime).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  
                  return (
                    <div 
                      key={ride.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono">{time}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {ride.distance.toFixed(1)} km
                        </span>
                        <span className="flex items-center gap-1 text-destructive">
                          <Fuel className="h-3 w-3" />
                          {formatCurrency(ride.cost)}
                        </span>
                      </div>
                      
                      {ride.profit !== undefined && (
                        <span className={`font-semibold ${ride.profit >= 0 ? 'text-money' : 'text-destructive'}`}>
                          {ride.profit >= 0 ? '+' : ''}{formatCurrency(ride.profit)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            {/* Totais do dia */}
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Totais do Dia
              </h4>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/50">
                  <MapPin className="h-4 w-4 mx-auto text-accent mb-1" />
                  <p className="font-semibold">{summary.totalDistance.toFixed(1)} km</p>
                  <p className="text-[10px] text-muted-foreground">Rodados</p>
                </div>
                
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Fuel className="h-4 w-4 mx-auto text-destructive mb-1" />
                  <p className="font-semibold text-destructive">{formatCurrency(summary.totalCost)}</p>
                  <p className="text-[10px] text-muted-foreground">Combustível</p>
                </div>
                
                <div className="p-2 rounded-lg bg-money/10">
                  <TrendingUp className="h-4 w-4 mx-auto text-money mb-1" />
                  <p className={`font-semibold ${summary.totalProfit >= 0 ? 'text-money' : 'text-destructive'}`}>
                    {summary.totalProfit >= 0 ? '+' : ''}{formatCurrency(summary.totalProfit)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Lucro</p>
                </div>
              </div>
              
              {/* Lembrete de combustível */}
              {summary.totalCost > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-200">
                    <strong>Lembrete:</strong> Guarde {formatCurrency(summary.totalCost)} para o combustível de amanhã.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
