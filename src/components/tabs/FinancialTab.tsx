import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TripMonitor } from '@/components/financial/TripMonitor';
import { TripControls } from '@/components/financial/TripControls';
import { QuickSettings } from '@/components/financial/QuickSettings';
import { TripHistory } from '@/components/financial/TripHistory';
import { TodayRides } from '@/components/financial/TodayRides';
import { RideStatusBadge } from '@/components/financial/RideStatusBadge';
import { 
  FuelEducation,
  FuelActionCards,
  FuelMonitoringDashboard,
  FuelHistory,
  FuelWaitingCard,
  RefuelResult,
  RefuelSettingsSheet,
} from '@/components/refuel';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Timer, Fuel, History, Car, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TripData, TripSettings, TripHistoryEntry, RideStatus, DailySummary } from '@/types/tripSettings';
import type { RefuelSettings, RefuelEntry, RefuelMode, RefuelFlowType, FuelTrimSample } from '@/types/refuelTypes';

interface FinancialTabProps {
  // Trip Calculator
  tripData: TripData;
  tripSettings: TripSettings;
  tripHistory: TripHistoryEntry[];
  onStartTrip: () => void;
  onPauseTrip: () => void;
  onResumeTrip: () => void;
  onResetTrip: () => void;
  onSaveTrip: () => void;
  onClearHistory: () => void;
  onUpdateSettings: (settings: Partial<TripSettings>) => void;
  onVoiceReport: () => void;
  currentSpeed: number | null;
  isSpeaking: boolean;
  
  // Auto Ride
  autoRideEnabled: boolean;
  rideStatus: RideStatus;
  dailySummary: DailySummary;
  onClearTodayRides: () => void;
  onDailyReport: () => void;
  
  // Refuel Monitor
  refuelMode: RefuelMode;
  refuelFlowType: RefuelFlowType | null;
  distanceMonitored: number;
  currentSTFT: number | null;
  currentLTFT: number | null;
  anomalyActive: boolean;
  anomalyDuration: number;
  fuelTrimHistory: FuelTrimSample[];
  refuelSettings: RefuelSettings;
  frozenSettings: RefuelSettings | null;
  currentRefuel: Partial<RefuelEntry> | null;
  isSyncing: boolean;
  stftSupported: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  onStartRefuelMode: () => void;
  onStartQuickTest: () => void;
  onCancelRefuel: () => void;
  onOpenRefuelModal: () => void;
  onUpdateRefuelSettings: (settings: Partial<RefuelSettings>) => void;
  onResetRefuelSettings: () => void;
  userId?: string;
}

