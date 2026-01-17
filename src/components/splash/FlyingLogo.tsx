import { memo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { BrandLogo } from './logos';
import type { SplashPhase } from '@/hooks/useSplashScreen';
import type { SplashTheme } from '@/lib/splashThemes';

interface FlyingLogoProps {
  phase: SplashPhase;
  theme: SplashTheme;
  glowColor: string;
}

/**
 * Logo que "voa" da splash screen para o header durante a transição
 * Usa position fixed para animar entre as duas posições
 */
export const FlyingLogo = memo(function FlyingLogo({ 
  phase, 
  theme,
  glowColor 
}: FlyingLogoProps) {
  const [hasFlown, setHasFlown] = useState(false);
  const isExiting = phase === 'exiting';
  
  // Mark as flown after animation completes
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        setHasFlown(true);
      }, 700); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isExiting]);
  
  // Don't render if already flown or hidden
  if (phase === 'hidden' || hasFlown) {
    return null;
  }
  
  // Calculate target position (header area - top left corner)
  // These values align with AppHeader's logo position
  const targetLeft = '1rem'; // matches container padding
  const targetTop = '0.75rem'; // matches header padding
  const targetScale = 0.35; // scale down to header size
  
  return (
    <div
      className={cn(
        "fixed z-[10000] pointer-events-none transition-all duration-700 ease-out",
        isExiting && "!duration-700"
      )}
      style={{
        // Start position: center of screen
        left: isExiting ? targetLeft : '50%',
        top: isExiting ? targetTop : '45%',
        transform: isExiting 
          ? `translate(0, 0) scale(${targetScale})` 
          : 'translate(-50%, -50%) scale(1)',
        opacity: isExiting ? 0 : 1, // Fade out as it lands
        transformOrigin: 'top left',
      }}
    >
      <BrandLogo 
        brand={theme.brand}
        phase={phase}
        glowColor={glowColor}
      />
    </div>
  );
});
