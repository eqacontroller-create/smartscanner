import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ParsedDTC } from '@/lib/dtcParser';
import { getDTCInfo, getDefaultDTCInfo } from '@/lib/dtcDatabase';
import { getCategoryIcon } from '@/lib/ecuModules';

interface DTCListProps {
  dtcs: ParsedDTC[];
  onSelectDTC: (dtc: ParsedDTC) => void;
}

interface GroupedDTCs {
  [moduleId: string]: {
    moduleName: string;
    shortName: string;
    category: 'powertrain' | 'body' | 'chassis' | 'network';
    dtcs: ParsedDTC[];
  };
}

export function DTCList({ dtcs, onSelectDTC }: DTCListProps) {
  // Agrupar DTCs por módulo
  const groupedDTCs = dtcs.reduce<GroupedDTCs>((acc, dtc) => {
    const moduleId = dtc.module?.id || 'unknown';
    const moduleName = dtc.module?.name || 'Módulo Desconhecido';
    const shortName = dtc.module?.shortName || 'OBD-II';
    const category = dtc.module?.category || 'powertrain';
    
    if (!acc[moduleId]) {
      acc[moduleId] = {
        moduleName,
        shortName,
        category,
        dtcs: [],
      };
    }
    acc[moduleId].dtcs.push(dtc);
    return acc;
  }, {});

  const moduleIds = Object.keys(groupedDTCs);
  const totalErrors = dtcs.length;
  const totalModules = moduleIds.length;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-destructive mb-4">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">
          {totalErrors} {totalErrors === 1 ? 'erro encontrado' : 'erros encontrados'} em {totalModules} {totalModules === 1 ? 'módulo' : 'módulos'}
        </span>
      </div>

      {moduleIds.map((moduleId) => {
        const group = groupedDTCs[moduleId];
        const icon = getCategoryIcon(group.category);
        
        return (
          <Card key={moduleId} className="border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{icon}</span>
                <span>{group.shortName}</span>
                <span className="text-muted-foreground font-normal text-sm">
                  ({group.moduleName})
                </span>
                <Badge variant="destructive" className="ml-auto">
                  {group.dtcs.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {group.dtcs.map((dtc) => {
                const info = getDTCInfo(dtc.code) || getDefaultDTCInfo(dtc.code);
                
                return (
                  <div
                    key={dtc.code}
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer"
                    onClick={() => onSelectDTC(dtc)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="destructive" 
                        className="font-mono text-sm px-2 py-0.5"
                      >
                        {dtc.code}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {info.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Clique para ver detalhes
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
