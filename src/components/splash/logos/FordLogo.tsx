import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { BrandLogoProps } from './types';

/**
 * Ford - Oval azul com texto Ford
 */
export const FordLogo = memo(function FordLogo({ 
  phase, 
  glowColor,
  className 
}: BrandLogoProps) {
  const isActive = phase !== 'ignition';
  const isReady = phase === 'ready' || phase === 'exiting';
  
  return (
    <svg 
      viewBox="0 0 120 60" 
      className={cn("w-28 h-14", className)}
      aria-label="Ford logo"
    >
      <defs>
        <filter id="ford-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Oval externo */}
      <ellipse 
        cx={60} 
        cy={30} 
        rx={55} 
        ry={26}
        fill="none"
        stroke={glowColor}
        strokeWidth={3}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          filter: isReady ? 'url(#ford-glow)' : 'none',
        }}
      />
      
      {/* Preenchimento do oval */}
      <ellipse 
        cx={60} 
        cy={30} 
        rx={52} 
        ry={23}
        fill={glowColor}
        opacity={0.15}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-15' : 'opacity-0',
          isReady && 'animate-pulse'
        )}
        style={{
          transitionDelay: '200ms',
        }}
      />
      
      {/* Texto Ford em script */}
      <text 
        x="60" 
        y="38" 
        textAnchor="middle" 
        fill={glowColor}
        fontSize="22"
        fontWeight="normal"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0',
          isReady && 'animate-[logo-pulse_2s_ease-in-out_infinite]'
        )}
        style={{ 
          transitionDelay: '300ms',
          filter: isReady ? 'url(#ford-glow)' : 'none',
        }}
      >
        Ford
      </text>
    </svg>
  );
});
