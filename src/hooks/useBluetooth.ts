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

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  }, []);

  const handleNotification = useCallback((event: Event) => {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const decoder = new TextDecoder();
    const chunk = decoder.decode(value);
    
    // Acumular dados no buffer (respostas podem vir fragmentadas)
    responseBufferRef.current += chunk;
    
    addLog(`📥 Chunk: ${chunk.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}`);

    // Verificar se resposta está completa (prompt '>' indica fim)
    if (responseBufferRef.current.includes('>')) {
      const fullResponse = responseBufferRef.current;
      responseBufferRef.current = '';
      
      addLog(`✅ Resposta completa recebida`);
      
      if (responseResolverRef.current) {
        responseResolverRef.current(fullResponse);
        responseResolverRef.current = null;
      }
    }
  }, [addLog]);

  const sendCommand = useCallback(async (command: string, timeout: number = 5000): Promise<string> => {
    if (!writeCharRef.current) {
      throw new Error('Característica de escrita não disponível');
    }

    // Limpar buffer antes de enviar novo comando
    responseBufferRef.current = '';

    addLog(`📤 TX: ${command}`);
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
            addLog(`⚠️ Timeout com resposta parcial`);
            resolve(partialResponse);
          } else {
            resolve('TIMEOUT');
          }
        }
      }, timeout);
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
      addLog('🔍 Solicitando dispositivo Bluetooth...');

      // Usar acceptAllDevices para maior compatibilidade com ELM327
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID]
      });

      deviceRef.current = device;
      addLog(`📱 Dispositivo: ${device.name || 'Desconhecido'}`);

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('disconnected');
        addLog('🔌 Dispositivo desconectado');
        writeCharRef.current = null;
        notifyCharRef.current = null;
        responseBufferRef.current = '';
      });

      addLog('🔗 Conectando ao GATT Server...');
      const server = await device.gatt?.connect();
      if (!server) throw new Error('Falha ao conectar ao GATT Server');
      addLog('✅ GATT conectado');

      addLog('🔍 Obtendo serviço...');
      const service = await server.getPrimaryService(SERVICE_UUID);
      addLog('✅ Serviço encontrado');

      addLog('🔍 Obtendo características...');
      const [writeChar, notifyChar] = await Promise.all([
        service.getCharacteristic(WRITE_CHARACTERISTIC_UUID),
        service.getCharacteristic(NOTIFY_CHARACTERISTIC_UUID)
      ]);

      writeCharRef.current = writeChar;
      notifyCharRef.current = notifyChar;
      addLog('✅ Características obtidas');

      addLog('📡 Ativando notificações...');
      await notifyChar.startNotifications();
      notifyChar.addEventListener('characteristicvaluechanged', handleNotification);
      addLog('✅ Notificações ativas');

      // Delay antes de inicializar
      await delay(300);

      setStatus('initializing');
      addLog('🔧 Inicializando ELM327...');

      // AT Z - Reset do chip
      addLog('📡 AT Z (reset)...');
      await sendCommand('AT Z', 6000);
      
      // Delay maior após reset para chip estabilizar completamente
      addLog('⏳ Aguardando estabilização (1s)...');
      await delay(1000);

      // AT E0 - Desativar echo
      addLog('📡 AT E0 (desativar echo)...');
      await sendCommand('AT E0', 3000);
      await delay(200);

      // AT L0 - Desativar linefeeds
      addLog('📡 AT L0 (desativar linefeeds)...');
      await sendCommand('AT L0', 3000);
      await delay(200);

      // AT S0 - Desativar espaços
      addLog('📡 AT S0 (desativar espaços)...');
      await sendCommand('AT S0', 3000);
      await delay(200);

      // AT H0 - Desativar headers
      addLog('📡 AT H0 (desativar headers)...');
      await sendCommand('AT H0', 3000);
      await delay(200);

      // AT SP0 - Auto protocolo
      addLog('📡 AT SP0 (auto protocolo)...');
      await sendCommand('AT SP0', 5000);
      await delay(300);

      setStatus('ready');
      setError(null);
      addLog('✅ Scanner pronto!');

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setStatus('error');
      addLog(`❌ Erro: ${message}`);
    }
  }, [isSupported, addLog, sendCommand, handleNotification]);

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
    addLog('🔌 Desconectado manualmente');
  }, [addLog]);

  const readRPM = useCallback(async () => {
    if (status !== 'ready') {
      addLog('⚠️ Scanner não está pronto');
      return;
    }

    try {
      setStatus('reading');
      addLog('📊 Lendo RPM (010C)...');
      
      const response = await sendCommand('010C', 5000);
      
      // Limpar resposta
      const cleanResponse = response.replace(/[\r\n>\s]/g, '').toUpperCase();
      addLog(`📊 Resposta: ${cleanResponse}`);
      
      // Procurar padrão 410C seguido de dados
      const match = cleanResponse.match(/410C([0-9A-F]{2})([0-9A-F]{2})/);
      
      if (match) {
        const A = parseInt(match[1], 16);
        const B = parseInt(match[2], 16);
        const rpmValue = ((A * 256) + B) / 4;
        setRPM(Math.round(rpmValue));
        addLog(`✅ RPM: ${Math.round(rpmValue)}`);
      } else if (response === 'TIMEOUT') {
        addLog('⚠️ Timeout ao ler RPM');
      } else if (cleanResponse.includes('NODATA') || cleanResponse.includes('NO DATA')) {
        addLog('⚠️ Sem dados (motor desligado?)');
        setRPM(0);
      } else {
        addLog(`⚠️ Resposta não reconhecida`);
      }

      setStatus('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao ler RPM';
      addLog(`❌ Erro: ${message}`);
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
