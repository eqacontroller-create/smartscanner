import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { BrandLogoProps } from './types';

/**
 * Chevrolet - Bowtie dourado com shimmer
 */
export const ChevroletLogo = memo(function ChevroletLogo({ 
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
      aria-label="Chevrolet logo"
    >
      <defs>
        <filter id="chevy-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <linearGradient id="chevy-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.8">
            <animate 
              attributeName="stopOpacity" 
              values="0.8;1;0.8" 
              dur="2s" 
              repeatCount="indefinite" 
            />
          </stop>
          <stop offset="50%" stopColor={glowColor} stopOpacity="1">
            <animate 
              attributeName="stopOpacity" 
              values="1;0.8;1" 
              dur="2s" 
              repeatCount="indefinite" 
            />
          </stop>
          <stop offset="100%" stopColor={glowColor} stopOpacity="0.8">
            <animate 
              attributeName="stopOpacity" 
              values="0.8;1;0.8" 
              dur="2s" 
              repeatCount="indefinite" 
            />
          </stop>
        </linearGradient>
      </defs>
      
      {/* Contorno do bowtie */}
      <path
        d="M5 15 L35 15 L60 5 L85 15 L115 15 L115 45 L85 45 L60 55 L35 45 L5 45 Z"
        fill="none"
        stroke={glowColor}
        strokeWidth={3}
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          filter: isReady ? 'url(#chevy-glow)' : 'none',
        }}
      />
      
      {/* Preenchimento com shimmer */}
      <path
        d="M8 17 L34 17 L60 8 L86 17 L112 17 L112 43 L86 43 L60 52 L34 43 L8 43 Z"
        fill="url(#chevy-gradient)"
        className={cn(
          'transition-all duration-700',
          isActive ? 'opacity-100' : 'opacity-0',
          isReady && 'animate-shimmer'
        )}
        style={{
          transitionDelay: '200ms',
        }}
      />
      
      {/* Linha central horizontal */}
      <line
        x1="8" y1="30"
        x2="112" y2="30"
        stroke="hsl(0 0% 15%)"
        strokeWidth={8}
        className={cn(
          'transition-all duration-500',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          transitionDelay: '400ms',
        }}
      />
    </svg>
  );
});
