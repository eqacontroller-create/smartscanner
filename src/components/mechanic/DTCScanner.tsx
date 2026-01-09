import { useState } from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AllClearShield } from './AllClearShield';
import { DTCList } from './DTCList';
import { DTCModal } from './DTCModal';
import { parseDTCResponse, isNoErrorsResponse, type ParsedDTC } from '@/lib/dtcParser';

type ScanState = 'idle' | 'scanning' | 'clear' | 'errors';

interface DTCScannerProps {
  sendCommand: (command: string) => Promise<string>;
  isConnected: boolean;
  addLog: (message: string) => void;
}

export function DTCScanner({ sendCommand, isConnected, addLog }: DTCScannerProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [dtcs, setDtcs] = useState<ParsedDTC[]>([]);
  const [selectedDTC, setSelectedDTC] = useState<ParsedDTC | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleScan = async () => {
    if (!isConnected) return;

    setScanState('scanning');
    setDtcs([]);
    addLog('🔍 Iniciando scan de falhas (comando 03)...');

    try {
      const response = await sendCommand('03');
      addLog(`📥 Resposta DTCs: ${response.replace(/[\r\n]/g, ' ')}`);

      if (isNoErrorsResponse(response)) {
        addLog('✅ Nenhum código de erro encontrado');
        setScanState('clear');
        return;
      }

      const parsedDTCs = parseDTCResponse(response);
      
      if (parsedDTCs.length === 0) {
        addLog('✅ Nenhum código de erro encontrado');
        setScanState('clear');
      } else {
        addLog(`⚠️ ${parsedDTCs.length} código(s) encontrado(s): ${parsedDTCs.map(d => d.code).join(', ')}`);
        setDtcs(parsedDTCs);
        setScanState('errors');
      }
    } catch (error) {
      addLog(`❌ Erro ao escanear: ${error}`);
      setScanState('idle');
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

      {/* Results */}
      {scanState === 'clear' && <AllClearShield />}
      
      {scanState === 'errors' && (
        <DTCList dtcs={dtcs} onSelectDTC={handleSelectDTC} />
      )}

      {/* Modal */}
      <DTCModal 
        dtc={selectedDTC}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
