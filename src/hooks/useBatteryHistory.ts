/**
 * Hook para gerenciar histórico de testes de bateria
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  BatteryTestService, 
  BatteryTestRecord, 
  CreateBatteryTest,
  BatteryTrend 
} from '@/services/supabase/BatteryTestService';
import { toast } from 'sonner';

interface UseBatteryHistoryReturn {
  tests: BatteryTestRecord[];
  trend: BatteryTrend | null;
  loading: boolean;
  saving: boolean;
  saveTest: (data: CreateBatteryTest) => Promise<BatteryTestRecord | null>;
  deleteTest: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useBatteryHistory(): UseBatteryHistoryReturn {
  const { user, isAuthenticated } = useAuth();
  const [tests, setTests] = useState<BatteryTestRecord[]>([]);
  const [trend, setTrend] = useState<BatteryTrend | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carrega histórico (filtrado por user_id)
  const loadTests = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    setLoading(true);
    try {
      const data = await BatteryTestService.getAll(user.id, 50);
      setTests(data);
      
      // Calcular tendência
      const calculatedTrend = BatteryTestService.calculateTrend(data);
      setTrend(calculatedTrend);
    } catch (error) {
      console.error('Erro ao carregar histórico de bateria:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  // Salva novo teste
  const saveTest = useCallback(async (data: CreateBatteryTest): Promise<BatteryTestRecord | null> => {
    if (!user) {
      toast.error('Faça login para salvar testes de bateria');
      return null;
    }

    setSaving(true);
    try {
      const saved = await BatteryTestService.create(user.id, data);
      setTests(prev => [saved, ...prev]);
      
      // Recalcular tendência
      const updatedTests = [saved, ...tests];
      const calculatedTrend = BatteryTestService.calculateTrend(updatedTests);
      setTrend(calculatedTrend);
      
      // Disparar evento para atualizar VehicleHealth
      window.dispatchEvent(new CustomEvent('vehicle-health-updated'));
      
      toast.success('Diagnóstico salvo', {
        description: 'Resultados disponíveis no Dashboard e Histórico.',
        duration: 3000,
      });
      return saved;
    } catch (error) {
      console.error('Erro ao salvar teste:', error);
      toast.error('Erro ao salvar teste de bateria');
      return null;
    } finally {
      setSaving(false);
    }
  }, [user, tests]);

  // Remove teste
  const deleteTest = useCallback(async (id: string) => {
    try {
      await BatteryTestService.delete(id);
      const updatedTests = tests.filter(t => t.id !== id);
      setTests(updatedTests);
      
      // Recalcular tendência
      const calculatedTrend = BatteryTestService.calculateTrend(updatedTests);
      setTrend(calculatedTrend);
      
      toast.success('Teste removido do histórico');
    } catch (error) {
      console.error('Erro ao remover teste:', error);
      toast.error('Erro ao remover teste');
    }
  }, [tests]);

  return {
    tests,
    trend,
    loading,
    saving,
    saveTest,
    deleteTest,
    refresh: loadTests,
  };
}
