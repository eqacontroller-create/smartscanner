import { useState, useEffect } from 'react';
import { getSplashTheme, DEFAULT_THEME, type SplashTheme } from '@/lib/splashThemes';

const PROFILE_STORAGE_KEY = 'jarvis-settings';

/**
 * Hook para carregar o tema da splash baseado no veículo configurado
 * Lê do localStorage ANTES do primeiro render para evitar flash
 */
export function useSplashTheme(): SplashTheme {
  // Tentar ler sincronamente no estado inicial para evitar flash
  const [theme, setTheme] = useState<SplashTheme>(() => {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // vehicleBrand está armazenado nas configurações do Jarvis
        if (parsed.vehicleBrand) {
          return getSplashTheme(parsed.vehicleBrand);
        }
      }
    } catch (e) {
      console.warn('[SplashTheme] Erro ao ler localStorage:', e);
    }
    return DEFAULT_THEME;
  });
  
  // Re-verificar após mount (caso localStorage mude)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.vehicleBrand) {
          setTheme(getSplashTheme(parsed.vehicleBrand));
        }
      }
    } catch (e) {
      // Silently fail, keep default theme
    }
  }, []);
  
  return theme;
}
