import { useState, useCallback, useRef } from 'react';

const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const WRITE_CHARACTERISTIC_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';
const NOTIFY_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'initializing' | 'ready' | 'reading' | 'error';

interface VehicleData {
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

interface BluetoothHookReturn {
  status: ConnectionStatus;
  rpm: number | null;
  speed: number | null;
  temperature: number | null;
  voltage: number | null;
  fuelLevel: number | null;
  engineLoad: number | null;
  detectedVehicle: DetectedVehicleInfo | null;
  error: string | null;
  logs: string[];
  isPolling: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  startPolling: () => void;
  stopPolling: () => void;
  sendRawCommand: (command: string, timeout?: number) => Promise<string>;
  addLog: (message: string) => void;
  isSupported: boolean;
  reconnect: () => Promise<boolean>;
  hasLastDevice: boolean;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useBluetooth(): BluetoothHookReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [rpm, setRPM] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [voltage, setVoltage] = useState<number | null>(null);
  const [fuelLevel, setFuelLevel] = useState<number | null>(null);
  const [engineLoad, setEngineLoad] = useState<number | null>(null);
  const [detectedVehicle, setDetectedVehicle] = useState<DetectedVehicleInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const writeCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const notifyCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const responseBufferRef = useRef<string>('');
  const responseResolverRef = useRef<((value: string) => void) | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const isPollingRef = useRef(false);
  const isReadingRef = useRef(false);

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  // Usar ref para addLog para evitar dependências circulares
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  }, []);
  
  const addLogRef = useRef(addLog);
  addLogRef.current = addLog;

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

  const disconnect = useCallback(() => {
    stopPolling();
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    // Não limpa deviceRef para permitir reconexão
    writeCharRef.current = null;
    notifyCharRef.current = null;
    responseBufferRef.current = '';
    isReadingRef.current = false;
    setStatus('disconnected');
    setRPM(null);
    setSpeed(null);
    setTemperature(null);
    setVoltage(null);
    setFuelLevel(null);
    setEngineLoad(null);
    addLogRef.current('🔌 Desconectado manualmente');
  }, [stopPolling]);

  // Função de reconexão automática
  const reconnect = useCallback(async (): Promise<boolean> => {
    if (!deviceRef.current) {
      addLogRef.current('⚠️ Nenhum dispositivo anterior para reconectar');
      return false;
    }

    try {
      setStatus('connecting');
      setError(null);
      addLogRef.current('🔄 Tentando reconexão automática...');

      // Verificar se o GATT ainda está acessível
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

      // Re-inicializar ELM327 de forma rápida
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
    }
  }, [handleNotification, sendCommand]);

  const readVehicleData = useCallback(async (): Promise<boolean> => {
    if (!writeCharRef.current || isReadingRef.current) return false;

    isReadingRef.current = true;

    try {
      // Read RPM (PID 010C) - RPM = ((A * 256) + B) / 4
      try {
        const rpmResponse = await sendCommand('010C', 2500);
        const cleanRpm = rpmResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const rpmMatch = cleanRpm.match(/410C([0-9A-F]{2})([0-9A-F]{2})/);
        
        if (rpmMatch) {
          const A = parseInt(rpmMatch[1], 16);
          const B = parseInt(rpmMatch[2], 16);
          setRPM(Math.round(((A * 256) + B) / 4));
        } else if (cleanRpm.includes('NODATA')) {
          setRPM(0);
        }
      } catch (e) {
        addLogRef.current('⚠️ Erro lendo RPM');
      }

      await delay(50);

      // Read Speed (PID 010D) - km/h = A
      try {
        const speedResponse = await sendCommand('010D', 2500);
        const cleanSpeed = speedResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const speedMatch = cleanSpeed.match(/410D([0-9A-F]{2})/);
        
        if (speedMatch) {
          setSpeed(parseInt(speedMatch[1], 16));
        } else if (cleanSpeed.includes('NODATA')) {
          setSpeed(0);
        }
      } catch (e) {
        addLogRef.current('⚠️ Erro lendo velocidade');
      }

      await delay(50);

      // Read Coolant Temperature (PID 0105) - Celsius = A - 40
      try {
        const tempResponse = await sendCommand('0105', 2500);
        const cleanTemp = tempResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const tempMatch = cleanTemp.match(/4105([0-9A-F]{2})/);
        
        if (tempMatch) {
          setTemperature(parseInt(tempMatch[1], 16) - 40);
        } else if (cleanTemp.includes('NODATA')) {
          setTemperature(null);
        }
      } catch (e) {
        addLogRef.current('⚠️ Erro lendo temperatura');
      }

      await delay(50);

      // Read Battery Voltage (PID 0142) - Volts = ((A * 256) + B) / 1000
      try {
        const voltResponse = await sendCommand('0142', 2500);
        const cleanVolt = voltResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const voltMatch = cleanVolt.match(/4142([0-9A-F]{2})([0-9A-F]{2})/);
        
        if (voltMatch) {
          const A = parseInt(voltMatch[1], 16);
          const B = parseInt(voltMatch[2], 16);
          setVoltage(Math.round(((A * 256) + B) / 1000 * 10) / 10);
        } else if (cleanVolt.includes('NODATA')) {
          setVoltage(null);
        }
      } catch (e) {
        addLogRef.current('⚠️ Erro lendo voltagem');
      }

      await delay(50);

      // Read Fuel Level (PID 012F) - % = (A * 100) / 255
      try {
        const fuelResponse = await sendCommand('012F', 2500);
        const cleanFuel = fuelResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const fuelMatch = cleanFuel.match(/412F([0-9A-F]{2})/);
        
        if (fuelMatch) {
          setFuelLevel(Math.round(parseInt(fuelMatch[1], 16) * 100 / 255));
        } else if (cleanFuel.includes('NODATA')) {
          setFuelLevel(null); // Sensor não suportado
        }
      } catch (e) {
        addLogRef.current('⚠️ Erro lendo nível de combustível');
      }

      await delay(50);

      // Read Engine Load (PID 0104) - % = (A * 100) / 255
      try {
        const loadResponse = await sendCommand('0104', 2500);
        const cleanLoad = loadResponse.replace(/[\r\n>\s]/g, '').toUpperCase();
        const loadMatch = cleanLoad.match(/4104([0-9A-F]{2})/);
        
        if (loadMatch) {
          setEngineLoad(Math.round(parseInt(loadMatch[1], 16) * 100 / 255));
        } else if (cleanLoad.includes('NODATA')) {
          setEngineLoad(null);
        }
      } catch (e) {
        addLogRef.current('⚠️ Erro lendo carga do motor');
      }

      return true;
    } catch {
      return false;
    } finally {
      isReadingRef.current = false;
    }
  }, [sendCommand]);

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

  const sendRawCommand = async (command: string, timeout: number = 10000): Promise<string> => {
    return sendCommand(command, timeout);
  };

  return {
    status,
    rpm,
    speed,
    temperature,
    voltage,
    fuelLevel,
    engineLoad,
    detectedVehicle,
    error,
    logs,
    isPolling,
    connect,
    disconnect,
    startPolling,
    stopPolling,
    sendRawCommand,
    addLog,
    isSupported,
    reconnect,
    hasLastDevice: !!deviceRef.current,
  };
}

