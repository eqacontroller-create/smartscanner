import { memo, useMemo } from 'react';
import type { SplashPhase } from '@/hooks/useSplashScreen';

// Logo components
import { AudiRingsLogo } from './AudiRingsLogo';
import { MercedesStarLogo } from './MercedesStarLogo';
import { BMWLogo } from './BMWLogo';
import { VWLogo } from './VWLogo';
import { ToyotaLogo } from './ToyotaLogo';
import { HondaLogo } from './HondaLogo';
import { ChevroletLogo } from './ChevroletLogo';
import { PorscheLogo } from './PorscheLogo';
import { FordLogo } from './FordLogo';
import { FiatLogo } from './FiatLogo';
import { GenericLogo } from './GenericLogo';
import type { BrandLogoProps } from './types';

interface BrandLogoWrapperProps {
  brand: string;
  phase: SplashPhase;
  glowColor: string;
  className?: string;
}

/**
 * Componente wrapper que escolhe o logo correto baseado na marca do veículo
 */
export const BrandLogo = memo(function BrandLogo({ 
  brand, 
  phase, 
  glowColor, 
  className 
}: BrandLogoWrapperProps) {
  const LogoComponent = useMemo(() => {
    const normalizedBrand = brand.toLowerCase().replace(/[-\s]/g, '');
    
    switch (normalizedBrand) {
      // Alemãs
      case 'audi':
        return AudiRingsLogo;
      case 'mercedes':
      case 'mercedesbenz':
        return MercedesStarLogo;
      case 'bmw':
        return BMWLogo;
      case 'volkswagen':
      case 'vw':
        return VWLogo;
      case 'porsche':
        return PorscheLogo;
        
      // Japonesas
      case 'toyota':
      case 'lexus':
        return ToyotaLogo;
      case 'honda':
      case 'acura':
        return HondaLogo;
      case 'nissan':
      case 'infiniti':
        return ToyotaLogo; // Similar style
      case 'mazda':
        return ToyotaLogo; // Similar style
      case 'subaru':
        return ToyotaLogo; // Similar style
      case 'mitsubishi':
        return ToyotaLogo; // Similar style
        
      // Americanas
      case 'chevrolet':
      case 'gm':
      case 'cadillac':
      case 'buick':
        return ChevroletLogo;
      case 'ford':
      case 'lincoln':
        return FordLogo;
      case 'jeep':
      case 'dodge':
      case 'ram':
      case 'chrysler':
        return FordLogo; // Similar oval style
        
      // Europeias
      case 'fiat':
        return FiatLogo;
      case 'renault':
        return FiatLogo; // Similar style
      case 'peugeot':
      case 'citroen':
        return FiatLogo; // Similar style
      case 'volvo':
        return FordLogo; // Similar oval style
        
      // Coreanas
      case 'hyundai':
      case 'kia':
      case 'genesis':
        return HondaLogo; // Similar H style
        
      // Britânicas
      case 'landrover':
      case 'jaguar':
      case 'mini':
        return FordLogo; // Similar oval style
      case 'rollsroyce':
      case 'bentley':
        return MercedesStarLogo; // Similar premium style
      case 'astonmartin':
        return PorscheLogo; // Similar shield style
        
      // Italianas
      case 'ferrari':
      case 'lamborghini':
      case 'maserati':
      case 'alfaromeo':
        return PorscheLogo; // Similar shield style
        
      default:
        return GenericLogo;
    }
  }, [brand]);

  const logoProps: BrandLogoProps = {
    phase,
    glowColor,
    className,
  };

  return <LogoComponent {...logoProps} />;
});
