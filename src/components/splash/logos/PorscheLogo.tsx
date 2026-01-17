import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { BrandLogoProps } from './types';

/**
 * Porsche - Escudo simplificado com cavalo estilizado
 */
export const PorscheLogo = memo(function PorscheLogo({ 
  phase, 
  glowColor,
  className 
}: BrandLogoProps) {
  const isActive = phase !== 'ignition';
  const isReady = phase === 'ready' || phase === 'exiting';
  
  return (
    <svg 
      viewBox="0 0 80 100" 
      className={cn("w-16 h-20", className)}
      aria-label="Porsche logo"
    >
      <defs>
        <filter id="porsche-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <clipPath id="shield-clip">
          <path d="M40 5 L75 20 L75 65 Q75 90 40 95 Q5 90 5 65 L5 20 Z" />
        </clipPath>
      </defs>
      
      {/* Contorno do escudo */}
      <path
        d="M40 5 L75 20 L75 65 Q75 90 40 95 Q5 90 5 65 L5 20 Z"
        fill="none"
        stroke={glowColor}
        strokeWidth={3}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          filter: isReady ? 'url(#porsche-glow)' : 'none',
        }}
      />
      
      {/* Preenchimento animado do escudo */}
      <rect
        x="5" y="95"
        width="70" height="90"
        fill={glowColor}
        opacity={0.3}
        clipPath="url(#shield-clip)"
        className={cn(
          'transition-all duration-1000',
          isActive ? 'opacity-30' : 'opacity-0'
        )}
        style={{
          transform: isActive ? 'translateY(-90px)' : 'translateY(0)',
          transitionDelay: '200ms',
        }}
      />
      
      {/* Texto PORSCHE */}
      <text 
        x="40" 
        y="25" 
        textAnchor="middle" 
        fill={glowColor}
        fontSize="8"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
        letterSpacing="1"
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0',
          isReady && 'animate-[logo-pulse_2s_ease-in-out_infinite]'
        )}
        style={{ 
          transitionDelay: '400ms',
          filter: isReady ? 'url(#porsche-glow)' : 'none',
        }}
      >
        PORSCHE
      </text>
      
      {/* Cavalo estilizado simplificado */}
      <path
        d="M30 45 Q40 35 50 45 L48 55 Q40 50 32 55 Z M38 60 L42 60 L42 75 L38 75 Z"
        fill={glowColor}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{ 
          transitionDelay: '600ms',
          filter: isReady ? 'url(#porsche-glow)' : 'none',
        }}
      />
    </svg>
  );
});
