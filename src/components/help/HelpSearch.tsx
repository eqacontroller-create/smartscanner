import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  type: "section" | "faq" | "glossary";
  preview?: string;
}

interface HelpSearchProps {
  onSearch: (query: string) => void;
  onResultClick: (id: string) => void;
  results: SearchResult[];
  isSearching: boolean;
}

export function HelpSearch({ onSearch, onResultClick, results, isSearching }: HelpSearchProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (id: string) => {
    onResultClick(id);
    setQuery("");
    setIsFocused(false);
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const showResults = isFocused && query.length > 0;

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "section":
        return "Seção";
      case "faq":
        return "FAQ";
      case "glossary":
        return "Glossário";
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "section":
        return "bg-primary/10 text-primary";
      case "faq":
        return "bg-blue-500/10 text-blue-500";
      case "glossary":
        return "bg-purple-500/10 text-purple-500";
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar na ajuda... (ex: DTC, combustível, Jarvis)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="pl-10 pr-10 h-11 bg-muted/30 border-border focus:bg-background transition-colors"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-2 space-y-1">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors",
                    "flex items-center justify-between gap-3 group"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", getTypeColor(result.type))}>
                        {getTypeLabel(result.type)}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate">
                        {result.title}
                      </span>
                    </div>
                    {result.preview && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {result.preview}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {isSearching ? (
                "Buscando..."
              ) : (
                <>
                  Nenhum resultado para "<span className="font-medium text-foreground">{query}</span>"
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
