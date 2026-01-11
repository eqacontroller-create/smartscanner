// Card de Manutenção Inteligente por Marca

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Volume2,
  Calendar,
  Gauge,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { MaintenanceAlert, MaintenanceType } from '@/types/maintenanceTypes';
import type { useMaintenanceSchedule } from '@/hooks/useMaintenanceSchedule';

interface MaintenanceCardProps {
  alerts: MaintenanceAlert[];
  intervals: ReturnType<typeof useMaintenanceSchedule>['intervals'];
  currentMileage: number;
  brandName: string;
  onRecordMaintenance: (type: MaintenanceType, mileage: number, notes?: string) => void;
  onSpeakAlerts?: () => void;
  isSpeaking?: boolean;
}

export function MaintenanceCard({
  alerts,
  intervals,
  currentMileage,
  brandName,
  onRecordMaintenance,
  onSpeakAlerts,
  isSpeaking,
}: MaintenanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<MaintenanceType | ''>('');
  const [serviceMileage, setServiceMileage] = useState(currentMileage.toString());
  const [serviceNotes, setServiceNotes] = useState('');
  
  const overdueAlerts = alerts.filter(a => a.isOverdue);
  const upcomingAlerts = alerts.filter(a => !a.isOverdue);
  
  const getPriorityColor = (priority: MaintenanceAlert['priority']) => {
    switch (priority) {
      case 'critica': return 'bg-red-500 text-white';
      case 'alta': return 'bg-orange-500 text-white';
      case 'media': return 'bg-yellow-500 text-black';
      case 'baixa': return 'bg-blue-500 text-white';
      default: return 'bg-muted';
    }
  };
  
  const getPriorityIcon = (priority: MaintenanceAlert['priority'], isOverdue: boolean) => {
    if (isOverdue || priority === 'critica') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <Wrench className="h-4 w-4 text-muted-foreground" />;
  };
  
  const handleRecordMaintenance = () => {
    if (selectedType && serviceMileage) {
      onRecordMaintenance(
        selectedType as MaintenanceType,
        parseInt(serviceMileage),
        serviceNotes || undefined
      );
      setIsDialogOpen(false);
      setSelectedType('');
      setServiceMileage(currentMileage.toString());
      setServiceNotes('');
    }
  };
  
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Manutenção {brandName}
          </CardTitle>
          <div className="flex items-center gap-2">
            {overdueAlerts.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueAlerts.length} atrasada{overdueAlerts.length > 1 ? 's' : ''}
              </Badge>
            )}
            {onSpeakAlerts && alerts.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSpeakAlerts}
                disabled={isSpeaking}
                className="h-8 w-8"
              >
                <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Quilometragem Atual */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Gauge className="h-4 w-4" />
            Quilometragem atual
          </span>
          <span className="font-mono font-semibold">
            {currentMileage > 0 ? `${currentMileage.toLocaleString('pt-BR')} km` : 'Não informada'}
          </span>
        </div>
        
        {currentMileage === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Configure a quilometragem nas configurações do Jarvis para ver os lembretes.
          </p>
        )}
        
        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {/* Mostrar primeiros 3 alertas ou todos se expandido */}
            {(isExpanded ? alerts : alerts.slice(0, 3)).map((alert) => (
              <div
                key={alert.type}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  alert.isOverdue ? 'bg-red-500/10 border border-red-500/30' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getPriorityIcon(alert.priority, alert.isOverdue)}
                  <span className="text-sm truncate">{alert.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(alert.priority)} variant="secondary">
                    {alert.isOverdue
                      ? `-${alert.kmOverdue.toLocaleString('pt-BR')} km`
                      : `${alert.kmRemaining.toLocaleString('pt-BR')} km`}
                  </Badge>
                </div>
              </div>
            ))}
            
            {/* Botão expandir/colapsar */}
            {alerts.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-xs"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Mais {alerts.length - 3} itens
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        
        {/* Sem alertas */}
        {alerts.length === 0 && currentMileage > 0 && (
          <div className="flex items-center justify-center gap-2 py-4 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Tudo em dia!</span>
          </div>
        )}
        
        {/* Botão registrar manutenção */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Registrar Manutenção
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Manutenção Realizada</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tipo de Manutenção</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as MaintenanceType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {intervals.map((interval) => (
                        <SelectItem key={interval.type} value={interval.type}>
                          {interval.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Quilometragem no serviço</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={serviceMileage}
                    onChange={(e) => setServiceMileage(e.target.value)}
                    placeholder="Ex: 50000"
                  />
                  <span className="text-sm text-muted-foreground">km</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Input
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Ex: Óleo sintético 5W30"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleRecordMaintenance}
                  disabled={!selectedType || !serviceMileage}
                >
                  <Calendar className="h-4 w-4" />
                  Registrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
