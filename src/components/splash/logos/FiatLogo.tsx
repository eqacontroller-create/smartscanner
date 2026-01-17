import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { BrandLogoProps } from './types';

/**
 * Fiat - Letras que aparecem uma a uma
 */
export const FiatLogo = memo(function FiatLogo({ 
  phase, 
  glowColor,
  className 
}: BrandLogoProps) {
  const isActive = phase !== 'ignition';
  const isReady = phase === 'ready' || phase === 'exiting';
  
  const letters = ['F', 'I', 'A', 'T'];
  
  return (
    <svg 
      viewBox="0 0 120 50" 
      className={cn("w-28 h-12", className)}
      aria-label="Fiat logo"
    >
      <defs>
        <filter id="fiat-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Contorno retangular com cantos arredondados */}
      <rect
        x="5" y="5"
        width="110" height="40"
        rx="8" ry="8"
        fill="none"
        stroke={glowColor}
        strokeWidth={3}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          filter: isReady ? 'url(#fiat-glow)' : 'none',
        }}
      />
      
      {/* Letras FIAT */}
      {letters.map((letter, i) => (
        <text 
          key={letter}
          x={22 + i * 25} 
          y="35" 
          textAnchor="middle" 
          fill={glowColor}
          fontSize="24"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          className={cn(
            'transition-all duration-500',
            isActive ? 'opacity-100' : 'opacity-0',
            isReady && 'animate-[logo-pulse_2s_ease-in-out_infinite]'
          )}
          style={{ 
            transitionDelay: `${200 + i * 100}ms`,
            filter: isReady ? 'url(#fiat-glow)' : 'none',
          }}
        >
          {letter}
        </text>
      ))}
      
      {/* Linha vermelha característica */}
      <line
        x1="10" y1="25"
        x2="110" y2="25"
        stroke={glowColor}
        strokeWidth={2}
        opacity={0.3}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-30' : 'opacity-0'
        )}
        style={{ transitionDelay: '600ms' }}
      />
    </svg>
  );
});
