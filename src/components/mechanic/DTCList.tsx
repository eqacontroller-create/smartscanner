import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ParsedDTC } from '@/lib/dtcParser';
import { getDTCInfo, getDefaultDTCInfo } from '@/lib/dtcDatabase';

interface DTCListProps {
  dtcs: ParsedDTC[];
  onSelectDTC: (dtc: ParsedDTC) => void;
}

export function DTCList({ dtcs, onSelectDTC }: DTCListProps) {
  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-destructive mb-4">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">
          {dtcs.length} {dtcs.length === 1 ? 'erro encontrado' : 'erros encontrados'}
        </span>
      </div>

      {dtcs.map((dtc) => {
        const info = getDTCInfo(dtc.code) || getDefaultDTCInfo(dtc.code);
        
        return (
          <Card
            key={dtc.code}
            className="border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer"
            onClick={() => onSelectDTC(dtc)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge 
                  variant="destructive" 
                  className="font-mono text-sm px-3 py-1"
                >
                  {dtc.code}
                </Badge>
                <div>
                  <p className="font-medium text-foreground">
                    {info.name}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Clique para ver detalhes e análise IA
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
