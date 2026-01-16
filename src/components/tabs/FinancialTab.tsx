import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TripMonitor } from '@/components/financial/TripMonitor';
import { TripControls } from '@/components/financial/TripControls';
import { QuickSettings } from '@/components/financial/QuickSettings';
import { TripHistory } from '@/components/financial/TripHistory';
import { TodayRides } from '@/components/financial/TodayRides';
import { RideStatusBadge } from '@/components/financial/RideStatusBadge';
import { FuelQualityMonitor } from '@/components/refuel/FuelQualityMonitor';
import { RefuelResult } from '@/components/refuel/RefuelResult';
import { RefuelButton } from '@/components/refuel/RefuelButton';
import { RefuelSettingsSheet } from '@/components/refuel/RefuelSettingsSheet';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Timer, Fuel, History, Car, TrendingUp, Zap } from 'lucide-react';
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
}: FinancialTabProps) {
  const [subTab, setSubTab] = useState('taximetro');

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <SectionHeader
        icon={DollarSign}
        title="Controle Financeiro"
        description="Gerencie custos, viagens e combustível"
        badge={autoRideEnabled ? 'Auto' : undefined}
        badgeVariant="success"
      />

      {/* Status da corrida automática */}
      {autoRideEnabled && (
        <div className="flex justify-center animate-fade-in">
          <RideStatusBadge status={rideStatus} />
        </div>
      )}

      <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto tabs-scroll">
          <TabsTrigger value="taximetro" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row">
            <Timer className="h-4 w-4" />
            <span className="hidden xs:inline">Viagem</span>
          </TabsTrigger>
          <TabsTrigger value="corridas" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row">
            <Car className="h-4 w-4" />
            <span className="hidden xs:inline">Hoje</span>
          </TabsTrigger>
          <TabsTrigger value="combustivel" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row relative">
            <Fuel className="h-4 w-4" />
            <span className="hidden xs:inline">Fuel</span>
            {(refuelMode === 'monitoring' || refuelMode === 'analyzing') && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5 py-2.5 text-xs touch-target flex-col sm:flex-row">
            <History className="h-4 w-4" />
            <span className="hidden xs:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        {/* Taxímetro (Viagem Atual) */}
        <TabsContent value="taximetro" className="space-y-4 mt-4 animate-fade-in">
          <TripMonitor 
            tripData={tripData} 
            currentSpeed={currentSpeed}
          />
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
          <QuickSettings
            settings={tripSettings}
            onUpdateSettings={onUpdateSettings}
          />
        </TabsContent>

        {/* Corridas de Hoje (Auto-Ride) */}
        <TabsContent value="corridas" className="space-y-4 mt-4 animate-fade-in">
          {autoRideEnabled ? (
            <TodayRides
              summary={dailySummary}
              onClear={onClearTodayRides}
              onVoiceReport={onDailyReport}
              isSpeaking={isSpeaking}
            />
          ) : (
            <EmptyState
              icon={Car}
              title="Auto-Ride Desativado"
              description="Ative a detecção automática nas configurações para ver suas corridas do dia."
            />
          )}
        </TabsContent>

        {/* Combustível (Qualidade e Abastecimento) */}
        <TabsContent value="combustivel" className="space-y-4 mt-4 animate-fade-in">
          {/* Controles de Combustível */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-primary" />
                    Monitor de Combustível
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {refuelMode === 'inactive' 
                      ? 'Inicie uma análise para verificar a qualidade do combustível'
                      : refuelMode === 'monitoring'
                      ? 'Monitorando Fuel Trim...'
                      : refuelMode === 'analyzing'
                      ? 'Analisando dados coletados...'
                      : 'Análise concluída'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {refuelMode === 'inactive' && (
                    <RefuelSettingsSheet
                      settings={refuelSettings}
                      onSettingsChange={onUpdateRefuelSettings}
                      onReset={onResetRefuelSettings}
                    />
                  )}
                  <RefuelButton
                    mode={refuelMode}
                    isConnected={isConnected}
                    isAuthenticated={isAuthenticated}
                    onStart={onOpenRefuelModal}
                    onCancel={onCancelRefuel}
                  />
                </div>
              </div>

              {/* Botões de ação quando inativo */}
              {refuelMode === 'inactive' && isConnected && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 flex-col gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    onClick={() => {
                      onStartRefuelMode();
                      onOpenRefuelModal();
                    }}
                  >
                    <Fuel className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium">Vou Abastecer</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 flex-col gap-1 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                    onClick={onStartQuickTest}
                    disabled={!stftSupported}
                  >
                    <Zap className="h-5 w-5 text-blue-500" />
                    <span className="text-xs font-medium">Teste Rápido</span>
                    {!stftSupported && (
                      <span className="text-[10px] text-muted-foreground">STFT indisponível</span>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monitor de Qualidade (quando ativo) */}
          {(refuelMode === 'monitoring' || refuelMode === 'analyzing') && (
            <FuelQualityMonitor
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
            />
          )}

          {/* Resultado da Análise */}
          {refuelMode === 'completed' && currentRefuel && (
            <RefuelResult
              refuel={currentRefuel as RefuelEntry}
              flowType={refuelFlowType || 'refuel'}
              onClose={onCancelRefuel}
            />
          )}

          {/* Estatísticas de Consumo */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Resumo de Consumo
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {tripSettings.averageConsumption.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">km/L médio</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    R$ {tripSettings.fuelPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">preço/litro</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico Geral */}
        <TabsContent value="historico" className="space-y-4 mt-4 animate-fade-in">
          <TripHistory
            history={tripHistory}
            onClearHistory={onClearHistory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
