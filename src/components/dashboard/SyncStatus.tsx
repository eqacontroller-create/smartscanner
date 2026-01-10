import { Cloud, CloudOff, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';

interface SyncStatusProps {
  synced: boolean;
  onLoginClick: () => void;
}

export function SyncStatus({ synced, onLoginClick }: SyncStatusProps) {
  const { isAuthenticated, user, signOut } = useAuth();

  if (!isAuthenticated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onLoginClick}
            className="gap-2"
          >
            <CloudOff className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Entre para sincronizar seus dados
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2">
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
              {synced ? 'Sincronizado' : 'Offline'}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {synced 
            ? 'Dados sincronizados com a nuvem' 
            : 'Salvando localmente, sincroniza quando online'}
        </TooltipContent>
      </Tooltip>

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
          <span className="text-xs">Clique para sair</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
