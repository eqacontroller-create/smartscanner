import React, { useState } from 'react';
import { Plug, Key, Bluetooth, CheckCircle2, Circle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  helpText: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'scanner-plugged',
    title: 'Scanner plugado',
    description: 'A luz do adaptador está acesa?',
    icon: Plug,
    helpText: 'Encaixe o adaptador ELM327 na porta OBD-II. Uma luz (geralmente vermelha ou azul) deve acender.',
  },
  {
    id: 'ignition-on',
    title: 'Ignição ligada',
    description: 'O painel do carro está aceso?',
    icon: Key,
    helpText: 'Gire a chave para a posição ON (sem dar partida) ou pressione o botão Start sem pisar no freio.',
  },
  {
    id: 'bluetooth-on',
    title: 'Bluetooth ligado',
    description: 'O Bluetooth do celular está ativado?',
    icon: Bluetooth,
    helpText: 'Ative o Bluetooth nas configurações do seu celular. Não precisa parear antes.',
  },
];

interface PreFlightChecklistProps {
  onComplete: () => void;
}

export function PreFlightChecklist({ onComplete }: PreFlightChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allChecked = checkedItems.size === CHECKLIST_ITEMS.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">Checklist Pré-Voo</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Confirme cada item antes de buscar o dispositivo
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {CHECKLIST_ITEMS.map((item) => {
          const isChecked = checkedItems.has(item.id);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-300",
                "text-left",
                isChecked
                  ? "border-green-500 bg-green-500/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {/* Checkbox */}
              <div className={cn(
                "flex-shrink-0 transition-transform duration-300",
                isChecked && "scale-110"
              )}>
                {isChecked ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300",
                isChecked ? "bg-green-500/20" : "bg-muted"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-colors duration-300",
                  isChecked ? "text-green-500" : "text-muted-foreground"
                )} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium transition-colors duration-300",
                  isChecked ? "text-foreground" : "text-muted-foreground"
                )}>
                  {item.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.description}
                </div>
              </div>

              {/* Help tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="flex-shrink-0 p-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[250px]">
                  <p className="text-sm">{item.helpText}</p>
                </TooltipContent>
              </Tooltip>
            </button>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {CHECKLIST_ITEMS.map((item) => (
          <div
            key={item.id}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              checkedItems.has(item.id) 
                ? "bg-green-500 scale-125" 
                : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* Action button */}
      <Button
        onClick={onComplete}
        disabled={!allChecked}
        className={cn(
          "w-full h-12 text-base font-medium transition-all duration-300",
          allChecked && "animate-pulse shadow-lg shadow-primary/25"
        )}
      >
        {allChecked ? (
          <>
            <Bluetooth className="h-5 w-5 mr-2" />
            Buscar Dispositivo
          </>
        ) : (
          `Confirme ${CHECKLIST_ITEMS.length - checkedItems.size} item${CHECKLIST_ITEMS.length - checkedItems.size > 1 ? 's' : ''} acima`
        )}
      </Button>
    </div>
  );
}
