import { cn } from '@/lib/utils';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBrandAsset } from '@/lib/brandAssets';

interface FilterChipsProps {
  selectedBrand: string | null;
  selectedYear: number | null;
  onClearBrand: () => void;
  onClearYear: () => void;
  onClearAll: () => void;
  className?: string;
}

export function FilterChips({
  selectedBrand,
  selectedYear,
  onClearBrand,
  onClearYear,
  onClearAll,
  className
}: FilterChipsProps) {
  const hasFilters = selectedBrand || selectedYear;

  if (!hasFilters) return null;

  const brandAsset = selectedBrand ? getBrandAsset(selectedBrand) : null;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Filter className="w-4 h-4 text-muted-foreground" />
      
      {selectedBrand && (
        <Badge
          variant="secondary"
          className={cn(
            "pl-2 pr-1 py-1 gap-1 cursor-pointer hover:bg-secondary/80 transition-colors",
            "animate-scale-in"
          )}
          style={{
            borderColor: brandAsset ? `hsl(${brandAsset.color} / 0.5)` : undefined,
            backgroundColor: brandAsset ? `hsl(${brandAsset.color} / 0.1)` : undefined
          }}
          onClick={onClearBrand}
        >
          <span 
            className="w-3 h-3 rounded-full mr-1"
            style={{ backgroundColor: brandAsset ? `hsl(${brandAsset.color})` : undefined }}
          />
          {brandAsset?.displayName || selectedBrand}
          <X className="w-3 h-3 ml-0.5 hover:text-destructive" />
        </Badge>
      )}

      {selectedYear && (
        <Badge
          variant="secondary"
          className="pl-2 pr-1 py-1 gap-1 cursor-pointer hover:bg-secondary/80 transition-colors animate-scale-in"
          onClick={onClearYear}
        >
          {selectedYear}
          <X className="w-3 h-3 ml-0.5 hover:text-destructive" />
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
      >
        Limpar tudo
      </Button>
    </div>
  );
}
