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
  const responseResolverRef = useRef<((value: string) => void) | null>(null);

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  }, []);

  const handleNotification = useCallback((event: Event) => {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const decoder = new TextDecoder();
    const response = decoder.decode(value).trim();
    addLog(`RX: ${response}`);

    if (responseResolverRef.current) {
      responseResolverRef.current(response);
      responseResolverRef.current = null;
    }
  }, [addLog]);

  const sendCommand = useCallback(async (command: string): Promise<string> => {
    if (!writeCharRef.current) {
      throw new Error('Característica de escrita não disponível');
    }

    addLog(`TX: ${command}`);
    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\r');
    
    const responsePromise = new Promise<string>((resolve) => {
      responseResolverRef.current = resolve;
      setTimeout(() => {
        if (responseResolverRef.current === resolve) {
          responseResolverRef.current = null;
          resolve('TIMEOUT');
        }
      }, 3000);
    });

    await writeCharRef.current.writeValue(data);
    return responsePromise;
  }, [addLog]);

  const connect = useCallback(async () => {
    if (!isSupported) {
      setError('Web Bluetooth não é suportado neste navegador');
      return;
    }

    try {
      setStatus('connecting');
      setError(null);
      addLog('Solicitando dispositivo Bluetooth...');

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID]
      });

      deviceRef.current = device;
      addLog(`Dispositivo encontrado: ${device.name || 'Desconhecido'}`);

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('disconnected');
        addLog('Dispositivo desconectado');
        writeCharRef.current = null;
        notifyCharRef.current = null;
      });

      addLog('Conectando ao GATT Server...');
      const server = await device.gatt?.connect();
      if (!server) throw new Error('Falha ao conectar ao GATT Server');

      addLog('Obtendo serviço...');
      const service = await server.getPrimaryService(SERVICE_UUID);

      addLog('Obtendo características...');
      const [writeChar, notifyChar] = await Promise.all([
        service.getCharacteristic(WRITE_CHARACTERISTIC_UUID),
        service.getCharacteristic(NOTIFY_CHARACTERISTIC_UUID)
      ]);

      writeCharRef.current = writeChar;
      notifyCharRef.current = notifyChar;

      addLog('Ativando notificações...');
      await notifyChar.startNotifications();
      notifyChar.addEventListener('characteristicvaluechanged', handleNotification);

      setStatus('initializing');
      addLog('Inicializando ELM327...');

      // Send AT Z (reset)
      addLog('Enviando AT Z (reset)...');
      await sendCommand('AT Z');
      
      // Delay de 500ms para garantir que o chip reinicialize
      addLog('Aguardando 500ms para reinicialização...');
      await delay(500);

      // Send AT SP0 (auto protocol)
      addLog('Enviando AT SP0 (auto protocolo)...');
      await sendCommand('AT SP0');

      setStatus('ready');
      addLog('Scanner pronto!');

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setStatus('error');
      addLog(`Erro: ${message}`);
    }
  }, [isSupported, addLog, sendCommand, handleNotification]);

  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    writeCharRef.current = null;
    notifyCharRef.current = null;
    setStatus('disconnected');
    setRPM(null);
    addLog('Desconectado manualmente');
  }, [addLog]);

  const readRPM = useCallback(async () => {
    if (status !== 'ready') {
      addLog('Scanner não está pronto');
      return;
    }

    try {
      setStatus('reading');
      const response = await sendCommand('010C');
      
      // Parse OBD-II response
      // Expected format: "41 0C XX YY" or similar
      const cleanResponse = response.replace(/\s/g, '').toUpperCase();
      
      // Look for 410C pattern followed by data bytes
      const match = cleanResponse.match(/410C([0-9A-F]{2})([0-9A-F]{2})/);
      
      if (match) {
        const A = parseInt(match[1], 16);
        const B = parseInt(match[2], 16);
        const rpmValue = ((A * 256) + B) / 4;
        setRPM(Math.round(rpmValue));
        addLog(`RPM calculado: ${Math.round(rpmValue)}`);
      } else if (response === 'TIMEOUT') {
        addLog('Timeout ao ler RPM');
      } else {
        addLog(`Resposta não reconhecida: ${response}`);
      }

      setStatus('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao ler RPM';
      addLog(`Erro: ${message}`);
      setStatus('ready');
    }
  }, [status, sendCommand, addLog]);

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
