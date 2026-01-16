// Hook para gerenciar configurações do modo abastecimento
// Persiste no localStorage e sincroniza com Supabase se autenticado

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefuelSettings, defaultRefuelSettings } from '@/types/refuelTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
      console.error('[RefuelSettings] Error loading from localStorage:', error);
    }
    return defaultRefuelSettings;
  });

  // Carregar configurações do Supabase quando autenticado
  useEffect(() => {
    if (!isAuthenticated || !user || initialLoadDoneRef.current) return;
    
    const loadFromCloud = async () => {
      try {
        setIsSyncing(true);
        console.log('[RefuelSettings] Loading from cloud for user:', user.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('refuel_settings')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.warn('[RefuelSettings] Error loading from cloud:', error.message);
          return;
        }
        
        if (data?.refuel_settings && typeof data.refuel_settings === 'object') {
          const cloudSettings = data.refuel_settings as unknown as Partial<RefuelSettings>;
          console.log('[RefuelSettings] Loaded from cloud:', cloudSettings);
          
          // Mesclar com defaults e atualizar estado
          const merged = { ...defaultRefuelSettings, ...cloudSettings };
          setSettings(merged);
          
          // Atualizar localStorage também
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          setLastSyncTime(Date.now());
        }
        
        initialLoadDoneRef.current = true;
      } catch (error) {
        console.error('[RefuelSettings] Error in loadFromCloud:', error);
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
      console.log('[RefuelSettings] Settings saved to localStorage:', settings);
    } catch (error) {
      console.error('[RefuelSettings] Error saving to localStorage:', error);
    }
  }, [settings]);

  // Sincronizar com Supabase (debounced)
  const syncToCloud = useCallback(async (newSettings: RefuelSettings) => {
    if (!isAuthenticated || !user) return;
    
    try {
      setIsSyncing(true);
      console.log('[RefuelSettings] Syncing to cloud:', newSettings);
      
      const { error } = await supabase
        .from('profiles')
        .update({ refuel_settings: JSON.parse(JSON.stringify(newSettings)) })
        .eq('id', user.id);
      
      if (error) {
        console.error('[RefuelSettings] Error syncing to cloud:', error);
      } else {
        setLastSyncTime(Date.now());
        console.log('[RefuelSettings] Successfully synced to cloud');
      }
    } catch (error) {
      console.error('[RefuelSettings] Error in syncToCloud:', error);
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
