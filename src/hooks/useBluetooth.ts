import { useState, useCallback, useRef } from 'react';

const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const WRITE_CHARACTERISTIC_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';
const NOTIFY_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'initializing' | 'ready' | 'reading' | 'error';

interface BluetoothHookReturn {
  status: ConnectionStatus;
  rpm: number | null;
  error: string | null;
  logs: string[];
  connect: () => Promise<void>;
  disconnect: () => void;
  readRPM: () => Promise<void>;
  isSupported: boolean;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useBluetooth(): BluetoothHookReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [rpm, setRPM] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const writeCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const notifyCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const responseBufferRef = useRef<string>('');
  const responseResolverRef = useRef<((value: string) => void) | null>(null);

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

  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    writeCharRef.current = null;
    notifyCharRef.current = null;
    responseBufferRef.current = '';
    setStatus('disconnected');
    setRPM(null);
    addLogRef.current('🔌 Desconectado manualmente');
  }, []);

  const readRPM = useCallback(async () => {
    if (status !== 'ready') {
      addLogRef.current('⚠️ Scanner não está pronto');
      return;
    }

    try {
      setStatus('reading');
      addLogRef.current('📊 Lendo RPM (010C)...');
      
      const response = await sendCommand('010C', 5000);
      
      const cleanResponse = response.replace(/[\r\n>\s]/g, '').toUpperCase();
      addLogRef.current(`📊 Resposta: ${cleanResponse}`);
      
      const match = cleanResponse.match(/410C([0-9A-F]{2})([0-9A-F]{2})/);
      
      if (match) {
        const A = parseInt(match[1], 16);
        const B = parseInt(match[2], 16);
        const rpmValue = ((A * 256) + B) / 4;
        setRPM(Math.round(rpmValue));
        addLogRef.current(`✅ RPM: ${Math.round(rpmValue)}`);
      } else if (response === 'TIMEOUT') {
        addLogRef.current('⚠️ Timeout ao ler RPM');
      } else if (cleanResponse.includes('NODATA') || cleanResponse.includes('NO DATA')) {
        addLogRef.current('⚠️ Sem dados (motor desligado?)');
        setRPM(0);
      } else {
        addLogRef.current(`⚠️ Resposta não reconhecida`);
      }

      setStatus('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao ler RPM';
      addLogRef.current(`❌ Erro: ${message}`);
      setStatus('ready');
    }
  }, [status, sendCommand]);

  return {
    status,
    rpm,
    error,
    logs,
    connect,
    disconnect,
    readRPM,
    isSupported
  };
}
