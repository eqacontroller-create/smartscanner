import { VehicleBrand, VehicleProfile } from '@/lib/vehicleProfiles';
import { Car } from 'lucide-react';

interface VehicleBadgeProps {
  brand: VehicleBrand;
  profile: VehicleProfile;
  modelYear?: string | null;
  compact?: boolean;
}

/**
 * Badge que exibe o logo/nome da marca detectada
 * Usa ícones simples e cores da marca para identificação visual
 */
export function VehicleBadge({ brand, profile, modelYear, compact = false }: VehicleBadgeProps) {
  // Para versão compacta (header)
  if (compact) {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-md"
        style={{ 
          backgroundColor: `hsl(${profile.colors.primary} / 0.15)`,
          borderColor: `hsl(${profile.colors.primary} / 0.3)`,
          borderWidth: '1px',
        }}
      >
        <BrandIcon brand={brand} className="h-4 w-4" style={{ color: `hsl(${profile.colors.primary})` }} />
        <span 
          className="text-xs font-semibold"
          style={{ color: `hsl(${profile.colors.primary})` }}
        >
          {profile.displayName}
        </span>
        {modelYear && (
          <span className="text-xs text-muted-foreground">
            {modelYear}
          </span>
        )}
      </div>
    );
  }

  // Versão completa
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg border"
      style={{ 
        backgroundColor: `hsl(${profile.colors.primary} / 0.1)`,
        borderColor: `hsl(${profile.colors.primary} / 0.3)`,
      }}
    >
      <div 
        className="p-2 rounded-lg"
        style={{ backgroundColor: `hsl(${profile.colors.primary} / 0.2)` }}
      >
        <BrandIcon brand={brand} className="h-6 w-6" style={{ color: `hsl(${profile.colors.primary})` }} />
      </div>
      <div className="flex flex-col">
        <span 
          className="text-base font-bold"
          style={{ color: `hsl(${profile.colors.primary})` }}
        >
          {profile.displayName}
        </span>
        <span className="text-xs text-muted-foreground">
          {modelYear ? `Ano ${modelYear}` : profile.slogan}
        </span>
      </div>
    </div>
  );
}

// Componente de ícone por marca (usa ícones simples por enquanto)
function BrandIcon({ brand, className, style }: { brand: VehicleBrand; className?: string; style?: React.CSSProperties }) {
  // Por simplicidade, usamos o ícone Car para todas as marcas
  // Em produção, poderia ser substituído por SVGs específicos
  return <Car className={className} style={style} />;
}
