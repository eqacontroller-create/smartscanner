import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TripSettings } from '@/types/tripSettings';
import { Check, Fuel, Gauge, Wrench } from 'lucide-react';

interface QuickSettingsProps {
  settings: TripSettings;
  onUpdateSettings: (newSettings: Partial<TripSettings>) => void;
}

export function QuickSettings({ settings, onUpdateSettings }: QuickSettingsProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Configurações Rápidas
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-money">
            <Check className="h-3 w-3" />
            Auto-salvo
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preço do Combustível */}
        <div className="space-y-2">
          <Label htmlFor="fuelPrice" className="flex items-center gap-2 text-sm">
            <Fuel className="h-4 w-4 text-money" />
            Preço do Combustível (R$/L)
          </Label>
          <Input
            id="fuelPrice"
            type="number"
            step="0.01"
            min="0"
            value={settings.fuelPrice}
            onChange={(e) => onUpdateSettings({ fuelPrice: parseFloat(e.target.value) || 0 })}
            className="font-mono"
          />
        </div>

        {/* Consumo Médio */}
        <div className="space-y-2">
          <Label htmlFor="consumption" className="flex items-center gap-2 text-sm">
            <Gauge className="h-4 w-4 text-accent" />
            Consumo Médio (km/L)
          </Label>
          <Input
            id="consumption"
            type="number"
            step="0.1"
            min="0"
            value={settings.averageConsumption}
            onChange={(e) => onUpdateSettings({ averageConsumption: parseFloat(e.target.value) || 0 })}
            className="font-mono"
          />
        </div>

        {/* Custo Adicional por KM (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="additionalCost" className="flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Custo Adicional/KM (R$)
            <span className="text-xs text-muted-foreground">(manutenção, depreciação)</span>
          </Label>
          <Input
            id="additionalCost"
            type="number"
            step="0.01"
            min="0"
            value={settings.vehicleCostPerKm}
            onChange={(e) => onUpdateSettings({ vehicleCostPerKm: parseFloat(e.target.value) || 0 })}
            className="font-mono"
          />
        </div>

        {/* Info de salvamento */}
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          💡 Alterações salvas automaticamente no dispositivo.
        </p>
      </CardContent>
    </Card>
  );
}
