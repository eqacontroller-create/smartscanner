import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TripHistoryEntry, formatCurrency, formatDuration } from '@/types/tripSettings';
import { History, Trash2, MapPin, Clock, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TripHistoryProps {
  history: TripHistoryEntry[];
  onClearHistory: () => void;
}

export function TripHistory({ history, onClearHistory }: TripHistoryProps) {
  const { toast } = useToast();

  // Exportar para CSV
  const exportToCSV = () => {
    if (history.length === 0) return;

    const headers = ['Data', 'Distância (km)', 'Custo (R$)', 'Custo/KM (R$)', 'Duração', 'Velocidade Média (km/h)'];
    const rows = history.map(entry => [
      new Date(entry.date).toLocaleString('pt-BR'),
      entry.distance.toFixed(2),
      entry.cost.toFixed(2),
      entry.costPerKm.toFixed(2),
      formatDuration(entry.duration),
      entry.averageSpeed.toFixed(1),
    ]);

    // Adicionar totais
    const totals = history.reduce(
      (acc, entry) => ({
        distance: acc.distance + entry.distance,
        cost: acc.cost + entry.cost,
        duration: acc.duration + entry.duration,
      }),
      { distance: 0, cost: 0, duration: 0 }
    );

    rows.push([]);
    rows.push(['TOTAIS', totals.distance.toFixed(2), totals.cost.toFixed(2), '', formatDuration(totals.duration), '']);

    const csvContent = [headers, ...rows]
      .map(row => row.join(';'))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-viagens-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: '📊 CSV Exportado!',
      description: `${history.length} viagens exportadas com sucesso.`,
    });
  };

  // Exportar para PDF (usando window.print com estilo)
  const exportToPDF = () => {
    if (history.length === 0) return;

    const totals = history.reduce(
      (acc, entry) => ({
        distance: acc.distance + entry.distance,
        cost: acc.cost + entry.cost,
        duration: acc.duration + entry.duration,
      }),
      { distance: 0, cost: 0, duration: 0 }
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Viagens</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #00cc00; border-bottom: 2px solid #00cc00; padding-bottom: 10px; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .summary-item { text-align: center; }
          .summary-label { font-size: 12px; color: #666; }
          .summary-value { font-size: 24px; font-weight: bold; color: #00cc00; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #00cc00; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>📊 Relatório de Viagens</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        
        <div class="summary">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total de Viagens</div>
              <div class="summary-value">${history.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Distância Total</div>
              <div class="summary-value">${totals.distance.toFixed(1)} km</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Custo Total</div>
              <div class="summary-value">${formatCurrency(totals.cost)}</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Distância</th>
              <th>Custo</th>
              <th>Custo/KM</th>
              <th>Duração</th>
              <th>Vel. Média</th>
            </tr>
          </thead>
          <tbody>
            ${history.map(entry => `
              <tr>
                <td>${new Date(entry.date).toLocaleString('pt-BR')}</td>
                <td>${entry.distance.toFixed(2)} km</td>
                <td>${formatCurrency(entry.cost)}</td>
                <td>${formatCurrency(entry.costPerKm)}</td>
                <td>${formatDuration(entry.duration)}</td>
                <td>${entry.averageSpeed.toFixed(1)} km/h</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>OBD-II Scanner com Jarvis AI - Relatório Financeiro</p>
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Viagens
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-money hover:text-money hover:bg-money/10"
              onClick={exportToCSV}
              title="Exportar CSV"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-money hover:text-money hover:bg-money/10"
              onClick={exportToPDF}
              title="Exportar PDF"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onClearHistory}
              title="Limpar histórico"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
