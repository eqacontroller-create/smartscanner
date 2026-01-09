import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface JarvisTestButtonProps {
  onTest: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function JarvisTestButton({ onTest, isSpeaking, isSupported }: JarvisTestButtonProps) {
  if (!isSupported) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onTest}
            disabled={isSpeaking}
            className={`h-8 w-8 sm:h-9 sm:w-9 relative ${
              isSpeaking ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isSpeaking ? (
              <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            ) : (
              <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
            {isSpeaking && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full animate-ping" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Testar áudio Jarvis</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
