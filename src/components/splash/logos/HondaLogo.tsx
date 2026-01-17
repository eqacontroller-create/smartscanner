import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { BrandLogoProps } from './types';

/**
 * Honda - H estilizado com stroke animation
 */
export const HondaLogo = memo(function HondaLogo({ 
  phase, 
  glowColor,
  className 
}: BrandLogoProps) {
  const isActive = phase !== 'ignition';
  const isReady = phase === 'ready' || phase === 'exiting';
  const isBoot = phase === 'boot';
  
  return (
    <svg 
      viewBox="0 0 100 80" 
      className={cn("w-24 h-16", className)}
      aria-label="Honda logo"
    >
      <defs>
        <filter id="honda-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* H estilizado */}
      <g 
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          filter: isReady ? 'url(#honda-glow)' : 'none',
        }}
      >
        {/* Perna esquerda do H */}
        <path
          d="M20 10 L20 70"
          fill="none"
          stroke={glowColor}
          strokeWidth={6}
          strokeLinecap="round"
          style={{
            strokeDasharray: isBoot ? '60' : '0',
            strokeDashoffset: isBoot ? '60' : '0',
            animation: isBoot ? 'draw-stroke 0.6s ease-out forwards' : 'none',
          }}
        />
        
        {/* Perna direita do H */}
        <path
          d="M80 10 L80 70"
          fill="none"
          stroke={glowColor}
          strokeWidth={6}
          strokeLinecap="round"
          style={{
            strokeDasharray: isBoot ? '60' : '0',
            strokeDashoffset: isBoot ? '60' : '0',
            animation: isBoot ? 'draw-stroke 0.6s ease-out 0.2s forwards' : 'none',
          }}
        />
        
        {/* Travessão superior esquerdo */}
        <path
          d="M20 10 L35 10"
          fill="none"
          stroke={glowColor}
          strokeWidth={6}
          strokeLinecap="round"
          style={{
            strokeDasharray: isBoot ? '15' : '0',
            strokeDashoffset: isBoot ? '15' : '0',
            animation: isBoot ? 'draw-stroke 0.4s ease-out 0.4s forwards' : 'none',
          }}
        />
        
        {/* Travessão superior direito */}
        <path
          d="M65 10 L80 10"
          fill="none"
          stroke={glowColor}
          strokeWidth={6}
          strokeLinecap="round"
          style={{
            strokeDasharray: isBoot ? '15' : '0',
            strokeDashoffset: isBoot ? '15' : '0',
            animation: isBoot ? 'draw-stroke 0.4s ease-out 0.4s forwards' : 'none',
          }}
        />
        
        {/* Barra central (inclinada para dentro) */}
        <path
          d="M28 40 L72 40"
          fill="none"
          stroke={glowColor}
          strokeWidth={5}
          strokeLinecap="round"
          className={isReady ? 'animate-[logo-pulse_2s_ease-in-out_infinite]' : ''}
          style={{
            strokeDasharray: isBoot ? '44' : '0',
            strokeDashoffset: isBoot ? '44' : '0',
            animation: isBoot ? 'draw-stroke 0.5s ease-out 0.6s forwards' : undefined,
          }}
        />
      </g>
      
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
