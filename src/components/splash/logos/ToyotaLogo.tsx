import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { BrandLogoProps } from './types';

/**
 * Toyota - 3 elipses que se desenham progressivamente
 */
export const ToyotaLogo = memo(function ToyotaLogo({ 
  phase, 
  glowColor,
  className 
}: BrandLogoProps) {
  const isActive = phase !== 'ignition';
  const isReady = phase === 'ready' || phase === 'exiting';
  const isBoot = phase === 'boot';
  
  return (
    <svg 
      viewBox="0 0 120 80" 
      className={cn("w-28 h-16", className)}
      aria-label="Toyota logo"
    >
      <defs>
        <filter id="toyota-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Elipse externa (maior) */}
      <ellipse 
        cx={60} 
        cy={40} 
        rx={55} 
        ry={35}
        fill="none"
        stroke={glowColor}
        strokeWidth={3}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          filter: isReady ? 'url(#toyota-glow)' : 'none',
          strokeDasharray: isBoot ? '350' : '0',
          strokeDashoffset: isBoot ? '350' : '0',
          animation: isBoot ? 'draw-stroke 1.5s ease-out forwards' : 'none',
        }}
      />
      
      {/* Elipse vertical interna (maior) */}
      <ellipse 
        cx={60} 
        cy={40} 
        rx={28} 
        ry={22}
        fill="none"
        stroke={glowColor}
        strokeWidth={3}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          filter: isReady ? 'url(#toyota-glow)' : 'none',
          transitionDelay: '200ms',
          strokeDasharray: isBoot ? '160' : '0',
          strokeDashoffset: isBoot ? '160' : '0',
          animation: isBoot ? 'draw-stroke 1.2s ease-out 0.3s forwards' : 'none',
        }}
      />
      
      {/* Elipse interna menor (centro) */}
      <ellipse 
        cx={60} 
        cy={40} 
        rx={15} 
        ry={10}
        fill="none"
        stroke={glowColor}
        strokeWidth={3}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0',
          isReady && 'animate-[logo-pulse_2s_ease-in-out_infinite]'
        )}
        style={{
          filter: isReady ? 'url(#toyota-glow)' : 'none',
          transitionDelay: '400ms',
        }}
      />
      
      {/* Animação de desenho */}
      <style>{`
        @keyframes draw-stroke {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </svg>
  );
});
