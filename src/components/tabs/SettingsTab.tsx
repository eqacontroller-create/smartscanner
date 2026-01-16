import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Settings, Bot, Bell, DollarSign, Fuel, Car, Smartphone, 
  Volume2, Mic, Gauge, Thermometer, Battery, 
  Zap, Moon, RefreshCw, LogOut, RotateCcw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { VehicleSetup, type VehicleConfig } from '@/components/settings/VehicleSetup';
import type { JarvisSettings } from '@/types/jarvisSettings';
import type { TripSettings } from '@/types/tripSettings';
import type { RefuelSettings } from '@/types/refuelTypes';
import type { VehicleInfo } from '@/hooks/useSyncedProfile';

interface SettingsTabProps {
  jarvisSettings: JarvisSettings;
  tripSettings: TripSettings;
  refuelSettings: RefuelSettings;
  vehicleInfo?: VehicleInfo;
  onUpdateJarvisSetting: <K extends keyof JarvisSettings>(key: K, value: JarvisSettings[K]) => void;
  onUpdateTripSettings: (settings: Partial<TripSettings>) => void;
  onUpdateRefuelSettings: (settings: Partial<RefuelSettings>) => void;
  onUpdateVehicle?: (vehicle: Partial<VehicleInfo>) => Promise<void>;
  onResetJarvisSettings: () => void;
  onResetRefuelSettings: () => void;
  onTestVoice: () => void;
  availableVoices: SpeechSynthesisVoice[];
  portugueseVoices: SpeechSynthesisVoice[];
  isSpeaking: boolean;
  isWakeLockActive: boolean;
}