// Parser simples de VIN da resposta OBD-II (comando 0902)
function parseVINFromResponse(response: string): DetectedVehicleInfo | null {
  try {
    const lines = response.split(/[\r\n]+/).filter(line => line.trim());
    let hexData = '';
    
    for (const line of lines) {
      const clean = line.replace(/\s+/g, '').toUpperCase();
      
      // Ignorar erros e linhas inválidas
      if (clean.includes('NODATA') || clean.includes('ERROR') || 
          clean.includes('STOPPED') || clean.startsWith('7F') ||
          clean === '>' || clean.length < 4) {
        continue;
      }
      
      // Resposta Mode 09 PID 02: 49 02 [dados]
      if (clean.includes('4902')) {
        const idx = clean.indexOf('4902');
        hexData += clean.substring(idx + 4);
      } else if (clean.match(/^[0-9A-F]+$/)) {
        // Linha de continuação (dados hex puros)
        hexData += clean;
      }
    }
    
    if (hexData.length < 34) return null; // VIN tem 17 caracteres = 34 hex
    
    // Converter HEX para ASCII
    let vin = '';
    for (let i = 0; i < Math.min(hexData.length, 40); i += 2) {
      const byte = parseInt(hexData.substring(i, i + 2), 16);
      if (byte >= 32 && byte <= 126) { // Caracteres ASCII imprimíveis
        vin += String.fromCharCode(byte);
      }
    }
    
    // VIN deve ter exatamente 17 caracteres alfanuméricos
    vin = vin.replace(/[^A-Z0-9]/gi, '').substring(0, 17);
    
    if (vin.length !== 17) return null;
    
    // Decodificar informações básicas do VIN
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

// Mapeamento simplificado WMI -> Fabricante
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

// Ano do modelo pelo caractere da posição 10
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

// País de origem pelo primeiro caractere do WMI
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
