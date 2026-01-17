import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { BrandLogoProps } from './types';

/**
 * BMW - Hélice/Roundel que gira durante boot
 */
export const BMWLogo = memo(function BMWLogo({ 
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
      aria-label="BMW logo"
    >
      <defs>
        <filter id="bmw-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.5" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <clipPath id="bmw-clip">
          <circle cx="50" cy="50" r="42" />
        </clipPath>
      </defs>
      
      {/* Círculo externo escuro */}
      <circle 
        cx={50} 
        cy={50} 
        r={48} 
        fill="hsl(0 0% 8%)"
        stroke={glowColor}
        strokeWidth={2}
        className={cn(
          'transition-all duration-500',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          filter: isReady ? 'url(#bmw-glow)' : 'none',
        }}
      />
      
      {/* Quadrantes que giram */}
      <g 
        clipPath="url(#bmw-clip)"
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0',
          isBoot && 'animate-[spin_2s_ease-out]'
        )}
        style={{ 
          transformOrigin: '50px 50px',
        }}
      >
        {/* Quadrante superior-direito - Azul */}
        <path 
          d="M50 8 A42 42 0 0 1 92 50 L50 50 Z" 
          fill="hsl(210 100% 45%)"
        />
        {/* Quadrante inferior-direito - Branco */}
        <path 
          d="M92 50 A42 42 0 0 1 50 92 L50 50 Z" 
          fill="hsl(0 0% 95%)"
        />
        {/* Quadrante inferior-esquerdo - Azul */}
        <path 
          d="M50 92 A42 42 0 0 1 8 50 L50 50 Z" 
          fill="hsl(210 100% 45%)"
        />
        {/* Quadrante superior-esquerdo - Branco */}
        <path 
          d="M8 50 A42 42 0 0 1 50 8 L50 50 Z" 
          fill="hsl(0 0% 95%)"
        />
      </g>
      
      {/* Texto BMW */}
      <text 
        x="50" 
        y="20" 
        textAnchor="middle" 
        fill="hsl(0 0% 85%)"
        fontSize="9"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{ transitionDelay: '300ms' }}
      >
        BMW
      </text>
    </svg>
  );
});
