import { useState, useEffect } from 'react';
import { History, ChevronRight, CheckCircle2, AlertCircle, Clock, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getRecentScans, getScanHistoryByVIN, compareScanResults, type ScanHistoryEntry } from '@/lib/scanHistory';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScanHistoryProps {
  currentVIN?: string | null;
  onRefresh?: () => void;
}

export function ScanHistory({ currentVIN, onRefresh }: ScanHistoryProps) {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [currentVIN]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const scans = currentVIN 
        ? await getScanHistoryByVIN(currentVIN)
        : await getRecentScans(15);
      setHistory(scans);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getComparisonWithPrevious = (index: number) => {
    if (index >= history.length - 1) return null;
    return compareScanResults(history[index + 1], history[index]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Histórico de Scans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Histórico de Scans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum scan salvo ainda</p>
            <p className="text-xs mt-1">Os resultados dos scans serão salvos automaticamente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Histórico de Scans
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadHistory}>
            Atualizar
          </Button>
        </div>
        {currentVIN && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Car className="h-4 w-4" />
            <span className="font-mono">{currentVIN}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <Accordion type="single" collapsible className="space-y-2">
            {history.map((scan, index) => {
              const comparison = getComparisonWithPrevious(index);
              const hasIssues = scan.totalDtcs > 0;
              
              return (
                <AccordionItem 
                  key={scan.id} 
                  value={scan.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 w-full">
                      {/* Status Icon */}
                      <div className={`p-1.5 rounded-full ${
                        hasIssues 
                          ? 'bg-destructive/10' 
                          : 'bg-green-500/10'
                      }`}>
                        {hasIssues ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {hasIssues ? `${scan.totalDtcs} erro(s)` : 'Sem erros'}
                          </span>
                          {comparison && comparison.new.length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              +{comparison.new.length} novo(s)
                            </Badge>
                          )}
                          {comparison && comparison.resolved.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                              {comparison.resolved.length} resolvido(s)
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(scan.scanDate, { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                          {scan.vehicleInfo && (
                            <>
                              <span>•</span>
                              <span>{scan.vehicleInfo.manufacturer}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="pb-4">
                    <div className="space-y-3 pt-2">
                      {/* Detalhes do Scan */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded bg-muted/30">
                          <p className="text-xs text-muted-foreground">Módulos escaneados</p>
                          <p className="font-medium">{scan.modulesScanned}</p>
                        </div>
                        <div className="p-2 rounded bg-muted/30">
                          <p className="text-xs text-muted-foreground">Duração</p>
                          <p className="font-medium">
                            {scan.scanDurationMs 
                              ? `${(scan.scanDurationMs / 1000).toFixed(1)}s`
                              : '--'}
                          </p>
                        </div>
                      </div>
                      
                      {/* DTCs encontrados */}
                      {scan.dtcs.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Códigos encontrados:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {scan.dtcs.map((dtc, i) => (
                              <Badge 
                                key={i} 
                                variant="outline"
                                className={`font-mono text-xs ${
                                  comparison?.new.includes(dtc.code)
                                    ? 'bg-destructive/10 border-destructive/30 text-destructive'
                                    : ''
                                }`}
                              >
                                {dtc.code}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Comparação */}
                      {comparison && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Comparado com scan anterior:</p>
                          <div className="space-y-1 text-xs">
                            {comparison.new.length > 0 && (
                              <p className="text-destructive">
                                ⬆️ Novos: {comparison.new.join(', ')}
                              </p>
                            )}
                            {comparison.resolved.length > 0 && (
                              <p className="text-green-600">
                                ✅ Resolvidos: {comparison.resolved.join(', ')}
                              </p>
                            )}
                            {comparison.persistent.length > 0 && (
                              <p className="text-muted-foreground">
                                🔄 Persistentes: {comparison.persistent.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
