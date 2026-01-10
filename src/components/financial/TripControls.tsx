import { Button } from '@/components/ui/button';
import { TripData } from '@/types/tripSettings';
import { Play, Pause, RotateCcw, Volume2, Save } from 'lucide-react';

interface TripControlsProps {
  tripData: TripData;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSave: () => void;
  onVoiceReport: () => void;
  isSpeaking?: boolean;
}

export function TripControls({
  tripData,
  onStart,
  onPause,
  onResume,
  onReset,
  onSave,
  onVoiceReport,
  isSpeaking,
}: TripControlsProps) {
  const hasData = tripData.distance > 0.01;
  
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
      {/* Botão Iniciar/Pausar/Retomar */}
      {!tripData.isActive && !hasData ? (
        <Button
          size="lg"
          className="gap-1.5 sm:gap-2 bg-money text-money-foreground hover:bg-money/90 min-h-[44px] px-3 sm:px-6 text-sm sm:text-base"
          onClick={onStart}
        >
          <Play className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden xs:inline">Iniciar</span> Viagem
        </Button>
      ) : tripData.isActive ? (
        <Button
          size="lg"
          variant="secondary"
          className="gap-1.5 sm:gap-2 min-h-[44px] px-3 sm:px-6 text-sm sm:text-base"
          onClick={onPause}
        >
          <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
          Pausar
        </Button>
      ) : (
        <Button
          size="lg"
          className="gap-1.5 sm:gap-2 bg-money text-money-foreground hover:bg-money/90 min-h-[44px] px-3 sm:px-6 text-sm sm:text-base"
          onClick={onResume}
        >
          <Play className="h-4 w-4 sm:h-5 sm:w-5" />
          Retomar
        </Button>
      )}

      {/* Botão Zerar */}
      <Button
        size="lg"
        variant="outline"
        className="gap-1.5 sm:gap-2 min-h-[44px] px-3 sm:px-6 text-sm sm:text-base"
        onClick={onReset}
        disabled={!hasData && !tripData.isActive}
      >
        <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
        Zerar
      </Button>

      {/* Botão Salvar */}
      {hasData && !tripData.isActive && (
        <Button
          size="lg"
          variant="outline"
          className="gap-1.5 sm:gap-2 min-h-[44px] px-3 sm:px-6 text-sm sm:text-base border-money/50 text-money hover:bg-money/10"
          onClick={onSave}
        >
          <Save className="h-4 w-4 sm:h-5 sm:w-5" />
          Salvar
        </Button>
      )}

      {/* Botão Ouvir Relatório */}
      <Button
        size="lg"
        variant="outline"
        className="gap-1.5 sm:gap-2 min-h-[44px] px-3 sm:px-6 text-sm sm:text-base"
        onClick={onVoiceReport}
        disabled={isSpeaking || !hasData}
      >
        <Volume2 className={`h-4 w-4 sm:h-5 sm:w-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
        <span className="hidden xs:inline">Ouvir</span> Custo
      </Button>
    </div>
  );
}
