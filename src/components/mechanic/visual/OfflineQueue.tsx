/**
 * OfflineQueue - Mostra fotos salvas offline aguardando análise
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Cloud, 
  CloudOff, 
  Trash2, 
  RefreshCw, 
  Camera,
  Video,
  Loader2,
  Clock,
} from 'lucide-react';
import type { OfflineVisionItem } from '@/hooks/useOfflineVision';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OfflineQueueProps {
  items: OfflineVisionItem[];
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: { current: number; total: number } | null;
  onProcess: () => void;
  onRemove: (id: string) => void;
  getPreview: (item: OfflineVisionItem) => string;
}

export function OfflineQueue({
  items,
  isOnline,
  isSyncing,
  syncProgress,
  onProcess,
  onRemove,
  getPreview,
}: OfflineQueueProps) {
  if (items.length === 0) {
    return null;
  }
  
  const progressPercent = syncProgress 
    ? (syncProgress.current / syncProgress.total) * 100 
    : 0;
  
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isOnline ? (
              <Cloud className="h-4 w-4 text-green-500" />
            ) : (
              <CloudOff className="h-4 w-4 text-amber-500" />
            )}
            Fotos Pendentes
          </CardTitle>
          <Badge variant="secondary" className="font-normal">
            {items.length} aguardando
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress durante sync */}
        {isSyncing && syncProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Analisando...
              </span>
              <span className="font-medium">
                {syncProgress.current}/{syncProgress.total}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
        
        {/* Lista de itens pendentes */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((item) => (
            <div 
              key={item.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
            >
              {/* Thumbnail ou placeholder */}
              {item.thumbnailBase64 ? (
                <img 
                  src={getPreview(item)}
                  alt="Foto pendente"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {item.analysisType === 'video' ? (
                    <Video className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              )}
              
              {/* Badge de tipo */}
              <div className="absolute top-1 left-1">
                <Badge variant="secondary" className="h-5 px-1 text-[10px]">
                  {item.analysisType === 'video' ? (
                    <Video className="h-3 w-3" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </Badge>
              </div>
              
              {/* Botão de remover */}
              <button
                onClick={() => onRemove(item.id)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-destructive/80 text-destructive-foreground"
                aria-label="Remover foto"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              
              {/* Tempo de espera */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                <span className="text-[10px] text-white flex items-center gap-1">
                  <Clock className="h-2 w-2" />
                  {formatDistanceToNow(item.createdAt, { 
                    addSuffix: false, 
                    locale: ptBR 
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Botão de processar */}
        <Button
          onClick={onProcess}
          disabled={!isOnline || isSyncing}
          className="w-full gap-2"
          variant={isOnline ? "default" : "secondary"}
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : isOnline ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Analisar Agora
            </>
          ) : (
            <>
              <CloudOff className="h-4 w-4" />
              Aguardando Conexão
            </>
          )}
        </Button>
        
        {!isOnline && (
          <p className="text-xs text-center text-muted-foreground">
            As fotos serão analisadas automaticamente quando a conexão retornar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
