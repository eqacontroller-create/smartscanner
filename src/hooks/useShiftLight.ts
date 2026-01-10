import { useEffect, useRef, useCallback } from 'react';
import { getShiftPoints } from '@/types/jarvisSettings';

interface UseShiftLightOptions {
  rpm: number | null;
  redlineRPM: number;
  ecoEnabled: boolean;
  sportEnabled: boolean;
  shiftLightEnabled: boolean;
  speak: (text: string) => void;
}

interface UseShiftLightReturn {
  currentZone: 'eco' | 'normal' | 'sport' | 'redline' | null;
  ecoPoint: number;
  sportPoint: number;
}

export function useShiftLight({
  rpm,
  redlineRPM,
  ecoEnabled,
  sportEnabled,
  shiftLightEnabled,
  speak,
}: UseShiftLightOptions): UseShiftLightReturn {
  const lastEcoAlertRef = useRef<number>(0);
  const lastSportAlertRef = useRef<number>(0);
  const cooldown = 5000; // 5 segundos entre alertas

  const { ecoPoint, sportPoint } = getShiftPoints(redlineRPM);

  // Determinar zona atual do RPM
  const getCurrentZone = useCallback((): 'eco' | 'normal' | 'sport' | 'redline' | null => {
    if (rpm === null || rpm === 0) return null;
    if (rpm >= redlineRPM) return 'redline';
    if (rpm >= sportPoint) return 'sport';
    if (rpm >= ecoPoint) return 'normal';
    return 'eco';
  }, [rpm, redlineRPM, sportPoint, ecoPoint]);

  // Monitor de Eco Shift (40% do redline)
  useEffect(() => {
    if (!shiftLightEnabled || !ecoEnabled) return;
    if (rpm === null || rpm === 0) return;
    
    const now = Date.now();
    
    // Detectar quando cruza o ponto eco (subindo)
    if (
      rpm >= ecoPoint &&
      rpm < sportPoint &&
      now - lastEcoAlertRef.current > cooldown
    ) {
      lastEcoAlertRef.current = now;
      speak('Ponto de troca econômico.');
    }
  }, [rpm, ecoPoint, sportPoint, ecoEnabled, shiftLightEnabled, speak]);

  // Monitor de Sport Shift (90% do redline)
  useEffect(() => {
    if (!shiftLightEnabled || !sportEnabled) return;
    if (rpm === null || rpm === 0) return;
    
    const now = Date.now();
    
    // Detectar quando cruza o ponto sport (subindo)
    if (
      rpm >= sportPoint &&
      rpm < redlineRPM &&
      now - lastSportAlertRef.current > cooldown
    ) {
      lastSportAlertRef.current = now;
      speak('Limite de rotação! Reduza a marcha.');
    }
  }, [rpm, sportPoint, redlineRPM, sportEnabled, shiftLightEnabled, speak]);

  return {
    currentZone: getCurrentZone(),
    ecoPoint,
    sportPoint,
  };
}
