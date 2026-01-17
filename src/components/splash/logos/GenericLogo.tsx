import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Car } from 'lucide-react';
import type { BrandLogoProps } from './types';

/**
 * Logo genérico - Ícone de carro com pulse
 */
export const GenericLogo = memo(function GenericLogo({ 
  phase, 
  glowColor,
  className 
}: BrandLogoProps) {
  const isActive = phase !== 'ignition';
  const isReady = phase === 'ready' || phase === 'exiting';
  
  return (
    <div 
      className={cn(
        "relative transition-all duration-700",
        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90',
        isReady && 'animate-[logo-pulse_2s_ease-in-out_infinite]',
        className
      )}
    >
      {/* Glow atrás do ícone */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full blur-xl transition-opacity duration-500",
          isReady ? 'opacity-50' : 'opacity-0'
        )}
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        }}
      />
      
      {/* Círculo de fundo */}
      <div 
        className="relative w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, hsl(0 0% 15%) 0%, hsl(0 0% 8%) 100%)`,
          boxShadow: isReady 
            ? `0 0 30px ${glowColor.replace(')', ' / 0.4)')}, inset 0 0 20px ${glowColor.replace(')', ' / 0.1)')}`
            : 'none',
          border: `2px solid ${glowColor}`,
        }}
      >
        <Car 
          size={36} 
          style={{ color: glowColor }}
          className={cn(
            "transition-all duration-500",
            isReady && 'drop-shadow-lg'
          )}
        />
      </div>
    </div>
  );
});
