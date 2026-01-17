// Card de monitoramento de qualidade de combustível em tempo real
// Suporta dois fluxos: Abastecimento completo e Teste Rápido

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Fuel, Activity, AlertTriangle, CheckCircle2, Settings, Cloud, FlaskConical, Thermometer, Gauge } from 'lucide-react';
import { RefuelMode, RefuelFlowType, RefuelSettings } from '@/types/refuelTypes';
import type { FuelSystemStatus } from '@/types/fuelForensics';
import { FUEL_SYSTEM_LABELS } from '@/types/fuelForensics';
import { FuelTrimChart } from './FuelTrimChart';
import { cn } from '@/lib/utils';

interface FuelQualityMonitorProps {
  mode: RefuelMode;
  flowType?: RefuelFlowType | null;
  distanceMonitored: number;
  currentSTFT: number | null;
  currentLTFT: number | null;
  anomalyActive: boolean;
  anomalyDuration: number;
  fuelTrimHistory: Array<{ timestamp: number; stft: number; ltft: number; distance: number }>;
  settings: RefuelSettings;
  frozenSettings?: RefuelSettings | null;
  isSyncing?: boolean;
  fuelSystemStatus?: FuelSystemStatus;
  isClosedLoopActive?: boolean;
}

export function FuelQualityMonitor({
  mode,
  flowType,
  distanceMonitored,
  currentSTFT,
  currentLTFT,
  anomalyActive,
  anomalyDuration,
  fuelTrimHistory,
  settings,
  frozenSettings,
  isSyncing,
  fuelSystemStatus = 'closed_loop',
  isClosedLoopActive = true,
}: FuelQualityMonitorProps) {
  if (mode !== 'monitoring' && mode !== 'analyzing') return null;
  
  const isQuickTest = flowType === 'quick-test';
  
  // CORREÇÃO v2: Usar settings congelados se disponíveis (durante monitoramento)
  const activeSettings = frozenSettings || settings;
  const progress = (distanceMonitored / activeSettings.monitoringDistance) * 100;
  
  // Detectar se configurações mudaram durante monitoramento
  const settingsChanged = frozenSettings && 
    frozenSettings.monitoringDistance !== settings.monitoringDistance;
  
  // Determinar cor do STFT
  const getSTFTStatus = (value: number | null) => {
    if (value === null) return { color: 'text-muted-foreground', status: 'Lendo...' };
    const abs = Math.abs(value);
    if (abs <= 10) return { color: 'text-green-500', status: 'Normal' };
    if (abs <= activeSettings.stftWarningThreshold) return { color: 'text-yellow-500', status: 'Elevado' };
    return { color: 'text-red-500', status: 'Crítico' };
  };
  
  const stftStatus = getSTFTStatus(currentSTFT);
  const ltftStatus = getSTFTStatus(currentLTFT);
  
  return (
    <Card className={cn(
      'border-2 transition-colors duration-300',
      anomalyActive ? 'border-yellow-500 animate-pulse' : 
        isQuickTest ? 'border-blue-500/30' : 'border-primary/30'
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {isQuickTest ? (
              <FlaskConical className="h-5 w-5 text-blue-500" />
            ) : (
              <Fuel className="h-5 w-5 text-primary" />
            )}
            {isQuickTest ? 'Teste de Combustível' : 'Hora do Posto'}
            {isSyncing && (
              <Cloud className="h-4 w-4 text-muted-foreground animate-pulse" />
            )}
          </span>
          <div className="flex items-center gap-1">
            {isQuickTest && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <FlaskConical className="h-3 w-3" />
                Rápido
              </Badge>
            )}
            {anomalyActive ? (
              <Badge variant="destructive" className="animate-pulse gap-1">
                <AlertTriangle className="h-3 w-3" />
                Anomalia
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Activity className="h-3 w-3" />
                Analisando
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Aviso de Open Loop (motor frio, aceleração, etc) */}
        {!isClosedLoopActive && (
          <div className={cn(
            "p-2 rounded-lg border flex items-center gap-2 text-sm animate-pulse",
            fuelSystemStatus === 'open_loop_cold' 
              ? "bg-orange-500/10 border-orange-500/50 text-orange-600 dark:text-orange-400" 
              : fuelSystemStatus === 'open_loop_load'
                ? "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400"
                : "bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400"
          )}>
            {fuelSystemStatus === 'open_loop_cold' && (
              <Thermometer className="h-4 w-4 animate-pulse shrink-0" />
            )}
            {fuelSystemStatus === 'open_loop_load' && (
              <Gauge className="h-4 w-4 shrink-0" />
            )}
            {fuelSystemStatus !== 'open_loop_cold' && fuelSystemStatus !== 'open_loop_load' && (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span className="text-xs">{FUEL_SYSTEM_LABELS[fuelSystemStatus]} - Leitura pausada</span>
          </div>
        )}
        
        {/* Indicador de configurações congeladas */}
        {settingsChanged && (
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center gap-2 text-xs">
            <Settings className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="text-blue-600 dark:text-blue-400">
              Configuração alterada para {settings.monitoringDistance}km. 
              Esta sessão usa {frozenSettings?.monitoringDistance}km.
            </span>
          </div>
        )}
        
        {/* Progresso da distância */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Distância Monitorada</span>
            <span className="font-mono font-medium">
              {distanceMonitored.toFixed(1)} / {activeSettings.monitoringDistance} km
            </span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
        </div>
        
        {/* Fuel Trim atual */}
        <div className="grid grid-cols-2 gap-3">
          {/* STFT */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>STFT (Curto Prazo)</span>
              <span className={stftStatus.color}>{stftStatus.status}</span>
            </div>
            <div className={cn('text-2xl font-mono font-bold', stftStatus.color)}>
              {currentSTFT !== null ? `${currentSTFT > 0 ? '+' : ''}${currentSTFT}%` : '--'}
            </div>
            {/* Barra visual */}
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/30" />
              {currentSTFT !== null && (
                <div 
                  className={cn(
                    'absolute inset-y-0 transition-all duration-300',
                    currentSTFT >= 0 ? 'left-1/2' : 'right-1/2',
                    stftStatus.color.replace('text-', 'bg-')
                  )}
                  style={{ 
                    width: `${Math.min(Math.abs(currentSTFT), 50)}%`,
                  }}
                />
              )}
            </div>
          </div>
          
          {/* LTFT */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>LTFT (Longo Prazo)</span>
              <span className={ltftStatus.color}>{ltftStatus.status}</span>
            </div>
            <div className={cn('text-2xl font-mono font-bold', ltftStatus.color)}>
              {currentLTFT !== null ? `${currentLTFT > 0 ? '+' : ''}${currentLTFT}%` : '--'}
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/30" />
              {currentLTFT !== null && (
                <div 
                  className={cn(
                    'absolute inset-y-0 transition-all duration-300',
                    currentLTFT >= 0 ? 'left-1/2' : 'right-1/2',
                    ltftStatus.color.replace('text-', 'bg-')
                  )}
                  style={{ 
                    width: `${Math.min(Math.abs(currentLTFT), 50)}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Alerta de anomalia */}
        {anomalyActive && (
          <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-500">Correção Excessiva Detectada</div>
              <div className="text-xs text-muted-foreground">
                Duração: {anomalyDuration.toFixed(0)}s / {activeSettings.anomalyDurationWarning}s para alerta
              </div>
            </div>
          </div>
        )}
        
        {/* Gráfico de Fuel Trim */}
        {fuelTrimHistory.length > 0 && (
          <FuelTrimChart 
            data={fuelTrimHistory} 
            warningThreshold={activeSettings.stftWarningThreshold}
          />
        )}
        
        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {mode === 'analyzing' ? (
            <>
              <Activity className="h-4 w-4 animate-spin" />
              Processando resultados...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Monitorando adaptação de combustível...
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
