// Hook para gerenciar configurações do modo abastecimento
// Persiste no localStorage e sincroniza com Supabase se autenticado

import { useState, useEffect, useCallback } from 'react';
import { RefuelSettings, defaultRefuelSettings } from '@/types/refuelTypes';

const STORAGE_KEY = 'refuel-settings';

interface UseRefuelSettingsReturn {
  settings: RefuelSettings;
  updateSettings: (newSettings: Partial<RefuelSettings>) => void;
  resetToDefaults: () => void;
}

export function useRefuelSettings(): UseRefuelSettingsReturn {
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

  // Persistir no localStorage quando settings mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      console.log('[RefuelSettings] Settings saved:', settings);
    } catch (error) {
      console.error('[RefuelSettings] Error saving to localStorage:', error);
    }
  }, [settings]);

  // Atualizar settings parcialmente
  const updateSettings = useCallback((newSettings: Partial<RefuelSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });
  }, []);

  // Resetar para valores padrão
  const resetToDefaults = useCallback(() => {
    setSettings(defaultRefuelSettings);
  }, []);

  return {
    settings,
    updateSettings,
    resetToDefaults,
  };
}
