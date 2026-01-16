// Rides Service
// Operações CRUD para corridas no Supabase

import { supabase } from '@/integrations/supabase/client';
import type { RideEntry } from '@/types/tripSettings';

export interface RideData {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string | null;
  distance?: number | null;
  cost?: number | null;
  cost_per_km?: number | null;
  duration?: number | null;
  average_speed?: number | null;
  amount_received?: number | null;
  profit?: number | null;
}

// Converte dados do banco para formato da aplicação
function dbToRideEntry(data: RideData): RideEntry {
  return {
    id: data.id,
    startTime: new Date(data.start_time).getTime(),
    endTime: data.end_time ? new Date(data.end_time).getTime() : Date.now(),
    distance: Number(data.distance) || 0,
    cost: Number(data.cost) || 0,
    costPerKm: Number(data.cost_per_km) || 0,
    duration: data.duration ?? 0,
    averageSpeed: Number(data.average_speed) || 0,
    amountReceived: data.amount_received ? Number(data.amount_received) : undefined,
    profit: data.profit ? Number(data.profit) : undefined,
  };
}

// Converte formato da aplicação para dados do banco
function rideEntryToDb(ride: RideEntry, userId: string): RideData {
  return {
    id: ride.id,
    user_id: userId,
    start_time: new Date(ride.startTime).toISOString(),
    end_time: new Date(ride.endTime).toISOString(),
    distance: ride.distance,
    cost: ride.cost,
    cost_per_km: ride.costPerKm,
    duration: ride.duration,
    average_speed: ride.averageSpeed,
    amount_received: ride.amountReceived,
    profit: ride.profit,
  };
}

export const RidesService = {
  /**
   * Busca corridas do dia para um usuário
   */
  async getTodayRides(userId: string): Promise<RideEntry[]> {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startOfDay.toISOString())
      .lt('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('[RidesService] Error fetching today rides:', error);
      throw error;
    }

    return (data || []).map(r => dbToRideEntry(r as RideData));
  },

  /**
   * Salva nova corrida
   */
  async save(ride: RideEntry, userId: string): Promise<void> {
    const dbData = rideEntryToDb(ride, userId);
    
    const { error } = await supabase
      .from('rides')
      .insert(dbData as any);

    if (error) {
      console.error('[RidesService] Error saving ride:', error);
      throw error;
    }
  },

  /**
   * Atualiza corrida existente
   */
  async update(id: string, updates: Partial<RideEntry>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.amountReceived !== undefined) dbUpdates.amount_received = updates.amountReceived;
    if (updates.profit !== undefined) dbUpdates.profit = updates.profit;
    if (updates.distance !== undefined) dbUpdates.distance = updates.distance;
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
    if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
    if (updates.averageSpeed !== undefined) dbUpdates.average_speed = updates.averageSpeed;

    const { error } = await supabase
      .from('rides')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('[RidesService] Error updating ride:', error);
      throw error;
    }
  },

  /**
   * Deleta corridas do dia
   */
  async deleteTodayRides(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('user_id', userId)
      .gte('start_time', startOfDay.toISOString())
      .lt('start_time', endOfDay.toISOString());

    if (error) {
      console.error('[RidesService] Error deleting today rides:', error);
      throw error;
    }
  },

  /**
   * Inscreve para mudanças em tempo real
   */
  subscribeToChanges(
    userId: string, 
    callback: (payload: { eventType: string; new?: any; old?: any }) => void
  ) {
    return supabase
      .channel('rides-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },
};
