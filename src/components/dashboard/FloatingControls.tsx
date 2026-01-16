import { JarvisFloatingWidget } from '@/components/dashboard/JarvisFloatingWidget';
import { JarvisSettingsSheet } from '@/components/dashboard/JarvisSettingsSheet';
import { RideEndModal } from '@/components/financial/RideEndModal';
import { RideRecoveryDialog } from '@/components/financial/RideRecoveryDialog';
import { RefuelButton } from '@/components/refuel/RefuelButton';
import { RefuelModal } from '@/components/refuel/RefuelModal';
import { RefuelFlowSelector } from '@/components/refuel/RefuelFlowSelector';
import { FuelQualityMonitor } from '@/components/refuel/FuelQualityMonitor';
import { RefuelResult } from '@/components/refuel/RefuelResult';
import { RefuelSettingsSheet } from '@/components/refuel/RefuelSettingsSheet';
import { Button } from '@/components/ui/button';
import { X, Fuel, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JarvisSettings } from '@/types/jarvisSettings';
import type { RefuelSettings, RefuelEntry, RefuelMode, RefuelFlowType, FuelTrimSample } from '@/types/refuelTypes';
import type { RideEntry } from '@/types/tripSettings';

interface FloatingControlsProps {
  // Jarvis AI
  isListening: boolean;
  isContinuousMode: boolean;
  isWakeWordDetected: boolean;
  isProcessing: boolean;
  isSpeakingAI: boolean;
  isAISupported: boolean;
  aiEnabled: boolean;
  continuousListeningEnabled: boolean;
  wakeWord: string;
  aiError: string | null;
  lastTranscript: string;
  interimTranscript: string;
  lastResponse: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  onToggleListening: () => void;
  onToggleContinuousMode: () => void;
  onClearHistory: () => void;
  // Jarvis Settings Sheet
  isSettingsOpen: boolean;
  onSettingsChange: (open: boolean) => void;
  jarvisSettings: JarvisSettings;
  onUpdateJarvisSetting: <K extends keyof JarvisSettings>(key: K, value: JarvisSettings[K]) => void;
  onResetJarvisSettings: () => void;
  availableVoices: SpeechSynthesisVoice[];
  portugueseVoices: SpeechSynthesisVoice[];
  onTestVoice: () => void;
  isSpeaking: boolean;
  isWakeLockActive: boolean;
  // Auto Ride
  autoRide: {
    isModalOpen: boolean;
    finishedRide: RideEntry | null;
    closeModal: () => void;
    saveRideWithAmount: (amount: number) => void;
    skipAmountEntry: () => void;
    pendingRecovery: RideEntry | null;
    recoverRide: () => void;
    discardRecovery: () => void;
  };
  // Refuel
  refuelMode: RefuelMode;
  refuelFlowType: RefuelFlowType | null;
  currentRefuel: Partial<RefuelEntry> | null;
  currentFuelLevel: number | null;
  fuelLevelSupported: boolean | null;
  distanceMonitored: number;
  currentSTFT: number | null;
  currentLTFT: number | null;
  anomalyActive: boolean;
  anomalyDuration: number;
  fuelTrimHistory: FuelTrimSample[];
  refuelSettings: RefuelSettings;
  frozenSettings: RefuelSettings | null;
  confirmRefuel: (pricePerLiter: number, litersAdded: number) => void;
  cancelRefuel: () => void;
  startRefuelMode: () => void;
  startQuickTest: () => void;
  stftSupported: boolean | null;
  onUpdateRefuelSettings: (settings: Partial<RefuelSettings>) => void;
  onResetRefuelSettings: () => void;
  isSyncing: boolean;
  tripFuelPrice: number;
  isConnected: boolean;
  isAuthenticated: boolean;
  isFlowSelectorOpen: boolean;
  isRefuelModalOpen: boolean;
  onFlowSelectorChange: (open: boolean) => void;
  onRefuelModalChange: (open: boolean) => void;
}

