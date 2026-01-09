import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, RefreshCw, Car, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AllClearShield } from './AllClearShield';
import { DTCList } from './DTCList';
import { DTCModal } from './DTCModal';
import { OBDLimitations } from './OBDLimitations';
import { ScanProgress, type ScanStep } from './ScanProgress';
import { parseDTCResponse, parseUDSResponse, isNoErrorsResponse, isNegativeResponse, getNegativeResponseCode, type ParsedDTC } from '@/lib/dtcParser';
import { KNOWN_ECU_MODULES, getAlternativeAddressesForManufacturer, UDS_STATUS_MASKS, type ECUModule } from '@/lib/ecuModules';
import { parseVINResponse, decodeVIN, type VINInfo, type ManufacturerGroup } from '@/lib/vinDecoder';
import { useToast } from '@/hooks/use-toast';

type ScanState = 'idle' | 'scanning' | 'clearing' | 'clear' | 'errors';

interface DTCScannerProps {
  sendCommand: (command: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  addLog: (message: string) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

const createInitialSteps = (hasVIN: boolean): ScanStep[] => [
  { id: 'bluetooth', label: 'Verificando conexão Bluetooth', status: 'pending' },
  { id: 'pause', label: 'Pausando leitura de dados', status: 'pending' },
  ...(hasVIN ? [] : [{ id: 'vin', label: 'Detectando fabricante pelo VIN', status: 'pending' as const }]),
  { id: 'config', label: 'Configurando ELM327', status: 'pending' },
  { id: 'protocol', label: 'Verificando protocolo CAN', status: 'pending' },
  ...KNOWN_ECU_MODULES.map(m => ({
    id: m.id,
    label: `Escaneando ${m.shortName} (${m.name})`,
    status: 'pending' as const,
  })),
  { id: 'alternative', label: 'Escaneando endereços específicos do fabricante', status: 'pending' },
  { id: 'reset', label: 'Resetando comunicação', status: 'pending' },
  { id: 'process', label: 'Processando resultados', status: 'pending' },
];

export function DTCScanner({ sendCommand, isConnected, addLog, stopPolling, isPolling }: DTCScannerProps) {
  const { toast } = useToast();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [dtcs, setDtcs] = useState<ParsedDTC[]>([]);
  const [selectedDTC, setSelectedDTC] = useState<ParsedDTC | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanSteps, setScanSteps] = useState<ScanStep[]>(createInitialSteps(false));
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentModule, setCurrentModule] = useState<string>('');
  const [detectedVIN, setDetectedVIN] = useState<VINInfo | null>(null);
  const [isClearing, setIsClearing] = useState(false);
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

  // Detectar VIN e fabricante
  const detectManufacturer = async (): Promise<ManufacturerGroup> => {
    try {
      addLog('🚗 Detectando fabricante pelo VIN...');
      
      const response = await sendCommand('09 02', 8000);
      const vin = parseVINResponse(response);
      
      if (vin) {
        const decoded = decodeVIN(vin);
        if (decoded) {
          setDetectedVIN(decoded);
          addLog(`✅ VIN: ${vin}`);
          addLog(`🏭 Fabricante: ${decoded.manufacturer} (${decoded.manufacturerGroup})`);
          return decoded.manufacturerGroup;
        }
      }
      
      addLog('⚠️ VIN não disponível, usando endereços genéricos');
      return 'Other';
    } catch {
      addLog('⚠️ Falha ao ler VIN, usando endereços genéricos');
      return 'Other';
    }
  };

