// Modal de seleção do fluxo de monitoramento de combustível
// Inclui pergunta de contexto sobre troca de combustível (State Machine Forense)

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Fuel, FlaskConical, Cloud, CloudOff, ChevronRight, ArrowLeft } from 'lucide-react';
import type { FuelChangeContext } from '@/types/fuelForensics';
import { FUEL_CONTEXT_LABELS } from '@/types/fuelForensics';

interface RefuelFlowSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRefuel: (context: FuelChangeContext) => void;
  onSelectQuickTest: (context: FuelChangeContext) => void;
  isAuthenticated?: boolean;
  stftSupported: boolean | null;
}

export function RefuelFlowSelector({
  open,
  onOpenChange,
  onSelectRefuel,
  onSelectQuickTest,
  isAuthenticated = false,
  stftSupported,
}: RefuelFlowSelectorProps) {
  const [step, setStep] = useState<'flow' | 'context'>('flow');
  const [selectedFlow, setSelectedFlow] = useState<'refuel' | 'quick-test' | null>(null);
  const [fuelContext, setFuelContext] = useState<FuelChangeContext>('same_fuel');
  
  // Reset ao fechar
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('flow');
      setSelectedFlow(null);
      setFuelContext('same_fuel');
    }
    onOpenChange(isOpen);
  };
  
  // Feedback háptico para mobile
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const handleSelectFlow = (flow: 'refuel' | 'quick-test') => {
    triggerHaptic();
    setSelectedFlow(flow);
    setStep('context');
  };
  
  const handleBack = () => {
    triggerHaptic();
    setStep('flow');
  };
  
  const handleConfirm = () => {
    triggerHaptic();
    handleOpenChange(false);
    
    if (selectedFlow === 'refuel') {
      onSelectRefuel(fuelContext);
    } else {
      onSelectQuickTest(fuelContext);
    }
  };

  const isStftUnavailable = stftSupported === false;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'flow' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-primary" />
                Hora do Posto
              </DialogTitle>
              <DialogDescription>
                Escolha como deseja monitorar o combustível
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 pt-4">
              {/* Opção 1: Abastecimento Completo */}
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 text-left 
                           hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02]
                           active:scale-[0.98] transition-all duration-200 ease-out"
                onClick={() => handleSelectFlow('refuel')}
              >
                <div className="flex items-center gap-2 w-full">
                  <Fuel className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-semibold flex-1">Vou Abastecer</span>
                  {isAuthenticated ? (
                    <Cloud className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <CloudOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  Registra preço, litros e salva histórico completo
                </span>
              </Button>

              {/* Opção 2: Teste Rápido */}
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 text-left 
                           hover:border-blue-500/50 hover:bg-blue-500/5 hover:scale-[1.02]
                           active:scale-[0.98] transition-all duration-200 ease-out
                           disabled:opacity-50 disabled:hover:scale-100"
                onClick={() => handleSelectFlow('quick-test')}
                disabled={isStftUnavailable}
              >
                <div className="flex items-center gap-2 w-full">
                  <FlaskConical className="h-5 w-5 text-blue-500 shrink-0" />
                  <span className="font-semibold flex-1">Testar Combustível</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {isStftUnavailable
                    ? 'Veículo não suporta leitura de Fuel Trim'
                    : 'Apenas verifica a qualidade sem registrar dados'}
                </span>
              </Button>

              <p className="text-xs text-center text-muted-foreground pt-2">
                Ambos os modos analisam o Fuel Trim enquanto você dirige
              </p>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                O que você abasteceu?
              </DialogTitle>
              <DialogDescription>
                Isso ajuda a análise a diferenciar troca de combustível de adulteração
              </DialogDescription>
            </DialogHeader>

            <div className="pt-4 space-y-4">
              <RadioGroup 
                value={fuelContext} 
                onValueChange={(v) => setFuelContext(v as FuelChangeContext)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                     onClick={() => setFuelContext('same_fuel')}>
                  <RadioGroupItem value="same_fuel" id="same_fuel" />
                  <Label htmlFor="same_fuel" className="flex-1 cursor-pointer">
                    <span className="font-medium">{FUEL_CONTEXT_LABELS.same_fuel}</span>
                    <p className="text-xs text-muted-foreground">Abasteci com o mesmo tipo de sempre</p>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                     onClick={() => setFuelContext('gas_to_ethanol')}>
                  <RadioGroupItem value="gas_to_ethanol" id="gas_to_ethanol" />
                  <Label htmlFor="gas_to_ethanol" className="flex-1 cursor-pointer">
                    <span className="font-medium">{FUEL_CONTEXT_LABELS.gas_to_ethanol}</span>
                    <p className="text-xs text-muted-foreground">Estava com gasolina, coloquei etanol</p>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                     onClick={() => setFuelContext('ethanol_to_gas')}>
                  <RadioGroupItem value="ethanol_to_gas" id="ethanol_to_gas" />
                  <Label htmlFor="ethanol_to_gas" className="flex-1 cursor-pointer">
                    <span className="font-medium">{FUEL_CONTEXT_LABELS.ethanol_to_gas}</span>
                    <p className="text-xs text-muted-foreground">Estava com etanol, coloquei gasolina</p>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                     onClick={() => setFuelContext('unknown')}>
                  <RadioGroupItem value="unknown" id="unknown" />
                  <Label htmlFor="unknown" className="flex-1 cursor-pointer">
                    <span className="font-medium">{FUEL_CONTEXT_LABELS.unknown}</span>
                    <p className="text-xs text-muted-foreground">Não tenho certeza do que tinha antes</p>
                  </Label>
                </div>
              </RadioGroup>
              
              <Button onClick={handleConfirm} className="w-full">
                Continuar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
