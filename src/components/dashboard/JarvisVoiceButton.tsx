import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface JarvisVoiceButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  error: string | null;
  onToggle: () => void;
}

export function JarvisVoiceButton({
  isListening,
  isProcessing,
  isSpeaking,
  isSupported,
  error,
  onToggle,
}: JarvisVoiceButtonProps) {
  const getIcon = () => {
    if (!isSupported) return <MicOff className="h-5 w-5" />;
    if (isProcessing) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (isSpeaking) return <Volume2 className="h-5 w-5" />;
    if (isListening) return <Mic className="h-5 w-5" />;
    return <Mic className="h-5 w-5" />;
  };

  const getTooltipText = () => {
    if (!isSupported) return 'Reconhecimento de voz não suportado';
    if (error) return error;
    if (isProcessing) return 'Processando...';
    if (isSpeaking) return 'Jarvis está falando...';
    if (isListening) return 'Escutando... Fale agora!';
    return 'Clique para falar com Jarvis';
  };

  const getButtonState = () => {
    if (!isSupported) return 'disabled';
    if (isProcessing) return 'processing';
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    return 'idle';
  };

  const state = getButtonState();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggle}
            disabled={!isSupported || isProcessing}
            className={cn(
              "relative h-10 w-10 rounded-full transition-all duration-300",
              // Estado idle
              state === 'idle' && "bg-card hover:bg-primary/10 border-border",
              // Escutando - pulsando
              state === 'listening' && "bg-primary/20 border-primary text-primary animate-pulse",
              // Processando
              state === 'processing' && "bg-muted border-muted-foreground/30",
              // Falando
              state === 'speaking' && "bg-accent/20 border-accent text-accent-foreground",
              // Desabilitado
              state === 'disabled' && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Anel animado quando escutando */}
            {state === 'listening' && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
                <span className="absolute inset-[-4px] rounded-full border border-primary/50 animate-pulse" />
              </>
            )}
            
            {/* Ícone principal */}
            <span className={cn(
              "relative z-10",
              state === 'listening' && "text-primary",
              state === 'speaking' && "text-accent"
            )}>
              {getIcon()}
            </span>
            
            {/* Indicador de erro */}
            {error && state === 'idle' && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full flex items-center justify-center">
                <AlertCircle className="h-2 w-2 text-destructive-foreground" />
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="text-xs">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
