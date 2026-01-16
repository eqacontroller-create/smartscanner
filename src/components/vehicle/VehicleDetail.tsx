import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { VehicleModelData, VehicleModelsService } from '@/services/supabase/VehicleModelsService';
import { getBrandAsset } from '@/lib/brandAssets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  Wrench, 
  Calendar,
  Fuel,
  Settings2,
  Star,
  Sparkles
} from 'lucide-react';

interface VehicleDetailProps {
  model: VehicleModelData;
  onBack: () => void;
  onConfirm: (config: VehicleConfig) => void;
  isLoading?: boolean;
}

interface VehicleConfig {
  brand: string;
  model: string;
  year: string;
  engine: string;
  transmission: string;
  nickname: string;
}

export function VehicleDetail({ model, onBack, onConfirm, isLoading }: VehicleDetailProps) {
  const asset = getBrandAsset(model.brand);
  const years = VehicleModelsService.parseYearsRange(model.years_available);
  const engines = VehicleModelsService.parseEngineOptions(model.engine_options || []);
  const issues = Array.isArray(model.common_issues) ? model.common_issues : [];
  
  const [selectedYear, setSelectedYear] = useState<number>(years[years.length - 1] || new Date().getFullYear());
  const [selectedEngine, setSelectedEngine] = useState<string>(engines[0] || '');
  const [transmission, setTransmission] = useState<'manual' | 'automatic'>('manual');
  const [nickname, setNickname] = useState('');

  const sortedYears = useMemo(() => [...years].sort((a, b) => b - a), [years]);

  const handleConfirm = () => {
    onConfirm({
      brand: model.brand,
      model: model.model_name,
      year: String(selectedYear),
      engine: selectedEngine,
      transmission: transmission === 'manual' ? 'Manual' : 'Automático',
      nickname: nickname.trim() || `${model.model_name} ${selectedYear}`
    });
  };

  const criticalIssues = issues.filter((i: any) => i.severity === 'error' || i.severity === 'critical');
  const warningIssues = issues.filter((i: any) => i.severity === 'warning');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
          style={{
            backgroundColor: `hsl(${asset.color})`,
            color: `hsl(${asset.accent})`
          }}
        >
          {asset.initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{asset.displayName}</span>
            {asset.premium && (
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            )}
          </div>
          <h2 className="font-semibold truncate">{model.model_name}</h2>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Year selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4 text-primary" />
              Ano do veículo
            </Label>
            <div className="flex flex-wrap gap-2">
              {sortedYears.slice(0, 8).map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    selectedYear === year
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {year}
                </button>
              ))}
              {sortedYears.length > 8 && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg text-sm bg-muted border-none"
                >
                  {sortedYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Engine selection */}
          {engines.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Fuel className="w-4 h-4 text-primary" />
                Motorização
              </Label>
              <div className="space-y-2">
                {engines.map((engine) => (
                  <button
                    key={engine}
                    onClick={() => setSelectedEngine(engine)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-all text-left",
                      selectedEngine === engine
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-muted hover:bg-muted/80 border-2 border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      selectedEngine === engine
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}>
                      {selectedEngine === engine && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className={cn(
                      "font-medium",
                      selectedEngine === engine && "text-primary"
                    )}>
                      {engine}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transmission */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Settings2 className="w-4 h-4 text-primary" />
              Câmbio
            </Label>
            <div className="flex gap-2">
              <button
                onClick={() => setTransmission('manual')}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                  transmission === 'manual'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                Manual
              </button>
              <button
                onClick={() => setTransmission('automatic')}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                  transmission === 'automatic'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                Automático
              </button>
            </div>
          </div>

          {/* Nickname */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              Apelido (opcional)
            </Label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={`${model.model_name} ${selectedYear}`}
              className="h-11"
            />
          </div>

          {/* Known issues */}
          {issues.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Wrench className="w-4 h-4 text-yellow-500" />
                Problemas conhecidos
                <Badge variant="secondary" className="ml-1 text-xs">
                  {issues.length}
                </Badge>
              </Label>
              
              <div className="space-y-2">
                {criticalIssues.length > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-destructive">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Atenção crítica
                    </div>
                    {criticalIssues.map((issue: any, i: number) => (
                      <p key={i} className="text-sm text-destructive/90">
                        • {issue.title}
                      </p>
                    ))}
                  </div>
                )}
                
                {warningIssues.length > 0 && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-yellow-600">
                      <Wrench className="w-3.5 h-3.5" />
                      Pontos de atenção
                    </div>
                    {warningIssues.slice(0, 3).map((issue: any, i: number) => (
                      <p key={i} className="text-sm text-yellow-700 dark:text-yellow-400">
                        • {issue.title}
                      </p>
                    ))}
                    {warningIssues.length > 3 && (
                      <p className="text-xs text-yellow-600">
                        +{warningIssues.length - 3} mais...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card/50">
        <Button
          onClick={handleConfirm}
          disabled={isLoading || !selectedYear}
          className="w-full h-12 text-base font-semibold gap-2"
          style={{
            background: `linear-gradient(135deg, hsl(${asset.color}), hsl(${asset.color} / 0.8))`
          }}
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Confirmar {model.model_name} {selectedYear}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
