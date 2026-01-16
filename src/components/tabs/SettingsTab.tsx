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
import { Separator } from '@/components/ui/separator';
import { 
  Settings, Bot, Bell, DollarSign, Fuel, Car, Smartphone, 
  Volume2, Mic, Gauge, Thermometer, Battery, 
  Zap, Moon, RefreshCw, LogOut, RotateCcw, Wrench,
  Brain, Radio, Sparkles, Eye, EyeOff, CheckCircle, XCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { VehicleSetup, type VehicleConfig } from '@/components/settings/VehicleSetup';
import type { JarvisSettings, FuelType, AIProvider, OpenAIVoice } from '@/types/jarvisSettings';
import { getDefaultRedlineForFuelType, getShiftPoints } from '@/types/jarvisSettings';
import type { TripSettings } from '@/types/tripSettings';
import type { RefuelSettings } from '@/types/refuelTypes';
import type { VehicleInfo } from '@/hooks/useSyncedProfile';
import { encryptApiKey, decryptApiKey, isValidOpenAIKey, maskApiKey } from '@/lib/encryption';

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
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const voicesToShow = portugueseVoices.length > 0 ? portugueseVoices : availableVoices.slice(0, 10);

  // Handler para mudança de tipo de combustível (auto-ajusta redline)
  const handleFuelTypeChange = (value: FuelType) => {
    onUpdateJarvisSetting('fuelType', value);
    onUpdateJarvisSetting('redlineRPM', getDefaultRedlineForFuelType(value));
  };

  // Handler para salvar API key
  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      const encrypted = encryptApiKey(apiKeyInput.trim());
      onUpdateJarvisSetting('openaiApiKey', encrypted);
      setApiKeyInput('');
    }
  };

  // Handler para remover API key
  const handleRemoveApiKey = () => {
    onUpdateJarvisSetting('openaiApiKey', null);
    setApiKeyInput('');
  };

  // Verifica se API key está configurada e válida
  const hasApiKey = !!jarvisSettings.openaiApiKey;
  const decryptedKey = jarvisSettings.openaiApiKey ? decryptApiKey(jarvisSettings.openaiApiKey) : '';
  const isApiKeyValid = decryptedKey ? isValidOpenAIKey(decryptedKey) : false;

  // Calcular pontos de shift
  const shiftPoints = getShiftPoints(jarvisSettings.redlineRPM);

  return (
    <div className="space-y-4 sm:space-y-6 tab-content-enter">
      <div className="animate-fade-in">
        <SectionHeader
          icon={Settings}
          title="Central de Configurações"
          description="Todas as configurações do app em um só lugar"
        />
      </div>

      <Accordion 
        type="multiple" 
        value={expandedSections}
        onValueChange={setExpandedSections}
        className="space-y-3 animate-fade-in stagger-1"
      >
        {/* ========== JARVIS AI ========== */}
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
          <AccordionContent className="px-3 sm:px-4 pb-4 space-y-6">
            {/* Ativar Jarvis */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ai-mode" className="text-sm font-medium">Ativar Jarvis AI</Label>
                <p className="text-xs text-muted-foreground">Converse naturalmente com o assistente</p>
              </div>
              <Switch
                id="ai-mode"
                checked={jarvisSettings.aiModeEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('aiModeEnabled', v)}
              />
            </div>

            {jarvisSettings.aiModeEnabled && (
              <>
                <Separator />
                
                {/* Tamanho das Respostas */}
                <div className="space-y-2">
                  <Label className="text-sm">Tamanho das respostas</Label>
                  <Select
                    value={jarvisSettings.aiResponseLength}
                    onValueChange={(v: 'short' | 'medium' | 'detailed') => onUpdateJarvisSetting('aiResponseLength', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Curta (1-2 frases)</SelectItem>
                      <SelectItem value="medium">Média (2-3 frases)</SelectItem>
                      <SelectItem value="detailed">Detalhada (3-4 frases)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Escuta Contínua */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="continuous" className="text-sm font-medium flex items-center gap-2">
                        <Radio className="h-4 w-4 text-accent" />
                        Escuta contínua
                      </Label>
                      <p className="text-xs text-muted-foreground">Jarvis fica sempre atento à wake word</p>
                    </div>
                    <Switch
                      id="continuous"
                      checked={jarvisSettings.continuousListening}
                      onCheckedChange={(v) => onUpdateJarvisSetting('continuousListening', v)}
                    />
                  </div>

                  {jarvisSettings.continuousListening && (
                    <div className="space-y-2 pl-4 border-l-2 border-accent/30">
                      <Label className="text-xs text-muted-foreground">Palavra de ativação</Label>
                      <Input
                        value={jarvisSettings.wakeWord}
                        onChange={(e) => onUpdateJarvisSetting('wakeWord', e.target.value || 'jarvis')}
                        placeholder="jarvis"
                        className="h-9"
                      />
                      <p className="text-xs text-muted-foreground">
                        💡 Diga "{jarvisSettings.wakeWord}, como está o motor?"
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Cérebro do Jarvis */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <Label className="text-sm font-medium">Cérebro do Jarvis</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <div 
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        jarvisSettings.aiProvider === 'basic' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => onUpdateJarvisSetting('aiProvider', 'basic')}
                    >
                      <input 
                        type="radio" 
                        checked={jarvisSettings.aiProvider === 'basic'} 
                        onChange={() => onUpdateJarvisSetting('aiProvider', 'basic')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">IA Básica</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-500">Grátis</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Análises locais, voz do navegador
                        </p>
                      </div>
                    </div>

                    <div 
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        jarvisSettings.aiProvider === 'openai' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => onUpdateJarvisSetting('aiProvider', 'openai')}
                    >
                      <input 
                        type="radio" 
                        checked={jarvisSettings.aiProvider === 'openai'} 
                        onChange={() => onUpdateJarvisSetting('aiProvider', 'openai')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">IA Avançada</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-500">OpenAI</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          GPT-4o-mini, voz premium Onyx
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Configurações OpenAI */}
                  {jarvisSettings.aiProvider === 'openai' && (
                    <div className="space-y-4 pt-2 border-l-2 border-purple-500/30 pl-4">
                      {/* API Key */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          Chave da API OpenAI
                          {hasApiKey && (
                            isApiKeyValid 
                              ? <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              : <XCircle className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Label>
                        
                        {hasApiKey ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                              <code className="text-xs flex-1 font-mono">
                                {showApiKey ? decryptedKey : maskApiKey(decryptedKey)}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="h-7 w-7 p-0"
                              >
                                {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveApiKey}
                              className="w-full text-destructive hover:text-destructive"
                            >
                              Remover chave
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                type="password"
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                placeholder="sk-..."
                                className="h-9 font-mono text-xs"
                              />
                              <Button
                                size="sm"
                                onClick={handleSaveApiKey}
                                disabled={!apiKeyInput.trim()}
                                className="h-9"
                              >
                                Salvar
                              </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Obtenha em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com</a>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* TTS Premium */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="openai-tts" className="text-sm font-medium">Voz Premium (TTS)</Label>
                          <p className="text-xs text-muted-foreground">Usar síntese de voz da OpenAI</p>
                        </div>
                        <Switch
                          id="openai-tts"
                          checked={jarvisSettings.openaiTTSEnabled}
                          onCheckedChange={(v) => onUpdateJarvisSetting('openaiTTSEnabled', v)}
                          disabled={!hasApiKey}
                        />
                      </div>

                      {/* Voz OpenAI */}
                      {jarvisSettings.openaiTTSEnabled && hasApiKey && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Voz Premium</Label>
                          <Select
                            value={jarvisSettings.openaiVoice}
                            onValueChange={(v: OpenAIVoice) => onUpdateJarvisSetting('openaiVoice', v)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="onyx">Onyx (grave, confiante)</SelectItem>
                              <SelectItem value="alloy">Alloy (neutro, versátil)</SelectItem>
                              <SelectItem value="echo">Echo (média, clara)</SelectItem>
                              <SelectItem value="fable">Fable (expressivo, narrativo)</SelectItem>
                              <SelectItem value="nova">Nova (feminino, suave)</SelectItem>
                              <SelectItem value="shimmer">Shimmer (feminino, caloroso)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {!hasApiKey && (
                        <p className="text-xs text-yellow-500">⚠️ Configure a API key para usar recursos avançados</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Configurações de Voz */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Configurações de Voz</Label>
              </div>

              {/* Voz */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Voz do navegador</Label>
                <Select
                  value={jarvisSettings.selectedVoiceURI || 'auto'}
                  onValueChange={(v) => onUpdateJarvisSetting('selectedVoiceURI', v === 'auto' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Automático" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático</SelectItem>
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
                  <Label className="text-xs text-muted-foreground">Volume</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(jarvisSettings.volume * 100)}%</span>
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
                  <Label className="text-xs text-muted-foreground">Velocidade</Label>
                  <span className="text-xs text-muted-foreground">{jarvisSettings.rate.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[jarvisSettings.rate]}
                  onValueChange={([v]) => onUpdateJarvisSetting('rate', v)}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
              </div>

              {/* Tom */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-muted-foreground">Tom</Label>
                  <span className="text-xs text-muted-foreground">{jarvisSettings.pitch.toFixed(2)}</span>
                </div>
                <Slider
                  value={[jarvisSettings.pitch]}
                  onValueChange={([v]) => onUpdateJarvisSetting('pitch', v)}
                  min={0.5}
                  max={2}
                  step={0.05}
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ========== ALERTAS E LIMITES ========== */}
        <AccordionItem value="alertas" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Bell className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Alertas e Limites</p>
                <p className="text-xs text-muted-foreground">Configure todos os avisos</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4 space-y-6">
            {/* Boas-vindas */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Boas-vindas ao conectar</Label>
                <p className="text-xs text-muted-foreground">Mensagem automática ao iniciar conexão</p>
              </div>
              <Switch
                checked={jarvisSettings.welcomeEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('welcomeEnabled', v)}
              />
            </div>

            {/* Motor frio */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Alerta de motor frio
                </Label>
                <p className="text-xs text-muted-foreground">Avisa quando acelerar com motor frio</p>
              </div>
              <Switch
                checked={jarvisSettings.highRpmAlertEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('highRpmAlertEnabled', v)}
              />
            </div>

            <Separator />

            {/* Temperatura Alta */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-destructive" />
                    Temperatura alta do motor
                  </Label>
                  <p className="text-xs text-muted-foreground">Alerta de superaquecimento</p>
                </div>
                <Switch
                  checked={jarvisSettings.highTempAlertEnabled}
                  onCheckedChange={(v) => onUpdateJarvisSetting('highTempAlertEnabled', v)}
                />
              </div>
              {jarvisSettings.highTempAlertEnabled && (
                <div className="space-y-2 pl-4 border-l-2 border-destructive/30">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">Limite de temperatura</Label>
                    <span className="text-xs font-medium">{jarvisSettings.highTempThreshold}°C</span>
                  </div>
                  <Slider
                    value={[jarvisSettings.highTempThreshold]}
                    onValueChange={([v]) => onUpdateJarvisSetting('highTempThreshold', v)}
                    min={80}
                    max={120}
                    step={5}
                  />
                </div>
              )}
            </div>

            {/* Velocidade */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Velocidade acima do limite
                  </Label>
                  <p className="text-xs text-muted-foreground">Avisa quando ultrapassar o limite</p>
                </div>
                <Switch
                  checked={jarvisSettings.speedAlertEnabled}
                  onCheckedChange={(v) => onUpdateJarvisSetting('speedAlertEnabled', v)}
                />
              </div>
              {jarvisSettings.speedAlertEnabled && (
                <div className="space-y-2 pl-4 border-l-2 border-yellow-500/30">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">Limite de velocidade</Label>
                    <span className="text-xs font-medium">{jarvisSettings.speedLimit} km/h</span>
                  </div>
                  <Slider
                    value={[jarvisSettings.speedLimit]}
                    onValueChange={([v]) => onUpdateJarvisSetting('speedLimit', v)}
                    min={60}
                    max={180}
                    step={10}
                  />
                </div>
              )}
            </div>

            {/* Voltagem Baixa */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  Alerta bateria baixa
                </Label>
                <p className="text-xs text-muted-foreground">Avisa quando voltagem {'<'} 12.5V</p>
              </div>
              <Switch
                checked={jarvisSettings.lowVoltageAlertEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('lowVoltageAlertEnabled', v)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ========== PERFIL DO MOTOR ========== */}
        <AccordionItem value="motor" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Fuel className="h-4 w-4 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Perfil do Motor</p>
                <p className="text-xs text-muted-foreground">Combustível, Redline e Shift Light</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4 space-y-6">
            {/* Tipo de Combustível */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Combustível</Label>
              <Select
                value={jarvisSettings.fuelType}
                onValueChange={(v: FuelType) => handleFuelTypeChange(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Gasolina</SelectItem>
                  <SelectItem value="ethanol">Etanol</SelectItem>
                  <SelectItem value="flex">Flex (Gasolina/Etanol)</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Redline */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm font-medium">Limite de Giro (Redline)</Label>
                <span className="text-xs font-medium text-primary">{jarvisSettings.redlineRPM} RPM</span>
              </div>
              <Slider
                value={[jarvisSettings.redlineRPM]}
                onValueChange={([v]) => onUpdateJarvisSetting('redlineRPM', v)}
                min={3000}
                max={9000}
                step={100}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>3000</span>
                <span>Diesel ~4500 | Gasolina ~6500</span>
                <span>9000</span>
              </div>
            </div>

            <Separator />

            {/* Shift Light */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent" />
                    Shift Light (Luz de Troca)
                  </Label>
                  <p className="text-xs text-muted-foreground">Avisos sonoros para troca de marcha</p>
                </div>
                <Switch
                  checked={jarvisSettings.shiftLightEnabled}
                  onCheckedChange={(v) => onUpdateJarvisSetting('shiftLightEnabled', v)}
                />
              </div>

              {jarvisSettings.shiftLightEnabled && (
                <div className="space-y-3 pl-4 border-l-2 border-accent/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Modo Eco (40%)</Label>
                      <p className="text-xs text-muted-foreground">Avisa em {shiftPoints.ecoPoint} RPM</p>
                    </div>
                    <Switch
                      checked={jarvisSettings.ecoShiftEnabled}
                      onCheckedChange={(v) => onUpdateJarvisSetting('ecoShiftEnabled', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Modo Sport (90%)</Label>
                      <p className="text-xs text-muted-foreground">Avisa em {shiftPoints.sportPoint} RPM</p>
                    </div>
                    <Switch
                      checked={jarvisSettings.sportShiftEnabled}
                      onCheckedChange={(v) => onUpdateJarvisSetting('sportShiftEnabled', v)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Alerta de Sobrecarga */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Alerta de Sobrecarga (Lugging)</Label>
                  <p className="text-xs text-muted-foreground">Avisa quando motor forçando (RPM baixo + pedal fundo)</p>
                </div>
                <Switch
                  checked={jarvisSettings.luggingAlertEnabled}
                  onCheckedChange={(v) => onUpdateJarvisSetting('luggingAlertEnabled', v)}
                />
              </div>
              {jarvisSettings.luggingAlertEnabled && (
                <p className="text-xs text-muted-foreground pl-4">
                  💡 Detecta quando RPM {'<'} {shiftPoints.luggingPoint} e carga {'>'} 80%
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ========== MANUTENÇÃO ========== */}
        <AccordionItem value="manutencao" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Wrench className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Manutenção</p>
                <p className="text-xs text-muted-foreground">Lembretes de revisão e óleo</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Ativar lembretes</Label>
                <p className="text-xs text-muted-foreground">Avisos baseados na quilometragem</p>
              </div>
              <Switch
                checked={jarvisSettings.maintenanceAlertEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('maintenanceAlertEnabled', v)}
              />
            </div>

            {jarvisSettings.maintenanceAlertEnabled && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quilometragem atual (km)</Label>
                  <Input
                    type="number"
                    value={jarvisSettings.currentMileage || ''}
                    onChange={(e) => onUpdateJarvisSetting('currentMileage', parseInt(e.target.value) || 0)}
                    placeholder="Ex: 85000"
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Próxima troca de óleo (km)</Label>
                  <Input
                    type="number"
                    value={jarvisSettings.nextOilChange || ''}
                    onChange={(e) => onUpdateJarvisSetting('nextOilChange', parseInt(e.target.value) || 0)}
                    placeholder="Ex: 90000"
                    className="h-9"
                  />
                  {jarvisSettings.currentMileage > 0 && jarvisSettings.nextOilChange > 0 && (
                    <p className={`text-xs ${jarvisSettings.nextOilChange - jarvisSettings.currentMileage <= 0 ? 'text-destructive font-medium' : jarvisSettings.nextOilChange - jarvisSettings.currentMileage <= 1000 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      {jarvisSettings.nextOilChange - jarvisSettings.currentMileage <= 0 
                        ? '⚠️ Troca de óleo atrasada!' 
                        : `Faltam ${(jarvisSettings.nextOilChange - jarvisSettings.currentMileage).toLocaleString('pt-BR')} km`}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Próxima revisão (km)</Label>
                  <Input
                    type="number"
                    value={jarvisSettings.nextInspection || ''}
                    onChange={(e) => onUpdateJarvisSetting('nextInspection', parseInt(e.target.value) || 0)}
                    placeholder="Ex: 100000"
                    className="h-9"
                  />
                  {jarvisSettings.currentMileage > 0 && jarvisSettings.nextInspection > 0 && (
                    <p className={`text-xs ${jarvisSettings.nextInspection - jarvisSettings.currentMileage <= 0 ? 'text-destructive font-medium' : jarvisSettings.nextInspection - jarvisSettings.currentMileage <= 2000 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      {jarvisSettings.nextInspection - jarvisSettings.currentMileage <= 0 
                        ? '⚠️ Revisão atrasada!' 
                        : `Faltam ${(jarvisSettings.nextInspection - jarvisSettings.currentMileage).toLocaleString('pt-BR')} km`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ========== FINANCEIRO ========== */}
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
              <div className="space-y-2 pl-4 border-l-2 border-green-500/30">
                <div className="flex justify-between">
                  <Label className="text-xs text-muted-foreground">Velocidade mínima para iniciar</Label>
                  <span className="text-xs text-muted-foreground">{tripSettings.speedThreshold} km/h</span>
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

        {/* ========== MONITOR DE COMBUSTÍVEL ========== */}
        <AccordionItem value="combustivel" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Gauge className="h-4 w-4 text-blue-500" />
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

        {/* ========== PERFIL DO VEÍCULO ========== */}
        <AccordionItem value="veiculo" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Car className="h-4 w-4 text-cyan-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Perfil do Veículo</p>
                <p className="text-xs text-muted-foreground">Dados do seu veículo</p>
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
              <p className="text-sm text-muted-foreground">
                Faça login para configurar o perfil do veículo.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ========== APP E CONTA ========== */}
        <AccordionItem value="app" className="border rounded-xl overflow-hidden bg-card card-hover">
          <AccordionTrigger className="px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 min-h-[56px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Smartphone className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">App e Conta</p>
                <p className="text-xs text-muted-foreground">Preferências e modo insônia</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4 space-y-4">
            {/* Modo Insônia */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Moon className="h-4 w-4 text-blue-400" />
                  Manter Tela Sempre Acesa
                  {isWakeLockActive && <span className="text-xs text-green-500">(Ativo)</span>}
                </Label>
                <p className="text-xs text-muted-foreground">Impede que a tela desligue enquanto conectado</p>
              </div>
              <Switch
                checked={jarvisSettings.keepAwakeEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('keepAwakeEnabled', v)}
              />
            </div>

            {/* Reconexão Automática */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reconexão automática
                </Label>
                <p className="text-xs text-muted-foreground">Reconecta ao desbloquear se desconectou</p>
              </div>
              <Switch
                checked={jarvisSettings.autoReconnectEnabled}
                onCheckedChange={(v) => onUpdateJarvisSetting('autoReconnectEnabled', v)}
              />
            </div>

            <Separator />

            {/* Conta */}
            {isAuthenticated && user && (
              <div className="space-y-3">
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

            <Separator />

            {/* Reset Geral */}
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={onResetJarvisSettings}
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar Todas as Configurações
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
