import React, { createContext, useCallback, useRef, useState, useEffect } from 'react';
import { 
  BLUETOOTH_UUIDS, 
  OBD_TIMING, 
  OBD_PIDS, 
  buildMode01Command 
} from '@/services/obd/OBDProtocol';
import { parseOBDResponse, parseVINResponse } from '@/services/obd/OBDParser';
import { saveSplashBrand } from '@/hooks/useSplashTheme';
// Destructure constants from protocol
const { SERVICE, WRITE_CHAR, NOTIFY_CHAR } = BLUETOOTH_UUIDS;
const { 
  POLLING_INTERVAL_MS, 
  COMMAND_TIMEOUT_MS,
  MAX_CONSECUTIVE_FAILURES,
  AUTO_RECONNECT_DELAY_MS,
  MAX_AUTO_RECONNECT_ATTEMPTS,
  THROTTLE_IDLE_MS,
  THROTTLE_NORMAL_MS,
  THROTTLE_SPORT_MS,
  SPORT_RPM_THRESHOLD,
  COMMAND_DELAY_MS
} = OBD_TIMING;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'initializing' | 'ready' | 'reading' | 'error';

export interface VehicleData {
  rpm: number | null;
  speed: number | null;
  temperature: number | null;
  voltage: number | null;
  fuelLevel: number | null;
  engineLoad: number | null;
}

export interface DetectedVehicleInfo {
  vin: string | null;
  manufacturer: string | null;
  modelYear: string | null;
  country: string | null;
}

export interface OBDContextType {
  // Status e conexão
  status: ConnectionStatus;
  isPolling: boolean;
  error: string | null;
  logs: string[];
  
  // Dados do veículo (throttled 200ms)
  vehicleData: VehicleData;
  
  // Veículo detectado
  detectedVehicle: DetectedVehicleInfo | null;
  
  // Ações
  connect: () => Promise<void>;
  disconnect: () => void;
  startPolling: () => void;
  stopPolling: () => void;
  sendRawCommand: (cmd: string, timeout?: number) => Promise<string>;
  addLog: (message: string) => void;
  
  // Utilitários
  isSupported: boolean;
  hasLastDevice: boolean;
  reconnect: () => Promise<boolean>;
}

const defaultVehicleData: VehicleData = {
  rpm: null,
  speed: null,
  temperature: null,
  voltage: null,
  fuelLevel: null,
  engineLoad: null,
};

