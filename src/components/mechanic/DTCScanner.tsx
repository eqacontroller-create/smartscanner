import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AllClearShield } from './AllClearShield';
import { DTCList } from './DTCList';
import { DTCModal } from './DTCModal';
import { OBDLimitations } from './OBDLimitations';
import { ScanProgress, type ScanStep } from './ScanProgress';
import { parseDTCResponse, parseUDSResponse, isNoErrorsResponse, isNegativeResponse, getNegativeResponseCode, type ParsedDTC } from '@/lib/dtcParser';
import { KNOWN_ECU_MODULES, ALTERNATIVE_ECU_ADDRESSES, UDS_STATUS_MASKS, type ECUModule } from '@/lib/ecuModules';

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
  { id: 'config', label: 'Configurando ELM327', status: 'pending' },
  { id: 'protocol', label: 'Verificando protocolo CAN', status: 'pending' },
  ...KNOWN_ECU_MODULES.map(m => ({
    id: m.id,
    label: `Escaneando ${m.shortName} (${m.name})`,
    status: 'pending' as const,
  })),
  { id: 'alternative', label: 'Escaneando endereços alternativos', status: 'pending' },
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

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Iniciar sessão diagnóstica UDS
  const startDiagnosticSession = async (): Promise<boolean> => {
    try {
      // Tentar Extended Diagnostic Session (10 03)
      addLog('📤 Iniciando sessão diagnóstica (10 03)...');
      const response = await sendCommand('10 03', 3000);
      
      if (response.includes('50 03') || response.includes('5003')) {
        addLog('✅ Sessão diagnóstica estendida iniciada');
        return true;
      }
      
      // Fallback para Default Session (10 01)
      addLog('📤 Tentando sessão default (10 01)...');
      const defaultResponse = await sendCommand('10 01', 3000);
      
      if (defaultResponse.includes('50 01') || defaultResponse.includes('5001')) {
        addLog('✅ Sessão diagnóstica default iniciada');
        return true;
      }
      
      addLog('⚠️ Sessão não confirmada, continuando mesmo assim');
      return false;
    } catch {
      addLog('⚠️ Falha ao iniciar sessão, continuando...');
      return false;
    }
  };

  // Enviar Tester Present para manter sessão ativa
  const sendTesterPresent = async () => {
    try {
      await sendCommand('3E 00', 1000);
    } catch {
      // Ignorar erros do tester present
    }
  };

  // Escanear módulo com protocolo avançado
  const scanModuleAdvanced = async (module: ECUModule): Promise<ParsedDTC[]> => {
    const allDTCs: ParsedDTC[] = [];
    
    try {
      // Definir header de transmissão para este módulo
      addLog(`📡 AT SH ${module.txHeader} (${module.shortName})`);
      await sendCommand(`AT SH ${module.txHeader}`, 2000);
      await delay(200);

      // Definir filtro de recepção
      addLog(`📡 AT CRA ${module.rxFilter}`);
      await sendCommand(`AT CRA ${module.rxFilter}`, 2000);
      await delay(200);

      // === PROTOCOLO 1: OBD-II Modo 03 (DTCs de emissão) ===
      addLog(`📤 [OBD-II] Enviando 03 para ${module.shortName}...`);
      const obd2Response = await sendCommand('03', 8000);
      addLog(`📥 [OBD-II] RAW: "${obd2Response.substring(0, 100)}"`);

      if (isValidResponse(obd2Response) && 
          !obd2Response.includes('NODATA') && 
          !obd2Response.includes('NO DATA') &&
          !obd2Response.includes('UNABLE') &&
          !obd2Response.includes('ERROR')) {
        
        if (!isNoErrorsResponse(obd2Response)) {
          const parsedOBD2 = parseDTCResponse(obd2Response);
          addLog(`📊 [OBD-II] ${parsedOBD2.length} código(s) encontrado(s)`);
          
          for (const dtc of parsedOBD2) {
            allDTCs.push({ ...dtc, module });
          }
        }
      }

      await delay(300);

      // === PROTOCOLO 2: UDS Serviço 19 02 (DTCs avançado) ===
      // Iniciar sessão diagnóstica primeiro
      await startDiagnosticSession();
      await delay(200);

      // Tentar múltiplos status masks em ordem de prioridade
      for (const statusInfo of UDS_STATUS_MASKS) {
        addLog(`📤 [UDS] 19 02 ${statusInfo.mask} (${statusInfo.description})...`);
        const udsResponse = await sendCommand(`19 02 ${statusInfo.mask}`, 10000);
        
        // Log apenas primeiros 100 chars para não poluir
        const logResponse = udsResponse.length > 100 ? udsResponse.substring(0, 100) + '...' : udsResponse;
        addLog(`📥 [UDS] RAW: "${logResponse}"`);

        // Verificar resposta negativa
        if (isNegativeResponse(udsResponse)) {
          const nrc = getNegativeResponseCode(udsResponse);
          addLog(`⚠️ [UDS] Resposta negativa: ${nrc}`);
          
          // Se for "Response Pending", esperar mais
          if (nrc?.includes('Pending')) {
            await delay(2000);
            continue;
          }
          
          // Se não suportado, não tentar outras máscaras
          if (nrc?.includes('Not Supported')) {
            break;
          }
          continue;
        }

        if (isValidResponse(udsResponse) && 
            !udsResponse.includes('NODATA') && 
            !udsResponse.includes('NO DATA')) {
          
          const parsedUDS = parseUDSResponse(udsResponse);
          
          if (parsedUDS.length > 0) {
            addLog(`📊 [UDS] ${parsedUDS.length} código(s) com mask ${statusInfo.mask}`);
            
            // Adicionar sem duplicatas
            for (const dtc of parsedUDS) {
              if (!allDTCs.some(existing => existing.code === dtc.code)) {
                allDTCs.push({ ...dtc, module });
              }
            }
            
            // Se encontrou DTCs, não precisa tentar outras máscaras
            break;
          }
        }

        // Manter sessão ativa
        await sendTesterPresent();
        await delay(200);
      }

      if (allDTCs.length > 0) {
        addLog(`⚠️ ${module.shortName}: ${allDTCs.length} DTC(s): ${allDTCs.map(d => d.code).join(', ')}`);
      } else {
        addLog(`✅ ${module.shortName}: Sem códigos`);
      }

      return allDTCs;
    } catch (error) {
      addLog(`❌ Erro em ${module.shortName}: ${error}`);
      return allDTCs;
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
      await delay(200);
      updateStep('bluetooth', 'done');

      // Step 2: Parar polling
      updateStep('pause', 'running');
      if (isPolling) {
        addLog('⏸️ Pausando leitura de dados...');
        stopPolling();
        await delay(1000);
      }
      updateStep('pause', 'done');

      // Step 3: Configurar ELM327 para scan avançado
      updateStep('config', 'running');
      addLog('🔧 Configurando ELM327...');
      
      try {
        // Timeout máximo do ELM327 (~1020ms)
        await sendCommand('AT ST FF', 2000);
        addLog('✅ AT ST FF - Timeout máximo configurado');
        
        // Desabilitar adaptive timing para respostas consistentes
        await sendCommand('AT AT 0', 2000);
        addLog('✅ AT AT 0 - Adaptive timing desabilitado');
        
        // Ativar headers CAN
        await sendCommand('AT H1', 2000);
        addLog('✅ AT H1 - Headers CAN ativados');
        
        // Permitir respostas longas (multi-frame)
        await sendCommand('AT AL', 2000);
        addLog('✅ AT AL - Respostas longas permitidas');
        
      } catch (e) {
        addLog(`⚠️ Configuração parcial: ${e}`);
      }
      updateStep('config', 'done');

      // Step 4: Verificar/definir protocolo CAN
      updateStep('protocol', 'running');
      addLog('🔍 Verificando protocolo CAN...');
      
      try {
        // Verificar protocolo atual
        const dpResponse = await sendCommand('AT DPN', 2000);
        addLog(`📡 Protocolo atual: ${dpResponse.replace(/[\r\n>]/g, '').trim()}`);
        
        // Se não for CAN 11bit 500k (6 ou A6), tentar forçar
        if (!dpResponse.includes('6') && !dpResponse.includes('A')) {
          addLog('📡 Tentando forçar protocolo CAN 11bit 500k (AT SP 6)...');
          await sendCommand('AT SP 6', 3000);
        }
      } catch {
        // Se falhar, usar auto-detect
        addLog('📡 Usando auto-detect de protocolo (AT SP 0)...');
        await sendCommand('AT SP 0', 2000);
      }
      updateStep('protocol', 'done');

      // Step 5: Escanear módulos padrão
      for (let i = 0; i < KNOWN_ECU_MODULES.length; i++) {
        const module = KNOWN_ECU_MODULES[i];
        setCurrentModule(`${module.shortName} (${i + 1}/${KNOWN_ECU_MODULES.length})`);
        updateStep(module.id, 'running');
        
        const moduleDTCs = await scanModuleAdvanced(module);
        allDTCs.push(...moduleDTCs);
        
        updateStep(module.id, 'done');
        await delay(300);
      }

      // Step 6: Escanear endereços alternativos de fabricantes
      updateStep('alternative', 'running');
      addLog('🔍 Escaneando endereços alternativos...');
      setCurrentModule('Endereços alternativos');
      
      // Escanear apenas alguns módulos alternativos principais
      const priorityAlternatives = ALTERNATIVE_ECU_ADDRESSES.slice(0, 6);
      
      for (const altModule of priorityAlternatives) {
        addLog(`📡 Tentando ${altModule.shortName}...`);
        
        try {
          await sendCommand(`AT SH ${altModule.txHeader}`, 2000);
          await sendCommand(`AT CRA ${altModule.rxFilter}`, 2000);
          await delay(200);
          
          // Tentar apenas UDS com mask 08 (mais rápido)
          const response = await sendCommand('19 02 08', 5000);
          
          if (isValidResponse(response) && 
              !response.includes('NODATA') && 
              !response.includes('NO DATA') &&
              !isNegativeResponse(response)) {
            
            const parsed = parseUDSResponse(response);
            
            for (const dtc of parsed) {
              if (!allDTCs.some(existing => existing.code === dtc.code)) {
                allDTCs.push({ ...dtc, module: altModule });
                addLog(`⚠️ ${altModule.shortName}: Encontrado ${dtc.code}`);
              }
            }
          }
        } catch {
          // Ignorar erros em endereços alternativos
        }
        
        await delay(100);
      }
      updateStep('alternative', 'done');

      // Step 7: Resetar comunicação
      updateStep('reset', 'running');
      addLog('🔄 Resetando para modo broadcast...');
      
      try {
        await sendCommand('AT H0', 2000);
        await sendCommand('AT SH 7DF', 2000);
        await sendCommand('AT CRA', 2000);
        await sendCommand('AT ST 32', 2000); // Reset timeout padrão
        await sendCommand('AT AT 1', 2000);  // Re-habilitar adaptive timing
      } catch {
        addLog('⚠️ Reset parcial');
      }
      updateStep('reset', 'done');

      // Step 8: Processar resultados
      updateStep('process', 'running');
      setCurrentModule('');
      
      if (allDTCs.length === 0) {
        addLog('✅ Nenhum código de erro encontrado');
        updateStep('process', 'done');
        setScanState('clear');
      } else {
        const uniqueModules = new Set(allDTCs.map(d => d.module?.id)).size;
        addLog(`⚠️ Total: ${allDTCs.length} DTC(s) em ${uniqueModules} módulo(s)`);
        updateStep('process', 'done');
        setDtcs(allDTCs);
        setScanState('errors');
      }
    } catch (error) {
      addLog(`❌ Erro no scan: ${error}`);
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
            Diagnóstico de Falhas (Avançado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Scan avançado multi-protocolo (OBD-II + UDS) com sessão diagnóstica e 
            endereços alternativos para máxima compatibilidade.
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
                  Scan Avançado
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
              Conecte-se ao scanner OBD-II primeiro.
            </p>
          )}
        </CardContent>
      </Card>

      {scanState === 'scanning' && (
        <ScanProgress steps={scanSteps} elapsedTime={elapsedTime} />
      )}

      {scanState === 'clear' && <AllClearShield />}
      
      {scanState === 'errors' && (
        <DTCList dtcs={dtcs} onSelectDTC={handleSelectDTC} />
      )}

      {(scanState === 'clear' || scanState === 'errors') && <OBDLimitations />}

      <DTCModal 
        dtc={selectedDTC}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
