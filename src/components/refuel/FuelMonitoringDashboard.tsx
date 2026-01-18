// Dashboard unificado de monitoramento de combustível em tempo real

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Fuel, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Settings, 
  Cloud, 
  FlaskConical,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Gauge,
} from 'lucide-react';
import { RefuelMode, RefuelFlowType, RefuelSettings, FuelTrimSample } from '@/types/refuelTypes';
import { FuelTrimChart } from './FuelTrimChart';
import { FuelGauge } from './FuelGauge';
import { O2SensorMonitor } from './O2SensorMonitor';
import { FuelTypeIndicator } from './FuelTypeIndicator';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState, useMemo } from 'react';
import type { O2SensorReading, FuelSystemStatus } from '@/types/fuelForensics';
import { FUEL_SYSTEM_LABELS } from '@/types/fuelForensics';
import { detectFuelType } from '@/services/fuel/FuelStateMachine';

interface FuelMonitoringDashboardProps {
  mode: RefuelMode;
  flowType: RefuelFlowType | null;
  distanceMonitored: number;
  currentSTFT: number | null;
  currentLTFT: number | null;
  currentO2: number | null;
  o2Readings: O2SensorReading[];
  o2FrozenDuration?: number;
  anomalyActive: boolean;
  anomalyDuration: number;
  fuelTrimHistory: FuelTrimSample[];
  settings: RefuelSettings;
  frozenSettings: RefuelSettings | null;
  isSyncing?: boolean;
  fuelSystemStatus?: FuelSystemStatus;
  isClosedLoopActive?: boolean;
  onCancel: () => void;
}

