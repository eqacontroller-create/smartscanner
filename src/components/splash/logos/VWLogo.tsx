import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { BrandLogoProps } from './types';

/**
 * Volkswagen - VW com pulse e glow azul característico
 */
export const VWLogo = memo(function VWLogo({ 
  phase, 
  glowColor,
  className 
}: BrandLogoProps) {
  const isActive = phase !== 'ignition';
  const isReady = phase === 'ready' || phase === 'exiting';
  
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={cn("w-20 h-20", className)}
      aria-label="Volkswagen logo"
    >
      <defs>
        <filter id="vw-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Círculo externo */}
      <circle 
        cx={50} 
        cy={50} 
        r={46} 
        fill="none" 
        stroke={glowColor}
        strokeWidth={4}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0',
          isReady && 'animate-[logo-pulse_2s_ease-in-out_infinite]'
        )}
        style={{
          filter: isReady ? 'url(#vw-glow)' : 'none',
        }}
      />
      
      {/* VW Letters */}
      <g 
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0',
          isReady && 'animate-[logo-pulse_2s_ease-in-out_infinite]'
        )}
        style={{
          filter: isReady ? 'url(#vw-glow)' : 'none',
          transitionDelay: '200ms',
        }}
      >
        {/* V */}
        <path
          d="M25 25 L50 70 L58 50"
          fill="none"
          stroke={glowColor}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* W */}
        <path
          d="M42 50 L50 70 L75 25"
          fill="none"
          stroke={glowColor}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Linha horizontal do W */}
        <path
          d="M35 38 L65 38"
          fill="none"
          stroke={glowColor}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
});
