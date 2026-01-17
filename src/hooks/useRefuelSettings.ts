// Hook para gerenciar configurações do modo abastecimento
// Persiste no localStorage e sincroniza com Supabase se autenticado

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefuelSettings, defaultRefuelSettings } from '@/types/refuelTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import logger from '@/lib/logger';

const STORAGE_KEY = 'refuel-settings';

interface UseRefuelSettingsReturn {
  settings: RefuelSettings;
  updateSettings: (newSettings: Partial<RefuelSettings>) => void;
  resetToDefaults: () => void;
  isSyncing: boolean;
  lastSyncTime: number | null;
}

export function useRefuelSettings(): UseRefuelSettingsReturn {
  const { user, isAuthenticated } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const initialLoadDoneRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [settings, setSettings] = useState<RefuelSettings>(() => {
    // Carregar do localStorage na inicialização
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Mesclar com defaults para garantir que novos campos existam
        return { ...defaultRefuelSettings, ...parsed };
      }
    } catch (error) {
      logger.error('[RefuelSettings] Erro ao carregar localStorage:', error);
    }
    return defaultRefuelSettings;
  });

  // Carregar configurações do Supabase quando autenticado
  useEffect(() => {
    if (!isAuthenticated || !user || initialLoadDoneRef.current) return;
    
    const loadFromCloud = async () => {
      try {
        setIsSyncing(true);
        logger.debug('[RefuelSettings] Carregando do cloud...');
        
        const { data, error } = await supabase
          .from('profiles')
          .select('refuel_settings')
          .eq('id', user.id)
          .single();
        
        if (error) {
          logger.warn('[RefuelSettings] Erro ao carregar:', error.message);
          return;
        }
        
        if (data?.refuel_settings && typeof data.refuel_settings === 'object') {
          const cloudSettings = data.refuel_settings as unknown as Partial<RefuelSettings>;
          logger.debug('[RefuelSettings] Carregado do cloud');
          
          // Mesclar com defaults e atualizar estado
          const merged = { ...defaultRefuelSettings, ...cloudSettings };
          setSettings(merged);
          
          // Atualizar localStorage também
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          setLastSyncTime(Date.now());
        }
        
        initialLoadDoneRef.current = true;
      } catch (error) {
        logger.error('[RefuelSettings] Erro em loadFromCloud:', error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    loadFromCloud();
  }, [isAuthenticated, user]);

  // Persistir no localStorage quando settings mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      logger.error('[RefuelSettings] Erro ao salvar localStorage:', error);
    }
  }, [settings]);

  // Sincronizar com Supabase (debounced)
  const syncToCloud = useCallback(async (newSettings: RefuelSettings) => {
    if (!isAuthenticated || !user) return;
    
    try {
      setIsSyncing(true);
      logger.debug('[RefuelSettings] Sincronizando com cloud...');
      
      const { error } = await supabase
        .from('profiles')
        .update({ refuel_settings: JSON.parse(JSON.stringify(newSettings)) })
        .eq('id', user.id);
      
      if (error) {
        logger.error('[RefuelSettings] Erro ao sincronizar:', error);
      } else {
        setLastSyncTime(Date.now());
        logger.debug('[RefuelSettings] Sincronizado com cloud');
      }
    } catch (error) {
      logger.error('[RefuelSettings] Erro em syncToCloud:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, user]);

  // Atualizar settings parcialmente
  const updateSettings = useCallback((newSettings: Partial<RefuelSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Debounce sync para cloud (500ms)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncToCloud(updated);
      }, 500);
      
      return updated;
    });
  }, [syncToCloud]);

  // Resetar para valores padrão
  const resetToDefaults = useCallback(() => {
    setSettings(defaultRefuelSettings);
    
    // Sincronizar reset para cloud
    if (isAuthenticated && user) {
      syncToCloud(defaultRefuelSettings);
    }
  }, [isAuthenticated, user, syncToCloud]);

  // Cleanup timeout ao desmontar
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    settings,
    updateSettings,
    resetToDefaults,
    isSyncing,
    lastSyncTime,
  };
}
