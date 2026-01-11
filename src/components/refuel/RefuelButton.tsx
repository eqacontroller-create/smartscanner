// Botão flutuante "Vou Abastecer"
// Ativa o modo de auditoria de combustível

import { Fuel, X, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefuelMode } from '@/types/refuelTypes';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RefuelButtonProps {
  mode: RefuelMode;
  isConnected: boolean;
  isAuthenticated?: boolean;
  onStart: () => void;
  onCancel: () => void;
}

export function RefuelButton({
  mode,
  isConnected,
  isAuthenticated = false,
  onStart,
  onCancel,
}: RefuelButtonProps) {
  const isActive = mode !== 'inactive';
  
  // Cores baseadas no modo
  const getModeStyles = () => {
    switch (mode) {
      case 'waiting':
        return 'bg-yellow-500 hover:bg-yellow-600 text-yellow-950 animate-pulse';
      case 'monitoring':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'analyzing':
        return 'bg-purple-500 hover:bg-purple-600 text-white animate-pulse';
      case 'completed':
        return 'bg-green-500 hover:bg-green-600 text-white';
      default:
        return 'bg-primary hover:bg-primary/90';
    }
  };
  
  // Label baseado no modo
  const getModeLabel = () => {
    switch (mode) {
      case 'waiting':
        return 'Aguardando...';
      case 'monitoring':
        return 'Analisando';
      case 'analyzing':
        return 'Processando';
      case 'completed':
        return 'Concluído';
      default:
        return 'Abastecer';
    }
  };
  
  if (!isConnected) return null;
  
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={isActive ? undefined : onStart}
              disabled={mode === 'analyzing'}
              className={cn(
                'gap-2 min-h-[44px] transition-all duration-300',
                getModeStyles()
              )}
              size="sm"
            >
              <Fuel className="h-4 w-4" />
              <span className="hidden xs:inline">{getModeLabel()}</span>
              {/* Indicador de sync no botão */}
              {!isActive && (
                isAuthenticated ? (
                  <Cloud className="h-3 w-3 opacity-60" />
                ) : (
                  <CloudOff className="h-3 w-3 opacity-60" />
                )
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isAuthenticated 
              ? 'Histórico será salvo na nuvem' 
              : 'Faça login para salvar histórico'
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {isActive && mode !== 'completed' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
