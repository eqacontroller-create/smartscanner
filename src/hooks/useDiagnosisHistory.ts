/**
 * Hook para gerenciar histórico de diagnósticos visuais
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { VisualDiagnosisService, VisualDiagnosis, CreateVisualDiagnosis } from '@/services/supabase/VisualDiagnosisService';
import { toast } from 'sonner';

interface UseDiagnosisHistoryReturn {
  diagnoses: VisualDiagnosis[];
  loading: boolean;
  saving: boolean;
  saveDiagnosis: (diagnosis: CreateVisualDiagnosis) => Promise<VisualDiagnosis | null>;
  deleteDiagnosis: (id: string) => Promise<void>;
  addNote: (id: string, notes: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDiagnosisHistory(): UseDiagnosisHistoryReturn {
  const { user, isAuthenticated } = useAuth();
  const [diagnoses, setDiagnoses] = useState<VisualDiagnosis[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carrega histórico ao montar
  const loadDiagnoses = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    setLoading(true);
    try {
      const data = await VisualDiagnosisService.getAll(50);
      setDiagnoses(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadDiagnoses();
  }, [loadDiagnoses]);

  // Salva novo diagnóstico
  const saveDiagnosis = useCallback(async (diagnosis: CreateVisualDiagnosis): Promise<VisualDiagnosis | null> => {
    if (!user) {
      toast.error('Faça login para salvar diagnósticos');
      return null;
    }

    setSaving(true);
    try {
      const saved = await VisualDiagnosisService.create(user.id, diagnosis);
      setDiagnoses(prev => [saved, ...prev]);
      toast.success('Diagnóstico salvo no histórico');
      return saved;
    } catch (error) {
      console.error('Erro ao salvar diagnóstico:', error);
      toast.error('Erro ao salvar diagnóstico');
      return null;
    } finally {
      setSaving(false);
    }
  }, [user]);

  // Remove diagnóstico
  const deleteDiagnosis = useCallback(async (id: string) => {
    try {
      await VisualDiagnosisService.delete(id);
      setDiagnoses(prev => prev.filter(d => d.id !== id));
      toast.success('Diagnóstico removido');
    } catch (error) {
      console.error('Erro ao remover diagnóstico:', error);
      toast.error('Erro ao remover diagnóstico');
    }
  }, []);

  // Adiciona nota
  const addNote = useCallback(async (id: string, notes: string) => {
    try {
      await VisualDiagnosisService.addNote(id, notes);
      setDiagnoses(prev => prev.map(d => 
        d.id === id ? { ...d, notes } : d
      ));
      toast.success('Nota adicionada');
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      toast.error('Erro ao adicionar nota');
    }
  }, []);

  return {
    diagnoses,
    loading,
    saving,
    saveDiagnosis,
    deleteDiagnosis,
    addNote,
    refresh: loadDiagnoses,
  };
}
