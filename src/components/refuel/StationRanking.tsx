// Ranking de Postos baseado no histórico de Fuel Trim
// Analisa qualidade do combustível por posto para recomendar os melhores

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, 
  Star, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Fuel,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';
import { FuelQuality } from '@/types/refuelTypes';

interface RefuelEntryWithStation {
  id: string;
  station_name: string | null;
  quality: string | null;
  stft_average: number | null;
  ltft_delta: number | null;
  anomaly_detected: boolean | null;
  price_per_liter: number;
  timestamp: string;
}

interface StationStats {
  name: string;
  totalRefuels: number;
  okCount: number;
  warningCount: number;
  criticalCount: number;
  avgStft: number;
  avgLtftDelta: number;
  avgPrice: number;
  lastVisit: string;
  score: number; // 0-100
  trend: 'up' | 'down' | 'stable';
}

interface StationRankingProps {
  refuelHistory: RefuelEntryWithStation[];
  className?: string;
}

export function StationRanking({ refuelHistory, className }: StationRankingProps) {
  // Agregar dados por posto
  const stationStats = useMemo(() => {
    const statsMap = new Map<string, {
      refuels: RefuelEntryWithStation[];
      okCount: number;
      warningCount: number;
      criticalCount: number;
      stftSum: number;
      ltftDeltaSum: number;
      priceSum: number;
    }>();

    // Agrupar por nome do posto
    refuelHistory.forEach(entry => {
      if (!entry.station_name) return;
      
      const name = entry.station_name.trim().toLowerCase();
      const existing = statsMap.get(name) || {
        refuels: [],
        okCount: 0,
        warningCount: 0,
        criticalCount: 0,
        stftSum: 0,
        ltftDeltaSum: 0,
        priceSum: 0,
      };

      existing.refuels.push(entry);
      
      if (entry.quality === 'ok') existing.okCount++;
      else if (entry.quality === 'warning') existing.warningCount++;
      else if (entry.quality === 'critical') existing.criticalCount++;
      
      existing.stftSum += Math.abs(entry.stft_average || 0);
      existing.ltftDeltaSum += Math.abs(entry.ltft_delta || 0);
      existing.priceSum += entry.price_per_liter;

      statsMap.set(name, existing);
    });

    // Converter para array de stats
    const stats: StationStats[] = [];
    
    statsMap.forEach((data, key) => {
      const total = data.refuels.length;
      if (total === 0) return;

      // Calcular score (0-100)
      // Base: 100 pontos
      // -5 por warning, -15 por critical
      // -1 por cada % de STFT médio acima de 5%
      const warningPenalty = data.warningCount * 5;
      const criticalPenalty = data.criticalCount * 15;
      const avgStft = data.stftSum / total;
      const stftPenalty = Math.max(0, (avgStft - 5)) * 2;
      
      let score = Math.max(0, Math.min(100, 100 - warningPenalty - criticalPenalty - stftPenalty));
      
      // Bonus por consistência (muitos OK seguidos)
      if (data.okCount === total && total >= 3) {
        score = Math.min(100, score + 5);
      }

      // Calcular tendência baseada nos últimos abastecimentos
      const sortedRefuels = [...data.refuels].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (sortedRefuels.length >= 2) {
        const recent = sortedRefuels.slice(0, Math.ceil(sortedRefuels.length / 2));
        const older = sortedRefuels.slice(Math.ceil(sortedRefuels.length / 2));
        
        const recentAvgStft = recent.reduce((sum, r) => sum + Math.abs(r.stft_average || 0), 0) / recent.length;
        const olderAvgStft = older.reduce((sum, r) => sum + Math.abs(r.stft_average || 0), 0) / older.length;
        
        if (recentAvgStft < olderAvgStft - 2) trend = 'up';
        else if (recentAvgStft > olderAvgStft + 2) trend = 'down';
      }

      // Formatar nome para exibição (capitalizar)
      const displayName = data.refuels[0].station_name || key;

      stats.push({
        name: displayName,
        totalRefuels: total,
        okCount: data.okCount,
        warningCount: data.warningCount,
        criticalCount: data.criticalCount,
        avgStft: data.stftSum / total,
        avgLtftDelta: data.ltftDeltaSum / total,
        avgPrice: data.priceSum / total,
        lastVisit: sortedRefuels[0]?.timestamp || '',
        score,
        trend,
      });
    });

    // Ordenar por score (maior primeiro)
    return stats.sort((a, b) => b.score - a.score);
  }, [refuelHistory]);

  // Postos sem nome registrado
  const unnamedCount = refuelHistory.filter(e => !e.station_name).length;

  if (stationStats.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking de Postos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {unnamedCount > 0 
                ? `Você tem ${unnamedCount} abastecimentos sem nome de posto registrado.`
                : 'Registre abastecimentos com o nome do posto para ver o ranking.'}
            </p>
            <p className="text-xs mt-2">
              Informe o posto ao registrar abastecimentos para comparar qualidade.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking de Postos
          </div>
          <Badge variant="outline" className="text-xs">
            {stationStats.length} postos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 p-4 pt-0">
            {stationStats.map((station, index) => (
              <StationCard 
                key={station.name} 
                station={station} 
                rank={index + 1} 
              />
            ))}
          </div>
        </ScrollArea>
        
        {unnamedCount > 0 && (
          <div className="border-t p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              + {unnamedCount} abastecimentos sem posto identificado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Card individual de posto
function StationCard({ station, rank }: { station: StationStats; rank: number }) {
  const getRankBadge = () => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-yellow-950">🥇 1º</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-gray-900">🥈 2º</Badge>;
    if (rank === 3) return <Badge className="bg-amber-700 text-amber-100">🥉 3º</Badge>;
    return <Badge variant="outline">{rank}º</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Muito Bom';
    if (score >= 70) return 'Bom';
    if (score >= 60) return 'Regular';
    if (score >= 40) return 'Ruim';
    return 'Péssimo';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = () => {
    if (station.trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (station.trend === 'down') return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short' 
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {getRankBadge()}
          <div className="min-w-0">
            <h4 className="font-medium text-sm truncate">{station.name}</h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Fuel className="h-3 w-3" />
              {station.totalRefuels} abastecimentos
            </p>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <div className={`text-lg font-bold ${getScoreColor(station.score)}`}>
            {Math.round(station.score)}
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
            {getTrendIcon()}
            {getScoreLabel(station.score)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${getProgressColor(station.score)}`}
            style={{ width: `${station.score}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <ThumbsUp className="h-3 w-3" />
            {station.okCount}
          </span>
          {station.warningCount > 0 && (
            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-3 w-3" />
              {station.warningCount}
            </span>
          )}
          {station.criticalCount > 0 && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <ThumbsDown className="h-3 w-3" />
              {station.criticalCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>STFT: ±{station.avgStft.toFixed(1)}%</span>
          <span className="text-[10px]">• {formatDate(station.lastVisit)}</span>
        </div>
      </div>
    </div>
  );
}
