import { useEffect, useRef, useCallback } from 'react';
import { getShiftPoints } from '@/types/jarvisSettings';

interface AlertSettings {
  highRpmAlertEnabled: boolean;
  highTempAlertEnabled: boolean;
  highTempThreshold: number;
  speedAlertEnabled: boolean;
  speedLimit: number;
  lowVoltageAlertEnabled: boolean;
  lowVoltageThreshold: number;
  luggingAlertEnabled: boolean;
  redlineRPM: number;
  welcomeEnabled: boolean;
  maintenanceAlertEnabled: boolean;
  currentMileage: number;
  nextOilChange: number;
  nextInspection: number;
  aiModeEnabled: boolean;
}

interface VehicleData {
  rpm: number | null;
  speed: number | null;
  temperature: number | null;
  voltage: number | null;
  engineLoad: number | null;
}

interface UseAlertsOptions {
  vehicleData: VehicleData;
  settings: AlertSettings;
  status: string;
  speak: (text: string) => void;
  brandName: string;
  modelYear?: string;
  brandTip?: string;
}

// Cooldown constants (in milliseconds)
const COOLDOWNS = {
  HIGH_RPM: 15000,      // 15 seconds
  HIGH_TEMP: 60000,     // 1 minute
  SPEED: 30000,         // 30 seconds
  LOW_VOLTAGE: 120000,  // 2 minutes
  LUGGING: 30000,       // 30 seconds
};

// Max simultaneous alerts in queue
const MAX_ALERT_QUEUE = 2;

