import { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal } from 'lucide-react';

interface LogPanelProps {
  logs: string[];
}

export function LogPanel({ logs }: LogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Terminal className="h-4 w-4" />
          Logs de Comunicação
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-40" ref={scrollRef}>
          <div className="p-4 pt-0 font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <p className="text-muted-foreground/50">Nenhum log ainda...</p>
            ) : (
              logs.map((log, index) => (
                <p
                  key={index}
                  className={`${
                    log.includes('TX:')
                      ? 'text-accent'
                      : log.includes('RX:')
                      ? 'text-primary'
                      : log.includes('Erro')
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {log}
                </p>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
