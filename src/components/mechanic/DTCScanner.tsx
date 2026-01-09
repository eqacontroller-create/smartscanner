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
import { KNOWN_ECU_MODULES, type ECUModule } from '@/lib/ecuModules';

type ScanState = 'idle' | 'scanning' | 'clear' | 'errors';

interface DTCScannerProps {
  sendCommand: (command: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  addLog: (message: string) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

const createInitialSteps = (): ScanStep[] => [
  { id: 'bluetooth', label: 'Verificando conexão Bluetooth', status: 'pending' },
  { id: 'pause', label: 'Pausando leitura de dados', status: 'pending' },
  { id: 'headers', label: 'Ativando headers CAN', status: 'pending' },
  ...KNOWN_ECU_MODULES.map(m => ({
    id: m.id,
    label: `Escaneando ${m.shortName} (${m.name})`,
    status: 'pending' as const,
  })),
  { id: 'reset', label: 'Resetando comunicação', status: 'pending' },
  { id: 'process', label: 'Processando resultados', status: 'pending' },
];

export function DTCScanner({ sendCommand, isConnected, addLog, stopPolling, isPolling }: DTCScannerProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [dtcs, setDtcs] = useState<ParsedDTC[]>([]);
  const [selectedDTC, setSelectedDTC] = useState<ParsedDTC | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanSteps, setScanSteps] = useState<ScanStep[]>(createInitialSteps());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentModule, setCurrentModule] = useState<string>('');
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
    const cleaned = response.replace(/[\r\n\s]/g, '');
    if (!cleaned || cleaned === '>') return false;
    return /[0-9A-Fa-f]{2}/.test(cleaned) || 
           response.includes('NODATA') || 
           response.includes('NO DATA');
  };

  const scanModule = async (module: ECUModule): Promise<ParsedDTC[]> => {
    try {
      // Definir header de transmissão para este módulo
      addLog(`📡 AT SH ${module.txHeader} (${module.shortName})`);
      await sendCommand(`AT SH ${module.txHeader}`, 2000);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Definir filtro de recepção
      addLog(`📡 AT CRA ${module.rxFilter}`);
      await sendCommand(`AT CRA ${module.rxFilter}`, 2000);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Enviar comando 03 para ler DTCs
      addLog(`📤 Enviando 03 para ${module.shortName}...`);
      const response = await sendCommand('03', 5000);
      addLog(`📥 ${module.shortName}: "${response.replace(/[\r\n]/g, '\\n')}"`);

      // Verificar resposta
      if (!isValidResponse(response) || 
          response.includes('NODATA') || 
          response.includes('NO DATA') ||
          response.includes('UNABLE') ||
          response.includes('ERROR')) {
        addLog(`ℹ️ ${module.shortName}: Nenhum código ou módulo não responde`);
        return [];
      }

      if (isNoErrorsResponse(response)) {
        addLog(`✅ ${module.shortName}: Sem erros`);
        return [];
      }

      const parsedDTCs = parseDTCResponse(response);
      
      // Adicionar informação do módulo a cada DTC
      const dtcsWithModule = parsedDTCs.map(dtc => ({
        ...dtc,
        module,
      }));

      if (dtcsWithModule.length > 0) {
        addLog(`⚠️ ${module.shortName}: ${dtcsWithModule.length} código(s): ${dtcsWithModule.map(d => d.code).join(', ')}`);
      }

      return dtcsWithModule;
    } catch (error) {
      addLog(`❌ Erro ao escanear ${module.shortName}: ${error}`);
      return [];
    }
  };

  const handleScan = async () => {
    if (!isConnected) return;

    // Reset states
    setScanSteps(createInitialSteps());
    setElapsedTime(0);
    setScanState('scanning');
    setDtcs([]);
    setCurrentModule('');

    // Start timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    const allDTCs: ParsedDTC[] = [];

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
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      updateStep('pause', 'done');
      addLog('✅ Leitura de dados pausada');

      // Step 3: Ativar headers
      updateStep('headers', 'running');
      addLog('🔧 Ativando exibição de headers (AT H1)...');
      try {
        await sendCommand('AT H1', 2000);
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch {
        addLog('⚠️ AT H1 falhou, continuando...');
      }
      updateStep('headers', 'done');

      // Step 4: Escanear cada módulo
      for (let i = 0; i < KNOWN_ECU_MODULES.length; i++) {
        const module = KNOWN_ECU_MODULES[i];
        setCurrentModule(`${module.shortName} (${i + 1}/${KNOWN_ECU_MODULES.length})`);
        updateStep(module.id, 'running');
        
        const moduleDTCs = await scanModule(module);
        allDTCs.push(...moduleDTCs);
        
        updateStep(module.id, 'done');
        
        // Pequena pausa entre módulos
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Step 5: Resetar comunicação para broadcast
      updateStep('reset', 'running');
      addLog('🔄 Resetando para modo broadcast...');
      try {
        await sendCommand('AT H0', 2000);
        await sendCommand('AT SH 7DF', 2000);
        await sendCommand('AT CRA', 2000);
      } catch {
        addLog('⚠️ Reset falhou, mas scan concluído');
      }
      updateStep('reset', 'done');

      // Step 6: Processar resultados
      updateStep('process', 'running');
      setCurrentModule('');
      
      if (allDTCs.length === 0) {
        addLog('✅ Nenhum código de erro encontrado em nenhum módulo');
        updateStep('process', 'done');
        setScanState('clear');
      } else {
        addLog(`⚠️ Total: ${allDTCs.length} código(s) encontrado(s) em ${new Set(allDTCs.map(d => d.module?.id)).size} módulo(s)`);
        updateStep('process', 'done');
        setDtcs(allDTCs);
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
      setCurrentModule('');
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
            Escaneie os códigos de erro (DTCs) de <strong>todos os módulos</strong> do veículo: 
            Motor (ECM), Transmissão (TCM), Carroceria (BCM), ABS, Airbag (SRS) e Painel (IC).
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
                  {currentModule || 'Escaneando...'}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Escanear Todos os Módulos
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
