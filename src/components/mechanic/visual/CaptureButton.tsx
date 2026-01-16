/**
 * CaptureButton - Botão grande para captura de foto/vídeo
 */

import { Button } from '@/components/ui/button';
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
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-auto flex-col gap-2 p-6 text-center',
        'border-2 border-dashed hover:border-primary hover:bg-primary/5',
        'transition-all duration-200',
        'min-w-[140px] flex-1',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span className="text-3xl">{config.emoji}</span>
      <Icon className="h-8 w-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{config.title}</p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </div>
    </Button>
  );
}
