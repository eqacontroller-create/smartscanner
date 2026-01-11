import { Cloud, CloudOff, User, RefreshCw, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useSyncQueue } from '@/hooks/useSyncQueue';

interface SyncStatusProps {
  synced: boolean;
  lastSyncedAt?: Date | null;
}

export function SyncStatus({ synced, lastSyncedAt }: SyncStatusProps) {
  const { user, signOut } = useAuth();
  const { pendingCount, isOnline, isSyncing, processQueue } = useSyncQueue();

  // Formata a data do último sync
  const formatLastSync = (date: Date | null | undefined) => {
    if (!date) return 'Nunca';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Indicador de conexão */}
      {!isOnline && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" />
              <span className="hidden sm:inline">Offline</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            Sem conexão com a internet
          </TooltipContent>
        </Tooltip>
      )}

      {/* Indicador de pendências offline */}
      {pendingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={processQueue}
              disabled={!isOnline || isSyncing}
              className="gap-1 h-8"
            >
              {isSyncing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span>{pendingCount}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSyncing 
              ? 'Sincronizando...' 
              : `${pendingCount} item(s) pendente(s)`}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Status de sincronização */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={synced ? "default" : "secondary"} 
            className="gap-1 cursor-default"
          >
            {synced ? (
              <Cloud className="h-3 w-3" />
            ) : (
              <CloudOff className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">
              {synced ? 'Sync' : 'Pendente'}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {synced 
            ? `Sincronizado: ${formatLastSync(lastSyncedAt)}` 
            : 'Alterações pendentes'}
        </TooltipContent>
      </Tooltip>

      {/* Botão do usuário */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="h-8 w-8 p-0"
          >
            <User className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {user?.email}<br/>
          <span className="text-xs text-muted-foreground">Clique para sair</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
