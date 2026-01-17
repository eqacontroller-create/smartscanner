import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';

const LOCAL_STATS_KEY = 'user-stats-cache';

export interface UserStats {
  totalRides: number;
  totalDistance: number;    // km
  totalProfit: number;      // R$
  totalCost: number;        // R$
  daysActive: number;
  averagePerRide: number;
  averageDistance: number;
  bestDay: { date: string; profit: number } | null;
  memberSince: Date | null;
}

const defaultStats: UserStats = {
  totalRides: 0,
  totalDistance: 0,
  totalProfit: 0,
  totalCost: 0,
  daysActive: 0,
  averagePerRide: 0,
  averageDistance: 0,
  bestDay: null,
  memberSince: null,
};

interface UseUserStatsReturn {
  stats: UserStats;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useUserStats(userId: string | undefined): UseUserStatsReturn {
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  // Load cached stats from localStorage for immediate display
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STATS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.memberSince) {
          parsed.memberSince = new Date(parsed.memberSince);
        }
        setStats(parsed);
      }
    } catch (error) {
      logger.error('[UserStats] Error loading cached stats:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch all rides for aggregation
      const { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select('*')
        .eq('user_id', userId)
        .not('end_time', 'is', null);

      if (ridesError) throw ridesError;

      // Fetch profile for member_since
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('member_since, created_at')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Calculate stats from rides
      const totalRides = rides?.length || 0;
      const totalDistance = rides?.reduce((sum, r) => sum + (r.distance || 0), 0) || 0;
      const totalProfit = rides?.reduce((sum, r) => sum + (r.profit || 0), 0) || 0;
      const totalCost = rides?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;

      // Calculate unique active days
      const uniqueDays = new Set(
        rides?.map(r => new Date(r.start_time).toISOString().split('T')[0]) || []
      );
      const daysActive = uniqueDays.size;

      // Calculate averages
      const averagePerRide = totalRides > 0 ? totalProfit / totalRides : 0;
      const averageDistance = totalRides > 0 ? totalDistance / totalRides : 0;

      // Find best day
      const profitByDay: Record<string, number> = {};
      rides?.forEach(r => {
        const day = new Date(r.start_time).toISOString().split('T')[0];
        profitByDay[day] = (profitByDay[day] || 0) + (r.profit || 0);
      });

      let bestDay: { date: string; profit: number } | null = null;
      Object.entries(profitByDay).forEach(([date, profit]) => {
        if (!bestDay || profit > bestDay.profit) {
          bestDay = { date, profit };
        }
      });

      // Get member_since
      const memberSince = profile?.member_since 
        ? new Date(profile.member_since) 
        : profile?.created_at 
          ? new Date(profile.created_at) 
          : null;

      const newStats: UserStats = {
        totalRides,
        totalDistance,
        totalProfit,
        totalCost,
        daysActive,
        averagePerRide,
        averageDistance,
        bestDay,
        memberSince,
      };

      setStats(newStats);

      // Cache to localStorage
      try {
        localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(newStats));
      } catch (e) {
        logger.warn('[UserStats] Failed to cache stats');
      }

      logger.info('[UserStats] Stats loaded:', { totalRides, totalDistance, totalProfit });
    } catch (error) {
      logger.error('[UserStats] Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch on mount and when userId changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    refresh: fetchStats,
  };
}
