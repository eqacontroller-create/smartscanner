import { useState } from 'react';
import { Mic, MicOff, Loader2, Volume2, X, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface JarvisFloatingWidgetProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  isEnabled: boolean;
  error: string | null;
  lastTranscript: string;
  lastResponse: string;
  conversationHistory: Message[];
  onToggleListening: () => void;
  onClearHistory: () => void;
}

export function JarvisFloatingWidget({
  isListening,
  isProcessing,
  isSpeaking,
  isSupported,
  isEnabled,
  error,
  lastTranscript,
  lastResponse,
  conversationHistory,
  onToggleListening,
  onClearHistory,
}: JarvisFloatingWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isEnabled || !isSupported) return null;

  const getStatusText = () => {
    if (error) return error;
    if (isProcessing) return 'Pensando...';
    if (isSpeaking) return 'Falando...';
    if (isListening) return 'Escutando...';
    return 'Toque para falar';
  };

  const getStatusIcon = () => {
    if (isProcessing) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (isSpeaking) return <Volume2 className="h-5 w-5 animate-pulse" />;
    if (isListening) return <Mic className="h-5 w-5" />;
    return <Mic className="h-5 w-5" />;
  };

  // Widget minimizado - só mostra bolha
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 safe-area-bottom">
        <Button
          onClick={() => setIsMinimized(false)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            isListening && "bg-primary animate-pulse",
            isSpeaking && "bg-accent",
            !isListening && !isSpeaking && "bg-card border border-border hover:bg-muted"
          )}
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 safe-area-bottom">
      <div className={cn(
        "bg-card border border-border rounded-2xl shadow-xl transition-all duration-300 overflow-hidden",
        isExpanded ? "w-80" : "w-72"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isListening && "bg-primary animate-pulse",
              isSpeaking && "bg-accent animate-pulse",
              isProcessing && "bg-warning animate-pulse",
              !isListening && !isSpeaking && !isProcessing && "bg-muted-foreground"
            )} />
            <span className="text-sm font-medium">Jarvis</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Histórico expandido */}
        {isExpanded && conversationHistory.length > 0 && (
          <ScrollArea className="h-40 p-3 border-b border-border">
            <div className="space-y-2">
              {conversationHistory.slice(-6).map((msg, i) => (
                <div 
                  key={i}
                  className={cn(
                    "text-xs p-2 rounded-lg",
                    msg.role === 'user' 
                      ? "bg-primary/10 text-primary ml-4" 
                      : "bg-muted mr-4"
                  )}
                >
                  <span className="font-medium">
                    {msg.role === 'user' ? 'Você: ' : 'Jarvis: '}
                  </span>
                  {msg.content}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Última interação */}
        <div className="p-3 space-y-2">
          {/* Transcrição atual (quando escutando ou processando) */}
          {(isListening || lastTranscript) && !lastResponse && (
            <div className="bg-primary/10 rounded-lg p-2">
              <p className="text-xs text-muted-foreground mb-1">Você disse:</p>
              <p className="text-sm text-foreground">
                {isListening && !lastTranscript ? (
                  <span className="text-muted-foreground italic">Aguardando...</span>
                ) : (
                  lastTranscript || '...'
                )}
              </p>
            </div>
          )}

          {/* Última resposta */}
          {lastResponse && (
            <div className="bg-muted rounded-lg p-2">
              <p className="text-xs text-muted-foreground mb-1">Jarvis:</p>
              <p className="text-sm text-foreground">{lastResponse}</p>
            </div>
          )}

          {/* Estado vazio */}
          {!lastTranscript && !lastResponse && !isListening && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Pergunte algo como "Como está o motor?"
            </p>
          )}
        </div>

        {/* Controles */}
        <div className="p-3 pt-0 flex items-center gap-2">
          <Button
            onClick={onToggleListening}
            disabled={isProcessing}
            className={cn(
              "flex-1 gap-2 transition-all duration-300",
              isListening && "bg-primary text-primary-foreground",
              isSpeaking && "bg-accent text-accent-foreground"
            )}
            variant={isListening || isSpeaking ? "default" : "outline"}
          >
            {getStatusIcon()}
            <span className="text-sm">{getStatusText()}</span>
          </Button>
          
          {conversationHistory.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
              onClick={onClearHistory}
              title="Limpar histórico"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Indicador de escuta animado */}
        {isListening && (
          <div className="h-1 bg-primary/20 overflow-hidden">
            <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
}
