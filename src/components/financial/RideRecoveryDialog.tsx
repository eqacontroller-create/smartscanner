import { RideEntry } from '@/types/tripSettings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Car, Clock, Route } from 'lucide-react';

interface RideRecoveryDialogProps {
  pendingRide: RideEntry | null;
  onRecover: () => void;
  onDiscard: () => void;
}

export function RideRecoveryDialog({ 
  pendingRide, 
  onRecover, 
  onDiscard 
}: RideRecoveryDialogProps) {
  if (!pendingRide) return null;

  const distance = pendingRide.distance.toFixed(2);
  const minutes = Math.floor(pendingRide.duration / 60);
  const seconds = Math.floor(pendingRide.duration % 60);

  // Formatar hora de início
  const startTime = new Date(pendingRide.startTime);
  const formattedTime = startTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AlertDialog open={!!pendingRide}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Restaurar Corrida Anterior?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-sm">
              Encontramos uma corrida não finalizada que foi interrompida.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Route className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{distance} km</span>
                <span className="text-muted-foreground">percorridos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
                <span className="text-muted-foreground">de duração</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Iniciada às {formattedTime}
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Deseja continuar de onde parou?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            Descartar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRecover}>
            Restaurar Corrida
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
