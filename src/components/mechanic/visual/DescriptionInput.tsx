/**
 * DescriptionInput - Campo de texto + voz para descrever o problema
 */

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_SUGGESTIONS = [
  { label: 'Barulho estranho', icon: '🔊' },
  { label: 'Vazamento', icon: '💧' },
  { label: 'Luz acesa', icon: '💡' },
  { label: 'Cheiro de queimado', icon: '🔥' },
  { label: 'Vibração', icon: '〰️' },
  { label: 'Não funciona', icon: '❌' },
];

const MAX_CHARS = 300;

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  onVoiceToggle?: () => void;
  isListening?: boolean;
  isVoiceSupported?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function DescriptionInput({
  value,
  onChange,
  onVoiceToggle,
  isListening = false,
  isVoiceSupported = true,
  placeholder = 'Ex: Está fazendo barulho quando acelero...',
  disabled = false,
}: DescriptionInputProps) {
  const handleSuggestionClick = (suggestion: string) => {
    if (disabled) return;
    
    const newValue = value ? `${value}, ${suggestion.toLowerCase()}` : suggestion;
    if (newValue.length <= MAX_CHARS) {
      onChange(newValue);
    }
  };
  
  const charsRemaining = MAX_CHARS - value.length;
  const isNearLimit = charsRemaining <= 50;
  
  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span>Descreva o problema (opcional)</span>
      </div>
      
      {/* Input area */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              onChange(e.target.value);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'min-h-[80px] max-h-[120px] pr-14 resize-none rounded-xl',
            'border-2 border-border/50 focus:border-primary/50',
            'bg-background/50 backdrop-blur-sm',
            isListening && 'border-primary animate-pulse'
          )}
        />
        
        {/* Voice button */}
        {isVoiceSupported && onVoiceToggle && (
          <Button
            type="button"
            variant={isListening ? 'default' : 'secondary'}
            size="icon"
            onClick={onVoiceToggle}
            disabled={disabled}
            className={cn(
              'absolute right-2 top-2 h-10 w-10 rounded-full transition-all',
              isListening && 'bg-destructive hover:bg-destructive/90 animate-pulse shadow-lg shadow-destructive/30'
            )}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {/* Character count */}
        <div className={cn(
          'absolute right-2 bottom-2 text-xs',
          isNearLimit ? 'text-amber-500' : 'text-muted-foreground'
        )}>
          {charsRemaining}
        </div>
      </div>
      
      {/* Listening indicator */}
      {isListening && (
        <div className="flex items-center gap-2 text-sm text-primary animate-fade-in">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <span>Ouvindo... fale agora</span>
        </div>
      )}
      
      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_SUGGESTIONS.map((suggestion) => (
          <Badge
            key={suggestion.label}
            variant="outline"
            className={cn(
              'cursor-pointer py-1.5 px-3 text-sm font-normal',
              'border-border/50 hover:border-primary/50 hover:bg-primary/5',
              'transition-all duration-200',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => handleSuggestionClick(suggestion.label)}
          >
            <span className="mr-1.5">{suggestion.icon}</span>
            {suggestion.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
