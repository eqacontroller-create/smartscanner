// Modal para entrada de dados do abastecimento

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Fuel, DollarSign, Droplets, Gauge, Cloud, CloudOff, LogIn } from 'lucide-react';
import { formatCurrency } from '@/types/tripSettings';

interface RefuelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFuelLevel: number | null;
  fuelLevelSupported: boolean | null;
  defaultPrice?: number;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onConfirm: (pricePerLiter: number, litersAdded: number) => void;
}

export function RefuelModal({
  open,
  onOpenChange,
  currentFuelLevel,
  fuelLevelSupported,
  defaultPrice = 6.00,
  isAuthenticated = false,
  onLoginClick,
  onConfirm,
}: RefuelModalProps) {
  const [pricePerLiter, setPricePerLiter] = useState(defaultPrice.toString());
  const [litersAdded, setLitersAdded] = useState('');
  
  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setPricePerLiter(defaultPrice.toFixed(2));
      setLitersAdded('');
    }
  }, [open, defaultPrice]);
  
  const price = parseFloat(pricePerLiter) || 0;
  const liters = parseFloat(litersAdded) || 0;
  const total = price * liters;
  
  const handleConfirm = () => {
    if (price > 0 && liters > 0) {
      onConfirm(price, liters);
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Fuel className="h-5 w-5 text-primary" />
            Vou Abastecer
          </DialogTitle>
          <DialogDescription className="text-sm">
            Registre os dados do abastecimento para análise de qualidade.
          </DialogDescription>
        </DialogHeader>
        
        {/* Badge de Status de Autenticação */}
        {isAuthenticated ? (
          <Badge variant="outline" className="w-fit gap-1.5 border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400">
            <Cloud className="h-3 w-3" />
            Histórico será salvo na nuvem
          </Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
              <CloudOff className="h-3 w-3" />
              Histórico não será salvo
            </Badge>
            {onLoginClick && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs gap-1"
                onClick={() => {
                  onOpenChange(false);
                  onLoginClick();
                }}
              >
                <LogIn className="h-3 w-3" />
                Entrar
              </Button>
            )}
          </div>
        )}
        
        <div className="space-y-4 pt-4">
          {/* Preço por Litro */}
          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Preço por Litro (R$/L)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={pricePerLiter}
              onChange={(e) => setPricePerLiter(e.target.value)}
              placeholder="6.29"
              className="text-lg font-mono"
            />
          </div>
          
          {/* Litros Abastecidos */}
          <div className="space-y-2">
            <Label htmlFor="liters" className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              Litros Abastecidos
            </Label>
            <Input
              id="liters"
              type="number"
              step="0.1"
              min="0"
              inputMode="decimal"
              value={litersAdded}
              onChange={(e) => setLitersAdded(e.target.value)}
              placeholder="40.00"
              className="text-lg font-mono"
            />
          </div>
          
          {/* Total */}
          <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Pago:</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(total)}
            </span>
          </div>
          
          {/* Nível de Combustível Atual (se suportado) */}
          {fuelLevelSupported && currentFuelLevel !== null && (
            <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
              <Gauge className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Nível Atual do Tanque</div>
                <div className="text-lg font-bold">{currentFuelLevel}%</div>
              </div>
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${currentFuelLevel}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Aviso */}
          <p className="text-xs text-muted-foreground text-center">
            Após confirmar, o sistema monitorará os primeiros 5 km para analisar a qualidade do combustível.
          </p>
          
          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleConfirm}
              disabled={price <= 0 || liters <= 0}
            >
              <Fuel className="h-4 w-4" />
              Iniciar Monitoramento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
