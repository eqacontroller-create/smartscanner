import { useState, useMemo, useCallback } from 'react';
import { useVehicleSearch } from '@/hooks/useVehicleSearch';
import { VehicleModelData } from '@/services/supabase/VehicleModelsService';
import { BrandCarousel } from './BrandCarousel';
import { VehicleSearch } from './VehicleSearch';
import { VehicleGrid } from './VehicleGrid';
import { VehicleDetail } from './VehicleDetail';
import { FilterChips } from './FilterChips';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Car, Sparkles, AlertTriangle } from 'lucide-react';

export interface VehicleConfig {
  brand: string;
  model: string;
  year: string;
  engine: string;
  transmission: string;
  nickname: string;
}

interface VehicleSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVehicle?: VehicleConfig;
  onSelect: (vehicle: VehicleConfig) => Promise<void>;
}

export function VehicleSelector({ 
  open, 
  onOpenChange, 
  currentVehicle,
  onSelect 
}: VehicleSelectorProps) {
  const {
    brands,
    models,
    filteredModels,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedBrand,
    setSelectedBrand,
    selectedYear,
    setSelectedYear,
    clearFilters,
    recentSearches,
    addRecentSearch
  } = useVehicleSearch();

  const [selectedModel, setSelectedModel] = useState<VehicleModelData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate model counts per brand (based on raw models, not filtered)
  const modelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const model of models) {
      const brandLower = model.brand.toLowerCase();
      counts[model.brand] = (counts[model.brand] || 0) + 1;
    }
    return counts;
  }, [models]);

  // Search suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results = new Set<string>();
    
    filteredModels.forEach(model => {
      if (model.brand.toLowerCase().includes(query)) {
        results.add(model.brand);
      }
      if (model.model_name.toLowerCase().includes(query)) {
        results.add(`${model.brand} ${model.model_name}`);
      }
    });
    
    return Array.from(results).slice(0, 5);
  }, [searchQuery, filteredModels]);

  const handleSearch = useCallback((query: string) => {
    addRecentSearch(query);
  }, [addRecentSearch]);

  const handleSelectModel = useCallback((model: VehicleModelData) => {
    setSelectedModel(model);
  }, []);

  const handleConfirmVehicle = useCallback(async (config: VehicleConfig) => {
    setIsSaving(true);
    try {
      await onSelect(config);
      setSelectedModel(null);
      onOpenChange(false);
      clearFilters();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSelect, onOpenChange, clearFilters]);

  const handleBack = useCallback(() => {
    setSelectedModel(null);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedModel(null);
    onOpenChange(false);
  }, [onOpenChange]);

  // Main content
  const content = (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Selecionar Veículo</h2>
            <p className="text-xs text-muted-foreground">
              {filteredModels.length} modelos disponíveis
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 pb-2">
        <VehicleSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          recentSearches={recentSearches}
          suggestions={suggestions}
          placeholder="Buscar por marca, modelo ou ano..."
        />
      </div>

      {/* Brand carousel */}
      <div className="py-3 border-b border-border/30">
        <BrandCarousel
          brands={brands}
          selectedBrand={selectedBrand}
          onSelectBrand={setSelectedBrand}
          modelCounts={modelCounts}
        />
      </div>

      {/* Active filters */}
      <FilterChips
        selectedBrand={selectedBrand}
        selectedYear={selectedYear}
        onClearBrand={() => setSelectedBrand(null)}
        onClearYear={() => setSelectedYear(null)}
        onClearAll={clearFilters}
        className="px-4 py-2"
      />

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mx-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Vehicle grid */}
      <div className="flex-1 overflow-auto p-4">
        <VehicleGrid
          models={filteredModels}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          isLoading={isLoading}
        />
      </div>

      {/* Current vehicle indicator */}
      {currentVehicle && (
        <div className="p-3 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>
              Veículo atual: <strong className="text-foreground">{currentVehicle.nickname || `${currentVehicle.brand} ${currentVehicle.model}`}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Vehicle detail sheet
  const detailSheet = selectedModel && (
    <Sheet open={!!selectedModel} onOpenChange={(open) => !open && handleBack()}>
      <SheetContent side="right" className="p-0 w-full sm:max-w-md">
        <VehicleDetail
          model={selectedModel}
          onBack={handleBack}
          onConfirm={handleConfirmVehicle}
          isLoading={isSaving}
        />
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <Dialog open={open && !selectedModel} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] max-h-[800px] p-0 gap-0 overflow-hidden">
          {content}
        </DialogContent>
      </Dialog>
      {detailSheet}
    </>
  );
}