export function FuelMonitoringDashboard({
  mode,
  flowType,
  distanceMonitored,
  currentSTFT,
  currentLTFT,
  currentO2,
  o2Readings,
  o2FrozenDuration = 0,
  anomalyActive,
  anomalyDuration,
  fuelTrimHistory,
  settings,
  frozenSettings,
  isSyncing,
  fuelSystemStatus = 'closed_loop',
  isClosedLoopActive = true,
  onCancel,
}: FuelMonitoringDashboardProps) {
  const [showO2Monitor, setShowO2Monitor] = useState(true);
  const isQuickTest = flowType === 'quick-test';
  const activeSettings = frozenSettings || settings;
  const progress = (distanceMonitored / activeSettings.monitoringDistance) * 100;
  
  // Detectar tipo de combustível em tempo real
  const fuelTypeDetection = useMemo(() => {
    if (currentLTFT === null) return null;
    const stftSamples = fuelTrimHistory.map(s => s.stft);
    return detectFuelType(currentLTFT, stftSamples);
  }, [currentLTFT, fuelTrimHistory]);
  
  // Detectar se configurações mudaram durante monitoramento
  const settingsChanged = frozenSettings && 
    frozenSettings.monitoringDistance !== settings.monitoringDistance;

  type StatusColor = 'success' | 'warning' | 'danger' | 'muted';
  type TrendType = 'up' | 'down' | 'neutral';

  // Determinar status do STFT
  const getStatus = (value: number | null): { color: StatusColor; status: string; trend: TrendType } => {
    if (value === null) return { color: 'muted', status: 'Aguardando...', trend: 'neutral' };
    const abs = Math.abs(value);
    if (abs <= 10) return { color: 'success', status: 'Normal', trend: 'neutral' };
    if (abs <= activeSettings.stftWarningThreshold) return { color: 'warning', status: 'Elevado', trend: value > 0 ? 'up' : 'down' };
    return { color: 'danger', status: 'Crítico', trend: value > 0 ? 'up' : 'down' };
  };

  const stftStatus = getStatus(currentSTFT);
  const ltftStatus = getStatus(currentLTFT);

  // Explicação contextual
  const getExplanation = () => {
    if (currentSTFT === null) {
      return '⏳ Lendo sensor de oxigênio... O polling do dashboard foi pausado para garantir leituras precisas.';
    }
    
    const abs = Math.abs(currentSTFT);
    if (abs <= 5) {
      return '✅ Mistura ar/combustível está perfeita. Combustível de boa qualidade!';
    }
    if (abs <= 10) {
      return '✅ Pequena correção normal. O motor está funcionando bem.';
    }
    if (abs <= 15) {
      if (currentSTFT > 0) {
        return '⚠️ Motor está adicionando mais combustível. Pode indicar combustível com mais etanol.';
      }
      return '⚠️ Motor está reduzindo combustível. Verifique se não há vazamentos.';
    }
    if (currentSTFT > 0) {
      return '🔴 Correção muito alta! Combustível pode estar adulterado ou há problema mecânico.';
    }
    return '🔴 Correção muito baixa! Verifique pressão de combustível e bicos injetores.';
  };

  return (
    <Card className={cn(
      'border-2 transition-all duration-300',
      anomalyActive ? 'border-yellow-500 shadow-yellow-500/20 shadow-lg' : 
        isQuickTest ? 'border-blue-500/50' : 'border-primary/50'
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {isQuickTest ? (
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <FlaskConical className="h-5 w-5 text-blue-500" />
              </div>
            ) : (
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Fuel className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <span className="block">{isQuickTest ? 'Teste de Combustível' : 'Monitorando Abastecimento'}</span>
              {isSyncing && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-normal">
                  <Cloud className="h-3 w-3 animate-pulse" />
                  Sincronizando...
                </span>
              )}
            </div>
          </span>
          
          <div className="flex items-center gap-2">
            {anomalyActive ? (
              <Badge variant="destructive" className="animate-pulse gap-1">
                <AlertTriangle className="h-3 w-3" />
                Anomalia
              </Badge>
            ) : mode === 'analyzing' ? (
              <Badge variant="secondary" className="gap-1">
                <Activity className="h-3 w-3 animate-spin" />
                Processando
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-green-500/50 text-green-600">
                <Activity className="h-3 w-3" />
                Monitorando
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Aviso de Open Loop (motor frio ou aceleração) */}
        {!isClosedLoopActive && (
          <div className={cn(
            "p-3 rounded-lg border flex items-start gap-3",
            fuelSystemStatus === 'open_loop_cold' 
              ? "bg-orange-500/10 border-orange-500/50" 
              : fuelSystemStatus === 'open_loop_load'
                ? "bg-blue-500/10 border-blue-500/50"
                : "bg-red-500/10 border-red-500/50"
          )}>
            {fuelSystemStatus === 'open_loop_cold' ? (
              <Thermometer className="h-5 w-5 text-orange-500 shrink-0 mt-0.5 animate-pulse" />
            ) : fuelSystemStatus === 'open_loop_load' ? (
              <Gauge className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className={cn(
                "text-sm font-medium",
                fuelSystemStatus === 'open_loop_cold' ? "text-orange-600 dark:text-orange-400" :
                fuelSystemStatus === 'open_loop_load' ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
              )}>
                {FUEL_SYSTEM_LABELS[fuelSystemStatus]}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {fuelSystemStatus === 'open_loop_cold' 
                  ? 'Motor frio. Análise pausada até atingir temperatura de operação.'
                  : fuelSystemStatus === 'open_loop_load'
                    ? 'Aceleração forte detectada. Análise retoma ao estabilizar.'
                    : 'Problema detectado no sistema de combustível. Verifique DTCs.'
                }
              </div>
            </div>
          </div>
        )}
        
        {/* Indicador de configurações congeladas */}
        {settingsChanged && (
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center gap-2 text-xs">
            <Settings className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="text-blue-600 dark:text-blue-400">
              Configuração alterada. Esta sessão usa {frozenSettings?.monitoringDistance}km.
            </span>
          </div>
        )}
        
        {/* Progresso da distância */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              Progresso
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs">
                      Distância percorrida durante o monitoramento. 
                      A análise é concluída após {activeSettings.monitoringDistance} km.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span className="font-mono font-semibold">
              {distanceMonitored.toFixed(1)} / {activeSettings.monitoringDistance} km
            </span>
          </div>
          <div className="relative">
            <Progress value={Math.min(progress, 100)} className="h-3" />
            <div 
              className="absolute top-0 h-full w-1 bg-foreground/30"
              style={{ left: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {progress < 100 
              ? `Faltam ${(activeSettings.monitoringDistance - distanceMonitored).toFixed(1)} km para análise completa`
              : 'Finalizando análise...'
            }
          </p>
        </div>
        
        {/* Gauges de Fuel Trim */}
        <div className="grid grid-cols-2 gap-3">
          <FuelGauge
            label="STFT"
            sublabel="Curto Prazo"
            value={currentSTFT}
            status={stftStatus.color}
            statusText={stftStatus.status}
            trend={stftStatus.trend}
            thresholds={{
              warning: activeSettings.stftWarningThreshold,
              critical: activeSettings.stftCriticalThreshold,
            }}
          />
          <FuelGauge
            label="LTFT"
            sublabel="Longo Prazo"
            value={currentLTFT}
            status={ltftStatus.color}
            statusText={ltftStatus.status}
            trend={ltftStatus.trend}
            thresholds={{
              warning: activeSettings.stftWarningThreshold,
              critical: activeSettings.stftCriticalThreshold,
            }}
          />
        </div>
        
        {/* Indicador de tipo de combustível detectado */}
        {fuelTypeDetection && fuelTypeDetection.inferredType !== 'unknown' && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" />
              Combustível Detectado
            </div>
            <FuelTypeIndicator detection={fuelTypeDetection} showPercentage />
          </div>
        )}
        
        {/* Alerta de anomalia */}
        {anomalyActive && (
          <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 flex items-start gap-3 animate-pulse">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Correção Excessiva Detectada
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Duração: {anomalyDuration.toFixed(0)}s 
                {anomalyDuration >= activeSettings.anomalyDurationWarning 
                  ? ' — Alerta ativo!'
                  : ` / ${activeSettings.anomalyDurationWarning}s para alerta`
                }
              </div>
            </div>
          </div>
        )}
        
        {/* Explicação contextual */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {getExplanation()}
            </p>
          </div>
        </div>
        
        {/* Monitor O2 Sensor em tempo real */}
        {o2Readings.length > 0 && (
          <Collapsible open={showO2Monitor} onOpenChange={setShowO2Monitor}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="text-sm font-medium">Sensor O2 (Sonda Lambda)</span>
                {showO2Monitor ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <O2SensorMonitor
                currentO2={currentO2}
                o2Readings={o2Readings}
                frozenDuration={o2FrozenDuration}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Gráfico de Fuel Trim */}
        {fuelTrimHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Histórico da Sessão
            </h4>
            <FuelTrimChart 
              data={fuelTrimHistory} 
              warningThreshold={activeSettings.stftWarningThreshold}
            />
          </div>
        )}
        
        {/* Status final */}
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground border-t">
          {mode === 'analyzing' ? (
            <>
              <Activity className="h-4 w-4 animate-spin" />
              Processando resultados finais...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Sistema funcionando normalmente
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
