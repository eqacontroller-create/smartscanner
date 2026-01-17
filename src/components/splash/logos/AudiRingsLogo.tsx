import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { BrandLogoProps } from './types';

/**
 * Audi - 4 anéis que aparecem sequencialmente e se conectam
 */
export const AudiRingsLogo = memo(function AudiRingsLogo({ 
  phase, 
  glowColor,
  className 
}: BrandLogoProps) {
  const isActive = phase !== 'ignition';
  const isReady = phase === 'ready' || phase === 'exiting';
  
  return (
    <svg 
      viewBox="0 0 200 50" 
      className={cn("w-48 h-12", className)}
      aria-label="Audi logo"
    >
      <defs>
        <filter id="audi-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* 4 anéis interconectados */}
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={35 + i * 35}
          cy={25}
          r={18}
          fill="none"
          stroke={glowColor}
          strokeWidth={2.5}
          className={cn(
            'transition-all duration-700 ease-out',
            isActive 
              ? 'opacity-100' 
              : 'opacity-0'
          )}
          style={{
            transitionDelay: `${i * 120}ms`,
            filter: isReady ? 'url(#audi-glow)' : 'none',
            transform: isActive ? 'scale(1)' : 'scale(0.8)',
            transformOrigin: `${35 + i * 35}px 25px`,
          }}
        />
      ))}
    </svg>
  );
});
