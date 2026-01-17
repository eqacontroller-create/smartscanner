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
}

/**
 * Logo que "voa" da splash screen para o header durante a transição
 * OTIMIZADO: Reduzido partículas, GPU acceleration, CSS simples
 */
export const FlyingLogo = memo(function FlyingLogo({ 
  phase, 
  theme,
  glowColor 
}: FlyingLogoProps) {
  const [hasFlown, setHasFlown] = useState(false);
  const isExiting = phase === 'exiting';
  
  // Generate FEWER particles for trail effect (8 instead of 20)
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      offsetX: (Math.random() - 0.5) * 60,
      offsetY: (Math.random() - 0.5) * 30,
      size: Math.random() * 4 + 2, // 2-6px (smaller)
      delay: i * 0.04, // Sequential delay
      duration: 0.5 + Math.random() * 0.2,
    }));
  }, []);
  
  // Mark as flown after animation completes
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        setHasFlown(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isExiting]);
  
  // Don't render if already flown or hidden
  if (phase === 'hidden' || hasFlown) {
    return null;
  }
  
  // Calculate target position (header area)
  const targetLeft = '1rem';
  const targetTop = '0.75rem';
  const targetScale = 0.35;
  
  return (
    <>
      {/* Optimized particle trail - GPU accelerated, fewer elements */}
      {isExiting && (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full gpu-accelerated"
              style={{
                left: '50%',
                top: '45%',
                width: particle.size,
                height: particle.size,
                backgroundColor: glowColor,
                boxShadow: `0 0 ${particle.size}px ${glowColor}`,
                opacity: 0,
                willChange: 'transform, opacity',
                transform: 'translateZ(0)',
                '--particle-offset-x': `${particle.offsetX}px`,
                '--particle-offset-y': `${particle.offsetY}px`,
                '--particle-end-x': `calc(-50% + 1rem + 48px)`,
                '--particle-end-y': `calc(-45% + 0.75rem + 24px)`,
                animation: `particle-trail-optimized ${particle.duration}s ease-out forwards`,
                animationDelay: `${particle.delay}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
      
      {/* Main flying logo - GPU accelerated */}
      <div
        className={cn(
          "fixed z-[10000] pointer-events-none gpu-accelerated",
          isExiting && "flying-logo-exit"
        )}
        style={{
          left: isExiting ? targetLeft : '50%',
          top: isExiting ? targetTop : '45%',
          transform: isExiting 
            ? `translate3d(0, 0, 0) scale(${targetScale})` 
            : 'translate3d(-50%, -50%, 0) scale(1)',
          opacity: isExiting ? 0 : 1,
          transformOrigin: 'top left',
          willChange: 'transform, opacity',
          transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease-out',
        }}
      >
        {/* Simple glow trail - CSS only, no heavy filters */}
        {isExiting && (
          <div
            className="absolute inset-0 gpu-accelerated"
            style={{
              background: `radial-gradient(ellipse at center, ${glowColor}30 0%, transparent 60%)`,
              transform: 'scale(2.5) translateZ(0)',
              opacity: 0.6,
              animation: 'logo-glow-fade 0.7s ease-out forwards',
            }}
          />
        )}
        
        <BrandLogo 
          brand={theme.brand}
          phase={phase}
          glowColor={glowColor}
        />
      </div>
      
      {/* Inline optimized keyframes */}
      <style>{`
        .gpu-accelerated {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        @keyframes particle-trail-optimized {
          0% {
            opacity: 0.9;
            transform: translate3d(var(--particle-offset-x), var(--particle-offset-y), 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--particle-end-x), var(--particle-end-y), 0) scale(0);
          }
        }
        
        @keyframes logo-glow-fade {
          0% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
});
