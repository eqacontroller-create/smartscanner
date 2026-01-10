import { useEffect, useState, useCallback } from 'react';
import { VehicleBrand, VehicleProfile, DetectedVehicle, getVehicleProfile, detectVehicle } from '@/lib/vehicleProfiles';

interface UseVehicleThemeReturn {
  detectedVehicle: DetectedVehicle | null;
  currentProfile: VehicleProfile;
  themeClass: string;
  setVehicle: (vin: string | null, manufacturer?: string, modelYear?: string, country?: string) => void;
  resetToGeneric: () => void;
}

/**
 * Hook para gerenciar tema dinâmico baseado no veículo detectado
 * Aplica cores e estilos específicos da marca automaticamente
 */
export function useVehicleTheme(): UseVehicleThemeReturn {
  const [detectedVehicle, setDetectedVehicle] = useState<DetectedVehicle | null>(null);
  
  // Perfil atual (genérico se não detectado)
  const currentProfile = detectedVehicle?.profile || getVehicleProfile('generic');
  
  // Classe CSS para o tema
  const themeClass = `brand-${detectedVehicle?.brand || 'generic'}`;

  // Aplicar CSS variables quando o tema mudar
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = currentProfile;
    
    // Aplicar cores dinâmicas via CSS custom properties
    root.style.setProperty('--brand-primary', colors.primary);
    root.style.setProperty('--brand-accent', colors.accent);
    root.style.setProperty('--brand-primary-foreground', colors.primaryForeground);
    
    // Adicionar classe ao body para estilos específicos
    document.body.classList.remove(
      'brand-volkswagen', 'brand-ford', 'brand-chevrolet', 
      'brand-honda', 'brand-fiat', 'brand-toyota', 
      'brand-hyundai', 'brand-renault', 'brand-nissan',
      'brand-jeep', 'brand-bmw', 'brand-mercedes', 
      'brand-audi', 'brand-generic'
    );
    document.body.classList.add(themeClass);
    
    return () => {
      document.body.classList.remove(themeClass);
    };
  }, [currentProfile, themeClass]);

  // Definir veículo detectado
  const setVehicle = useCallback((
    vin: string | null, 
    manufacturer?: string, 
    modelYear?: string, 
    country?: string
  ) => {
    const vehicle = detectVehicle(vin, manufacturer, modelYear, country);
    setDetectedVehicle(vehicle);
  }, []);

  // Resetar para genérico
  const resetToGeneric = useCallback(() => {
    setDetectedVehicle(null);
  }, []);

  return {
    detectedVehicle,
    currentProfile,
    themeClass,
    setVehicle,
    resetToGeneric,
  };
}