export function FinancialTab({
  tripData,
  tripSettings,
  tripHistory,
  onStartTrip,
  onPauseTrip,
  onResumeTrip,
  onResetTrip,
  onSaveTrip,
  onClearHistory,
  onUpdateSettings,
  onVoiceReport,
  currentSpeed,
  isSpeaking,
  autoRideEnabled,
  rideStatus,
  dailySummary,
  onClearTodayRides,
  onDailyReport,
  refuelMode,
  refuelFlowType,
  distanceMonitored,
  currentSTFT,
  currentLTFT,
  anomalyActive,
  anomalyDuration,
  fuelTrimHistory,
  refuelSettings,
  frozenSettings,
  currentRefuel,
  isSyncing,
  stftSupported,
  isConnected,
  isAuthenticated,
  onStartRefuelMode,
  onStartQuickTest,
  onCancelRefuel,
  onOpenRefuelModal,
  onUpdateRefuelSettings,
  onResetRefuelSettings,
  userId,
}: FinancialTabProps) {
  const [subTab, setSubTab] = useState('taximetro');

  return (
    <div className="space-y-4 sm:space-y-6 tab-content-enter">
      <div className="animate-fade-in">
        <SectionHeader
          icon={DollarSign}
          title="Controle Financeiro"
          description="Gerencie custos, viagens e combustível"
          badge={autoRideEnabled ? 'Auto' : undefined}
          badgeVariant="success"
        />
      </div>

      {/* Status da corrida automática */}
      {autoRideEnabled && (
        <div className="flex justify-center animate-fade-in stagger-1">
          <RideStatusBadge status={rideStatus} />
        </div>
      )}

      <Tabs value={subTab} onValueChange={setSubTab} className="w-full animate-fade-in stagger-2">
        <TabsList className="grid w-full grid-cols-4 h-auto tabs-scroll glass">
          <TabsTrigger value="taximetro" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row press-effect">
            <Timer className="h-4 w-4" />
            <span className="hidden xs:inline">Viagem</span>
          </TabsTrigger>
          <TabsTrigger value="corridas" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row press-effect">
            <Car className="h-4 w-4" />
            <span className="hidden xs:inline">Hoje</span>
          </TabsTrigger>
          <TabsTrigger value="combustivel" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row relative press-effect">
            <Fuel className="h-4 w-4" />
            <span className="hidden xs:inline">Fuel</span>
            {refuelMode !== 'inactive' && refuelMode !== 'completed' && (
              <span className={cn(
                "absolute -top-1 -right-1 h-2 w-2 rounded-full animate-glow",
                refuelMode === 'waiting-quick' ? 'bg-blue-500' : 'bg-primary'
              )} />
            )}
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row press-effect">
            <History className="h-4 w-4" />
            <span className="hidden xs:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        {/* Taxímetro (Viagem Atual) */}
        <TabsContent value="taximetro" className="space-y-4 mt-4 tab-content-enter">
          <div className="card-hover rounded-xl">
            <TripMonitor 
              tripData={tripData} 
              currentSpeed={currentSpeed}
            />
          </div>
          <div className="animate-fade-in stagger-1 card-hover rounded-xl">
            <TripControls
              tripData={tripData}
              onStart={onStartTrip}
              onPause={onPauseTrip}
              onResume={onResumeTrip}
              onReset={onResetTrip}
              onSave={onSaveTrip}
              onVoiceReport={onVoiceReport}
              isSpeaking={isSpeaking}
            />
          </div>
          <div className="animate-fade-in stagger-2">
            <QuickSettings
              settings={tripSettings}
              onUpdateSettings={onUpdateSettings}
            />
          </div>
        </TabsContent>

        {/* Corridas de Hoje (Auto-Ride) */}
        <TabsContent value="corridas" className="space-y-4 mt-4 tab-content-enter">
          {autoRideEnabled ? (
            <div className="card-hover rounded-xl">
              <TodayRides
                summary={dailySummary}
                onClear={onClearTodayRides}
                onVoiceReport={onDailyReport}
                isSpeaking={isSpeaking}
              />
            </div>
          ) : (
            <EmptyState
              icon={Car}
              title="Auto-Ride Desativado"
              description="Ative a detecção automática nas configurações para ver suas corridas do dia."
            />
          )}
        </TabsContent>

        {/* Combustível (Qualidade e Abastecimento) */}
        <TabsContent value="combustivel" className="space-y-4 mt-4 tab-content-enter">
          {/* Estado Inativo - Educação + Ações */}
          {refuelMode === 'inactive' && (
            <>
              <FuelEducation defaultOpen={['what-is']} />
              
              <FuelActionCards
                isConnected={isConnected}
                isAuthenticated={isAuthenticated}
                stftSupported={stftSupported}
                onStartRefuel={() => {
                  onStartRefuelMode();
                  onOpenRefuelModal();
                }}
                onStartQuickTest={onStartQuickTest}
              />
              
              {/* Configurações */}
              <div className="flex justify-end">
                <RefuelSettingsSheet
                  settings={refuelSettings}
                  onSettingsChange={onUpdateRefuelSettings}
                  onReset={onResetRefuelSettings}
                />
              </div>
              
              <FuelHistory 
                userId={userId} 
                isAuthenticated={isAuthenticated} 
              />
            </>
          )}

          {/* Estados de Espera - Card visual com instrução */}
          {(refuelMode === 'waiting' || refuelMode === 'waiting-quick') && (
            <FuelWaitingCard
              mode={refuelMode}
              flowType={refuelFlowType}
              currentSpeed={currentSpeed}
              isAuthenticated={isAuthenticated}
              onCancel={onCancelRefuel}
              onOpenModal={refuelMode === 'waiting' ? onOpenRefuelModal : undefined}
            />
          )}

          {/* Estado Monitorando - Dashboard em tempo real */}
          {(refuelMode === 'monitoring' || refuelMode === 'analyzing') && (
            <FuelMonitoringDashboard
              mode={refuelMode}
              flowType={refuelFlowType}
              distanceMonitored={distanceMonitored}
              currentSTFT={currentSTFT}
              currentLTFT={currentLTFT}
              anomalyActive={anomalyActive}
              anomalyDuration={anomalyDuration}
              fuelTrimHistory={fuelTrimHistory}
              settings={refuelSettings}
              frozenSettings={frozenSettings}
              isSyncing={isSyncing}
              onCancel={onCancelRefuel}
            />
          )}

          {/* Resultado da Análise */}
          {refuelMode === 'completed' && currentRefuel && (
            <div className="animate-scale-in">
              <RefuelResult
                refuel={currentRefuel as RefuelEntry}
                flowType={refuelFlowType || 'refuel'}
                onClose={onCancelRefuel}
              />
            </div>
          )}

          {/* Estatísticas de Consumo */}
          <Card className="card-hover animate-fade-in">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Resumo de Consumo
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary value-transition">
                    {tripSettings.averageConsumption.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">km/L médio</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground value-transition">
                    R$ {tripSettings.fuelPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">preço/litro</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico Geral */}
        <TabsContent value="historico" className="space-y-4 mt-4 tab-content-enter">
          <div className="card-hover rounded-xl">
            <TripHistory
              history={tripHistory}
              onClearHistory={onClearHistory}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
