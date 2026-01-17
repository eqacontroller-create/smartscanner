import { AlertTriangle, ChevronRight, OctagonX, Info, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ParsedDTC } from '@/services/obd/DTCParser';
import { getDTCInfo, getDefaultDTCInfo } from '@/lib/dtcDatabase';
import { getCategoryIcon } from '@/lib/ecuModules';
import { cn } from '@/lib/utils';

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

// Severity visual configuration
const getSeverityStyles = (severity: 'low' | 'medium' | 'high') => {
  switch (severity) {
    case 'high':
      return {
        cardClass: 'bg-red-500/15 border-red-500/40 hover:bg-red-500/25',
        iconClass: 'text-red-500',
        icon: OctagonX,
        badgeClass: 'bg-red-500 text-white border-red-500',
        action: '⛔ PARE O CARRO!',
        actionClass: 'text-red-500 font-bold',
        pulse: true,
      };
    case 'medium':
      return {
        cardClass: 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20',
        iconClass: 'text-yellow-500',
        icon: AlertTriangle,
        badgeClass: 'bg-yellow-500 text-black border-yellow-500',
        action: '⚠️ Vá à oficina em breve',
        actionClass: 'text-yellow-600 font-medium',
        pulse: false,
      };
    case 'low':
      return {
        cardClass: 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20',
        iconClass: 'text-green-500',
        icon: Info,
        badgeClass: 'bg-green-500 text-white border-green-500',
        action: '✅ Pode agendar revisão',
        actionClass: 'text-green-600 font-medium',
        pulse: false,
      };
  }
};

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

  // Check for any critical errors
  const hasCritical = dtcs.some(dtc => {
    const info = getDTCInfo(dtc.code) || getDefaultDTCInfo(dtc.code);
    return info.severity === 'high';
  });

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-500">
      {/* Summary Header */}
      <div className={cn(
        "flex items-center gap-2 mb-3 sm:mb-4 p-3 rounded-lg",
        hasCritical ? "bg-red-500/20 border border-red-500/40" : "bg-destructive/10"
      )}>
        {hasCritical ? (
          <OctagonX className="h-5 w-5 text-red-500 animate-pulse" />
        ) : (
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
        )}
        <span className={cn(
          "font-medium text-sm sm:text-base",
          hasCritical ? "text-red-500" : "text-destructive"
        )}>
          {totalErrors} {totalErrors === 1 ? 'erro encontrado' : 'erros encontrados'} em {totalModules} {totalModules === 1 ? 'módulo' : 'módulos'}
        </span>
        {hasCritical && (
          <Badge className="bg-red-500 text-white ml-auto animate-pulse">
            CRÍTICO
          </Badge>
        )}
      </div>

      {moduleIds.map((moduleId) => {
        const group = groupedDTCs[moduleId];
        const icon = getCategoryIcon(group.category);
        
        // Check for critical errors in this module
        const moduleCritical = group.dtcs.some(dtc => {
          const info = getDTCInfo(dtc.code) || getDefaultDTCInfo(dtc.code);
          return info.severity === 'high';
        });
        
        return (
          <Card key={moduleId} className={cn(
            "border transition-all",
            moduleCritical ? "border-red-500/40 bg-red-500/5" : "border-destructive/20"
          )}>
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
                const styles = getSeverityStyles(info.severity);
                const SeverityIcon = styles.icon;
                
                return (
                  <div
                    key={dtc.code}
                    className={cn(
                      "flex flex-col p-3 rounded-lg border transition-all cursor-pointer touch-target",
                      styles.cardClass,
                      styles.pulse && "animate-pulse"
                    )}
                    onClick={() => onSelectDTC(dtc)}
                  >
                    {/* Header Row */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <SeverityIcon className={cn("h-5 w-5 flex-shrink-0", styles.iconClass)} />
                      <Badge 
                        variant="outline" 
                        className={cn("font-mono text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 flex-shrink-0", styles.badgeClass)}
                      >
                        {dtc.code}
                      </Badge>
                      <p className="font-medium text-xs sm:text-sm text-foreground truncate flex-1">
                        {info.name}
                      </p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    
                    {/* Action Message */}
                    <div className={cn("text-xs mt-2", styles.actionClass)}>
                      {styles.action}
                    </div>
                    
                    {/* Budget Link */}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-primary hover:underline">
                      <DollarSign className="h-3 w-3" />
                      <span>Ver orçamento estimado</span>
                    </div>
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
