import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, RefreshCw, Car, Trash2, BatteryWarning, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { ScanHistory } from './ScanHistory';
import { DTCAlertBanner } from './DTCAlertBanner';
import { parseDTCResponse, parseUDSResponse, isNoErrorsResponse, isNegativeResponse, getNegativeResponseCode, type ParsedDTC } from '@/services/obd/DTCParser';
import { KNOWN_ECU_MODULES, getAlternativeAddressesForManufacturer, UDS_STATUS_MASKS, type ECUModule } from '@/lib/ecuModules';
import { parseVINResponse, decodeVIN, type VINInfo, type ManufacturerGroup } from '@/lib/vinDecoder';
import { saveScanResult, getRecentScans, compareScanResults } from '@/lib/scanHistory';
import { generateVoiceAlert, getDTCSeverity } from '@/lib/dtcNotifications';
import { generateDTCReportPDF, downloadPDF, type ScanAuditData } from '@/services/report/DTCScanReportService';
import { useToast } from '@/hooks/use-toast';

type ScanState = 'idle' | 'scanning' | 'clearing' | 'clear' | 'errors';

interface DTCScannerProps {
  sendCommand: (command: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  addLog: (message: string) => void;
  stopPolling: () => void;
  isPolling: boolean;
  onSpeakAlert?: (message: string) => void;
}

const createInitialSteps = (hasVIN: boolean): ScanStep[] => [
  { id: 'bluetooth', label: 'Verificando conexão Bluetooth', status: 'pending' },
  { id: 'pause', label: 'Pausando leitura de dados', status: 'pending' },
  { id: 'voltage', label: '🔋 Verificando voltagem da bateria', status: 'pending' }, // NOVO
  ...(hasVIN ? [] : [{ id: 'vin', label: 'Detectando fabricante pelo VIN', status: 'pending' as const }]),
  { id: 'config', label: 'Configurando ELM327 (timeout máximo)', status: 'pending' },
  { id: 'protocol', label: 'Verificando protocolo CAN', status: 'pending' },
  ...KNOWN_ECU_MODULES.map(m => ({
    id: m.id,
    label: `Escaneando ${m.shortName} (${m.name})`,
    status: 'pending' as const,
  })),
  { id: 'alternative', label: 'Escaneando endereços específicos do fabricante', status: 'pending' },
  { id: 'verify', label: '🔄 Re-verificando erros encontrados (Double Check)', status: 'pending' }, // NOVO
  { id: 'reset', label: 'Resetando comunicação', status: 'pending' },
  { id: 'process', label: 'Processando resultados', status: 'pending' },
];

export function DTCScanner({ sendCommand, isConnected, addLog, stopPolling, isPolling, onSpeakAlert }: DTCScannerProps) {
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
  const [scanStartTime, setScanStartTime] = useState(0);
  const [historyKey, setHistoryKey] = useState(0);
  const [scanComparison, setScanComparison] = useState<{ new: string[]; resolved: string[]; persistent: string[] } | null>(null);
  // NOVO: Estados para Low Voltage Warning
  const [lowVoltageWarning, setLowVoltageWarning] = useState(false);
  const [detectedVoltage, setDetectedVoltage] = useState<number | null>(null);
  // NOVO: Estados para auditoria/PDF
  const [discardedDTCs, setDiscardedDTCs] = useState<ParsedDTC[]>([]);
  const [initialDTCs, setInitialDTCs] = useState<ParsedDTC[]>([]);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
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

  // Limpar códigos de erro (OBD-II Modo 04 + UDS 14)
  const handleClearDTCs = async () => {
    if (!isConnected) return;
    
    setIsClearing(true);
    addLog('🗑️ Iniciando limpeza de códigos de erro...');
    
    try {
      // Parar polling se ativo para evitar conflito
      if (isPolling) {
        stopPolling();
        await delay(500);
      }
      
      // Resetar para modo broadcast primeiro
      await sendCommand('AT SH 7DF', 2000);
      await sendCommand('AT CRA', 2000);
      await delay(200);
      
      let obd2Success = false;
      let udsSuccess = false;
      
      // === MÉTODO 1: OBD-II Modo 04 (códigos de emissão) ===
      addLog('📤 Enviando OBD-II Clear (04)...');
      try {
        const obd2Response = await sendCommand('04', 5000);
        addLog(`📥 OBD-II: "${obd2Response.substring(0, 50)}"`);
        
        if (obd2Response.includes('44')) {
          obd2Success = true;
          addLog('✅ Códigos OBD-II limpos com sucesso');
        } else if (obd2Response.includes('NODATA') || obd2Response.includes('NO DATA')) {
          obd2Success = true;
          addLog('ℹ️ Nenhum código OBD-II para limpar');
        }
      } catch (e) {
        addLog(`⚠️ OBD-II Clear falhou: ${e}`);
      }
      
      await delay(300);
      
      // === MÉTODO 2: UDS Clear DTC (14 FF FF FF = todos os grupos) ===
      addLog('📤 Enviando UDS Clear (14 FF FF FF)...');
      try {
        // Iniciar sessão diagnóstica primeiro
        await startDiagnosticSession();
        await delay(200);
        
        const udsResponse = await sendCommand('14 FF FF FF', 5000);
        addLog(`📥 UDS: "${udsResponse.substring(0, 50)}"`);
        
        if (udsResponse.includes('54')) {
          udsSuccess = true;
          addLog('✅ Códigos UDS limpos com sucesso');
        } else if (udsResponse.includes('NODATA') || udsResponse.includes('NO DATA')) {
          udsSuccess = true;
          addLog('ℹ️ Nenhum código UDS para limpar');
        } else if (udsResponse.includes('7F')) {
          addLog('⚠️ ECU rejeitou comando UDS (pode não suportar)');
        }
      } catch (e) {
        addLog(`⚠️ UDS Clear falhou: ${e}`);
      }
      
      // Resetar comunicação
      await delay(200);
      await sendCommand('AT SH 7DF', 2000);
      await sendCommand('AT CRA', 2000);
      
      // Resultado
      if (obd2Success || udsSuccess) {
        addLog('✅ Limpeza concluída!');
        toast({
          title: "Códigos limpos!",
          description: "Os códigos de erro foram apagados. A luz do motor pode levar alguns ciclos para apagar.",
        });
        
        // Limpar estado e mostrar tela limpa
        setDtcs([]);
        setScanState('clear');
        
        // Fazer scan de verificação após 2 segundos
        addLog('🔄 Aguarde... verificando se os códigos foram limpos');
        await delay(2000);
        
        // Quick verification scan
        addLog('📤 Verificando códigos restantes (03)...');
        const verifyResponse = await sendCommand('03', 5000);
        
        if (isNoErrorsResponse(verifyResponse)) {
          addLog('✅ Verificação: Nenhum código restante');
        } else {
          const remaining = parseDTCResponse(verifyResponse);
          if (remaining.length > 0) {
            addLog(`⚠️ Verificação: ${remaining.length} código(s) persistente(s)`);
            toast({
              title: "Alguns códigos persistem",
              description: `${remaining.length} código(s) não puderam ser limpos. Pode haver uma falha ativa.`,
              variant: "default",
            });
          }
        }
        
      } else {
        addLog('⚠️ Resposta não confirmada, verifique com um novo scan');
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

  // ===== NOVO: Parsear resposta de voltagem (PID 01 42) =====
  const parseVoltageResponse = (response: string): number | null => {
    try {
      const clean = response.replace(/[\s\r\n>]/g, '').toUpperCase();
      
      // Formato: 4142XXYY onde XX e YY são os bytes de dados
      // Fórmula: ((A * 256) + B) / 1000
      const match = clean.match(/4142([0-9A-F]{2})([0-9A-F]{2})/);
      if (match) {
        const a = parseInt(match[1], 16);
        const b = parseInt(match[2], 16);
        return ((a * 256) + b) / 1000;
      }
      
      // Fallback: tentar parsear dados diretos
      const directMatch = clean.match(/([0-9A-F]{2})([0-9A-F]{2})$/);
      if (directMatch && clean.length >= 4) {
        const a = parseInt(directMatch[1], 16);
        const b = parseInt(directMatch[2], 16);
        const voltage = ((a * 256) + b) / 1000;
        if (voltage > 8 && voltage < 20) return voltage; // Sanity check
      }
      
      return null;
    } catch {
      return null;
    }
  };

  // ===== NOVO: Double Check - Re-verificar DTCs encontrados =====
  // Retorna { confirmed, discarded } para auditoria PDF
  const verifyDTCs = async (inputDTCs: ParsedDTC[]): Promise<{ confirmed: ParsedDTC[]; discarded: ParsedDTC[] }> => {
    if (inputDTCs.length === 0) return { confirmed: [], discarded: [] };
    
    addLogWithCapture('🔄 Iniciando Double Check (re-verificação de erros)...');
    
    // Agrupar DTCs por módulo
    const dtcsByModule = new Map<string, ParsedDTC[]>();
    for (const dtc of inputDTCs) {
      const moduleId = dtc.module?.id || 'unknown';
      if (!dtcsByModule.has(moduleId)) {
        dtcsByModule.set(moduleId, []);
      }
      dtcsByModule.get(moduleId)!.push(dtc);
    }
    
    const confirmed: ParsedDTC[] = [];
    const discarded: ParsedDTC[] = [];
    
    // Re-escanear APENAS os módulos que reportaram erros
    for (const [moduleId, moduleDTCs] of dtcsByModule) {
      const module = moduleDTCs[0].module;
      if (!module) {
        // DTCs sem módulo: confirmar diretamente (veio do broadcast)
        confirmed.push(...moduleDTCs);
        continue;
      }
      
      addLogWithCapture(`🔍 Re-verificando ${module.shortName}...`);
      setCurrentModule(`Verificando ${module.shortName}...`);
      
      try {
        // Re-configurar para este módulo
        await sendCommand(`AT SH ${module.txHeader}`, 2000);
        await sendCommand(`AT CRA ${module.rxFilter}`, 2000);
        await delay(300);
        
        // Ler DTCs novamente com timeout maior
        const verifyResponse = await sendCommand('03', 10000);
        const verifiedDTCs = parseDTCResponse(verifyResponse);
        
        // Confirmar apenas os que aparecem nas DUAS leituras
        for (const original of moduleDTCs) {
          if (verifiedDTCs.some(v => v.code === original.code)) {
            confirmed.push(original);
            addLogWithCapture(`✅ Confirmado: ${original.code}`);
          } else {
            discarded.push(original);
            addLogWithCapture(`🗑️ Descartado (ruído): ${original.code}`);
          }
        }
      } catch (e) {
        // Em caso de erro, manter os DTCs originais
        addLogWithCapture(`⚠️ Erro na verificação de ${module.shortName}, mantendo DTCs originais`);
        confirmed.push(...moduleDTCs);
      }
      
      await delay(200);
    }
    
    addLogWithCapture(`📊 Double Check: ${confirmed.length}/${inputDTCs.length} confirmados, ${discarded.length} descartados`);
    return { confirmed, discarded };
  };
  
  // Wrapper para capturar logs durante o scan
  const addLogWithCapture = (message: string) => {
    addLog(message);
    setScanLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
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
      // NOVO: Timeout aumentado para 12s (módulos lentos)
      addLog(`📤 [OBD-II] Enviando 03 para ${module.shortName}...`);
      const obd2Response = await sendCommand('03', 12000);
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
      // NOVO: Timeout aumentado para 15s (módulos lentos como ABS/Airbag)
      for (const statusInfo of UDS_STATUS_MASKS) {
        addLog(`📤 [UDS] 19 02 ${statusInfo.mask} (${statusInfo.description})...`);
        const udsResponse = await sendCommand(`19 02 ${statusInfo.mask}`, 15000);
        
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
    setLowVoltageWarning(false); // Reset warning
    setDetectedVoltage(null);    // Reset voltage
    // Reset estados de auditoria
    setDiscardedDTCs([]);
    setInitialDTCs([]);
    setScanLogs([]);
    
    let manufacturerGroup: ManufacturerGroup = detectedVIN?.manufacturerGroup || 'Other';
    setScanStartTime(Date.now());

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

      // ===== NOVO: Step 2.5 - Verificar voltagem (Pré-Scan) =====
      updateStep('voltage', 'running');
      setCurrentModule('Verificando bateria...');
      addLog('🔋 Verificando voltagem da bateria...');
      
      try {
        const voltageResponse = await sendCommand('01 42', 5000);
        const voltage = parseVoltageResponse(voltageResponse);
        
        if (voltage !== null) {
          setDetectedVoltage(voltage);
          addLog(`🔋 Voltagem: ${voltage.toFixed(1)}V`);
          
          if (voltage < 12.0) {
            setLowVoltageWarning(true);
            addLog('⚠️ ATENÇÃO: Bateria fraca pode gerar erros falsos!');
            
            toast({
              title: "⚠️ Bateria Fraca Detectada",
              description: `Voltagem: ${voltage.toFixed(1)}V. Isso pode gerar códigos de erro falsos em múltiplos módulos.`,
              variant: "destructive",
              duration: 10000,
            });
          } else {
            addLog(`✅ Voltagem OK: ${voltage.toFixed(1)}V`);
          }
        } else {
          addLog('⚠️ Não foi possível ler voltagem (PID 42 não suportado)');
        }
      } catch (e) {
        addLog('⚠️ Leitura de voltagem falhou, continuando...');
      }
      updateStep('voltage', 'done');

      // Step 3: Detectar VIN se ainda não temos
      if (!detectedVIN) {
        updateStep('vin', 'running');
        setCurrentModule('Lendo VIN...');
        manufacturerGroup = await detectManufacturer();
        updateStep('vin', 'done');
      } else {
        addLog(`🏭 Usando fabricante detectado: ${detectedVIN.manufacturer} (${manufacturerGroup})`);
      }

      // Step 4: Configurar ELM327 para scan avançado (Timeout Dinâmico)
      updateStep('config', 'running');
      addLog('🔧 Configurando ELM327 para scan profundo...');
      
      try {
        // *** TIMEOUT MÁXIMO - Crítico para módulos lentos (ABS, Airbag) ***
        await sendCommand('AT ST FF', 2000);
        addLog('✅ AT ST FF - Timeout MÁXIMO (1s por resposta)');
        
        // Desabilitar adaptive timing para consistência
        await sendCommand('AT AT 0', 2000);
        addLog('✅ AT AT 0 - Adaptive timing OFF');
        
        // Headers CAN ativados
        await sendCommand('AT H1', 2000);
        addLog('✅ AT H1 - Headers CAN ativados');
        
        // Respostas longas permitidas
        await sendCommand('AT AL', 2000);
        addLog('✅ AT AL - Respostas longas OK');
        
        // *** NOVO: Desabilitar DLC display para respostas mais limpas ***
        await sendCommand('AT D0', 2000);
        addLog('✅ AT D0 - DLC display OFF');
        
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

      // ===== NOVO: Step 7 - Double Check (Validação) =====
      // Deduplicar primeiro
      let uniqueDTCs: ParsedDTC[] = [];
      const seenCodes = new Set<string>();
      
      for (const dtc of allDTCs) {
        if (!seenCodes.has(dtc.code)) {
          seenCodes.add(dtc.code);
          uniqueDTCs.push(dtc);
        }
      }
      
      if (uniqueDTCs.length !== allDTCs.length) {
        addLog(`🔄 Removidas ${allDTCs.length - uniqueDTCs.length} duplicata(s)`);
      }
      
      // Double Check - Re-verificar erros encontrados
      // Salvar DTCs iniciais para auditoria
      setInitialDTCs([...uniqueDTCs]);
      
      if (uniqueDTCs.length > 0) {
        updateStep('verify', 'running');
        setCurrentModule('Re-verificando erros...');
        addLogWithCapture(`🔄 Iniciando Double Check para ${uniqueDTCs.length} código(s)...`);
        
        const verifyResult = await verifyDTCs(uniqueDTCs);
        
        // Salvar descartados para auditoria
        setDiscardedDTCs(verifyResult.discarded);
        
        if (verifyResult.confirmed.length < uniqueDTCs.length) {
          const discardedCount = verifyResult.discarded.length;
          addLogWithCapture(`🗑️ ${discardedCount} código(s) de ruído eliminado(s)`);
          
          toast({
            title: "🔍 Double Check Concluído",
            description: `${verifyResult.confirmed.length} erro(s) confirmado(s), ${discardedCount} ruído(s) eliminado(s)`,
            duration: 5000,
          });
        }
        
        uniqueDTCs = verifyResult.confirmed;
        updateStep('verify', 'done');
      } else {
        updateStep('verify', 'done');
      }

      // Step 8: Resetar comunicação
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

      // Step 9: Processar resultados
      updateStep('process', 'running');
      setCurrentModule('');
      
      // Calcular duração do scan
      const scanDuration = Date.now() - scanStartTime;
      const modulesCount = KNOWN_ECU_MODULES.length + alternativeModules.length;
      
      // Salvar resultado no histórico
      try {
        await saveScanResult(uniqueDTCs, detectedVIN, modulesCount, scanDuration);
        addLog('💾 Scan salvo no histórico');
        setHistoryKey(prev => prev + 1); // Atualizar histórico
        
        // === NOVO: Comparar com scan anterior e notificar ===
        const previousScans = await getRecentScans(2);
        
        if (previousScans.length >= 2) {
          const currentScan = previousScans[0];
          const previousScan = previousScans[1];
          
          const comparison = compareScanResults(previousScan, currentScan);
          setScanComparison(comparison);
          
          // Notificar sobre novos erros
          if (comparison.new.length > 0) {
            const hasCritical = comparison.new.some(code => getDTCSeverity(code) === 'critical');
            
            toast({
              title: `⚠️ ${comparison.new.length} Novo(s) Erro(s) Detectado(s)!`,
              description: comparison.new.slice(0, 5).join(', ') + (comparison.new.length > 5 ? ` +${comparison.new.length - 5}` : ''),
              variant: hasCritical ? 'destructive' : 'default',
              duration: 10000,
            });
            
            // Alerta de voz via Jarvis
            if (onSpeakAlert) {
              const voiceMessage = generateVoiceAlert(comparison.new, []);
              if (voiceMessage) {
                onSpeakAlert(voiceMessage);
              }
            }
            
            addLog(`🔔 Comparação: +${comparison.new.length} novo(s), -${comparison.resolved.length} resolvido(s)`);
          }
          
          // Notificar sobre erros resolvidos (separado para não sobrescrever)
          if (comparison.resolved.length > 0 && comparison.new.length === 0) {
            toast({
              title: `✅ ${comparison.resolved.length} Erro(s) Resolvido(s)!`,
              description: comparison.resolved.slice(0, 5).join(', '),
              duration: 8000,
            });
            
            // Alerta de voz positivo
            if (onSpeakAlert) {
              const voiceMessage = generateVoiceAlert([], comparison.resolved);
              if (voiceMessage) {
                onSpeakAlert(voiceMessage);
              }
            }
          }
        } else {
          setScanComparison(null);
        }
      } catch (e) {
        addLog('⚠️ Erro ao salvar histórico');
      }
      
      if (uniqueDTCs.length === 0) {
        addLog('✅ Nenhum código de erro encontrado');
        updateStep('process', 'done');
        setScanState('clear');
      } else {
        const uniqueModules = new Set(uniqueDTCs.map(d => d.module?.id)).size;
        addLog(`⚠️ Total: ${uniqueDTCs.length} DTC(s) em ${uniqueModules} módulo(s)`);
        updateStep('process', 'done');
        setDtcs(uniqueDTCs);
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
    setScanComparison(null);
    setLowVoltageWarning(false);
    setDetectedVoltage(null);
    // Reset auditoria
    setDiscardedDTCs([]);
    setInitialDTCs([]);
    setScanLogs([]);
  };

  // Exportar relatório PDF para auditoria mecânica
  const handleExportPDF = async () => {
    if (isExportingPDF) return;
    
    setIsExportingPDF(true);
    
    try {
      const auditData: ScanAuditData = {
        vin: detectedVIN,
        confirmedDTCs: dtcs,
        discardedDTCs: discardedDTCs,
        initialDTCs: initialDTCs,
        scanDate: new Date(scanStartTime),
        scanDurationMs: elapsedTime,
        modulesScanned: KNOWN_ECU_MODULES.length,
        protocolUsed: 'OBD-II + UDS',
        batteryVoltage: detectedVoltage,
        lowVoltageWarning: lowVoltageWarning,
        scanLogs: scanLogs,
      };
      
      const pdfBlob = await generateDTCReportPDF(auditData);
      
      // Gerar nome do arquivo
      const dateStr = new Date().toISOString().split('T')[0];
      const vinStr = detectedVIN?.vin?.slice(-6) || 'unknown';
      const filename = `relatorio-dtc-${vinStr}-${dateStr}.pdf`;
      
      downloadPDF(pdfBlob, filename);
      
      toast({
        title: "📄 Relatório Exportado",
        description: `${filename} salvo com sucesso!`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o relatório PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPDF(false);
    }
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
              <>
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Novo Scan
                </Button>
                
                {/* Botão de Exportar PDF */}
                <Button 
                  variant="secondary" 
                  onClick={handleExportPDF} 
                  disabled={isExportingPDF}
                  className="gap-2"
                >
                  {isExportingPDF ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Exportar PDF
                    </>
                  )}
                </Button>
              </>
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

      {/* ===== NOVO: Banner de aviso de bateria fraca ===== */}
      {lowVoltageWarning && (scanState === 'clear' || scanState === 'errors') && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <BatteryWarning className="h-5 w-5 text-yellow-500" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            <span className="font-semibold">⚠️ Bateria fraca detectada: {detectedVoltage?.toFixed(1)}V</span>
            <br />
            <span className="text-sm">
              Resultados podem incluir códigos falsos devido à queda de tensão. 
              Recomendamos recarregar a bateria e repetir o scan.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Banner de comparação com scan anterior */}
      {(scanState === 'clear' || scanState === 'errors') && scanComparison && (
        <DTCAlertBanner comparison={scanComparison} />
      )}

      {scanState === 'clear' && <AllClearShield />}
      
      {scanState === 'errors' && (
        <DTCList dtcs={dtcs} onSelectDTC={handleSelectDTC} />
      )}

      {(scanState === 'clear' || scanState === 'errors') && <OBDLimitations />}

      {/* Histórico de Scans */}
      <ScanHistory 
        key={historyKey}
        currentVIN={detectedVIN?.vin}
      />

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
