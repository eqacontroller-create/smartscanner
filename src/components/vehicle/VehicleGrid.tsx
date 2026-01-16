import { cn } from '@/lib/utils';
import { VehicleModelData } from '@/services/supabase/VehicleModelsService';
import { VehicleCard } from './VehicleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, SearchX } from 'lucide-react';

interface VehicleGridProps {
  models: VehicleModelData[];
  selectedModel?: VehicleModelData | null;
  onSelectModel: (model: VehicleModelData) => void;
  isLoading?: boolean;
  className?: string;
}

function VehicleCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-border/50 bg-card animate-pulse">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-1 mt-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="w-5 h-5" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <SearchX className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">Nenhum veículo encontrado</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        Tente buscar por outra marca, modelo ou ano
      </p>
    </div>
  );
}

function NoModelsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Car className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-1">Selecione uma marca</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        Escolha uma marca acima ou busque pelo veículo desejado
      </p>
    </div>
  );
}

export function VehicleGrid({ 
  models, 
  selectedModel,
  onSelectModel, 
  isLoading,
  className 
}: VehicleGridProps) {
  if (isLoading) {
    return (
      <div className={cn(
        "grid gap-3",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}>
        {Array.from({ length: 6 }).map((_, i) => (
          <VehicleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (models.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={cn(
      "grid gap-3",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      className
    )}>
      {models.map((model, index) => (
        <VehicleCard
          key={model.id}
          model={model}
          isSelected={selectedModel?.id === model.id}
          onClick={() => onSelectModel(model)}
          animationDelay={index < 12 ? index * 40 : 0}
        />
      ))}
    </div>
  );
}