  // Limpar códigos de erro (comando 04)
  const handleClearDTCs = async () => {
    if (!isConnected) return;
    
    setIsClearing(true);
    addLog('🗑️ Iniciando limpeza de códigos de erro...');
    
    try {
      // Resetar para modo broadcast primeiro
      await sendCommand('AT SH 7DF', 2000);
      await sendCommand('AT CRA', 2000);
      
      // Comando 04 = Clear/Reset Emission-Related DTCs
      addLog('📤 Enviando comando 04 (Clear DTCs)...');
      const response = await sendCommand('04', 5000);
      addLog(`📥 Resposta: "${response}"`);
      
      // Verificar se foi aceito (resposta 44 = sucesso)
      if (response.includes('44')) {
        addLog('✅ Códigos de erro limpos com sucesso!');
        toast({
          title: "Códigos limpos!",
          description: "Os códigos de erro foram apagados. A luz do motor pode levar alguns ciclos para apagar.",
        });
        
        // Limpar estado e mostrar tela limpa
        setDtcs([]);
        setScanState('clear');
      } else if (response.includes('NODATA') || response.includes('NO DATA')) {
        addLog('⚠️ Nenhum código para limpar');
        toast({
          title: "Nenhum código",
          description: "Não havia códigos de erro para limpar.",
        });
        setDtcs([]);
        setScanState('clear');
      } else {
        addLog('⚠️ Resposta inesperada, verificando...');
        // Mesmo com resposta diferente, considerar sucesso se não houve erro
        toast({
          title: "Comando enviado",
          description: "O comando foi enviado. Faça um novo scan para verificar.",
          variant: "default",
        });
        setDtcs([]);
        setScanState('idle');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog(`❌ Erro ao limpar códigos: ${message}`);
      toast({
        title: "Erro",
        description: "Não foi possível limpar os códigos de erro.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
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
    const hasExistingVIN = detectedVIN !== null;
    setScanSteps(createInitialSteps(hasExistingVIN));
    setElapsedTime(0);
    setScanState('scanning');
    setDtcs([]);
    setCurrentModule('');
    
    let manufacturerGroup: ManufacturerGroup = detectedVIN?.manufacturerGroup || 'Other';

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

      // Step 2.5: Detectar VIN se ainda não temos
      if (!detectedVIN) {
        updateStep('vin', 'running');
        setCurrentModule('Lendo VIN...');
        manufacturerGroup = await detectManufacturer();
        updateStep('vin', 'done');
      } else {
        addLog(`🏭 Usando fabricante detectado: ${detectedVIN.manufacturer} (${manufacturerGroup})`);
      }

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

      // Step 6: Escanear endereços específicos do fabricante
      updateStep('alternative', 'running');
      
      // Obter endereços específicos para o fabricante detectado
      const alternativeModules = getAlternativeAddressesForManufacturer(manufacturerGroup);
      
      if (alternativeModules.length > 0) {
        addLog(`🔍 Escaneando ${alternativeModules.length} endereços específicos para ${manufacturerGroup}...`);
        setCurrentModule(`Endereços ${manufacturerGroup}`);
      } else {
        addLog('ℹ️ Sem endereços alternativos para este fabricante');
      }
      
      for (const altModule of alternativeModules) {
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
          {detectedVIN && (
            <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-primary" />
                <span className="font-medium">{detectedVIN.manufacturer}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{detectedVIN.modelYear}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-mono text-xs text-muted-foreground">{detectedVIN.vin}</span>
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mb-4">
            Scan avançado multi-protocolo (OBD-II + UDS) com detecção automática do fabricante 
            para usar endereços CAN otimizados.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleScan}
              disabled={!isConnected || scanState === 'scanning' || isClearing}
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

            {scanState === 'errors' && dtcs.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="gap-2"
                    disabled={isClearing}
                  >
                    {isClearing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Limpando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Limpar Códigos
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar códigos de erro?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Isso irá apagar <strong>{dtcs.length} código(s)</strong> de erro do veículo.
                      </p>
                      <p className="text-amber-600 dark:text-amber-400">
                        ⚠️ A luz do motor (check engine) será apagada, mas voltará se o problema persistir.
                      </p>
                      <p className="text-sm">
                        Importante: Limpar os códigos não resolve o problema, apenas apaga o registro. 
                        Se a falha persistir, os códigos retornarão.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearDTCs}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Limpar Códigos
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

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
        sendCommand={sendCommand}
        addLog={addLog}
      />
    </div>
  );
}
