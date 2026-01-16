import { useState } from 'react';
import { Mic, MicOff, Loader2, Volume2, X, ChevronUp, ChevronDown, Sparkles, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface JarvisFloatingWidgetProps {
  isListening: boolean;
  isContinuousMode: boolean;
  isWakeWordDetected: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  isEnabled: boolean;
  continuousListeningEnabled: boolean;
  wakeWord: string;
  error: string | null;
  lastTranscript: string;
  interimTranscript: string;
  lastResponse: string;
  conversationHistory: Message[];
  onToggleListening: () => void;
  onToggleContinuousMode: () => void;
  onClearHistory: () => void;
}

export function JarvisFloatingWidget({
  isListening,
  isContinuousMode,
  isWakeWordDetected,
  isProcessing,
  isSpeaking,
  isSupported,
  isEnabled,
  continuousListeningEnabled,
  wakeWord,
  error,
  lastTranscript,
  interimTranscript,
  lastResponse,
  conversationHistory,
  onToggleListening,
  onToggleContinuousMode,
  onClearHistory,
}: JarvisFloatingWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isEnabled || !isSupported) return null;

  const getStatusText = () => {
    if (error) return error;
    if (isProcessing) return 'Pensando...';
    if (isSpeaking) return 'Falando...';
    if (isWakeWordDetected) return 'Wake word detectada!';
    if (isContinuousMode && isListening) return `Diga "${wakeWord}"...`;
    if (isListening) return 'Escutando...';
    if (isContinuousMode) return 'Modo contínuo pausado';
    return 'Toque para falar';
  };

  const getStatusIcon = () => {
    if (isProcessing) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (isSpeaking) return <Volume2 className="h-5 w-5 animate-pulse" />;
    if (isContinuousMode) return <Radio className="h-5 w-5" />;
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
            isContinuousMode && isListening && "bg-accent animate-pulse",
            isWakeWordDetected && "bg-primary animate-bounce",
            isListening && !isContinuousMode && "bg-primary animate-pulse",
            isSpeaking && "bg-accent",
            !isListening && !isSpeaking && "bg-card border border-border hover:bg-muted"
          )}
        >
          {isContinuousMode ? <Radio className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-2 sm:right-4 z-50 safe-area-bottom safe-area-x">
      <div className={cn(
        "bg-card border border-border rounded-2xl shadow-xl transition-all duration-300 overflow-hidden",
        "w-[calc(100vw-1rem)] max-w-72 sm:max-w-80",
        isExpanded && "max-w-80 sm:max-w-96",
        isWakeWordDetected && "border-primary"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-3 border-b border-border transition-colors",
          isContinuousMode ? "bg-accent/10" : "bg-muted/30"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full transition-colors",
              isWakeWordDetected && "bg-primary animate-ping",
              isContinuousMode && isListening && "bg-accent animate-pulse",
              isListening && !isContinuousMode && "bg-primary animate-pulse",
              isSpeaking && "bg-accent animate-pulse",
              isProcessing && "bg-warning animate-pulse",
              !isListening && !isSpeaking && !isProcessing && "bg-muted-foreground"
            )} />
            <span className="text-sm font-medium">Jarvis</span>
            {isContinuousMode && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
                CONTÍNUO
              </span>
            )}
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
          {/* Transcrição em tempo real (modo contínuo) */}
          {isContinuousMode && isListening && interimTranscript && (
            <div className="bg-accent/10 rounded-lg p-2 border border-accent/20">
              <p className="text-xs text-muted-foreground mb-1">Ouvindo:</p>
              <p className="text-sm text-foreground italic">{interimTranscript}</p>
            </div>
          )}

          {/* Transcrição atual (quando escutando ou processando) */}
          {((isListening && !isContinuousMode) || lastTranscript) && !lastResponse && !interimTranscript && (
            <div className={cn(
              "rounded-lg p-2",
              isWakeWordDetected ? "bg-primary/20 border border-primary/30" : "bg-primary/10"
            )}>
              <p className="text-xs text-muted-foreground mb-1">
                {isWakeWordDetected ? '🎯 Wake word detectada:' : 'Você disse:'}
              </p>
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
          {!lastTranscript && !lastResponse && !isListening && !interimTranscript && (
            <p className="text-xs text-muted-foreground text-center py-2">
              {isContinuousMode 
                ? `Diga "${wakeWord}" seguido do comando`
                : 'Pergunte algo como "Como está o motor?"'
              }
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
              isContinuousMode && isListening && "bg-accent text-accent-foreground",
              isListening && !isContinuousMode && "bg-primary text-primary-foreground",
              isSpeaking && "bg-accent text-accent-foreground"
            )}
            variant={isListening || isSpeaking ? "default" : "outline"}
          >
            {getStatusIcon()}
            <span className="text-sm truncate">{getStatusText()}</span>
          </Button>

          {/* Botão de modo contínuo */}
          {continuousListeningEnabled && (
            <Button
              variant={isContinuousMode ? "default" : "ghost"}
              size="icon"
              className={cn(
                "h-9 w-9 transition-colors",
                isContinuousMode && "bg-accent text-accent-foreground"
              )}
              onClick={onToggleContinuousMode}
              title={isContinuousMode ? "Desativar modo contínuo" : "Ativar modo contínuo"}
              disabled={isProcessing}
            >
              <Radio className="h-4 w-4" />
            </Button>
          )}
          
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
          <div className={cn(
            "h-1 overflow-hidden",
            isContinuousMode ? "bg-accent/20" : "bg-primary/20"
          )}>
            <div 
              className={cn(
                "h-full animate-pulse",
                isContinuousMode ? "bg-accent" : "bg-primary",
                isWakeWordDetected && "animate-bounce bg-primary"
              )} 
              style={{ width: '100%' }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
