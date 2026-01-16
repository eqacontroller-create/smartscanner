// Modal de seleção do fluxo de monitoramento de combustível
// Permite escolher entre "Vou Abastecer" (completo) e "Testar Combustível" (rápido)

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fuel, FlaskConical, Cloud, CloudOff } from 'lucide-react';

interface RefuelFlowSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRefuel: () => void;
  onSelectQuickTest: () => void;
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
  // Feedback háptico para mobile
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(15); // Vibração curta de 15ms
    }
  };

  const handleSelectRefuel = () => {
    triggerHaptic();
    onOpenChange(false);
    onSelectRefuel();
  };

  const handleSelectQuickTest = () => {
    triggerHaptic();
    onOpenChange(false);
    onSelectQuickTest();
  };

  const isStftUnavailable = stftSupported === false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
                       active:scale-[0.98] transition-all duration-200 ease-out
                       animate-fade-in [animation-delay:100ms]"
            onClick={handleSelectRefuel}
          >
            <div className="flex items-center gap-2 w-full">
              <Fuel className="h-5 w-5 text-primary shrink-0 transition-transform group-hover:scale-110" />
              <span className="font-semibold flex-1">Vou Abastecer</span>
              {isAuthenticated ? (
                <Cloud className="h-4 w-4 text-muted-foreground" />
              ) : (
                <CloudOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Registra preço, litros e salva histórico completo
              {isAuthenticated ? ' na nuvem' : ' (login para salvar na nuvem)'}
            </span>
          </Button>

          {/* Opção 2: Teste Rápido */}
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 text-left 
                       hover:border-blue-500/50 hover:bg-blue-500/5 hover:scale-[1.02]
                       active:scale-[0.98] transition-all duration-200 ease-out
                       animate-fade-in [animation-delay:200ms]
                       disabled:opacity-50 disabled:hover:scale-100"
            onClick={handleSelectQuickTest}
            disabled={isStftUnavailable}
          >
            <div className="flex items-center gap-2 w-full">
              <FlaskConical className="h-5 w-5 text-blue-500 shrink-0 transition-transform group-hover:scale-110" />
              <span className="font-semibold flex-1">Testar Combustível</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {isStftUnavailable
                ? 'Veículo não suporta leitura de Fuel Trim'
                : 'Apenas verifica a qualidade sem registrar dados financeiros'}
            </span>
          </Button>

          {/* Nota informativa */}
          <p className="text-xs text-center text-muted-foreground pt-2 animate-fade-in [animation-delay:300ms]">
            Ambos os modos analisam o Fuel Trim enquanto você dirige
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
