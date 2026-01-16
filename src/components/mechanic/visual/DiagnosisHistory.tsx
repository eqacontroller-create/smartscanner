/**
 * Componente para exibir histórico de diagnósticos visuais
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  History, Trash2, ChevronDown, ChevronUp, Car, 
  AlertTriangle, CheckCircle, XCircle, HelpCircle,
  FileText, ExternalLink
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
  low: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Baixo' },
  medium: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Médio' },
  high: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Alto' },
  critical: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Crítico' },
  unknown: { icon: HelpCircle, color: 'text-muted-foreground', bg: 'bg-muted/50', label: 'Desconhecido' },
};

function DiagnosisCard({ diagnosis, onDelete }: { diagnosis: VisualDiagnosis; onDelete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const risk = riskConfig[diagnosis.risk_level] || riskConfig.unknown;
  const RiskIcon = risk.icon;

  const vehicleDisplay = [
    diagnosis.vehicle_brand,
    diagnosis.vehicle_model,
    diagnosis.vehicle_year,
  ].filter(Boolean).join(' ');

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={cn('p-2 rounded-lg', risk.bg)}>
                  <RiskIcon className={cn('h-4 w-4', risk.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm font-medium truncate">
                      {diagnosis.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {diagnosis.media_type === 'video' ? 'Vídeo' : 'Foto'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
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
                <Badge className={cn('text-xs', risk.bg, risk.color, 'border-0')}>
                  {risk.label}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-3">
            {/* Descrição */}
            <div className="text-sm text-muted-foreground">
              {diagnosis.description}
            </div>

            {/* Recomendação */}
            {diagnosis.recommendation && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium text-primary mb-1">Recomendação</p>
                <p className="text-sm text-muted-foreground">{diagnosis.recommendation}</p>
              </div>
            )}

            {/* Peças mencionadas */}
            {diagnosis.parts_mentioned && diagnosis.parts_mentioned.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {diagnosis.parts_mentioned.map((part, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {part}
                  </Badge>
                ))}
              </div>
            )}

            {/* Notas */}
            {diagnosis.notes && (
              <div className="p-2 rounded bg-muted/50 text-sm">
                <span className="text-muted-foreground">Notas: </span>
                {diagnosis.notes}
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir diagnóstico?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O diagnóstico será removido permanentemente do seu histórico.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
  );
}

export function DiagnosisHistory({ diagnoses, loading, onDelete, onRefresh }: DiagnosisHistoryProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="py-3 px-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-3 rounded-full bg-muted mb-3">
            <History className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Nenhum diagnóstico salvo</p>
          <p className="text-xs text-muted-foreground mt-1">
            Seus diagnósticos visuais aparecerão aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {diagnoses.length} diagnóstico{diagnoses.length !== 1 ? 's' : ''} salvo{diagnoses.length !== 1 ? 's' : ''}
        </p>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="gap-1.5">
          <History className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>
      
      {diagnoses.map(diagnosis => (
        <DiagnosisCard 
          key={diagnosis.id} 
          diagnosis={diagnosis} 
          onDelete={() => onDelete(diagnosis.id)} 
        />
      ))}
    </div>
  );
}
