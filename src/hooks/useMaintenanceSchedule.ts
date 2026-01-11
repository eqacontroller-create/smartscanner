// Hook para gerenciar cronograma de manutenção por marca

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { VehicleBrand } from '@/lib/vehicleProfiles';
import {
  MaintenanceRecord,
  MaintenanceAlert,
  MaintenanceType,
  getMaintenanceIntervalsForBrand,
  calculateMaintenanceAlerts,
  generateMaintenanceVoiceMessage,
} from '@/types/maintenanceTypes';

interface UseMaintenanceScheduleOptions {
  brand: VehicleBrand;
  currentMileage: number;
  onAlertSpeak?: (message: string) => void;
}

interface UseMaintenanceScheduleReturn {
  // Estado
  alerts: MaintenanceAlert[];
  history: MaintenanceRecord[];
  intervals: ReturnType<typeof getMaintenanceIntervalsForBrand>;
  
  // Alertas pendentes
  overdueCount: number;
  criticalCount: number;
  
  // Ações
  recordMaintenance: (type: MaintenanceType, mileage: number, notes?: string) => void;
  removeMaintenance: (id: string) => void;
  clearHistory: () => void;
  
  // Mensagem de voz
  getVoiceMessage: () => string | null;
  
  // Atualizar quilometragem
  updateMileage: (mileage: number) => void;
}

const STORAGE_KEY = 'obd-maintenance-history';

export function useMaintenanceSchedule(options: UseMaintenanceScheduleOptions): UseMaintenanceScheduleReturn {
  const { brand, currentMileage, onAlertSpeak } = options;
  
  // Carregar histórico do localStorage
  const [history, setHistory] = useState<MaintenanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Mileage local (pode ser atualizado independentemente)
  const [mileage, setMileage] = useState(currentMileage);
  
  // Atualizar mileage quando prop mudar
  useEffect(() => {
    if (currentMileage > 0) {
      setMileage(currentMileage);
    }
  }, [currentMileage]);
  
  // Persistir histórico
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Erro ao salvar histórico de manutenção:', error);
    }
  }, [history]);
  
  // Obter intervalos específicos da marca
  const intervals = useMemo(() => {
    return getMaintenanceIntervalsForBrand(brand);
  }, [brand]);
  
  // Calcular alertas
  const alerts = useMemo(() => {
    if (mileage <= 0) return [];
    return calculateMaintenanceAlerts(brand, mileage, history);
  }, [brand, mileage, history]);
  
  // Contadores
  const overdueCount = useMemo(() => {
    return alerts.filter(a => a.isOverdue).length;
  }, [alerts]);
  
  const criticalCount = useMemo(() => {
    return alerts.filter(a => a.priority === 'critica').length;
  }, [alerts]);
  
  // Registrar manutenção realizada
  const recordMaintenance = useCallback((type: MaintenanceType, mileageAtService: number, notes?: string) => {
    const newRecord: MaintenanceRecord = {
      id: `${type}-${Date.now()}`,
      type,
      mileageAtService,
      datePerformed: new Date().toISOString(),
      notes,
    };
    
    setHistory(prev => [...prev, newRecord]);
  }, []);
  
  // Remover registro
  const removeMaintenance = useCallback((id: string) => {
    setHistory(prev => prev.filter(r => r.id !== id));
  }, []);
  
  // Limpar histórico
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);
  
  // Atualizar quilometragem
  const updateMileage = useCallback((newMileage: number) => {
    setMileage(newMileage);
  }, []);
  
  // Gerar mensagem de voz
  const getVoiceMessage = useCallback(() => {
    return generateMaintenanceVoiceMessage(alerts);
  }, [alerts]);
  
  // Efeito para falar alertas críticos (uma vez por sessão)
  useEffect(() => {
    const sessionKey = `maintenance-alert-spoken-${brand}`;
    const hasSpoken = sessionStorage.getItem(sessionKey);
    
    if (!hasSpoken && onAlertSpeak && mileage > 0) {
      const message = generateMaintenanceVoiceMessage(alerts);
      if (message) {
        // Aguardar um pouco para não sobrepor boas-vindas
        const timer = setTimeout(() => {
          onAlertSpeak(message);
          sessionStorage.setItem(sessionKey, 'true');
        }, 8000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [alerts, brand, mileage, onAlertSpeak]);
  
  return {
    alerts,
    history,
    intervals,
    overdueCount,
    criticalCount,
    recordMaintenance,
    removeMaintenance,
    clearHistory,
    getVoiceMessage,
    updateMileage,
  };
}
