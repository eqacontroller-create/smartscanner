import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RideEntry, formatCurrency, formatDistance, formatDuration } from '@/types/tripSettings';
import { Flag, MapPin, Clock, Fuel, Calculator } from 'lucide-react';

interface RideEndModalProps {
  isOpen: boolean;
  ride: RideEntry | null;
  onClose: () => void;
  onSave: (amountReceived: number) => void;
  onSkip: () => void;
}

export function RideEndModal({ isOpen, ride, onClose, onSave, onSkip }: RideEndModalProps) {
  const [amount, setAmount] = useState('');
  
  if (!ride) return null;
  
  const handleSave = () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (!isNaN(value) && value >= 0) {
      onSave(value);
      setAmount('');
    }
  };
  
  const profit = amount ? parseFloat(amount.replace(',', '.')) - ride.cost : null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-money text-base sm:text-lg">
            <Flag className="h-4 w-4 sm:h-5 sm:w-5" />
            Corrida Finalizada!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          {/* Estatísticas da corrida */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Distância</p>
                <p className="font-semibold">{formatDistance(ride.distance)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Duração</p>
                <p className="font-semibold">{formatDuration(ride.duration)}</p>
              </div>
            </div>
          </div>
          
          {/* Custo de combustível */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <Fuel className="h-4 w-4 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Custo de Combustível</p>
              <p className="font-bold text-destructive">{formatCurrency(ride.cost)}</p>
            </div>
          </div>
          
          {/* Input do valor recebido */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-money" />
              Valor Recebido (R$)
            </Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono text-lg"
              autoFocus
            />
          </div>
          
          {/* Preview do lucro */}
          {profit !== null && !isNaN(profit) && (
            <div className={`p-3 rounded-lg border ${profit >= 0 
              ? 'bg-money/10 border-money/20 text-money' 
              : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}>
              <p className="text-xs opacity-80">
                {profit >= 0 ? 'Lucro estimado' : 'Prejuízo'}
              </p>
              <p className="font-bold text-lg">
                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onSkip} className="flex-1 sm:flex-initial">
            Pular
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!amount || isNaN(parseFloat(amount.replace(',', '.')))}
            className="flex-1 sm:flex-initial bg-money text-money-foreground hover:bg-money/90"
          >
            Calcular Lucro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
