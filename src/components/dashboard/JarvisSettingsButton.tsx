import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface JarvisSettingsButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function JarvisSettingsButton({ onClick, disabled }: JarvisSettingsButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <span className="sr-only">Configurações do Jarvis</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Configurações do Jarvis</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
