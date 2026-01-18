import React from 'react';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CarBrand = 
  | 'volkswagen' 
  | 'ford' 
  | 'chevrolet' 
  | 'honda' 
  | 'fiat' 
  | 'toyota' 
  | 'hyundai' 
  | 'kia' 
  | 'renault' 
  | 'nissan' 
  | 'jeep' 
  | 'generic';

interface BrandOption {
  id: CarBrand;
  name: string;
  color: string;
}

const BRANDS: BrandOption[] = [
  { id: 'volkswagen', name: 'Volkswagen', color: '#00437A' },
  { id: 'ford', name: 'Ford', color: '#003478' },
  { id: 'chevrolet', name: 'Chevrolet', color: '#D4AF37' },
  { id: 'honda', name: 'Honda', color: '#CC0000' },
  { id: 'fiat', name: 'Fiat', color: '#8B0000' },
  { id: 'toyota', name: 'Toyota', color: '#EB0A1E' },
  { id: 'hyundai', name: 'Hyundai', color: '#002C5F' },
  { id: 'kia', name: 'Kia', color: '#05141F' },
  { id: 'renault', name: 'Renault', color: '#FFCC00' },
  { id: 'nissan', name: 'Nissan', color: '#C71444' },
  { id: 'jeep', name: 'Jeep', color: '#2E5435' },
  { id: 'generic', name: 'Outra', color: '#666666' },
];

interface BrandSelectorProps {
  selectedBrand: CarBrand | null;
  onSelectBrand: (brand: CarBrand) => void;
}

export function BrandSelector({ selectedBrand, onSelectBrand }: BrandSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Qual a marca do seu carro?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Vamos mostrar onde fica a porta OBD-II
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {BRANDS.map((brand) => (
          <button
            key={brand.id}
            onClick={() => onSelectBrand(brand.id)}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200",
              "hover:scale-105 hover:shadow-md",
              selectedBrand === brand.id
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
              style={{ backgroundColor: brand.color }}
            >
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">
              {brand.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
