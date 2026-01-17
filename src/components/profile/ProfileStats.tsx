import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, DollarSign, Calendar, TrendingUp, Car, Trophy } from 'lucide-react';
import type { UserStats } from '@/hooks/useUserStats';

interface ProfileStatsProps {
  stats: UserStats;
  loading: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtitle, highlight }) => (
  <Card className={highlight ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'}>
    <CardContent className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={highlight ? 'text-primary' : 'text-muted-foreground'}>
          {icon}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-lg font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
      )}
    </CardContent>
  </Card>
);

const StatCardSkeleton: React.FC = () => (
  <Card className="bg-muted/30">
    <CardContent className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-6 w-20 mb-1" />
      <Skeleton className="h-3 w-12" />
    </CardContent>
  </Card>
);

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDistance = (km: number) => {
    if (km >= 1000) {
      return `${(km / 1000).toFixed(1).replace('.', ',')} mil km`;
    }
    return `${km.toFixed(1).replace('.', ',')} km`;
  };

  const formatBestDay = () => {
    if (!stats.bestDay) return 'Nenhum';
    const date = new Date(stats.bestDay.date);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Car className="h-4 w-4" />}
          label="Corridas"
          value={stats.totalRides.toString()}
          subtitle={`${stats.daysActive} dias ativos`}
        />
        <StatCard
          icon={<MapPin className="h-4 w-4" />}
          label="Distância"
          value={formatDistance(stats.totalDistance)}
          subtitle={`~${stats.averageDistance.toFixed(1)} km/corrida`}
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Lucro Total"
          value={formatCurrency(stats.totalProfit)}
          subtitle={`${formatCurrency(stats.averagePerRide)} por corrida`}
          highlight={stats.totalProfit > 0}
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Melhor Dia"
          value={stats.bestDay ? formatCurrency(stats.bestDay.profit) : '--'}
          subtitle={formatBestDay()}
          highlight={!!stats.bestDay}
        />
      </div>

      {stats.memberSince && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
          <Calendar className="h-3 w-3" />
          <span>
            Membro desde {stats.memberSince.toLocaleDateString('pt-BR', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  );
};