export function useAlerts(options: UseAlertsOptions) {
  const { vehicleData, settings, status, speak, brandName, modelYear, brandTip } = options;
  const { rpm, speed, temperature, voltage, engineLoad } = vehicleData;

  // Refs for cooldown tracking
  const lastHighRpmAlertRef = useRef<number>(0);
  const lastHighTempAlertRef = useRef<number>(0);
  const lastSpeedAlertRef = useRef<number>(0);
  const lastLowVoltageAlertRef = useRef<number>(0);
  const lastLuggingAlertRef = useRef<number>(0);
  const hasWelcomedRef = useRef<boolean>(false);
  
  // Alert queue management
  const alertQueueRef = useRef<string[]>([]);
  const isProcessingAlertRef = useRef<boolean>(false);

  // Queue an alert with priority handling
  const queueAlert = useCallback((message: string, isCritical: boolean = false) => {
    if (isCritical) {
      // Critical alerts interrupt and go to front
      alertQueueRef.current = [message, ...alertQueueRef.current.slice(0, MAX_ALERT_QUEUE - 1)];
    } else if (alertQueueRef.current.length < MAX_ALERT_QUEUE) {
      alertQueueRef.current.push(message);
    }
    // else: drop non-critical alert if queue is full
  }, []);

  // Process alert queue
  const processAlertQueue = useCallback(() => {
    if (isProcessingAlertRef.current || alertQueueRef.current.length === 0) return;
    
    isProcessingAlertRef.current = true;
    const message = alertQueueRef.current.shift();
    
    if (message) {
      speak(message);
    }
    
    // Allow next alert after a delay
    setTimeout(() => {
      isProcessingAlertRef.current = false;
      if (alertQueueRef.current.length > 0) {
        processAlertQueue();
      }
    }, 3000); // 3s between alerts
  }, [speak]);

  // Welcome Protocol
  useEffect(() => {
    if (status === 'ready' && !hasWelcomedRef.current && settings.welcomeEnabled) {
      hasWelcomedRef.current = true;
      
      const timer = setTimeout(() => {
        const temp = temperature !== null ? temperature : 'desconhecida';
        
        // Battery status based on real voltage
        let batteryStatus: string;
        if (voltage === null) {
          batteryStatus = 'Aguardando leitura da bateria';
        } else if (voltage < 12.5) {
          batteryStatus = `Atenção, tensão da bateria baixa em ${voltage} volts. Verifique o alternador`;
        } else {
          batteryStatus = `Tensão da bateria estável em ${voltage} volts. Alternador operando`;
        }
        
        let maintenanceWarning = '';
        
        // Check maintenance reminders
        if (settings.maintenanceAlertEnabled && settings.currentMileage > 0) {
          const kmToOilChange = settings.nextOilChange - settings.currentMileage;
          const kmToInspection = settings.nextInspection - settings.currentMileage;
          
          if (kmToOilChange <= 0) {
            maintenanceWarning += ' Atenção: quilometragem da troca de óleo ultrapassada. Agende a manutenção.';
          } else if (kmToOilChange <= 1000) {
            maintenanceWarning += ` Lembrete: troca de óleo em ${kmToOilChange} quilômetros.`;
          }
          
          if (kmToInspection <= 0) {
            maintenanceWarning += ' Atenção: quilometragem da revisão ultrapassada. Agende a manutenção.';
          } else if (kmToInspection <= 2000) {
            maintenanceWarning += ` Revisão programada em ${kmToInspection} quilômetros.`;
          }
        }
        
        const tipMessage = brandTip ? ` Dica: ${brandTip.substring(0, 80)}` : '';
        const vehicleName = brandName !== 'Veículo' ? `${brandName}${modelYear ? ` ${modelYear}` : ''}` : 'Veículo';
        
        speak(`${vehicleName} conectado, piloto. Motor a ${temp} graus. ${batteryStatus}.${maintenanceWarning}${tipMessage} Pronto para rodar.`);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
    
    // Reset welcome flag when disconnecting
    if (status === 'disconnected') {
      hasWelcomedRef.current = false;
    }
  }, [status, temperature, voltage, speak, settings, brandName, modelYear, brandTip]);

  // Cold Engine + High RPM Alert
  useEffect(() => {
    if (!settings.highRpmAlertEnabled) return;
    
    const now = Date.now();
    
    if (
      temperature !== null && 
      temperature < 60 && 
      rpm !== null && 
      rpm > 2500 &&
      now - lastHighRpmAlertRef.current > COOLDOWNS.HIGH_RPM
    ) {
      lastHighRpmAlertRef.current = now;
      queueAlert('Cuidado, piloto. O motor ainda está frio. Evite altas rotações para proteger o motor.');
      processAlertQueue();
    }
  }, [rpm, temperature, settings.highRpmAlertEnabled, queueAlert, processAlertQueue]);

  // Lugging Alert (Engine Under Load)
  useEffect(() => {
    if (!settings.luggingAlertEnabled) return;
    
    const now = Date.now();
    const { luggingPoint } = getShiftPoints(settings.redlineRPM);
    
    if (
      rpm !== null &&
      rpm > 0 &&
      rpm < luggingPoint &&
      engineLoad !== null &&
      engineLoad > 80 &&
      now - lastLuggingAlertRef.current > COOLDOWNS.LUGGING
    ) {
      lastLuggingAlertRef.current = now;
      queueAlert('Motor em esforço excessivo, piloto. Reduza a marcha para proteger o motor.');
      processAlertQueue();
    }
  }, [rpm, engineLoad, settings.luggingAlertEnabled, settings.redlineRPM, queueAlert, processAlertQueue]);

  // High Temperature Alert (Critical)
  useEffect(() => {
    if (!settings.highTempAlertEnabled) return;
    
    const now = Date.now();
    
    if (
      temperature !== null && 
      temperature > settings.highTempThreshold &&
      now - lastHighTempAlertRef.current > COOLDOWNS.HIGH_TEMP
    ) {
      lastHighTempAlertRef.current = now;
      const isCritical = temperature > 110;
      queueAlert(
        `Atenção, piloto! Temperatura do motor em ${temperature} graus. Risco de superaquecimento. Reduza a velocidade ou pare o veículo.`,
        isCritical
      );
      processAlertQueue();
    }
  }, [temperature, settings.highTempAlertEnabled, settings.highTempThreshold, queueAlert, processAlertQueue]);

  // Speed Alert
  useEffect(() => {
    if (!settings.speedAlertEnabled) return;
    
    const now = Date.now();
    
    if (
      speed !== null && 
      speed > settings.speedLimit &&
      now - lastSpeedAlertRef.current > COOLDOWNS.SPEED
    ) {
      lastSpeedAlertRef.current = now;
      queueAlert(`Velocidade acima do limite configurado, piloto. Você está a ${speed} quilômetros por hora.`);
      processAlertQueue();
    }
  }, [speed, settings.speedAlertEnabled, settings.speedLimit, queueAlert, processAlertQueue]);

  // Low Voltage Alert
  useEffect(() => {
    if (!settings.lowVoltageAlertEnabled) return;
    
    const now = Date.now();
    
    if (
      voltage !== null && 
      voltage > 0 &&
      voltage < settings.lowVoltageThreshold &&
      now - lastLowVoltageAlertRef.current > COOLDOWNS.LOW_VOLTAGE
    ) {
      lastLowVoltageAlertRef.current = now;
      const isCritical = voltage < 12.0;
      
      if (isCritical) {
        queueAlert(
          `Alerta crítico, piloto! Tensão da bateria em ${voltage} volts. Verifique o sistema elétrico imediatamente.`,
          true
        );
      } else {
        queueAlert(`Atenção, piloto. Tensão da bateria baixa em ${voltage} volts. Recomendo verificar o alternador.`);
      }
      processAlertQueue();
    }
  }, [voltage, settings.lowVoltageAlertEnabled, settings.lowVoltageThreshold, queueAlert, processAlertQueue]);

  return {
    alertQueueLength: alertQueueRef.current.length,
    hasWelcomed: hasWelcomedRef.current,
  };
}
