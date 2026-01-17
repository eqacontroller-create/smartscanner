import { useState, useEffect } from 'react';
import { getSplashTheme, DEFAULT_THEME, type SplashTheme } from '@/lib/splashThemes';
import logger from '@/lib/logger';

// Chave dedicada para tema da splash (persistido entre sessões)
const SPLASH_BRAND_KEY = 'splash-vehicle-brand';

// Chaves alternativas para fallback
const VEHICLE_INFO_KEY = 'vehicle-info';
const JARVIS_SETTINGS_KEY = 'jarvis-settings';

/**
 * Tenta encontrar a marca do veículo em qualquer fonte disponível
 */
function detectBrandFromLocalStorage(): string | null {
  try {
    // 1. Prioridade: chave dedicada da splash
    const splashBrand = localStorage.getItem(SPLASH_BRAND_KEY);
    if (splashBrand) {
      return splashBrand;
    }
    
    // 2. Fallback: vehicle-info
    const vehicleInfo = localStorage.getItem(VEHICLE_INFO_KEY);
    if (vehicleInfo) {
      const parsed = JSON.parse(vehicleInfo);
      if (parsed.vehicleBrand) {
        return parsed.vehicleBrand;
      }
    }
    
    // 3. Fallback: jarvis-settings (legado)
    const jarvisSettings = localStorage.getItem(JARVIS_SETTINGS_KEY);
    if (jarvisSettings) {
      const parsed = JSON.parse(jarvisSettings);
      if (parsed.vehicleBrand) {
        return parsed.vehicleBrand;
      }
    }
  } catch (e) {
    console.warn('[SplashTheme] Erro ao ler localStorage:', e);
  }
  
  return null;
}

/**
 * Salva a marca do veículo para próximas splashs
 * Chamado quando o veículo é detectado/configurado
 */
export function saveSplashBrand(brand: string | null): void {
  try {
    if (brand) {
      localStorage.setItem(SPLASH_BRAND_KEY, brand);
      logger.debug('[SplashTheme] Marca salva para splash:', brand);
    } else {
      localStorage.removeItem(SPLASH_BRAND_KEY);
    }
  } catch (e) {
    logger.warn('[SplashTheme] Erro ao salvar marca:', e);
  }
}

/**
 * Hook para carregar o tema da splash baseado no veículo configurado
 * Lê do localStorage ANTES do primeiro render para evitar flash
 */
export function useSplashTheme(): SplashTheme {
  // Tentar ler sincronamente no estado inicial para evitar flash
  const [theme, setTheme] = useState<SplashTheme>(() => {
    const brand = detectBrandFromLocalStorage();
    if (brand) {
      return getSplashTheme(brand);
    }
    return DEFAULT_THEME;
  });
  
  // Re-verificar após mount (caso localStorage mude)
  useEffect(() => {
    const brand = detectBrandFromLocalStorage();
    if (brand) {
      setTheme(getSplashTheme(brand));
    }
  }, []);
  
  return theme;
}
