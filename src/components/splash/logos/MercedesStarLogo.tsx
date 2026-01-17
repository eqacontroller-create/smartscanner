import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { BrandLogoProps } from './types';

/**
 * Mercedes-Benz - Estrela de 3 pontas que gira suavemente com glow premium
 */
export const MercedesStarLogo = memo(function MercedesStarLogo({ 
  phase, 
  glowColor,
  className 
}: BrandLogoProps) {
  const isActive = phase !== 'ignition';
  const isReady = phase === 'ready' || phase === 'exiting';
  const isBoot = phase === 'boot';
  
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={cn("w-20 h-20", className)}
      aria-label="Mercedes-Benz logo"
      style={{ transform: 'translateZ(0)', willChange: 'transform' }}
    >
      {/* OPTIMIZED: Removed heavy SVG filters, using CSS filter instead */}
      <defs>
        <linearGradient id="mercedes-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="1" />
          <stop offset="50%" stopColor={glowColor} stopOpacity="0.85" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="1" />
        </linearGradient>
      </defs>
      
      {/* Outer circle - CSS filter */}
      <circle 
        cx={50} 
        cy={50} 
        r={45} 
        fill="none" 
        stroke={glowColor}
        strokeWidth={3}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          filter: isReady ? `drop-shadow(0 0 6px ${glowColor})` : 'none',
        }}
      />
      
      {/* Star - GPU accelerated rotation */}
      <g 
        className={cn(
          'transition-all duration-1000',
          isActive ? 'opacity-100' : 'opacity-0',
          isBoot && 'animate-[spin_20s_linear_infinite]',
          isReady && 'animate-[spin_30s_linear_infinite]'
        )}
        style={{ 
          transformOrigin: '50px 50px',
          filter: isReady ? `drop-shadow(0 0 4px ${glowColor})` : 'none',
          willChange: 'transform',
        }}
      >
        {/* 3 linhas da estrela */}
        <line
          x1="50" y1="50" x2="50" y2="12"
          stroke="url(#mercedes-gradient)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <line
          x1="50" y1="50" x2="83" y2="69"
          stroke="url(#mercedes-gradient)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <line
          x1="50" y1="50" x2="17" y2="69"
          stroke="url(#mercedes-gradient)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        
        {/* Centro da estrela */}
        <circle 
          cx={50} 
          cy={50} 
          r={6} 
          fill={glowColor}
        />
      </g>
    </svg>
  );
});