export const OBDContext = createContext<OBDContextType | null>(null);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function OBDProvider({ children }: { children: React.ReactNode }) {
  // Estados públicos (causam re-render controlado)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [vehicleData, setVehicleData] = useState<VehicleData>(defaultVehicleData);
  const [detectedVehicle, setDetectedVehicle] = useState<DetectedVehicleInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Refs para dados internos (não causam re-render)
  const vehicleDataRef = useRef<VehicleData>(defaultVehicleData);
  const lastUIUpdateRef = useRef<number>(0);
  
  // Refs para Bluetooth
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const writeCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const notifyCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const responseBufferRef = useRef<string>('');
  const responseResolverRef = useRef<((value: string) => void) | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const isPollingRef = useRef(false);
  const isReadingRef = useRef(false);
  const isReconnectingRef = useRef(false);
  
  // Contador de falhas consecutivas para auto-reconnect
  const consecutiveFailuresRef = useRef<number>(0);
  
  // Auto-reconnect state
  const wasIntentionallyConnectedRef = useRef(false);
  const autoReconnectAttemptsRef = useRef(0);

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  // Log helper
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  }, []);

  const addLogRef = useRef(addLog);
  addLogRef.current = addLog;

  // Refs para funções internas (usadas no handler de desconexão)
  const reconnectInternalRef = useRef<() => Promise<boolean>>(() => Promise.resolve(false));
  const readVehicleDataInternalRef = useRef<() => Promise<boolean>>(() => Promise.resolve(false));

  // Get adaptive throttle based on current RPM
  const getAdaptiveThrottle = useCallback(() => {
    const rpm = vehicleDataRef.current.rpm;
    if (rpm === null || rpm === 0) return THROTTLE_IDLE_MS;
    if (rpm > SPORT_RPM_THRESHOLD) return THROTTLE_SPORT_MS;
    return THROTTLE_NORMAL_MS;
  }, []);

  // Throttled UI update - atualiza estado público com throttle adaptativo
  useEffect(() => {
    const checkAndUpdate = () => {
      const now = Date.now();
      const throttle = getAdaptiveThrottle();
      
      if (now - lastUIUpdateRef.current >= throttle) {
        const current = vehicleDataRef.current;
        setVehicleData(prev => {
          // Só atualiza se houver mudanças reais
          if (
            prev.rpm !== current.rpm ||
            prev.speed !== current.speed ||
            prev.temperature !== current.temperature ||
            prev.voltage !== current.voltage ||
            prev.fuelLevel !== current.fuelLevel ||
            prev.engineLoad !== current.engineLoad
          ) {
            lastUIUpdateRef.current = now;
            return { ...current };
          }
          return prev;
        });
      }
    };

    // Use the fastest throttle to check frequently, actual update respects adaptive throttle
    const throttleInterval = setInterval(checkAndUpdate, THROTTLE_SPORT_MS);

    return () => clearInterval(throttleInterval);
  }, [getAdaptiveThrottle]);

  // Handle BLE notifications
  const handleNotification = useCallback((event: Event) => {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const decoder = new TextDecoder();
    const chunk = decoder.decode(value);
    
    responseBufferRef.current += chunk;
    
    addLogRef.current(`📥 Chunk: ${chunk.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}`);

    if (responseBufferRef.current.includes('>')) {
      const fullResponse = responseBufferRef.current;
      responseBufferRef.current = '';
      
      addLogRef.current(`✅ Resposta completa recebida`);
      
      if (responseResolverRef.current) {
        responseResolverRef.current(fullResponse);
        responseResolverRef.current = null;
      }
    }
  }, []);

  // Send command to ELM327
  const sendCommand = useCallback(async (command: string, timeout: number = 5000): Promise<string> => {
    if (!writeCharRef.current) {
      throw new Error('Característica de escrita não disponível');
    }

    responseBufferRef.current = '';

    addLogRef.current(`📤 TX: ${command}`);
    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\r');
    
    const responsePromise = new Promise<string>((resolve) => {
      responseResolverRef.current = resolve;
      setTimeout(() => {
        if (responseResolverRef.current === resolve) {
          responseResolverRef.current = null;
          const partialResponse = responseBufferRef.current;
          responseBufferRef.current = '';
          if (partialResponse) {
            addLogRef.current(`⚠️ Timeout com resposta parcial`);
            resolve(partialResponse);
          } else {
            resolve('TIMEOUT');
          }
        }
      }, timeout);
    });

    await writeCharRef.current.writeValue(data);
    return responsePromise;
  }, []);

  // Connect to BLE device
  const connect = useCallback(async () => {
    if (!isSupported) {
      setError('Web Bluetooth não é suportado neste navegador');
      return;
    }

    try {
      setStatus('connecting');
      setError(null);
      addLogRef.current('🔍 Solicitando dispositivo Bluetooth...');

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE]
      });

      deviceRef.current = device;
      addLogRef.current(`📱 Dispositivo: ${device.name || 'Desconhecido'}`);

      device.addEventListener('gattserverdisconnected', async () => {
        addLogRef.current('🔌 Conexão Bluetooth perdida');
        writeCharRef.current = null;
        notifyCharRef.current = null;
        responseBufferRef.current = '';
        isReadingRef.current = false;
        
        // Se estava conectado intencionalmente, tentar reconectar automaticamente
        if (wasIntentionallyConnectedRef.current && autoReconnectAttemptsRef.current < MAX_AUTO_RECONNECT_ATTEMPTS) {
          autoReconnectAttemptsRef.current++;
          const attempt = autoReconnectAttemptsRef.current;
          
          addLogRef.current(`🔄 Tentativa de reconexão automática ${attempt}/${MAX_AUTO_RECONNECT_ATTEMPTS}...`);
          setStatus('connecting');
          
          await delay(AUTO_RECONNECT_DELAY_MS);
          
          // Verificar se não foi desconectado manualmente durante o delay
          if (!wasIntentionallyConnectedRef.current) {
            addLogRef.current('⏹ Reconexão cancelada - desconexão manual');
            setStatus('disconnected');
            return;
          }
          
          const success = await reconnectInternalRef.current();
          
          if (success) {
            autoReconnectAttemptsRef.current = 0;
            addLogRef.current('✅ Reconexão automática bem-sucedida!');
            
            // Retomar polling se estava ativo
            if (isPollingRef.current) {
              addLogRef.current('▶ Retomando leitura contínua...');
              
              // CORREÇÃO: Limpar polling anterior antes de criar novo
              if (pollingIntervalRef.current) {
                clearTimeout(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              
              setStatus('reading');
              const poll = async () => {
                if (!isPollingRef.current) return;
                await readVehicleDataInternalRef.current();
                if (isPollingRef.current) {
                  pollingIntervalRef.current = window.setTimeout(poll, POLLING_INTERVAL_MS);
                }
              };
              poll();
            }
          } else {
            if (autoReconnectAttemptsRef.current >= MAX_AUTO_RECONNECT_ATTEMPTS) {
              addLogRef.current('❌ Todas as tentativas de reconexão falharam');
              setStatus('disconnected');
              vehicleDataRef.current = defaultVehicleData;
              setVehicleData(defaultVehicleData);
              wasIntentionallyConnectedRef.current = false;
              autoReconnectAttemptsRef.current = 0;
            }
          }
        } else {
          // Desconexão manual ou limite de tentativas atingido
          setStatus('disconnected');
          vehicleDataRef.current = defaultVehicleData;
          setVehicleData(defaultVehicleData);
        }
      });

      addLogRef.current('🔗 Conectando ao GATT Server...');
      const server = await device.gatt?.connect();
      if (!server) throw new Error('Falha ao conectar ao GATT Server');
      addLogRef.current('✅ GATT conectado');

      addLogRef.current('🔍 Obtendo serviço...');
      const service = await server.getPrimaryService(SERVICE);
      addLogRef.current('✅ Serviço encontrado');

      addLogRef.current('🔍 Obtendo características...');
      const [writeChar, notifyChar] = await Promise.all([
        service.getCharacteristic(WRITE_CHAR),
        service.getCharacteristic(NOTIFY_CHAR)
      ]);

      writeCharRef.current = writeChar;
      notifyCharRef.current = notifyChar;
      addLogRef.current('✅ Características obtidas');

      addLogRef.current('📡 Ativando notificações...');
      await notifyChar.startNotifications();
      notifyChar.addEventListener('characteristicvaluechanged', handleNotification);
      addLogRef.current('✅ Notificações ativas');

      await delay(300);

      setStatus('initializing');
      addLogRef.current('🔧 Inicializando ELM327...');

      addLogRef.current('📡 AT Z (reset)...');
      await sendCommand('AT Z', 6000);
      
      addLogRef.current('⏳ Aguardando estabilização (1s)...');
      await delay(1000);

      addLogRef.current('📡 AT E0 (desativar echo)...');
      await sendCommand('AT E0', 3000);
      await delay(200);

      addLogRef.current('📡 AT L0 (desativar linefeeds)...');
      await sendCommand('AT L0', 3000);
      await delay(200);

      addLogRef.current('📡 AT S0 (desativar espaços)...');
      await sendCommand('AT S0', 3000);
      await delay(200);

      addLogRef.current('📡 AT H0 (desativar headers)...');
      await sendCommand('AT H0', 3000);
      await delay(200);

      addLogRef.current('📡 AT SP0 (auto protocolo)...');
      await sendCommand('AT SP0', 5000);
      await delay(300);

      // Auto-detectar VIN do veículo
      addLogRef.current('🚗 Tentando detectar VIN do veículo...');
      try {
        const vinResponse = await sendCommand('0902', 8000);
        const vinInfo = parseVINResponse(vinResponse);
        if (vinInfo) {
          setDetectedVehicle({
            vin: vinInfo.vin,
            manufacturer: vinInfo.manufacturer,
            modelYear: vinInfo.modelYear,
            country: vinInfo.country,
          });
          addLogRef.current(`✅ VIN detectado: ${vinInfo.vin} (${vinInfo.manufacturer || 'Fabricante desconhecido'})`);
          
          // Salvar marca para próximas splashs
          if (vinInfo.manufacturer) {
            saveSplashBrand(vinInfo.manufacturer);
          }
        } else {
          addLogRef.current('⚠️ VIN não disponível - usando modo genérico');
          setDetectedVehicle(null);
        }
      } catch {
        addLogRef.current('⚠️ Erro ao ler VIN - usando modo genérico');
        setDetectedVehicle(null);
      }

      setStatus('ready');
      setError(null);
      wasIntentionallyConnectedRef.current = true;
      autoReconnectAttemptsRef.current = 0;
      addLogRef.current('✅ Scanner pronto!');

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setStatus('error');
      addLogRef.current(`❌ Erro: ${message}`);
    }
  }, [isSupported, handleNotification, sendCommand]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;
    isReadingRef.current = false;
    setIsPolling(false);
    addLogRef.current('⏹ Leitura contínua parada');
  }, []);

  // Disconnect from BLE device
  const disconnect = useCallback(() => {
    // Marcar como desconexão intencional para prevenir auto-reconnect
    wasIntentionallyConnectedRef.current = false;
    autoReconnectAttemptsRef.current = 0;
    
    stopPolling();
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    writeCharRef.current = null;
    notifyCharRef.current = null;
    responseBufferRef.current = '';
    isReadingRef.current = false;
    vehicleDataRef.current = defaultVehicleData;
    setVehicleData(defaultVehicleData);
    setStatus('disconnected');
    addLogRef.current('🔌 Desconectado manualmente');
  }, [stopPolling]);

  // Reconnect to last device
  const reconnect = useCallback(async (): Promise<boolean> => {
    if (isReconnectingRef.current) {
      addLogRef.current('⚠️ Reconexão já em andamento...');
      return false;
    }
    
    if (!deviceRef.current) {
      addLogRef.current('⚠️ Nenhum dispositivo anterior para reconectar');
      return false;
    }

    isReconnectingRef.current = true;

    try {
      setStatus('connecting');
      setError(null);
      addLogRef.current('🔄 Tentando reconexão automática...');

      if (!deviceRef.current.gatt) {
        addLogRef.current('❌ GATT não disponível');
        setStatus('disconnected');
        return false;
      }

      addLogRef.current('🔗 Reconectando ao GATT Server...');
      const server = await deviceRef.current.gatt.connect();
      if (!server) {
        throw new Error('Falha ao reconectar ao GATT Server');
      }
      addLogRef.current('✅ GATT reconectado');

      addLogRef.current('🔍 Re-obtendo serviço...');
      const service = await server.getPrimaryService(SERVICE);
      addLogRef.current('✅ Serviço encontrado');

      addLogRef.current('🔍 Re-obtendo características...');
      const [writeChar, notifyChar] = await Promise.all([
        service.getCharacteristic(WRITE_CHAR),
        service.getCharacteristic(NOTIFY_CHAR)
      ]);

      writeCharRef.current = writeChar;
      notifyCharRef.current = notifyChar;
      addLogRef.current('✅ Características obtidas');

      addLogRef.current('📡 Reativando notificações...');
      await notifyChar.startNotifications();
      notifyChar.addEventListener('characteristicvaluechanged', handleNotification);
      addLogRef.current('✅ Notificações reativas');

      await delay(300);

      setStatus('initializing');
      addLogRef.current('🔧 Re-inicializando ELM327...');

      await sendCommand('AT E0', 2000);
      await delay(100);
      await sendCommand('AT L0', 2000);
      await delay(100);
      await sendCommand('AT S0', 2000);
      await delay(100);
      await sendCommand('AT H0', 2000);
      await delay(100);

      setStatus('ready');
      setError(null);
      addLogRef.current('✅ Reconectado com sucesso!');
      return true;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setStatus('error');
      addLogRef.current(`❌ Reconexão falhou: ${message}`);
      return false;
    } finally {
      isReconnectingRef.current = false;
    }
  }, [handleNotification, sendCommand]);

  // Read vehicle data from OBD using Services
  const readVehicleData = useCallback(async (): Promise<boolean> => {
    if (!writeCharRef.current || isReadingRef.current) return false;

    isReadingRef.current = true;
    let readSuccess = false;

    // Helper to read a PID using the OBDParser service
    const readPID = async (pidKey: keyof typeof OBD_PIDS): Promise<{ success: boolean; value: number | null }> => {
      try {
        const pid = OBD_PIDS[pidKey];
        const command = buildMode01Command(pid.pid);
        const response = await sendCommand(command, COMMAND_TIMEOUT_MS);
        const result = parseOBDResponse(pid.pid, response);
        return { success: result.success, value: result.value };
      } catch {
        return { success: false, value: null };
      }
    };

    try {
      // Read RPM
      const rpmResult = await readPID('RPM');
      if (rpmResult.success) {
        vehicleDataRef.current.rpm = rpmResult.value ?? 0;
        readSuccess = true;
      }

      await delay(COMMAND_DELAY_MS);

      // Read Speed
      const speedResult = await readPID('SPEED');
      if (speedResult.success) {
        vehicleDataRef.current.speed = speedResult.value ?? 0;
        readSuccess = true;
      }

      await delay(COMMAND_DELAY_MS);

      // Read Coolant Temperature
      const tempResult = await readPID('COOLANT_TEMP');
      if (tempResult.success) {
        vehicleDataRef.current.temperature = tempResult.value;
        readSuccess = true;
      }

      await delay(COMMAND_DELAY_MS);

      // Read Battery Voltage
      const voltResult = await readPID('VOLTAGE');
      if (voltResult.success) {
        vehicleDataRef.current.voltage = voltResult.value;
        readSuccess = true;
      }

      await delay(COMMAND_DELAY_MS);

      // Read Fuel Level
      const fuelResult = await readPID('FUEL_LEVEL');
      if (fuelResult.success) {
        vehicleDataRef.current.fuelLevel = fuelResult.value;
        readSuccess = true;
      }

      await delay(COMMAND_DELAY_MS);

      // Read Engine Load
      const loadResult = await readPID('ENGINE_LOAD');
      if (loadResult.success) {
        vehicleDataRef.current.engineLoad = loadResult.value;
        readSuccess = true;
      }

      // Track consecutive failures
      if (readSuccess) {
        consecutiveFailuresRef.current = 0;
      } else {
        consecutiveFailuresRef.current++;
        if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
          addLogRef.current(`⚠️ ${MAX_CONSECUTIVE_FAILURES} falhas consecutivas - verificando conexão...`);
        }
      }

      return readSuccess;
    } catch {
      consecutiveFailuresRef.current++;
      return false;
    } finally {
      isReadingRef.current = false;
    }
  }, [sendCommand]);

  // Atualizar refs para uso no handler de desconexão
  reconnectInternalRef.current = reconnect;
  readVehicleDataInternalRef.current = readVehicleData;

  // Start polling loop
  const startPolling = useCallback(() => {
    if (status !== 'ready' || isPollingRef.current) {
      addLogRef.current('⚠️ Não é possível iniciar leitura');
      return;
    }

    isPollingRef.current = true;
    setIsPolling(true);
    setStatus('reading');
    addLogRef.current('▶ Iniciando leitura contínua (RPM, Velocidade, Temp, Voltagem, Combustível, Carga)...');

    const poll = async () => {
      if (!isPollingRef.current) return;
      
      await readVehicleData();
      
      if (isPollingRef.current) {
        pollingIntervalRef.current = window.setTimeout(poll, 600);
      }
    };

    poll();
  }, [status, readVehicleData]);

  const sendRawCommand = useCallback(async (command: string, timeout: number = 10000): Promise<string> => {
    return sendCommand(command, timeout);
  }, [sendCommand]);

  const value: OBDContextType = {
    status,
    isPolling,
    error,
    logs,
    vehicleData,
    detectedVehicle,
    connect,
    disconnect,
    startPolling,
    stopPolling,
    sendRawCommand,
    addLog,
    isSupported,
    hasLastDevice: !!deviceRef.current,
    reconnect,
  };

  return (
    <OBDContext.Provider value={value}>
      {children}
    </OBDContext.Provider>
  );
}
