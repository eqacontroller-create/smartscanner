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
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-destructive mb-3 sm:mb-4">
        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
        <span className="font-medium text-sm sm:text-base">
          {totalErrors} {totalErrors === 1 ? 'erro encontrado' : 'erros encontrados'} em {totalModules} {totalModules === 1 ? 'módulo' : 'módulos'}
        </span>
      </div>

      {moduleIds.map((moduleId) => {
        const group = groupedDTCs[moduleId];
        const icon = getCategoryIcon(group.category);
        
        return (
          <Card key={moduleId} className="border-destructive/20">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-base sm:text-lg">{icon}</span>
                <span>{group.shortName}</span>
                <span className="text-muted-foreground font-normal text-xs sm:text-sm hidden xs:inline">
                  ({group.moduleName})
                </span>
                <Badge variant="destructive" className="ml-auto text-xs">
                  {group.dtcs.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 px-3 sm:px-6 pb-3 sm:pb-6">
              {group.dtcs.map((dtc) => {
                const info = getDTCInfo(dtc.code) || getDefaultDTCInfo(dtc.code);
                
                return (
                  <div
                    key={dtc.code}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-destructive/5 hover:bg-destructive/10 active:bg-destructive/15 transition-colors cursor-pointer touch-target"
                    onClick={() => onSelectDTC(dtc)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Badge 
                        variant="destructive" 
                        className="font-mono text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 flex-shrink-0"
                      >
                        {dtc.code}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm text-foreground truncate">
                          {info.name}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Clique para ver detalhes
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
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
