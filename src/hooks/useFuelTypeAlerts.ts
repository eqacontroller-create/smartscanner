// Hook para alertas de voz do Jarvis quando tipo de combustível muda
// Detecta mudanças significativas e informa consumo esperado

import { useEffect, useRef } from 'react';
import type { FuelTypeDetection, InferredFuelType } from '@/types/fuelForensics';
import { INFERRED_FUEL_LABELS } from '@/types/fuelForensics';
import logger from '@/lib/logger';

interface UseFuelTypeAlertsOptions {
  currentDetection: FuelTypeDetection | null;
  speak: (text: string, options?: { priority?: number; interrupt?: boolean }) => Promise<void>;
  enabled: boolean;
  isClosedLoop?: boolean;
}

/**
 * Calcula diferença de consumo entre tipos de combustível
 * Referência: Etanol tem ~30% menos energia que gasolina
 */
function getConsumptionDifference(from: InferredFuelType, to: InferredFuelType): {
  percentDiff: number;
  description: string;
  isIncrease: boolean;
} {
  // Fator de energia relativo (gasolina pura = 1.0)
  const energyFactors: Record<InferredFuelType, number> = {
    gasoline: 1.0,       // Gasolina pura - referência
    gasoline_e27: 0.92,  // E27 - ~8% menos energia
    gasoline_e30: 0.90,  // E30 - ~10% menos energia
    ethanol_mix: 0.80,   // Mistura Flex - ~20% menos energia
    ethanol_pure: 0.70,  // Etanol puro - ~30% menos energia
    unknown: 0.85,       // Valor neutro
  };
  
  const fromFactor = energyFactors[from];
  const toFactor = energyFactors[to];
  const percentDiff = Math.abs(Math.round((1 - toFactor / fromFactor) * 100));
  const isIncrease = toFactor < fromFactor;
  
  let description: string;
  if (isIncrease) {
    description = `Consumo deve aumentar aproximadamente ${percentDiff}%.`;
  } else if (toFactor > fromFactor) {
    description = `Consumo deve reduzir aproximadamente ${percentDiff}%.`;
  } else {
    description = 'Consumo deve permanecer similar.';
  }
  
  return { percentDiff, description, isIncrease };
}

/**
 * Gera mensagem de alerta personalizada para mudança de combustível
 */
function generateFuelChangeAlert(
  from: InferredFuelType, 
  to: InferredFuelType,
  detection: FuelTypeDetection
): string {
  const consumptionInfo = getConsumptionDifference(from, to);
  
  // Mensagens personalizadas por transição
  
  // Transição para Etanol Puro
  if (to === 'ethanol_pure' && from !== 'ethanol_pure') {
    return `Atenção, piloto. Detectei etanol puro no tanque. ` +
           `Consumo deve aumentar em torno de ${consumptionInfo.percentDiff}%. ` +
           `Economia financeira depende do preço atual do etanol.`;
  }
  
  // Transição E27 → E30 (mudança de legislação)
  if (to === 'gasoline_e30' && from === 'gasoline_e27') {
    return `Detectei gasolina E30, o novo padrão brasileiro desde agosto de 2025. ` +
           `A octanagem maior pode melhorar levemente a performance. ` +
           `Consumo praticamente igual ao E27.`;
  }
  
  // Transição para E30 (de outros combustíveis)
  if (to === 'gasoline_e30' && from !== 'gasoline_e27') {
    const diff = consumptionInfo.isIncrease 
      ? `Consumo pode ${consumptionInfo.percentDiff > 5 ? 'reduzir' : 'ficar similar'}.`
      : `Consumo deve reduzir em torno de ${consumptionInfo.percentDiff}%.`;
    return `Detectei gasolina E30, o padrão brasileiro atual. ${diff}`;
  }
  
  // Transição para Mistura Flex
  if (to === 'ethanol_mix') {
    return `Tanque com mistura Flex detectada. ` +
           `Consumo pode variar dependendo da proporção. ` +
           `LTFT atual indica aproximadamente ${detection.estimatedEthanolPercent}% de etanol.`;
  }
  
  // Voltando de Etanol para Gasolina
  if ((from === 'ethanol_pure' || from === 'ethanol_mix') && 
      (to === 'gasoline_e30' || to === 'gasoline_e27' || to === 'gasoline')) {
    return `Voltando para gasolina, piloto. ` +
           `Consumo deve reduzir em torno de ${consumptionInfo.percentDiff}%. ` +
           `A ECU vai adaptar nos próximos quilômetros.`;
  }
  
  // Mensagem genérica
  return `Mudança de combustível detectada. ` +
         `De ${INFERRED_FUEL_LABELS[from]} para ${INFERRED_FUEL_LABELS[to]}. ` +
         `${consumptionInfo.description}`;
}

/**
 * Hook para alertas de voz quando tipo de combustível muda significativamente
 */
export function useFuelTypeAlerts({ 
  currentDetection, 
  speak, 
  enabled,
  isClosedLoop = true,
}: UseFuelTypeAlertsOptions) {
  const previousTypeRef = useRef<InferredFuelType | null>(null);
  const lastAlertTimeRef = useRef<number>(0);
  const COOLDOWN_MS = 60000; // 1 minuto entre alertas
  
  useEffect(() => {
    // Não alertar se desabilitado ou sem dados
    if (!enabled || !currentDetection || !isClosedLoop) {
      return;
    }
    
    // Só alertar com confiança alta
    if (currentDetection.confidence !== 'high') {
      // Atualizar tipo anterior mesmo com baixa confiança (evitar falso positivo no próximo)
      if (currentDetection.confidence === 'medium' && currentDetection.inferredType !== 'unknown') {
        previousTypeRef.current = currentDetection.inferredType;
      }
      return;
    }
    
    const now = Date.now();
    const previousType = previousTypeRef.current;
    const currentType = currentDetection.inferredType;
    
    // Primeira detecção - apenas registrar, sem alerta
    if (!previousType) {
      previousTypeRef.current = currentType;
      logger.debug('[FuelTypeAlerts] Primeiro tipo detectado:', currentType);
      return;
    }
    
    // Cooldown ativo
    if (now - lastAlertTimeRef.current < COOLDOWN_MS) {
      return;
    }
    
    // Detectar mudança significativa
    if (previousType !== currentType && currentType !== 'unknown') {
      lastAlertTimeRef.current = now;
      previousTypeRef.current = currentType;
      
      // Gerar e falar mensagem de alerta
      const message = generateFuelChangeAlert(previousType, currentType, currentDetection);
      
      logger.log('[FuelTypeAlerts] Mudança detectada:', previousType, '→', currentType);
      logger.log('[FuelTypeAlerts] Mensagem:', message);
      
      speak(message, { priority: 3, interrupt: false });
    }
  }, [currentDetection, speak, enabled, isClosedLoop]);
  
  // Retornar estado para debug/UI
  return {
    previousType: previousTypeRef.current,
    lastAlertTime: lastAlertTimeRef.current,
  };
}
