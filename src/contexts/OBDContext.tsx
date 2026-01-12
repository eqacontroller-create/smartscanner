import React, { createContext, useCallback, useRef, useState, useEffect } from 'react';

const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const WRITE_CHARACTERISTIC_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';
const NOTIFY_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';

// Throttle de 200ms para atualização da UI
const UI_THROTTLE_MS = 200;

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

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  // Log helper
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  }, []);

  const addLogRef = useRef(addLog);
  addLogRef.current = addLog;

  // Throttled UI update - atualiza estado público apenas a cada 200ms
  useEffect(() => {
    const throttleInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastUIUpdateRef.current >= UI_THROTTLE_MS) {
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
    }, UI_THROTTLE_MS);

    return () => clearInterval(throttleInterval);
  }, []);

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
        optionalServices: [SERVICE_UUID]
      });

      deviceRef.current = device;
      addLogRef.current(`📱 Dispositivo: ${device.name || 'Desconhecido'}`);

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('disconnected');
        addLogRef.current('🔌 Dispositivo desconectado');
        writeCharRef.current = null;
        notifyCharRef.current = null;
        responseBufferRef.current = '';
        isReadingRef.current = false;
        // Reset vehicle data
        vehicleDataRef.current = defaultVehicleData;
        setVehicleData(defaultVehicleData);
      });

      addLogRef.current('🔗 Conectando ao GATT Server...');
      const server = await device.gatt?.connect();
      if (!server) throw new Error('Falha ao conectar ao GATT Server');
      addLogRef.current('✅ GATT conectado');

      addLogRef.current('🔍 Obtendo serviço...');
      const service = await server.getPrimaryService(SERVICE_UUID);
      addLogRef.current('✅ Serviço encontrado');

      addLogRef.current('🔍 Obtendo características...');
      const [writeChar, notifyChar] = await Promise.all([
        service.getCharacteristic(WRITE_CHARACTERISTIC_UUID),
        service.getCharacteristic(NOTIFY_CHARACTERISTIC_UUID)
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
        const vinInfo = parseVINFromResponse(vinResponse);
        if (vinInfo) {
          setDetectedVehicle(vinInfo);
          addLogRef.current(`✅ VIN detectado: ${vinInfo.vin} (${vinInfo.manufacturer || 'Fabricante desconhecido'})`);
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
      const service = await server.getPrimaryService(SERVICE_UUID);
      addLogRef.current('✅ Serviço encontrado');

      addLogRef.current('🔍 Re-obtendo características...');
      const [writeChar, notifyChar] = await Promise.all([
        service.getCharacteristic(WRITE_CHARACTERISTIC_UUID),
        service.getCharacteristic(NOTIFY_CHARACTERISTIC_UUID)
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

  // Read vehicle data from OBD
  const readVehicleData = useCallback(async (): Promise<boolean> => {
    if (!writeCharRef.current || isReadingRef.current) return false;

    isReadingRef.current = true;

    try {
      // Read RPM (PID 010C)
      try {
        const rpmResponse = await sendCommand('010C', 2500);
        const cleanRpm = rpmResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const rpmMatch = cleanRpm.match(/410C([0-9A-F]{2})([0-9A-F]{2})/);
        
        if (rpmMatch) {
          const A = parseInt(rpmMatch[1], 16);
          const B = parseInt(rpmMatch[2], 16);
          vehicleDataRef.current.rpm = Math.round(((A * 256) + B) / 4);
        } else if (cleanRpm.includes('NODATA')) {
          vehicleDataRef.current.rpm = 0;
        }
      } catch {
        addLogRef.current('⚠️ Erro lendo RPM');
      }

      await delay(50);

      // Read Speed (PID 010D)
      try {
        const speedResponse = await sendCommand('010D', 2500);
        const cleanSpeed = speedResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const speedMatch = cleanSpeed.match(/410D([0-9A-F]{2})/);
        
        if (speedMatch) {
          vehicleDataRef.current.speed = parseInt(speedMatch[1], 16);
        } else if (cleanSpeed.includes('NODATA')) {
          vehicleDataRef.current.speed = 0;
        }
      } catch {
        addLogRef.current('⚠️ Erro lendo velocidade');
      }

      await delay(50);

      // Read Coolant Temperature (PID 0105)
      try {
        const tempResponse = await sendCommand('0105', 2500);
        const cleanTemp = tempResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const tempMatch = cleanTemp.match(/4105([0-9A-F]{2})/);
        
        if (tempMatch) {
          vehicleDataRef.current.temperature = parseInt(tempMatch[1], 16) - 40;
        } else if (cleanTemp.includes('NODATA')) {
          vehicleDataRef.current.temperature = null;
        }
      } catch {
        addLogRef.current('⚠️ Erro lendo temperatura');
      }

      await delay(50);

      // Read Battery Voltage (PID 0142)
      try {
        const voltResponse = await sendCommand('0142', 2500);
        const cleanVolt = voltResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const voltMatch = cleanVolt.match(/4142([0-9A-F]{2})([0-9A-F]{2})/);
        
        if (voltMatch) {
          const A = parseInt(voltMatch[1], 16);
          const B = parseInt(voltMatch[2], 16);
          vehicleDataRef.current.voltage = Math.round(((A * 256) + B) / 1000 * 10) / 10;
        } else if (cleanVolt.includes('NODATA')) {
          vehicleDataRef.current.voltage = null;
        }
      } catch {
        addLogRef.current('⚠️ Erro lendo voltagem');
      }

      await delay(50);

      // Read Fuel Level (PID 012F)
      try {
        const fuelResponse = await sendCommand('012F', 2500);
        const cleanFuel = fuelResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const fuelMatch = cleanFuel.match(/412F([0-9A-F]{2})/);
        
        if (fuelMatch) {
          vehicleDataRef.current.fuelLevel = Math.round(parseInt(fuelMatch[1], 16) * 100 / 255);
        } else if (cleanFuel.includes('NODATA')) {
          vehicleDataRef.current.fuelLevel = null;
        }
      } catch {
        addLogRef.current('⚠️ Erro lendo nível de combustível');
      }

      await delay(50);

      // Read Engine Load (PID 0104)
      try {
        const loadResponse = await sendCommand('0104', 2500);
        const cleanLoad = loadResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const loadMatch = cleanLoad.match(/4104([0-9A-F]{2})/);
        
        if (loadMatch) {
          vehicleDataRef.current.engineLoad = Math.round(parseInt(loadMatch[1], 16) * 100 / 255);
        } else if (cleanLoad.includes('NODATA')) {
          vehicleDataRef.current.engineLoad = null;
        }
      } catch {
        addLogRef.current('⚠️ Erro lendo carga do motor');
      }

      return true;
    } catch {
      return false;
    } finally {
      isReadingRef.current = false;
    }
  }, [sendCommand]);

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

// VIN Parser helpers
function parseVINFromResponse(response: string): DetectedVehicleInfo | null {
  try {
    const lines = response.split(/[\r\n]+/).filter(line => line.trim());
    let hexData = '';
    
    for (const line of lines) {
      const clean = line.replace(/\s+/g, '').toUpperCase();
      
      if (clean.includes('NODATA') || clean.includes('ERROR') || 
          clean.includes('STOPPED') || clean.startsWith('7F') ||
          clean === '>' || clean.length < 4) {
        continue;
      }
      
      if (clean.includes('4902')) {
        const idx = clean.indexOf('4902');
        hexData += clean.substring(idx + 4);
      } else if (clean.match(/^[0-9A-F]+$/)) {
        hexData += clean;
      }
    }
    
    if (hexData.length < 34) return null;
    
    let vin = '';
    for (let i = 0; i < Math.min(hexData.length, 40); i += 2) {
      const byte = parseInt(hexData.substring(i, i + 2), 16);
      if (byte >= 32 && byte <= 126) {
        vin += String.fromCharCode(byte);
      }
    }
    
    vin = vin.replace(/[^A-Z0-9]/gi, '').substring(0, 17);
    
    if (vin.length !== 17) return null;
    
    const wmi = vin.substring(0, 3);
    const yearChar = vin.charAt(9);
    
    return {
      vin,
      manufacturer: getManufacturerFromWMI(wmi),
      modelYear: getYearFromVIN(yearChar),
      country: getCountryFromWMI(wmi),
    };
  } catch {
    return null;
  }
}

function getManufacturerFromWMI(wmi: string): string | null {
  const map: Record<string, string> = {
    '9BW': 'Volkswagen', '93W': 'Volkswagen', '3VW': 'Volkswagen', 'WVW': 'Volkswagen',
    '9BF': 'Ford', '1FA': 'Ford', '3FA': 'Ford', 'WF0': 'Ford',
    '9BG': 'Chevrolet', '1G1': 'Chevrolet', '3G1': 'Chevrolet',
    '93H': 'Honda', 'JHM': 'Honda', '1HG': 'Honda',
    '9BD': 'Fiat', 'ZFA': 'Fiat',
    '9BR': 'Toyota', 'JT2': 'Toyota', '4T1': 'Toyota',
    'KMH': 'Hyundai', '5NP': 'Hyundai',
    'VF1': 'Renault', '93Y': 'Renault',
    'JN1': 'Nissan', '1N4': 'Nissan',
    '1J4': 'Jeep', '1C4': 'Jeep',
    'WBA': 'BMW', 'WBS': 'BMW',
    'WDB': 'Mercedes-Benz', 'WDC': 'Mercedes-Benz',
    'WAU': 'Audi', 'WUA': 'Audi',
  };
  return map[wmi] || null;
}

function getYearFromVIN(char: string): string | null {
  const map: Record<string, string> = {
    'A': '2010', 'B': '2011', 'C': '2012', 'D': '2013', 'E': '2014',
    'F': '2015', 'G': '2016', 'H': '2017', 'J': '2018', 'K': '2019',
    'L': '2020', 'M': '2021', 'N': '2022', 'P': '2023', 'R': '2024',
    'S': '2025', 'T': '2026', 'V': '2027', 'W': '2028', 'X': '2029',
    'Y': '2030',
    '1': '2001', '2': '2002', '3': '2003', '4': '2004', '5': '2005',
    '6': '2006', '7': '2007', '8': '2008', '9': '2009',
  };
  return map[char.toUpperCase()] || null;
}

function getCountryFromWMI(wmi: string): string | null {
  const first = wmi.charAt(0).toUpperCase();
  const map: Record<string, string> = {
    '1': 'Estados Unidos', '2': 'Canadá', '3': 'México',
    '9': 'Brasil', 'J': 'Japão', 'K': 'Coreia do Sul',
    'W': 'Alemanha', 'V': 'França', 'Z': 'Itália',
    'S': 'Reino Unido', 'Y': 'Suécia/Finlândia',
  };
  return map[first] || null;
}
