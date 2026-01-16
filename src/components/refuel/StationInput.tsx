// Campo de entrada para nome do posto de combustível
// Com sugestões baseadas no histórico

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, History, Star, X } from 'lucide-react';

interface StationInputProps {
  value: string;
  onChange: (value: string) => void;
  recentStations?: string[];
  favoriteStations?: string[];
}

export function StationInput({ 
  value, 
  onChange, 
  recentStations = [],
  favoriteStations = [] 
}: StationInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Combinar sugestões (favoritos primeiro, depois recentes únicos)
  const suggestions = useMemo(() => {
    const uniqueRecent = recentStations.filter(
      s => !favoriteStations.some(f => f.toLowerCase() === s.toLowerCase())
    );
    return [...favoriteStations, ...uniqueRecent].slice(0, 5);
  }, [recentStations, favoriteStations]);

  // Filtrar sugestões baseado no input
  const filteredSuggestions = useMemo(() => {
    if (!value.trim()) return suggestions;
    const search = value.toLowerCase();
    return suggestions.filter(s => s.toLowerCase().includes(search));
  }, [value, suggestions]);

  // Mostrar sugestões quando focado e há sugestões
  useEffect(() => {
    setShowSuggestions(inputFocused && filteredSuggestions.length > 0);
  }, [inputFocused, filteredSuggestions.length]);

  const handleSelect = (station: string) => {
    onChange(station);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="station" className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        Nome do Posto (opcional)
      </Label>
      
      <div className="relative">
        <Input
          id="station"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setTimeout(() => setInputFocused(false), 200)}
          placeholder="Ex: Shell Centro, Ipiranga BR-101..."
          className="pr-8"
        />
        
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        
        {/* Dropdown de sugestões */}
        {showSuggestions && (
          <div className="absolute z-50 w-full mt-1 py-1 bg-popover border rounded-md shadow-lg">
            {filteredSuggestions.map((station, index) => {
              const isFavorite = favoriteStations.some(
                f => f.toLowerCase() === station.toLowerCase()
              );
              
              return (
                <button
                  key={index}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                  onClick={() => handleSelect(station)}
                >
                  {isFavorite ? (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <History className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="truncate">{station}</span>
                  {isFavorite && (
                    <Badge variant="outline" className="ml-auto text-[10px] h-4">
                      Favorito
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Informe o posto para comparar qualidade entre eles.
      </p>
    </div>
  );
}
