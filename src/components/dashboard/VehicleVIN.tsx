import { useState } from 'react';
import { Car, Loader2, RefreshCw, MapPin, Calendar, Factory, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseVINResponse, decodeVIN, type VINInfo } from '@/lib/vinDecoder';

interface VehicleVINProps {
  sendCommand: (command: string, timeout?: number) => Promise<string>;
  isConnected: boolean;
  addLog: (message: string) => void;
}

export function VehicleVIN({ sendCommand, isConnected, addLog }: VehicleVINProps) {
  const [isReading, setIsReading] = useState(false);
  const [vinInfo, setVinInfo] = useState<VINInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readVIN = async () => {
    if (!isConnected) return;
    
    setIsReading(true);
    setError(null);
    
    try {
      addLog('🚗 Lendo VIN do veículo...');
      
      // Comando 09 02 = Modo 09 (informações do veículo), PID 02 (VIN)
      const response = await sendCommand('09 02', 10000);
      addLog(`📥 VIN RAW: "${response}"`);
      
      const vin = parseVINResponse(response);
      
      if (vin) {
        addLog(`✅ VIN: ${vin}`);
        const decoded = decodeVIN(vin);
        
        if (decoded) {
          setVinInfo(decoded);
          addLog(`🏭 ${decoded.manufacturer} (${decoded.country}) - Ano ${decoded.modelYear}`);
        } else {
          setError('Não foi possível decodificar o VIN');
        }
      } else {
        // Tentar método alternativo com headers
        addLog('⚠️ Tentando método alternativo...');
        
        await sendCommand('AT H1', 2000);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response2 = await sendCommand('09 02', 10000);
        addLog(`📥 VIN RAW (retry): "${response2}"`);
        
        const vin2 = parseVINResponse(response2);
        
        if (vin2) {
          addLog(`✅ VIN: ${vin2}`);
          const decoded = decodeVIN(vin2);
          if (decoded) {
            setVinInfo(decoded);
            addLog(`🏭 ${decoded.manufacturer} (${decoded.country}) - Ano ${decoded.modelYear}`);
          }
        } else {
          setError('VIN não disponível. O veículo pode não suportar este comando.');
          addLog('❌ VIN não disponível');
        }
        
        // Restaurar headers
        await sendCommand('AT H0', 2000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      addLog(`❌ Erro ao ler VIN: ${message}`);
    } finally {
      setIsReading(false);
    }
  };

  const handleReset = () => {
    setVinInfo(null);
    setError(null);
  };

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Identificação do Veículo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
        {!vinInfo && !error && (
          <>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Leia o VIN (Vehicle Identification Number) para identificar automaticamente o fabricante, país de origem e ano do modelo.
            </p>
            <Button
              onClick={readVIN}
              disabled={!isConnected || isReading}
              className="gap-2 min-h-[44px] touch-target"
            >
              {isReading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm sm:text-base">Lendo VIN...</span>
                </>
              ) : (
                <>
                  <Car className="h-4 w-4" />
                  <span className="text-sm sm:text-base">Ler VIN</span>
                </>
              )}
            </Button>
            
            {!isConnected && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Conecte-se ao scanner OBD-II primeiro.
              </p>
            )}
          </>
        )}

        {error && (
          <div className="space-y-3">
            <div className="p-2.5 sm:p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs sm:text-sm text-destructive">{error}</p>
            </div>
            <Button variant="outline" onClick={handleReset} className="gap-2 min-h-[44px] touch-target">
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm sm:text-base">Tentar Novamente</span>
            </Button>
          </div>
        )}

        {vinInfo && (
          <div className="space-y-3 sm:space-y-4">
            {/* VIN Display */}
            <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50 border">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">VIN</p>
              <p className="font-mono text-sm sm:text-lg font-semibold tracking-wider break-all">
                {vinInfo.vin}
              </p>
            </div>

            {/* Vehicle Info Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <Factory className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Fabricante</p>
                </div>
                <p className="font-semibold text-xs sm:text-sm truncate">{vinInfo.manufacturer}</p>
              </div>

              <div className="p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">País</p>
                </div>
                <p className="font-semibold text-xs sm:text-sm truncate">{vinInfo.country}</p>
              </div>

              <div className="p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Ano Modelo</p>
                </div>
                <p className="font-semibold text-xs sm:text-sm">{vinInfo.modelYear}</p>
              </div>

              <div className="p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Nº Série</p>
                </div>
                <p className="font-mono font-semibold text-xs sm:text-sm truncate">
                  {vinInfo.serialNumber || vinInfo.plantCode}
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={handleReset} className="gap-2 w-full min-h-[44px] touch-target">
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm sm:text-base">Ler Novamente</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
