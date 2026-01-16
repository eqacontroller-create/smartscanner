/**
 * ProcessedResults - Mostra histórico de diagnósticos offline processados
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from './RiskBadge';
import { 
  History, 
  Trash2, 
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { ProcessedVisionResult } from '@/hooks/useOfflineVision';
import { VisionService } from '@/services/ai/VisionService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface ProcessedResultsProps {
  results: ProcessedVisionResult[];
  onClear: () => void;
  onSpeak?: (text: string) => void;
}

export function ProcessedResults({ results, onClear, onSpeak }: ProcessedResultsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  if (results.length === 0) {
    return null;
  }
  
  // Ordena do mais recente para o mais antigo
  const sortedResults = [...results].sort((a, b) => b.processedAt - a.processedAt);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Diagnósticos Recentes
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {sortedResults.map((item) => {
          const isExpanded = expandedId === item.id;
          const { result, mediaPreviewUrl } = item;
          
          return (
            <div 
              key={item.id}
              className="border rounded-lg overflow-hidden"
            >
              {/* Header clicável */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img 
                    src={mediaPreviewUrl}
                    alt="Diagnóstico"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <RiskBadge level={result.riskLevel} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(item.processedAt, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-1">
                    {result.identification}
                  </p>
                </div>
                
                {/* Arrow */}
                <ChevronRight 
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
              
              {/* Conteúdo expandido */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 space-y-3 border-t">
                  {/* Diagnóstico */}
                  <div className="pt-3">
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">
                      Diagnóstico
                    </h4>
                    <p className="text-sm">{result.diagnosis}</p>
                  </div>
                  
                  {/* Ação recomendada */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">
                      O que fazer
                    </h4>
                    <p className="text-sm">{result.action}</p>
                  </div>
                  
                  {/* Mensagem de risco */}
                  <div className={`p-2 rounded text-sm ${
                    result.riskLevel === 'danger' 
                      ? 'bg-destructive/10 text-destructive' 
                      : result.riskLevel === 'attention'
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-green-500/10 text-green-600'
                  }`}>
                    {result.riskMessage}
                  </div>
                  
                  {/* Ações */}
                  <div className="flex gap-2 pt-1">
                    {result.technicalName && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1"
                      >
                        <a 
                          href={VisionService.generateShoppingLink(result.technicalName)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Buscar peça
                        </a>
                      </Button>
                    )}
                    
                    {onSpeak && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSpeak(
                          `${result.identification}. ${result.diagnosis}. ${result.action}`
                        )}
                        className="flex-1"
                      >
                        🔊 Ouvir
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
