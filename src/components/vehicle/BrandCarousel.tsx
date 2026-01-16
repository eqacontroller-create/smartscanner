import { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getBrandAsset, BrandAsset } from '@/lib/brandAssets';
import { Star } from 'lucide-react';

interface BrandCarouselProps {
  brands: string[];
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
  modelCounts?: Record<string, number>;
}

interface BrandItemProps {
  brand: string;
  asset: BrandAsset;
  isSelected: boolean;
  modelCount?: number;
  onClick: () => void;
}

function BrandItem({ brand, asset, isSelected, modelCount, onClick }: BrandItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300",
        "min-w-[80px] touch-target",
        isSelected 
          ? "bg-primary/10 ring-2 ring-primary scale-105" 
          : "bg-card hover:bg-accent/50 hover:scale-[1.02]",
        asset.premium && "relative"
      )}
      style={{
        '--brand-color': `hsl(${asset.color})`,
        '--brand-accent': `hsl(${asset.accent})`
      } as React.CSSProperties}
    >
      {/* Premium badge */}
      {asset.premium && (
        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
          <Star className="w-2.5 h-2.5 text-yellow-900 fill-current" />
        </div>
      )}
      
      {/* Brand logo circle */}
      <div 
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all",
          isSelected ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : ""
        )}
        style={{
          backgroundColor: `hsl(${asset.color})`,
          color: `hsl(${asset.accent})`
        }}
      >
        {asset.initial}
      </div>
      
      {/* Brand name */}
      <span className={cn(
        "text-xs font-medium text-center leading-tight max-w-[70px] truncate",
        isSelected ? "text-primary" : "text-muted-foreground"
      )}>
        {asset.displayName}
      </span>
      
      {/* Model count */}
      {modelCount !== undefined && (
        <span className="text-[10px] text-muted-foreground/60">
          {modelCount} {modelCount === 1 ? 'modelo' : 'modelos'}
        </span>
      )}
    </button>
  );
}

export function BrandCarousel({ brands, selectedBrand, onSelectBrand, modelCounts }: BrandCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to selected brand
  useEffect(() => {
    if (selectedBrand && scrollRef.current) {
      const index = brands.findIndex(b => b.toLowerCase() === selectedBrand.toLowerCase());
      if (index !== -1) {
        const element = scrollRef.current.children[index] as HTMLElement;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }
  }, [selectedBrand, brands]);

  // Memoize sorted brands with pre-computed assets
  const brandsWithAssets = useMemo(() => {
    return brands
      .map(brand => ({
        brand,
        asset: getBrandAsset(brand)
      }))
      .sort((a, b) => {
        if (a.asset.premium && !b.asset.premium) return -1;
        if (!a.asset.premium && b.asset.premium) return 1;
        return a.asset.displayName.localeCompare(b.asset.displayName);
      });
  }, [brands]);

  // Memoize total count
  const totalModels = useMemo(() => {
    if (!modelCounts) return 0;
    return Object.values(modelCounts).reduce((a, b) => a + b, 0);
  }, [modelCounts]);

  return (
    <div className="relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Carousel container */}
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 px-4 scroll-smooth snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* All brands option */}
        <button
          onClick={() => onSelectBrand(null)}
          className={cn(
            "flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300",
            "min-w-[80px] touch-target snap-start",
            selectedBrand === null 
              ? "bg-primary/10 ring-2 ring-primary scale-105" 
              : "bg-card hover:bg-accent/50"
          )}
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm bg-muted",
            selectedBrand === null ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : ""
          )}>
            <span className="text-lg">🚗</span>
          </div>
          <span className={cn(
            "text-xs font-medium",
            selectedBrand === null ? "text-primary" : "text-muted-foreground"
          )}>
            Todas
          </span>
          {modelCounts && (
            <span className="text-[10px] text-muted-foreground/60">
              {totalModels} modelos
            </span>
          )}
        </button>

        {brandsWithAssets.map(({ brand, asset }) => {
          const isSelected = selectedBrand?.toLowerCase() === brand.toLowerCase();
          
          return (
            <div key={brand} className="snap-start">
              <BrandItem
                brand={brand}
                asset={asset}
                isSelected={isSelected}
                modelCount={modelCounts?.[brand]}
                onClick={() => onSelectBrand(isSelected ? null : brand)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