export function FloatingControls(props: FloatingControlsProps) {
  return (
    <>
      <JarvisFloatingWidget isListening={props.isListening} isContinuousMode={props.isContinuousMode} isWakeWordDetected={props.isWakeWordDetected} isProcessing={props.isProcessing} isSpeaking={props.isSpeakingAI} isSupported={props.isAISupported} isEnabled={props.aiEnabled} continuousListeningEnabled={props.continuousListeningEnabled} wakeWord={props.wakeWord} error={props.aiError} lastTranscript={props.lastTranscript} interimTranscript={props.interimTranscript} lastResponse={props.lastResponse} conversationHistory={props.conversationHistory} onToggleListening={props.onToggleListening} onToggleContinuousMode={props.onToggleContinuousMode} onClearHistory={props.onClearHistory} />

      <JarvisSettingsSheet open={props.isSettingsOpen} onOpenChange={props.onSettingsChange} settings={props.jarvisSettings} onUpdateSetting={props.onUpdateJarvisSetting} onResetToDefaults={props.onResetJarvisSettings} availableVoices={props.availableVoices} portugueseVoices={props.portugueseVoices} onTestVoice={props.onTestVoice} isSpeaking={props.isSpeaking} isWakeLockActive={props.isWakeLockActive} />
      
      <RideEndModal isOpen={props.autoRide.isModalOpen} ride={props.autoRide.finishedRide} onClose={props.autoRide.closeModal} onSave={props.autoRide.saveRideWithAmount} onSkip={props.autoRide.skipAmountEntry} />
      
      <RideRecoveryDialog pendingRide={props.autoRide.pendingRecovery} onRecover={props.autoRide.recoverRide} onDiscard={props.autoRide.discardRecovery} />
      
      <RefuelModal open={props.isRefuelModalOpen} onOpenChange={props.onRefuelModalChange} fuelLevelBefore={props.currentRefuel?.fuelLevelBefore ?? null} currentFuelLevel={props.currentFuelLevel} fuelLevelSupported={props.fuelLevelSupported} defaultPrice={props.tripFuelPrice} isAuthenticated={props.isAuthenticated} onConfirm={(price, liters) => { props.confirmRefuel(price, liters); props.onRefuelModalChange(false); }} />
      
      {/* Badge flutuante para estados de espera */}
      {(props.refuelMode === 'waiting' || props.refuelMode === 'waiting-quick') && (
        <div className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto">
          <div className={cn(
            'rounded-xl border-2 p-3 backdrop-blur-sm animate-pulse',
            props.refuelMode === 'waiting-quick' 
              ? 'bg-blue-500/10 border-blue-500/50' 
              : 'bg-yellow-500/10 border-yellow-500/50'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-full',
                props.refuelMode === 'waiting-quick' ? 'bg-blue-500/20' : 'bg-yellow-500/20'
              )}>
                {props.refuelMode === 'waiting-quick' 
                  ? <Activity className="h-5 w-5 text-blue-500" />
                  : <Fuel className="h-5 w-5 text-yellow-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium',
                  props.refuelMode === 'waiting-quick' ? 'text-blue-500' : 'text-yellow-500'
                )}>
                  {props.refuelMode === 'waiting-quick' 
                    ? 'Teste Rápido Ativo' 
                    : 'Modo Abastecimento Ativo'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {props.refuelMode === 'waiting-quick' 
                    ? 'Comece a dirigir para iniciar' 
                    : 'Confirme os dados do abastecimento'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={props.cancelRefuel} className="h-8 w-8 flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {(props.refuelMode === 'monitoring' || props.refuelMode === 'analyzing') && (
        <div className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto">
          <FuelQualityMonitor mode={props.refuelMode} distanceMonitored={props.distanceMonitored} currentSTFT={props.currentSTFT} currentLTFT={props.currentLTFT} anomalyActive={props.anomalyActive} anomalyDuration={props.anomalyDuration} fuelTrimHistory={props.fuelTrimHistory} settings={props.refuelSettings} frozenSettings={props.frozenSettings} isSyncing={props.isSyncing} flowType={props.refuelFlowType} />
        </div>
      )}
      
      {props.refuelMode === 'completed' && props.currentRefuel && (
        <div className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto">
          <RefuelResult refuel={props.currentRefuel as RefuelEntry} flowType={props.refuelFlowType} onClose={props.cancelRefuel} />
        </div>
      )}
      
      {props.isConnected && (
        <div className="fixed bottom-4 left-4 z-50 safe-area-bottom flex items-center gap-2">
          <RefuelButton mode={props.refuelMode} flowType={props.refuelFlowType} isConnected={props.isConnected} isAuthenticated={props.isAuthenticated} onStart={() => props.onFlowSelectorChange(true)} onCancel={props.cancelRefuel} />
          {props.refuelMode === 'inactive' && <RefuelSettingsSheet settings={props.refuelSettings} onSettingsChange={props.onUpdateRefuelSettings} onReset={props.onResetRefuelSettings} />}
        </div>
      )}
      
      <RefuelFlowSelector open={props.isFlowSelectorOpen} onOpenChange={props.onFlowSelectorChange} stftSupported={props.stftSupported} isAuthenticated={props.isAuthenticated} onSelectRefuel={() => { props.startRefuelMode(); props.onRefuelModalChange(true); }} onSelectQuickTest={props.startQuickTest} />
    </>
  );
}
