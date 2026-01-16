/**
 * CaptureButton - Botão premium glassmorphism para captura de foto/vídeo
 */

import { Camera, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisType } from '@/types/visionTypes';

interface CaptureButtonProps {
  type: AnalysisType;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const buttonConfig = {
  photo: {
    icon: Camera,
    title: 'Identificar Peça/Luz',
    description: 'Tire uma foto do motor ou painel',
    emoji: '📸',
  },
  video: {
    icon: Video,
    title: 'Diagnosticar Barulho',
    description: 'Grave um vídeo curto do motor',
    emoji: '📹',
  },
};

export function CaptureButton({ type, onClick, disabled, className }: CaptureButtonProps) {
  const config = buttonConfig[type];
  const Icon = config.icon;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative overflow-hidden',
        'h-44 flex-1 min-w-[160px]',
        'rounded-2xl',
        'border-2 border-border/50 hover:border-primary/40',
        'bg-card/50 backdrop-blur-xl',
        'hover:bg-card/80',
        'transition-all duration-300 ease-out',
        'hover:shadow-[0_0_40px_-10px] hover:shadow-primary/30',
        'active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Animated ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-20 h-20 rounded-full border-2 border-primary/10 group-hover:border-primary/30 group-hover:scale-125 transition-all duration-500" />
        <div className="absolute w-24 h-24 rounded-full border border-primary/5 group-hover:border-primary/20 group-hover:scale-150 transition-all duration-700" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-3 p-4">
        {/* Emoji with glow */}
        <span className="text-4xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
          {config.emoji}
        </span>
        
        {/* Icon with animated glow */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Icon className="relative h-8 w-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)] group-hover:drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)] transition-all duration-300" />
        </div>
        
        {/* Text */}
        <div className="space-y-1 text-center">
          <p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
            {config.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {config.description}
          </p>
        </div>
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-primary/20 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-primary/20 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-primary/20 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-primary/20 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}
