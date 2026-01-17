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
  MapPin,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FuelQuality, getQualityLabel, getQualityColor } from '@/types/refuelTypes';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StationRanking } from './StationRanking';
import { useToast } from '@/hooks/use-toast';
import { OfflineSyncStatus } from './OfflineSyncStatus';
import { useOfflineRefuel } from '@/hooks/useOfflineRefuel';

interface RefuelHistoryEntry {
  id: string;
  timestamp: string;
  price_per_liter: number;
  liters_added: number;
  total_paid: number;
  quality: string | null;
  stft_average: number | null;
  ltft_delta: number | null;
  distance_monitored: number | null;
  pump_accuracy_percent: number | null;
  station_name: string | null;
  anomaly_detected: boolean | null;
}

interface FuelHistoryProps {
  userId?: string;
  isAuthenticated: boolean;
}

export function FuelHistory({ userId, isAuthenticated }: FuelHistoryProps) {
  const [entries, setEntries] = useState<RefuelHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Hook de sincronização offline
  const {
    pendingEntries,
    pendingCount,
    isOnline,
    isSyncing,
    syncProgress,
    syncNow,
    removeEntry,
    clearSynced,
  } = useOfflineRefuel();

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
        .limit(50);

      if (fetchError) throw fetchError;
      setEntries(data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError('Não foi possível carregar o histórico');
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar para CSV
  const exportToCSV = () => {
    if (entries.length === 0) return;

    const headers = ['Data', 'Posto', 'Litros', 'Preço/L (R$)', 'Total (R$)', 'Qualidade', 'STFT (%)', 'LTFT Delta (%)'];
    const rows = entries.map(entry => [
      format(new Date(entry.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      entry.station_name || 'Não informado',
      entry.liters_added.toFixed(2),
      entry.price_per_liter.toFixed(2),
      entry.total_paid.toFixed(2),
      getQualityLabel(entry.quality as FuelQuality),
      entry.stft_average !== null ? entry.stft_average.toFixed(1) : '-',
      entry.ltft_delta !== null ? entry.ltft_delta.toFixed(1) : '-',
    ]);

    // Calcular totais
    const totals = entries.reduce(
      (acc, entry) => ({
        liters: acc.liters + entry.liters_added,
        total: acc.total + entry.total_paid,
      }),
      { liters: 0, total: 0 }
    );

    rows.push([]);
    rows.push(['TOTAIS', '', totals.liters.toFixed(2), '', totals.total.toFixed(2), '', '', '']);

    const csvContent = [headers, ...rows]
      .map(row => row.join(';'))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-abastecimentos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: '📊 CSV Exportado!',
      description: `${entries.length} abastecimentos exportados com sucesso.`,
    });
  };

  // Exportar para PDF com gráfico de qualidade
  const exportToPDF = () => {
    if (entries.length === 0) return;

    // Calcular estatísticas
    const totals = entries.reduce(
      (acc, entry) => ({
        liters: acc.liters + entry.liters_added,
        total: acc.total + entry.total_paid,
        okCount: acc.okCount + (entry.quality === 'ok' ? 1 : 0),
        warningCount: acc.warningCount + (entry.quality === 'warning' ? 1 : 0),
        criticalCount: acc.criticalCount + (entry.quality === 'critical' ? 1 : 0),
        unknownCount: acc.unknownCount + (!entry.quality || entry.quality === 'unknown' ? 1 : 0),
        stftSum: acc.stftSum + Math.abs(entry.stft_average || 0),
        stftCount: acc.stftCount + (entry.stft_average !== null ? 1 : 0),
      }),
      { liters: 0, total: 0, okCount: 0, warningCount: 0, criticalCount: 0, unknownCount: 0, stftSum: 0, stftCount: 0 }
    );

    const avgStft = totals.stftCount > 0 ? totals.stftSum / totals.stftCount : 0;
    const totalAnalyzed = totals.okCount + totals.warningCount + totals.criticalCount;
    
    // Calcular porcentagens para o gráfico
    const okPercent = totalAnalyzed > 0 ? (totals.okCount / totalAnalyzed) * 100 : 0;
    const warningPercent = totalAnalyzed > 0 ? (totals.warningCount / totalAnalyzed) * 100 : 0;
    const criticalPercent = totalAnalyzed > 0 ? (totals.criticalCount / totalAnalyzed) * 100 : 0;

    // Agrupar por posto para ranking no PDF
    const stationMap = new Map<string, { count: number; okCount: number; avgStft: number }>();
    entries.forEach(entry => {
      if (!entry.station_name) return;
      const key = entry.station_name.toLowerCase().trim();
      const existing = stationMap.get(key) || { count: 0, okCount: 0, avgStft: 0 };
      existing.count++;
      if (entry.quality === 'ok') existing.okCount++;
      existing.avgStft = (existing.avgStft * (existing.count - 1) + Math.abs(entry.stft_average || 0)) / existing.count;
      stationMap.set(key, existing);
    });

    const stationRanking = Array.from(stationMap.entries())
      .map(([name, stats]) => ({
        name: entries.find(e => e.station_name?.toLowerCase().trim() === name)?.station_name || name,
        ...stats,
        score: Math.round((stats.okCount / stats.count) * 100),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Abastecimentos</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto; }
          h1 { color: #22c55e; border-bottom: 2px solid #22c55e; padding-bottom: 10px; }
          h2 { color: #333; font-size: 16px; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .summary-item { text-align: center; }
          .summary-label { font-size: 11px; color: #666; text-transform: uppercase; }
          .summary-value { font-size: 20px; font-weight: bold; color: #22c55e; }
          
          /* Gráfico de Qualidade */
          .chart-container { margin: 20px 0; padding: 20px; background: #fafafa; border-radius: 8px; }
          .chart-title { font-size: 14px; font-weight: bold; margin-bottom: 15px; }
          .chart-bar { height: 30px; border-radius: 4px; display: flex; overflow: hidden; margin-bottom: 10px; }
          .bar-ok { background: #22c55e; }
          .bar-warning { background: #eab308; }
          .bar-critical { background: #ef4444; }
          .chart-legend { display: flex; gap: 20px; font-size: 12px; }
          .legend-item { display: flex; align-items: center; gap: 6px; }
          .legend-dot { width: 12px; height: 12px; border-radius: 2px; }
          
          /* Ranking */
          .ranking { margin: 20px 0; }
          .ranking-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
          .ranking-item:nth-child(odd) { background: #fafafa; }
          .ranking-position { font-weight: bold; color: #666; width: 30px; }
          .ranking-name { flex: 1; }
          .ranking-score { font-weight: bold; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .score-high { background: #dcfce7; color: #166534; }
          .score-medium { background: #fef9c3; color: #854d0e; }
          .score-low { background: #fee2e2; color: #991b1b; }
          
          /* Tabela */
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th, td { padding: 8px 6px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #22c55e; color: white; font-size: 10px; text-transform: uppercase; }
          tr:nth-child(even) { background: #f9f9f9; }
          .quality-ok { color: #22c55e; font-weight: bold; }
          .quality-warning { color: #eab308; font-weight: bold; }
          .quality-critical { color: #ef4444; font-weight: bold; }
          
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
          @media print { 
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } 
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <h1>⛽ Relatório de Abastecimentos</h1>
        <p style="color: #666; font-size: 12px;">Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
        
        <!-- Resumo -->
        <div class="summary">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total de Registros</div>
              <div class="summary-value">${entries.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Litros Abastecidos</div>
              <div class="summary-value">${totals.liters.toFixed(0)}L</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Gasto</div>
              <div class="summary-value">R$ ${totals.total.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">STFT Médio</div>
              <div class="summary-value">±${avgStft.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <!-- Gráfico de Qualidade -->
        ${totalAnalyzed > 0 ? `
        <div class="chart-container">
          <div class="chart-title">📊 Qualidade do Combustível Analisado</div>
          <div class="chart-bar">
            ${okPercent > 0 ? `<div class="bar-ok" style="width: ${okPercent}%"></div>` : ''}
            ${warningPercent > 0 ? `<div class="bar-warning" style="width: ${warningPercent}%"></div>` : ''}
            ${criticalPercent > 0 ? `<div class="bar-critical" style="width: ${criticalPercent}%"></div>` : ''}
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <div class="legend-dot" style="background: #22c55e;"></div>
              <span>Combustível OK: ${totals.okCount} (${okPercent.toFixed(0)}%)</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background: #eab308;"></div>
              <span>Suspeito: ${totals.warningCount} (${warningPercent.toFixed(0)}%)</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background: #ef4444;"></div>
              <span>Crítico: ${totals.criticalCount} (${criticalPercent.toFixed(0)}%)</span>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Ranking de Postos -->
        ${stationRanking.length > 0 ? `
        <h2>🏆 Ranking de Postos</h2>
        <div class="ranking">
          ${stationRanking.map((station, index) => `
            <div class="ranking-item">
              <span class="ranking-position">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}</span>
              <span class="ranking-name">${station.name} <span style="color: #999; font-size: 11px;">(${station.count} abast.)</span></span>
              <span class="ranking-score ${station.score >= 80 ? 'score-high' : station.score >= 50 ? 'score-medium' : 'score-low'}">${station.score}% OK</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Tabela de Abastecimentos -->
        <h2>📋 Histórico Detalhado</h2>
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Posto</th>
              <th>Litros</th>
              <th>Preço/L</th>
              <th>Total</th>
              <th>Qualidade</th>
              <th>STFT</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map(entry => `
              <tr>
                <td>${format(new Date(entry.timestamp), "dd/MM/yy HH:mm", { locale: ptBR })}</td>
                <td>${entry.station_name || '-'}</td>
                <td>${entry.liters_added.toFixed(1)}L</td>
                <td>R$ ${entry.price_per_liter.toFixed(2)}</td>
                <td>R$ ${entry.total_paid.toFixed(2)}</td>
                <td class="${entry.quality === 'ok' ? 'quality-ok' : entry.quality === 'warning' ? 'quality-warning' : entry.quality === 'critical' ? 'quality-critical' : ''}">${getQualityLabel(entry.quality as FuelQuality)}</td>
                <td>${entry.stft_average !== null ? `${entry.stft_average > 0 ? '+' : ''}${entry.stft_average.toFixed(1)}%` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>OBD-II Scanner com Jarvis AI - Relatório de Qualidade de Combustível</p>
          <p>Os dados de qualidade são baseados na análise de Fuel Trim (STFT/LTFT) durante o monitoramento.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }

    toast({
      title: '📄 PDF Gerado!',
      description: 'Use Ctrl+P ou Cmd+P para salvar como PDF.',
    });
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

  // Extrair nomes de postos recentes para sugestões
  const recentStations = entries
    .filter(e => e.station_name)
    .map(e => e.station_name!)
    .filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="space-y-4">
      {/* Status de Sincronização Offline */}
      <OfflineSyncStatus
        isOnline={isOnline}
        isSyncing={isSyncing}
        syncProgress={syncProgress}
        pendingEntries={pendingEntries}
        pendingCount={pendingCount}
        onSyncNow={syncNow}
        onRemoveEntry={removeEntry}
        onClearSynced={clearSynced}
      />
      
      {/* Ranking de Postos */}
      <StationRanking refuelHistory={entries} />
      
      {/* Histórico */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Histórico de Abastecimentos
            </CardTitle>
            <div className="flex items-center gap-1">
              {entries.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 sm:w-auto sm:px-2 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                    onClick={exportToCSV}
                    title="Exportar CSV"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1 text-xs">CSV</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 sm:w-auto sm:px-2 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                    onClick={exportToPDF}
                    title="Exportar PDF com gráficos"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1 text-xs">PDF</span>
                  </Button>
                </>
              )}
              {entries.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {entries.length}
                </Badge>
              )}
            </div>
          </div>
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
                    
                    {/* Nome do Posto */}
                    {entry.station_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{entry.station_name}</span>
                      </div>
                    )}
                    
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
    </div>
  );
}
