/**
 * Componente de status de sincronização offline
 * Mostra indicador de conexão, itens pendentes e progresso de sync
 */

import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { OfflineRefuelEntry } from '@/hooks/useOfflineRefuel';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineSyncStatusProps {
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: number;
  pendingEntries: OfflineRefuelEntry[];
  pendingCount: number;
  onSyncNow: () => void;
  onRemoveEntry: (localId: string) => void;
  onClearSynced: () => void;
}

export function OfflineSyncStatus({
  isOnline,
  isSyncing,
  syncProgress,
  pendingEntries,
  pendingCount,
  onSyncNow,
  onRemoveEntry,
  onClearSynced,
}: OfflineSyncStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const syncedCount = pendingEntries.filter(e => e.synced).length;
  
  // Se não há nada pendente e está online, não mostra nada
  if (pendingEntries.length === 0 && isOnline) {
    return null;
  }
  
  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      {/* Header com status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Cloud className="h-4 w-4 text-green-500" />
          ) : (
            <CloudOff className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          
          {pendingCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
          
          {syncedCount > 0 && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">
              <Check className="h-3 w-3 mr-1" />
              {syncedCount} sincronizado{syncedCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {syncedCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={onClearSynced}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Limpar sincronizados</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {pendingCount > 0 && isOnline && !isSyncing && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={onSyncNow}
            >
              <RefreshCw className="h-3 w-3" />
              Sincronizar
            </Button>
          )}
        </div>
      </div>
      
      {/* Barra de progresso durante sync */}
      {isSyncing && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Sincronizando...
            </span>
            <span>{syncProgress}%</span>
          </div>
          <Progress value={syncProgress} className="h-1.5" />
        </div>
      )}
      
      {/* Aviso de offline */}
      {!isOnline && pendingCount > 0 && (
        <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-xs">
            {pendingCount} diagnóstico{pendingCount > 1 ? 's' : ''} aguardando conexão para sincronizar.
          </p>
        </div>
      )}
      
      {/* Lista de entradas pendentes (colapsável) */}
      {pendingEntries.length > 0 && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between h-7 px-2">
              <span className="text-xs text-muted-foreground">
                Ver detalhes ({pendingEntries.length})
              </span>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform",
                isOpen && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-2 space-y-2">
            {pendingEntries.map(entry => (
              <div 
                key={entry.localId}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md text-xs",
                  entry.synced 
                    ? "bg-green-500/10 border border-green-500/20" 
                    : "bg-muted/50"
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {entry.litersAdded.toFixed(1)}L
                    </span>
                    {entry.stationName && (
                      <span className="text-muted-foreground">
                        @ {entry.stationName}
                      </span>
                    )}
                    {entry.synced && (
                      <Check className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    {formatDistanceToNow(entry.createdAt, { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </div>
                </div>
                
                {!entry.synced && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onRemoveEntry(entry.localId)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remover</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
