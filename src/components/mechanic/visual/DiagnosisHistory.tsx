/**
 * DiagnosisHistory - Histórico premium de diagnósticos visuais com timeline
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  History, Trash2, ChevronDown, ChevronUp, Car, 
  AlertTriangle, CheckCircle, XCircle, HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { VisualDiagnosis } from '@/services/supabase/VisualDiagnosisService';

interface DiagnosisHistoryProps {
  diagnoses: VisualDiagnosis[];
  loading: boolean;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

const riskConfig = {
  low: { 
    icon: CheckCircle, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Baixo' 
  },
  medium: { 
    icon: AlertTriangle, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Médio' 
  },
  high: { 
    icon: AlertTriangle, 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/10', 
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
    label: 'Alto' 
  },
  critical: { 
    icon: XCircle, 
    color: 'text-red-400', 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/30',
    dot: 'bg-red-400',
    label: 'Crítico' 
  },
  unknown: { 
    icon: HelpCircle, 
    color: 'text-muted-foreground', 
    bg: 'bg-muted/50', 
    border: 'border-muted-foreground/30',
    dot: 'bg-muted-foreground',
    label: 'Desconhecido' 
  },
};

function DiagnosisCard({ diagnosis, onDelete, index }: { diagnosis: VisualDiagnosis; onDelete: () => void; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const risk = riskConfig[diagnosis.risk_level] || riskConfig.unknown;
  const RiskIcon = risk.icon;

  const vehicleDisplay = [
    diagnosis.vehicle_brand,
    diagnosis.vehicle_model,
    diagnosis.vehicle_year,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className="relative pl-8 animate-slide-in-left"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Timeline dot */}
      <div className={cn(
        'absolute left-0 top-4 w-4 h-4 rounded-full border-2 bg-background z-10',
        risk.border,
        risk.color
      )}>
        <div className={cn('absolute inset-1 rounded-full', risk.dot)} />
      </div>
      
      <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn('p-2 rounded-xl', risk.bg)}>
                    <RiskIcon className={cn('h-4 w-4', risk.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm font-medium truncate">
                        {diagnosis.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs rounded-full">
                        {diagnosis.media_type === 'video' ? '📹 Vídeo' : '📸 Foto'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(diagnosis.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {vehicleDisplay && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {vehicleDisplay}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    'text-xs rounded-full px-2.5 py-0.5',
                    risk.bg, 
                    risk.color, 
                    'border',
                    risk.border
                  )}>
                    {risk.label}
                  </Badge>
                  <div className={cn(
                    'p-1.5 rounded-full transition-colors',
                    isOpen ? 'bg-muted' : 'bg-transparent'
                  )}>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4 space-y-4 animate-fade-in">
              {/* Descrição */}
              <div className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-3">
                {diagnosis.description}
              </div>

              {/* Recomendação */}
              {diagnosis.recommendation && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
                  <p className="text-sm font-semibold text-primary mb-1.5">💡 Recomendação</p>
                  <p className="text-sm text-muted-foreground">{diagnosis.recommendation}</p>
                </div>
              )}

              {/* Peças mencionadas */}
              {diagnosis.parts_mentioned && diagnosis.parts_mentioned.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {diagnosis.parts_mentioned.map((part, i) => (
                    <Badge key={i} variant="secondary" className="text-xs rounded-full">
                      🔧 {part}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Notas */}
              {diagnosis.notes && (
                <div className="p-3 rounded-xl bg-muted/50 text-sm">
                  <span className="text-muted-foreground">📝 Notas: </span>
                  {diagnosis.notes}
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 rounded-full">
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir diagnóstico?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O diagnóstico será removido permanentemente do seu histórico.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

export function DiagnosisHistory({ diagnoses, loading, onDelete, onRefresh }: DiagnosisHistoryProps) {
  if (loading) {
    return (
      <div className="space-y-4 pl-8">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-border/50">
            <CardHeader className="py-3 px-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (diagnoses.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/30 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="p-4 rounded-2xl bg-muted mb-4">
            <History className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">Nenhum diagnóstico salvo</p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
            Seus diagnósticos visuais aparecerão aqui quando você salvá-los
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {diagnoses.length} diagnóstico{diagnoses.length !== 1 ? 's' : ''} salvo{diagnoses.length !== 1 ? 's' : ''}
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefresh} 
          className="gap-2 rounded-full hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>
      
      {/* Timeline container */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 via-border to-transparent rounded-full" />
        
        <div className="space-y-4">
          {diagnoses.map((diagnosis, index) => (
            <DiagnosisCard 
              key={diagnosis.id} 
              diagnosis={diagnosis} 
              onDelete={() => onDelete(diagnosis.id)}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