export function SettingsTab({
  jarvisSettings,
  tripSettings,
  refuelSettings,
  vehicleInfo,
  onUpdateJarvisSetting,
  onUpdateTripSettings,
  onUpdateRefuelSettings,
  onUpdateVehicle,
  onResetJarvisSettings,
  onResetRefuelSettings,
  onTestVoice,
  availableVoices,
  portugueseVoices,
  isSpeaking,
  isWakeLockActive,
}: SettingsTabProps) {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<string[]>(['jarvis']);

  const voicesToShow = portugueseVoices.length > 0 ? portugueseVoices : availableVoices.slice(0, 10);

  return (
    <div className="space-y-4 sm:space-y-6 tab-content-enter">
      <div className="animate-fade-in">
        <SectionHeader
          icon={Settings}
          title="Configurações"
          description="Personalize o app ao seu estilo"
        />
      </div>

      <Accordion 
        type="multiple" 
        value={expandedSections}
        onValueChange={setExpandedSections}
        className="space-y-3 animate-fade-in stagger-1"
      >
        {/* Jarvis AI */}
        <AccordionItem value="jarvis" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Jarvis AI</p>
                <p className="text-xs text-muted-foreground">Assistente de voz inteligente</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4 space-y-4">
            {/* Ativar Jarvis */}
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-mode" className="text-sm">Ativar Jarvis AI</Label>
              <Switch
                id="ai-mode"
                checked={jarvisSettings.aiModeEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('aiModeEnabled', v)}
              />
            </div>

            {/* Voz */}
            <div className="space-y-2">
              <Label className="text-sm">Voz</Label>
              <Select
                value={jarvisSettings.selectedVoiceURI || ''}
                onValueChange={(v) => onUpdateJarvisSetting('selectedVoiceURI', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar voz" />
                </SelectTrigger>
                <SelectContent>
                  {voicesToShow.map((voice) => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Volume
                </Label>
                <span className="text-sm text-muted-foreground">{Math.round(jarvisSettings.volume * 100)}%</span>
              </div>
              <Slider
                value={[jarvisSettings.volume]}
                onValueChange={([v]) => onUpdateJarvisSetting('volume', v)}
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            {/* Velocidade */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Velocidade</Label>
                <span className="text-sm text-muted-foreground">{jarvisSettings.rate.toFixed(1)}x</span>
              </div>
              <Slider
                value={[jarvisSettings.rate]}
                onValueChange={([v]) => onUpdateJarvisSetting('rate', v)}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>

            {/* Boas-vindas */}
            <div className="flex items-center justify-between">
              <Label htmlFor="welcome" className="text-sm">Mensagem de boas-vindas</Label>
              <Switch
                id="welcome"
                checked={jarvisSettings.welcomeEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('welcomeEnabled', v)}
              />
            </div>

            {/* Escuta contínua */}
            <div className="flex items-center justify-between">
              <Label htmlFor="continuous" className="text-sm flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Escuta contínua
              </Label>
              <Switch
                id="continuous"
                checked={jarvisSettings.continuousListening}
                onCheckedChange={(v) => onUpdateJarvisSetting('continuousListening', v)}
              />
            </div>

            <Button 
              variant="outline" 
              className="w-full gap-2" 
              onClick={onTestVoice}
              disabled={isSpeaking}
            >
              <Volume2 className="h-4 w-4" />
              Testar Voz
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Alertas e Limites */}
        <AccordionItem value="alertas" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Bell className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Alertas e Limites</p>
                <p className="text-xs text-muted-foreground">Configure avisos de segurança</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4 space-y-4">
            {/* RPM Alto */}
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Alerta RPM alto
              </Label>
              <Switch
                checked={jarvisSettings.highRpmAlertEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('highRpmAlertEnabled', v)}
              />
            </div>

            {/* Redline RPM */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Redline RPM</Label>
                <span className="text-sm text-muted-foreground">{jarvisSettings.redlineRPM}</span>
              </div>
              <Slider
                value={[jarvisSettings.redlineRPM]}
                onValueChange={([v]) => onUpdateJarvisSetting('redlineRPM', v)}
                min={4000}
                max={8000}
                step={500}
              />
            </div>

            {/* Temperatura Alta */}
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Alerta temperatura alta
              </Label>
              <Switch
                checked={jarvisSettings.highTempAlertEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('highTempAlertEnabled', v)}
              />
            </div>

            {/* Limite Temperatura */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Limite temperatura (°C)</Label>
                <span className="text-sm text-muted-foreground">{jarvisSettings.highTempThreshold}°C</span>
              </div>
              <Slider
                value={[jarvisSettings.highTempThreshold]}
                onValueChange={([v]) => onUpdateJarvisSetting('highTempThreshold', v)}
                min={90}
                max={120}
                step={5}
              />
            </div>

            {/* Velocidade */}
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Alerta velocidade
              </Label>
              <Switch
                checked={jarvisSettings.speedAlertEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('speedAlertEnabled', v)}
              />
            </div>

            {/* Limite Velocidade */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Limite velocidade (km/h)</Label>
                <span className="text-sm text-muted-foreground">{jarvisSettings.speedLimit} km/h</span>
              </div>
              <Slider
                value={[jarvisSettings.speedLimit]}
                onValueChange={([v]) => onUpdateJarvisSetting('speedLimit', v)}
                min={60}
                max={180}
                step={10}
              />
            </div>

            {/* Voltagem Baixa */}
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                <Battery className="h-4 w-4" />
                Alerta bateria baixa
              </Label>
              <Switch
                checked={jarvisSettings.lowVoltageAlertEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('lowVoltageAlertEnabled', v)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Configurações Financeiras */}
        <AccordionItem value="financeiro" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Financeiro</p>
                <p className="text-xs text-muted-foreground">Custos e consumo</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4 space-y-4">
            {/* Preço Combustível */}
            <div className="space-y-2">
              <Label className="text-sm">Preço do combustível (R$/L)</Label>
              <Input
                type="number"
                step="0.01"
                value={tripSettings.fuelPrice}
                onChange={(e) => onUpdateTripSettings({ fuelPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Consumo Médio */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Consumo médio (km/L)</Label>
                <span className="text-sm text-muted-foreground">{tripSettings.averageConsumption.toFixed(1)}</span>
              </div>
              <Slider
                value={[tripSettings.averageConsumption]}
                onValueChange={([v]) => onUpdateTripSettings({ averageConsumption: v })}
                min={5}
                max={25}
                step={0.5}
              />
            </div>

            {/* Custo por km */}
            <div className="space-y-2">
              <Label className="text-sm">Custo adicional por km (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={tripSettings.vehicleCostPerKm}
                onChange={(e) => onUpdateTripSettings({ vehicleCostPerKm: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Auto-Ride */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">Detecção automática de corridas</Label>
              <Switch
                checked={tripSettings.autoRideEnabled}
                onCheckedChange={(v) => onUpdateTripSettings({ autoRideEnabled: v })}
              />
            </div>

            {tripSettings.autoRideEnabled && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Velocidade mínima para iniciar</Label>
                  <span className="text-sm text-muted-foreground">{tripSettings.speedThreshold} km/h</span>
                </div>
                <Slider
                  value={[tripSettings.speedThreshold]}
                  onValueChange={([v]) => onUpdateTripSettings({ speedThreshold: v })}
                  min={5}
                  max={30}
                  step={1}
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Monitor de Combustível */}
        <AccordionItem value="combustivel" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Fuel className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Monitor de Combustível</p>
                <p className="text-xs text-muted-foreground">Análise de qualidade</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4 space-y-4">
            {/* Distância de monitoramento */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Distância de monitoramento</Label>
                <span className="text-sm text-muted-foreground">{refuelSettings.monitoringDistance} km</span>
              </div>
              <Slider
                value={[refuelSettings.monitoringDistance]}
                onValueChange={([v]) => onUpdateRefuelSettings({ monitoringDistance: v })}
                min={1}
                max={10}
                step={0.5}
              />
            </div>

            {/* Limite de alerta */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Limite de alerta (%)</Label>
                <span className="text-sm text-muted-foreground">{refuelSettings.stftWarningThreshold}%</span>
              </div>
              <Slider
                value={[refuelSettings.stftWarningThreshold]}
                onValueChange={([v]) => onUpdateRefuelSettings({ stftWarningThreshold: v })}
                min={5}
                max={30}
                step={1}
              />
            </div>

            <Button 
              variant="outline" 
              className="w-full gap-2" 
              onClick={onResetRefuelSettings}
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar Padrões
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Perfil do Veículo */}
        <AccordionItem value="veiculo" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Car className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Perfil do Veículo</p>
                <p className="text-xs text-muted-foreground">Quilometragem e manutenção</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4 space-y-4">
            {onUpdateVehicle ? (
              <VehicleSetup
                detectedBrand={vehicleInfo?.vehicleBrand}
                detectedYear={vehicleInfo?.modelYear}
                detectedVin={vehicleInfo?.vin}
                currentConfig={{
                  brand: vehicleInfo?.vehicleBrand || '',
                  model: vehicleInfo?.vehicleModel || '',
                  year: vehicleInfo?.modelYear || '',
                  engine: vehicleInfo?.vehicleEngine || '',
                  transmission: vehicleInfo?.vehicleTransmission || 'manual',
                  nickname: vehicleInfo?.vehicleNickname || '',
                }}
                onSave={async (config) => {
                  await onUpdateVehicle({
                    vehicleBrand: config.brand,
                    vehicleModel: config.model,
                    modelYear: config.year,
                    vehicleEngine: config.engine,
                    vehicleTransmission: config.transmission,
                    vehicleNickname: config.nickname,
                  });
                }}
              />
            ) : (
              <div className="space-y-2">
                <Label className="text-sm">Quilometragem atual</Label>
                <Input
                  type="number"
                  value={jarvisSettings.currentMileage}
                  onChange={(e) => onUpdateJarvisSetting('currentMileage', parseInt(e.target.value) || 0)}
                  placeholder="Ex: 50000"
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* App e Conta */}
        <AccordionItem value="app" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Smartphone className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">App e Conta</p>
                <p className="text-xs text-muted-foreground">Preferências gerais</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4 space-y-4">
            {/* Modo Insônia */}
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Modo Insônia
                {isWakeLockActive && (
                  <span className="text-xs text-blue-400">(Ativo)</span>
                )}
              </Label>
              <Switch
                checked={jarvisSettings.keepAwakeEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('keepAwakeEnabled', v)}
              />
            </div>

            {/* Reconexão Automática */}
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reconexão automática
              </Label>
              <Switch
                checked={jarvisSettings.autoReconnectEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('autoReconnectEnabled', v)}
              />
            </div>

            {/* Conta */}
            {isAuthenticated && user && (
              <div className="pt-4 border-t space-y-3">
                <p className="text-sm text-muted-foreground">
                  Logado como: <span className="text-foreground">{user.email}</span>
                </p>
                <Button 
                  variant="outline" 
                  className="w-full gap-2 text-destructive hover:text-destructive"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </Button>
              </div>
            )}

            {!isAuthenticated && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Fazer Login
              </Button>
            )}

            {/* Reset Geral */}
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={onResetJarvisSettings}
              >
                <RotateCcw className="h-4 w-4" />
                Restaurar Padrões do Jarvis
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
