import { memo, useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BrandLogo } from './logos';
import type { SplashPhase } from '@/hooks/useSplashScreen';
import type { SplashTheme } from '@/lib/splashThemes';

interface FlyingLogoProps {
  phase: SplashPhase;
  theme: SplashTheme;
  glowColor: string;
}

interface Particle {
  id: number;
  offsetX: number;
  offsetY: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

/**
 * Logo que "voa" da splash screen para o header durante a transição
 * Usa position fixed para animar entre as duas posições
 * Inclui efeito de partículas/faíscas que seguem o logo
 */
export const FlyingLogo = memo(function FlyingLogo({ 
  phase, 
  theme,
  glowColor 
}: FlyingLogoProps) {
  const [hasFlown, setHasFlown] = useState(false);
  const isExiting = phase === 'exiting';
  
  // Generate particles for trail effect
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      offsetX: (Math.random() - 0.5) * 80, // Random X spread
      offsetY: (Math.random() - 0.5) * 40, // Random Y spread
      size: Math.random() * 6 + 2, // 2-8px
      delay: Math.random() * 0.3, // 0-300ms delay
      duration: 0.4 + Math.random() * 0.3, // 400-700ms duration
      opacity: 0.6 + Math.random() * 0.4, // 60-100% opacity
    }));
  }, []);
  
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
  const targetLeft = '1rem';
  const targetTop = '0.75rem';
  const targetScale = 0.35;
  
  return (
    <>
      {/* Particle trail - only visible during exit */}
      {isExiting && (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full animate-particle-trail"
              style={{
                // Start from center, animate to top-left
                left: '50%',
                top: '45%',
                width: particle.size,
                height: particle.size,
                backgroundColor: glowColor,
                boxShadow: `0 0 ${particle.size * 2}px ${glowColor}, 0 0 ${particle.size * 4}px ${glowColor}`,
                opacity: 0,
                '--particle-offset-x': `${particle.offsetX}px`,
                '--particle-offset-y': `${particle.offsetY}px`,
                '--particle-end-x': `calc(-50% + 1rem + 48px + ${particle.offsetX * 0.3}px)`,
                '--particle-end-y': `calc(-45% + 0.75rem + 24px + ${particle.offsetY * 0.3}px)`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              } as React.CSSProperties}
            />
          ))}
          
          {/* Sparkle bursts along the path */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute animate-sparkle-burst"
              style={{
                left: `calc(50% - ${i * 10}%)`,
                top: `calc(45% - ${i * 8}%)`,
                width: 4,
                height: 4,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {/* 4-point star sparkle */}
              <svg viewBox="0 0 20 20" className="w-5 h-5 -translate-x-1/2 -translate-y-1/2">
                <path
                  d="M10 0 L10 20 M0 10 L20 10 M3 3 L17 17 M17 3 L3 17"
                  stroke={glowColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  style={{
                    filter: `drop-shadow(0 0 4px ${glowColor})`,
                  }}
                />
              </svg>
            </div>
          ))}
        </div>
      )}
      
      {/* Main flying logo */}
      <div
        className={cn(
          "fixed z-[10000] pointer-events-none transition-all duration-700 ease-out",
          isExiting && "!duration-700"
        )}
        style={{
          left: isExiting ? targetLeft : '50%',
          top: isExiting ? targetTop : '45%',
          transform: isExiting 
            ? `translate(0, 0) scale(${targetScale})` 
            : 'translate(-50%, -50%) scale(1)',
          opacity: isExiting ? 0 : 1,
          transformOrigin: 'top left',
        }}
      >
        {/* Glow trail behind logo during flight */}
        {isExiting && (
          <div
            className="absolute inset-0 animate-logo-trail-glow"
            style={{
              background: `radial-gradient(ellipse at center, ${glowColor}40 0%, transparent 70%)`,
              filter: `blur(20px)`,
              transform: 'scale(3)',
            }}
          />
        )}
        
        <BrandLogo 
          brand={theme.brand}
          phase={phase}
          glowColor={glowColor}
        />
      </div>
    </>
  );
});
