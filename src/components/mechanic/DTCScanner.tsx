import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AllClearShield } from './AllClearShield';
import { DTCList } from './DTCList';
import { DTCModal } from './DTCModal';
import { OBDLimitations } from './OBDLimitations';
import { ScanProgress, type ScanStep } from './ScanProgress';
import { parseDTCResponse, isNoErrorsResponse, type ParsedDTC } from '@/lib/dtcParser';

type ScanState = 'idle' | 'scanning' | 'clear' | 'errors';

interface DTCScannerProps {
  sendCommand: (command: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  addLog: (message: string) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

const INITIAL_STEPS: ScanStep[] = [
  { id: 'bluetooth', label: 'Verificando conexão Bluetooth', status: 'pending' },
  { id: 'pause', label: 'Pausando leitura de dados', status: 'pending' },
  { id: 'reset', label: 'Resetando comunicação', status: 'pending' },
  { id: 'send', label: 'Enviando comando 03', status: 'pending' },
  { id: 'wait', label: 'Aguardando resposta da ECU', status: 'pending' },
  { id: 'process', label: 'Processando resultado', status: 'pending' },
];

export function DTCScanner({ sendCommand, isConnected, addLog, stopPolling, isPolling }: DTCScannerProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [dtcs, setDtcs] = useState<ParsedDTC[]>([]);
  const [selectedDTC, setSelectedDTC] = useState<ParsedDTC | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanSteps, setScanSteps] = useState<ScanStep[]>(INITIAL_STEPS);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const updateStep = (stepId: string, status: ScanStep['status']) => {
    setScanSteps(prev => prev.map(s => s.id === stepId ? { ...s, status } : s));
  };

  const isValidResponse = (response: string): boolean => {
    // Resposta deve conter algo além de espaços e deve ter terminado (contém > ou dados)
    const cleaned = response.replace(/[\r\n\s]/g, '');
    if (!cleaned || cleaned === '>') return false;
    // Válido se tem dados hexadecimais ou NODATA
    return /[0-9A-Fa-f]{2}/.test(cleaned) || 
           response.includes('NODATA') || 
           response.includes('NO DATA');
  };

  const handleScan = async () => {
    if (!isConnected) return;

    // Reset states
    setScanSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })));
    setElapsedTime(0);
    setScanState('scanning');
    setDtcs([]);

    // Start timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    try {
      // Step 1: Verificar conexão
      updateStep('bluetooth', 'running');
      addLog('🔗 Verificando conexão Bluetooth...');
      await new Promise(resolve => setTimeout(resolve, 200));
      updateStep('bluetooth', 'done');
      addLog('✅ Conexão Bluetooth ativa');

      // Step 2: Parar polling
      updateStep('pause', 'running');
      if (isPolling) {
        addLog('⏸️ Pausando leitura de RPM/velocidade/temperatura...');
        stopPolling();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aumentado para 1s
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      updateStep('pause', 'done');
      addLog('✅ Leitura de dados pausada');

      // Step 3: Resetar headers
      updateStep('reset', 'running');
      addLog('🔄 Resetando comunicação (AT SH 7DF)...');
      try {
        await sendCommand('AT SH 7DF', 2000);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch {
        addLog('⚠️ Reset opcional falhou, continuando...');
      }
      updateStep('reset', 'done');

      // Step 4 & 5: Enviar comando e aguardar
      updateStep('send', 'running');
      addLog('📤 Enviando comando 03 (ler DTCs do motor)...');
      await new Promise(resolve => setTimeout(resolve, 200));
      updateStep('send', 'done');
      
      updateStep('wait', 'running');
      addLog('⏳ Aguardando resposta da ECU (timeout: 10s)...');

      let response = '';
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        attempts++;
        response = await sendCommand('03', 10000);
        addLog(`📥 Tentativa ${attempts} - Resposta raw: "${response.replace(/[\r\n]/g, '\\n')}"`);

        if (isValidResponse(response)) {
          break;
        }

        if (attempts < maxAttempts) {
          addLog('⚠️ Resposta inválida, tentando novamente...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      updateStep('wait', 'done');

      // Step 6: Processar resultado
      updateStep('process', 'running');
      addLog('🔍 Analisando resposta...');

      // Verificar respostas de erro
      if (response.includes('UNABLE') || response.includes('ERROR') || response === 'TIMEOUT') {
        addLog('❌ Falha na comunicação com a ECU');
        updateStep('process', 'error');
        setScanState('idle');
        return;
      }

      if (isNoErrorsResponse(response) || response.includes('NODATA') || response.includes('NO DATA')) {
        addLog('✅ Nenhum código de erro do MOTOR encontrado');
        updateStep('process', 'done');
        setScanState('clear');
        return;
      }

      const parsedDTCs = parseDTCResponse(response);
      
      if (parsedDTCs.length === 0) {
        addLog('✅ Nenhum código de erro do MOTOR encontrado');
        updateStep('process', 'done');
        setScanState('clear');
      } else {
        addLog(`⚠️ ${parsedDTCs.length} código(s) encontrado(s): ${parsedDTCs.map(d => d.code).join(', ')}`);
        updateStep('process', 'done');
        setDtcs(parsedDTCs);
        setScanState('errors');
      }
    } catch (error) {
      addLog(`❌ Erro ao escanear: ${error}`);
      setScanState('idle');
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSelectDTC = (dtc: ParsedDTC) => {
    setSelectedDTC(dtc);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDTC(null);
  };

  const handleReset = () => {
    setScanState('idle');
    setDtcs([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Diagnóstico de Falhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Escaneie os códigos de erro (DTCs) armazenados na ECU do veículo. 
            O sistema irá identificar e explicar cada problema encontrado.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={handleScan}
              disabled={!isConnected || scanState === 'scanning'}
              className="gap-2"
            >
              {scanState === 'scanning' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Escaneando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Escanear Falhas
                </>
              )}
            </Button>

            {(scanState === 'clear' || scanState === 'errors') && (
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Novo Scan
              </Button>
            )}
          </div>

          {!isConnected && (
            <p className="text-sm text-muted-foreground mt-3">
              Conecte-se ao scanner OBD-II primeiro para escanear falhas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Scan Progress */}
      {scanState === 'scanning' && (
        <ScanProgress steps={scanSteps} elapsedTime={elapsedTime} />
      )}

      {/* Results */}
      {scanState === 'clear' && <AllClearShield />}
      
      {scanState === 'errors' && (
        <DTCList dtcs={dtcs} onSelectDTC={handleSelectDTC} />
      )}

      {/* Limitações do OBD-II */}
      {(scanState === 'clear' || scanState === 'errors') && <OBDLimitations />}

      {/* Modal */}
      <DTCModal 
        dtc={selectedDTC}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
