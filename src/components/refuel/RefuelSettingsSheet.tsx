// Sheet de configurações do modo abastecimento

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings2, 
  Fuel, 
  Gauge, 
  AlertTriangle, 
  Timer, 
  RotateCcw,
  Info
} from 'lucide-react';
import { RefuelSettings, defaultRefuelSettings } from '@/types/refuelTypes';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RefuelSettingsSheetProps {
  settings: RefuelSettings;
  onSettingsChange: (settings: Partial<RefuelSettings>) => void;
  onReset: () => void;
  trigger?: React.ReactNode;
}

export function RefuelSettingsSheet({
  settings,
  onSettingsChange,
  onReset,
  trigger,
}: RefuelSettingsSheetProps) {
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<RefuelSettings>(settings);
  
  // Sincronizar quando sheet abrir
  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [open, settings]);
  
  const handleSave = () => {
    onSettingsChange(localSettings);
    setOpen(false);
  };
  
  const handleReset = () => {
    setLocalSettings(defaultRefuelSettings);
    onReset();
  };
  
  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);
  const isDefault = JSON.stringify(localSettings) === JSON.stringify(defaultRefuelSettings);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings2 className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            Configurações de Abastecimento
          </SheetTitle>
          <SheetDescription>
            Ajuste os parâmetros de monitoramento de qualidade de combustível.
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-6">
          {/* Capacidade do Tanque */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                Capacidade do Tanque
              </Label>
              <Badge variant="outline" className="font-mono">
                {localSettings.tankCapacity}L
              </Badge>
            </div>
            <Slider
              value={[localSettings.tankCapacity]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, tankCapacity: value }))}
              min={30}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>30L</span>
              <span>100L</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Distância de Monitoramento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                Distância de Monitoramento
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Quantos km rodar após abastecer para analisar a qualidade do combustível.
                        Valores maiores são mais precisos.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Badge variant="outline" className="font-mono">
                {localSettings.monitoringDistance} km
              </Badge>
            </div>
            <Slider
              value={[localSettings.monitoringDistance]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, monitoringDistance: value }))}
              min={2}
              max={15}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2 km (rápido)</span>
              <span>15 km (preciso)</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Thresholds de STFT */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Limites de Fuel Trim (STFT)
            </Label>
            
            {/* Warning Threshold */}
            <div className="space-y-2 pl-4 border-l-2 border-yellow-500/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-600 dark:text-yellow-400">Alerta (amarelo)</span>
                <Badge variant="outline" className="font-mono bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                  ±{localSettings.stftWarningThreshold}%
                </Badge>
              </div>
              <Slider
                value={[localSettings.stftWarningThreshold]}
                onValueChange={([value]) => {
                  // Warning não pode ser maior que Critical
                  if (value < localSettings.stftCriticalThreshold) {
                    setLocalSettings(prev => ({ ...prev, stftWarningThreshold: value }));
                  }
                }}
                min={5}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Critical Threshold */}
            <div className="space-y-2 pl-4 border-l-2 border-red-500/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600 dark:text-red-400">Crítico (vermelho)</span>
                <Badge variant="outline" className="font-mono bg-red-500/10 text-red-600 border-red-500/30">
                  ±{localSettings.stftCriticalThreshold}%
                </Badge>
              </div>
              <Slider
                value={[localSettings.stftCriticalThreshold]}
                onValueChange={([value]) => {
                  // Critical não pode ser menor que Warning
                  if (value > localSettings.stftWarningThreshold) {
                    setLocalSettings(prev => ({ ...prev, stftCriticalThreshold: value }));
                  }
                }}
                min={10}
                max={40}
                step={1}
                className="w-full"
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              STFT (Short Term Fuel Trim) mede quanto a ECU corrige a mistura ar/combustível.
              Valores altos indicam combustível de baixa qualidade.
            </p>
          </div>
          
          <Separator />
          
          {/* Duração de Anomalia */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Timer className="h-4 w-4 text-muted-foreground" />
              Duração para Alertas
            </Label>
            
            {/* Warning Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Primeiro alerta após</span>
                <Badge variant="outline" className="font-mono">
                  {localSettings.anomalyDurationWarning}s
                </Badge>
              </div>
              <Slider
                value={[localSettings.anomalyDurationWarning]}
                onValueChange={([value]) => {
                  if (value < localSettings.anomalyDurationCritical) {
                    setLocalSettings(prev => ({ ...prev, anomalyDurationWarning: value }));
                  }
                }}
                min={10}
                max={90}
                step={5}
                className="w-full"
              />
            </div>
            
            {/* Critical Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alerta crítico após</span>
                <Badge variant="outline" className="font-mono">
                  {localSettings.anomalyDurationCritical}s
                </Badge>
              </div>
              <Slider
                value={[localSettings.anomalyDurationCritical]}
                onValueChange={([value]) => {
                  if (value > localSettings.anomalyDurationWarning) {
                    setLocalSettings(prev => ({ ...prev, anomalyDurationCritical: value }));
                  }
                }}
                min={30}
                max={180}
                step={10}
                className="w-full"
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              Tempo que a anomalia deve persistir antes de disparar alertas de voz.
            </p>
          </div>
        </div>
        
        <SheetFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isDefault}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="gap-2"
          >
            Salvar Alterações
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
