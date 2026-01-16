import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VehicleSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  recentSearches?: string[];
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}

export function VehicleSearch({
  value,
  onChange,
  onSearch,
  recentSearches = [],
  suggestions = [],
  placeholder = "Buscar por marca, modelo ou ano...",
  className
}: VehicleSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    if (recentSearches.length > 0 || suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding dropdown to allow clicks
    setTimeout(() => setShowDropdown(false), 200);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleSelect = (text: string) => {
    onChange(text);
    onSearch?.(text);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onSearch?.(value);
      setShowDropdown(false);
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const hasContent = recentSearches.length > 0 || suggestions.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search input */}
      <div className={cn(
        "relative flex items-center transition-all duration-300",
        isFocused && "scale-[1.02]"
      )}>
        <Search className={cn(
          "absolute left-3 w-4 h-4 transition-colors duration-300",
          isFocused ? "text-primary" : "text-muted-foreground"
        )} />
        
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-10 h-12 text-base transition-all duration-300",
            "bg-card border-border/50",
            isFocused && "ring-2 ring-primary/20 border-primary/50"
          )}
        />
        
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 h-8 w-8 hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && hasContent && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-2 z-50",
          "bg-popover border border-border rounded-xl shadow-lg",
          "animate-fade-in overflow-hidden"
        )}>
          {/* Recent searches */}
          {recentSearches.length > 0 && !value && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Buscas recentes</span>
              </div>
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(search)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm",
                    "hover:bg-accent transition-colors",
                    "flex items-center gap-2"
                  )}
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && value && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>Sugestões</span>
              </div>
              {suggestions.slice(0, 5).map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(suggestion)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm",
                    "hover:bg-accent transition-colors",
                    "flex items-center gap-2"
                  )}
                >
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <span dangerouslySetInnerHTML={{
                    __html: suggestion.replace(
                      new RegExp(`(${value})`, 'gi'),
                      '<strong class="text-primary">$1</strong>'
                    )
                  }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
