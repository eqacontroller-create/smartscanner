import { useMemo, useCallback } from 'react';
import type { 
  VehicleBenefits, 
  VehicleTip, 
  BrandAlert 
} from '@/types/vehicleTypes';
import { 
  VehicleBrand, 
  VehicleProfile, 
  getVehicleProfile,
  getRandomBrandTip,
  getBrandCharacteristics
} from '@/lib/vehicleProfiles';

interface UseVehicleBenefitsOptions {
  brand: VehicleBrand;
  profile: VehicleProfile;
  modelYear?: string | null;
  currentSettings?: {
    redlineRPM?: number;
    highTempThreshold?: number;
    lowVoltageThreshold?: number;
    speedLimit?: number;
  };
  onApplySettings?: (settings: {
    redlineRPM: number;
    highTempThreshold: number;
    lowVoltageThreshold: number;
    speedLimit: number;
  }) => void;
}

export interface UseVehicleBenefitsReturn extends VehicleBenefits {
  applyRecommendedSettings: () => void;
  getWelcomeTip: () => string;
  hasSettingsDifference: boolean;
}

/**
 * Hook que processa informações do veículo e retorna benefícios específicos
 */
export function useVehicleBenefits({
  brand,
  profile,
  modelYear,
  currentSettings,
  onApplySettings,
}: UseVehicleBenefitsOptions): UseVehicleBenefitsReturn {
  
  // Calcular configurações sugeridas baseadas na marca
  const suggestedSettings = useMemo(() => {
    const specs = profile.specs;
    return {
      suggestedRedlineRPM: specs.typicalRedlineRPM,
      suggestedTempThreshold: specs.normalTempRange[1], // Máximo da faixa normal
      suggestedVoltageThreshold: specs.normalVoltageRange[0], // Mínimo da faixa normal
      suggestedSpeedLimit: 120, // Padrão de segurança
    };
  }, [profile]);

  // Verificar se há diferença entre configurações atuais e sugeridas
  const hasSettingsDifference = useMemo(() => {
    if (!currentSettings) return false;
    
    const { suggestedRedlineRPM, suggestedTempThreshold, suggestedVoltageThreshold } = suggestedSettings;
    
    return (
      (currentSettings.redlineRPM && Math.abs(currentSettings.redlineRPM - suggestedRedlineRPM) > 200) ||
      (currentSettings.highTempThreshold && Math.abs(currentSettings.highTempThreshold - suggestedTempThreshold) > 5) ||
      (currentSettings.lowVoltageThreshold && Math.abs(currentSettings.lowVoltageThreshold - suggestedVoltageThreshold) > 0.3)
    );
  }, [currentSettings, suggestedSettings]);

  // Gerar alertas específicos da marca
  const brandSpecificAlerts = useMemo((): BrandAlert[] => {
    const alerts: BrandAlert[] = [];
    
    // Adicionar alertas baseados em problemas conhecidos
    profile.knownIssues.forEach(issue => {
      if (issue.severity === 'critical' || issue.severity === 'warning') {
        alerts.push({
          id: issue.id,
          type: issue.severity === 'critical' ? 'critical' : 'warning',
          title: issue.title,
          description: issue.description,
          condition: issue.affectedYears,
        });
      }
    });

    return alerts;
  }, [profile]);

  // Filtrar dicas relevantes
  const currentTips = useMemo((): VehicleTip[] => {
    // Priorizar dicas de alta prioridade
    return [...profile.tips].sort((a, b) => {
      const priorityOrder = { alta: 0, media: 1, baixa: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [profile]);

  // Aplicar configurações recomendadas
  const applyRecommendedSettings = useCallback(() => {
    if (onApplySettings) {
      onApplySettings({
        redlineRPM: suggestedSettings.suggestedRedlineRPM,
        highTempThreshold: suggestedSettings.suggestedTempThreshold,
        lowVoltageThreshold: suggestedSettings.suggestedVoltageThreshold,
        speedLimit: suggestedSettings.suggestedSpeedLimit,
      });
    }
  }, [onApplySettings, suggestedSettings]);

  // Obter dica para mensagem de boas-vindas
  const getWelcomeTip = useCallback((): string => {
    const tip = getRandomBrandTip(brand);
    if (!tip) return '';
    return tip.description;
  }, [brand]);

  // Características para o Jarvis
  const brandCharacteristics = useMemo(() => {
    return getBrandCharacteristics(brand);
  }, [brand]);

  return {
    ...suggestedSettings,
    brandSpecificAlerts,
    currentTips,
    techSpecs: profile.specs,
    knownIssues: profile.knownIssues,
    brandCharacteristics,
    applyRecommendedSettings,
    getWelcomeTip,
    hasSettingsDifference,
  };
}
