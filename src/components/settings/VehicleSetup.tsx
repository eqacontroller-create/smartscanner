/**
 * VehicleSetup - Configuração completa do veículo
 */

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Car, CheckCircle2, Loader2, AlertTriangle, Sparkles, Wrench, Search } from 'lucide-react';
import { VehicleModelsService, type VehicleModelData, type CommonIssue } from '@/services/supabase/VehicleModelsService';
import { cn } from '@/lib/utils';
import { VehicleSelector, type VehicleConfig as SelectorConfig } from '@/components/vehicle';

export interface VehicleConfig {
  brand: string;
  model: string;
  year: string;
  engine: string;
  transmission: string;
  nickname: string;
}

interface VehicleSetupProps {
  detectedBrand?: string | null;
  detectedYear?: string | null;
  detectedVin?: string | null;
  currentConfig?: Partial<VehicleConfig>;
  onSave: (config: VehicleConfig) => Promise<void>;
  loading?: boolean;
}

const TRANSMISSIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automático' },
  { value: 'cvt', label: 'CVT' },
  { value: 'dct', label: 'DCT / DSG' },
  { value: 'automated', label: 'Automatizado' },
];

export function VehicleSetup({
  detectedBrand,
  detectedYear,
  detectedVin,
  currentConfig,
  onSave,
  loading = false,
}: VehicleSetupProps) {
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<VehicleModelData[]>([]);
  const [selectedModel, setSelectedModel] = useState<VehicleModelData | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [brand, setBrand] = useState(currentConfig?.brand || detectedBrand || '');
  const [model, setModel] = useState(currentConfig?.model || '');
  const [year, setYear] = useState(currentConfig?.year || detectedYear || '');
  const [engine, setEngine] = useState(currentConfig?.engine || '');
  const [transmission, setTransmission] = useState(currentConfig?.transmission || 'manual');
  const [nickname, setNickname] = useState(currentConfig?.nickname || '');
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Load brands on mount
  useEffect(() => {
    loadBrands();
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (brand) {
      loadModels(brand);
    } else {
      setModels([]);
      setModel('');
    }
  }, [brand]);

  // Update selected model when model changes
  useEffect(() => {
    const found = models.find(m => m.model_name === model);
    setSelectedModel(found || null);
  }, [model, models]);

  // Auto-set brand from VIN detection
  useEffect(() => {
    if (detectedBrand && !brand) {
      setBrand(detectedBrand.toLowerCase());
    }
  }, [detectedBrand]);

  // Auto-set year from VIN detection
  useEffect(() => {
    if (detectedYear && !year) {
      setYear(detectedYear);
    }
  }, [detectedYear]);

  const loadBrands = async () => {
    try {
      const data = await VehicleModelsService.getBrands();
      setBrands(data);
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadModels = async (brandName: string) => {
    setLoadingModels(true);
    try {
      const data = await VehicleModelsService.getModelsByBrand(brandName);
      setModels(data);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        brand,
        model,
        year,
        engine,
        transmission,
        nickname,
      });
    } finally {
      setSaving(false);
    }
  };

  const years = selectedModel 
    ? VehicleModelsService.parseYearsRange(selectedModel.years_available)
    : [];

  const engines = selectedModel
    ? VehicleModelsService.parseEngineOptions(selectedModel.engine_options)
    : [];

  const isComplete = brand && model && year;

  const formatBrandName = (b: string) => {
    return b.charAt(0).toUpperCase() + b.slice(1);
  };

  const handleSelectorSelect = async (config: SelectorConfig) => {
    setBrand(config.brand);
    setModel(config.model);
    setYear(config.year);
    setEngine(config.engine);
    setTransmission(config.transmission.toLowerCase().includes('auto') ? 'automatic' : 'manual');
    setNickname(config.nickname);
    await onSave(config);
  };

  return (
    <div className="space-y-4">
      {/* Quick Search Button */}
      <Button
        variant="outline"
        onClick={() => setSelectorOpen(true)}
        className="w-full h-12 gap-3 text-base border-dashed border-2 hover:border-primary hover:bg-primary/5"
      >
        <Search className="h-5 w-5 text-primary" />
        <span>Buscar veículo no catálogo</span>
      </Button>

      <VehicleSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        currentVehicle={currentConfig as SelectorConfig}
        onSelect={handleSelectorSelect}
      />

      <div className="relative flex items-center gap-2 my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground px-2">ou preencha manualmente</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* VIN Detection Badge */}
      {detectedVin && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm">
            VIN detectado: <span className="font-mono font-medium">{detectedVin}</span>
          </span>
          {detectedBrand && (
            <Badge variant="secondary" className="ml-auto">
              {formatBrandName(detectedBrand)} {detectedYear}
            </Badge>
          )}
        </div>
      )}

      {/* Brand */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <Car className="h-4 w-4" />
          Marca
        </Label>
        {loadingBrands ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando marcas...
          </div>
        ) : (
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a marca" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {formatBrandName(b)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Model */}
      <div className="space-y-2">
        <Label className="text-sm">Modelo</Label>
        {loadingModels ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando modelos...
          </div>
        ) : (
          <Select value={model} onValueChange={setModel} disabled={!brand}>
            <SelectTrigger>
              <SelectValue placeholder={brand ? "Selecione o modelo" : "Selecione a marca primeiro"} />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.model_name}>
                  {m.model_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Year */}
      <div className="space-y-2">
        <Label className="text-sm">Ano</Label>
        <Select value={year} onValueChange={setYear} disabled={!selectedModel}>
          <SelectTrigger>
            <SelectValue placeholder={selectedModel ? "Selecione o ano" : "Selecione o modelo primeiro"} />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Engine */}
      {engines.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Motorização</Label>
          <Select value={engine} onValueChange={setEngine}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o motor (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {engines.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Transmission */}
      <div className="space-y-2">
        <Label className="text-sm">Câmbio</Label>
        <Select value={transmission} onValueChange={setTransmission}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o câmbio" />
          </SelectTrigger>
          <SelectContent>
            {TRANSMISSIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nickname */}
      <div className="space-y-2">
        <Label className="text-sm">Apelido do veículo (opcional)</Label>
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Ex: Meu Polo, Carro da família"
        />
      </div>

      {/* Common Issues Alert */}
      {selectedModel && selectedModel.common_issues?.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium text-sm">Problemas conhecidos do {selectedModel.model_name}</span>
            </div>
            <ul className="space-y-1 pl-6">
              {(selectedModel.common_issues as CommonIssue[]).slice(0, 3).map((issue, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Wrench className={cn(
                    'h-3 w-3 mt-1 flex-shrink-0',
                    issue.severity === 'critical' && 'text-red-500',
                    issue.severity === 'warning' && 'text-yellow-500',
                    issue.severity === 'info' && 'text-blue-500'
                  )} />
                  {issue.title}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={!isComplete || saving || loading}
        className="w-full gap-2"
      >
        {(saving || loading) ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        Salvar Veículo
      </Button>
    </div>
  );
}
