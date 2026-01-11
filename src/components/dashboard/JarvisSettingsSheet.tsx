import { useState } from 'react';
import { Volume2, RotateCcw, Bell, Mic2, Thermometer, Gauge, Wrench, Brain, Radio, Fuel, Zap, Moon, Wifi, Sparkles, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { JarvisSettings, FuelType, AIProvider, OpenAIVoice, getDefaultRedlineForFuelType, getShiftPoints } from '@/types/jarvisSettings';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { encryptApiKey, decryptApiKey, isValidOpenAIKey, maskApiKey } from '@/lib/encryption';

interface JarvisSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: JarvisSettings;
  onUpdateSetting: <K extends keyof JarvisSettings>(key: K, value: JarvisSettings[K]) => void;
  onResetToDefaults: () => void;
  onTestVoice: () => void;
  availableVoices: SpeechSynthesisVoice[];
  portugueseVoices: SpeechSynthesisVoice[];
  isSpeaking: boolean;
  isWakeLockActive?: boolean;
}

export function JarvisSettingsSheet({
  open,
  onOpenChange,
  settings,
  onUpdateSetting,
  onResetToDefaults,
  onTestVoice,
  availableVoices,
  portugueseVoices,
  isSpeaking,
  isWakeLockActive = false,
}: JarvisSettingsSheetProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  const voicesToShow = portugueseVoices.length > 0 ? portugueseVoices : availableVoices;

  const getSelectedVoiceName = () => {
    if (!settings.selectedVoiceURI) return 'auto';
    const voice = availableVoices.find(v => v.voiceURI === settings.selectedVoiceURI);
    return voice?.voiceURI || 'auto';
  };

  const handleVoiceChange = (value: string) => {
    if (value === 'auto') {
      onUpdateSetting('selectedVoiceURI', null);
    } else {
      onUpdateSetting('selectedVoiceURI', value);
    }
  };

  // Handler para mudança de tipo de combustível (auto-ajusta redline)
  const handleFuelTypeChange = (value: FuelType) => {
    onUpdateSetting('fuelType', value);
    onUpdateSetting('redlineRPM', getDefaultRedlineForFuelType(value));
  };

  // Handler para salvar API key
  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      const encrypted = encryptApiKey(apiKeyInput.trim());
      onUpdateSetting('openaiApiKey', encrypted);
      setApiKeyInput('');
    }
  };

  // Handler para remover API key
  const handleRemoveApiKey = () => {
    onUpdateSetting('openaiApiKey', null);
    setApiKeyInput('');
  };

  // Verifica se API key está configurada e válida
  const hasApiKey = !!settings.openaiApiKey;
  const decryptedKey = settings.openaiApiKey ? decryptApiKey(settings.openaiApiKey) : '';
  const isApiKeyValid = decryptedKey ? isValidOpenAIKey(decryptedKey) : false;

  // Calcular pontos de shift para exibição
  const shiftPoints = getShiftPoints(settings.redlineRPM);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 flex flex-col h-full">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-primary" />
            Configurações do Jarvis
          </SheetTitle>
          <SheetDescription>
            Personalize o assistente de voz do seu veículo
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Seção de Alertas Básicos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Bell className="h-4 w-4 text-primary" />
                Alertas Básicos
              </div>
              
              <div className="space-y-4 pl-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="welcome-alert" className="text-sm font-medium">
                      Boas-vindas ao conectar
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Mensagem automática ao iniciar conexão
                    </p>
                  </div>
                  <Switch
                    id="welcome-alert"
                    checked={settings.welcomeEnabled}
                    onCheckedChange={(checked) => onUpdateSetting('welcomeEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="rpm-alert" className="text-sm font-medium">
                      Alerta de motor frio
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Avisa quando acelerar com motor frio
                    </p>
                  </div>
                  <Switch
                    id="rpm-alert"
                    checked={settings.highRpmAlertEnabled}
                    onCheckedChange={(checked) => onUpdateSetting('highRpmAlertEnabled', checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção de Perfil do Motor */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Fuel className="h-4 w-4 text-accent" />
                Perfil do Motor
              </div>
              
              <div className="space-y-4 pl-6">
                {/* Tipo de Combustível */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Combustível</Label>
                  <Select
                    value={settings.fuelType}
                    onValueChange={(value: FuelType) => handleFuelTypeChange(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Gasolina</SelectItem>
                      <SelectItem value="ethanol">Etanol</SelectItem>
                      <SelectItem value="flex">Flex (Gasolina/Etanol)</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Limite de Giro (Redline) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Limite de Giro (Redline)</Label>
                    <span className="text-xs font-medium text-primary">{settings.redlineRPM} RPM</span>
                  </div>
                  <Slider
                    value={[settings.redlineRPM]}
                    onValueChange={([value]) => onUpdateSetting('redlineRPM', value)}
                    min={3000}
                    max={9000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>3000</span>
                    <span>Diesel ~4500 | Gasolina ~6500</span>
                    <span>9000</span>
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Shift Light */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="shift-light" className="text-sm font-medium flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-accent" />
                      Shift Light (Luz de Troca)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Avisos sonoros para troca de marcha
                    </p>
                  </div>
                  <Switch
                    id="shift-light"
                    checked={settings.shiftLightEnabled}
                    onCheckedChange={(checked) => onUpdateSetting('shiftLightEnabled', checked)}
                  />
                </div>

                {settings.shiftLightEnabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-accent/30">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="eco-shift" className="text-sm font-medium">
                          Modo Eco (40%)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Avisa em {shiftPoints.ecoPoint} RPM
                        </p>
                      </div>
                      <Switch
                        id="eco-shift"
                        checked={settings.ecoShiftEnabled}
                        onCheckedChange={(checked) => onUpdateSetting('ecoShiftEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="sport-shift" className="text-sm font-medium">
                          Modo Sport (90%)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Avisa em {shiftPoints.sportPoint} RPM
                        </p>
                      </div>
                      <Switch
                        id="sport-shift"
                        checked={settings.sportShiftEnabled}
                        onCheckedChange={(checked) => onUpdateSetting('sportShiftEnabled', checked)}
                      />
                    </div>
                  </div>
                )}

                <Separator className="my-2" />

                {/* Alerta de Sobrecarga (Lugging) */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="lugging-alert" className="text-sm font-medium">
                      Alerta de Sobrecarga
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Avisa quando o motor está forçando (RPM baixo + pedal fundo)
                    </p>
                  </div>
                  <Switch
                    id="lugging-alert"
                    checked={settings.luggingAlertEnabled}
                    onCheckedChange={(checked) => onUpdateSetting('luggingAlertEnabled', checked)}
                  />
                </div>
                {settings.luggingAlertEnabled && (
                  <p className="text-xs text-muted-foreground pl-4">
                    💡 Detecta quando RPM &lt; {shiftPoints.luggingPoint} e carga &gt; 80%
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Seção de Alertas de Segurança */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Thermometer className="h-4 w-4 text-destructive" />
                Alertas de Segurança
              </div>
              
              <div className="space-y-4 pl-6">
                {/* Temperatura Alta */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="temp-alert" className="text-sm font-medium">
                        Temperatura alta do motor
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Alerta de superaquecimento
                      </p>
                    </div>
                    <Switch
                      id="temp-alert"
                      checked={settings.highTempAlertEnabled}
                      onCheckedChange={(checked) => onUpdateSetting('highTempAlertEnabled', checked)}
                    />
                  </div>
                  {settings.highTempAlertEnabled && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Limite de temperatura</Label>
                        <span className="text-xs font-medium">{settings.highTempThreshold}°C</span>
                      </div>
                      <Slider
                        value={[settings.highTempThreshold]}
                        onValueChange={([value]) => onUpdateSetting('highTempThreshold', value)}
                        min={80}
                        max={120}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Velocidade */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="speed-alert" className="text-sm font-medium flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5" />
                        Velocidade acima do limite
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Avisa quando ultrapassar o limite
                      </p>
                    </div>
                    <Switch
                      id="speed-alert"
                      checked={settings.speedAlertEnabled}
                      onCheckedChange={(checked) => onUpdateSetting('speedAlertEnabled', checked)}
                    />
                  </div>
                  {settings.speedAlertEnabled && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Limite de velocidade</Label>
                        <span className="text-xs font-medium">{settings.speedLimit} km/h</span>
                      </div>
                      <Slider
                        value={[settings.speedLimit]}
                        onValueChange={([value]) => onUpdateSetting('speedLimit', value)}
                        min={60}
                        max={180}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção de Manutenção */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Wrench className="h-4 w-4 text-warning" />
                Lembretes de Manutenção
              </div>
              
              <div className="space-y-4 pl-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-alert" className="text-sm font-medium">
                      Ativar lembretes
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Avisos baseados na quilometragem
                    </p>
                  </div>
                  <Switch
                    id="maintenance-alert"
                    checked={settings.maintenanceAlertEnabled}
                    onCheckedChange={(checked) => onUpdateSetting('maintenanceAlertEnabled', checked)}
                  />
                </div>

                {settings.maintenanceAlertEnabled && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="current-mileage" className="text-xs text-muted-foreground">
                        Quilometragem atual (km)
                      </Label>
                      <Input
                        id="current-mileage"
                        type="number"
                        value={settings.currentMileage || ''}
                        onChange={(e) => onUpdateSetting('currentMileage', Number(e.target.value) || 0)}
                        placeholder="Ex: 85000"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="next-oil" className="text-xs text-muted-foreground">
                        Próxima troca de óleo (km)
                      </Label>
                      <Input
                        id="next-oil"
                        type="number"
                        value={settings.nextOilChange || ''}
                        onChange={(e) => onUpdateSetting('nextOilChange', Number(e.target.value) || 0)}
                        placeholder="Ex: 90000"
                        className="h-9"
                      />
                      {settings.currentMileage > 0 && settings.nextOilChange > 0 && (
                        <p className={`text-xs ${settings.nextOilChange - settings.currentMileage <= 0 ? 'text-destructive font-medium' : settings.nextOilChange - settings.currentMileage <= 1000 ? 'text-warning' : 'text-muted-foreground'}`}>
                          {settings.nextOilChange - settings.currentMileage <= 0 
                            ? '⚠️ Troca de óleo atrasada!' 
                            : `Faltam ${(settings.nextOilChange - settings.currentMileage).toLocaleString('pt-BR')} km`}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="next-inspection" className="text-xs text-muted-foreground">
                        Próxima revisão (km)
                      </Label>
                      <Input
                        id="next-inspection"
                        type="number"
                        value={settings.nextInspection || ''}
                        onChange={(e) => onUpdateSetting('nextInspection', Number(e.target.value) || 0)}
                        placeholder="Ex: 100000"
                        className="h-9"
                      />
                      {settings.currentMileage > 0 && settings.nextInspection > 0 && (
                        <p className={`text-xs ${settings.nextInspection - settings.currentMileage <= 0 ? 'text-destructive font-medium' : settings.nextInspection - settings.currentMileage <= 2000 ? 'text-warning' : 'text-muted-foreground'}`}>
                          {settings.nextInspection - settings.currentMileage <= 0 
                            ? '⚠️ Revisão atrasada!' 
                            : `Faltam ${(settings.nextInspection - settings.currentMileage).toLocaleString('pt-BR')} km`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Seção de IA Conversacional */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Brain className="h-4 w-4 text-accent" />
                IA Conversacional
              </div>
              
              <div className="space-y-4 pl-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="ai-mode" className="text-sm font-medium">
                      Ativar modo IA
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Converse naturalmente com o Jarvis
                    </p>
                  </div>
                  <Switch
                    id="ai-mode"
                    checked={settings.aiModeEnabled}
                    onCheckedChange={(checked) => onUpdateSetting('aiModeEnabled', checked)}
                  />
                </div>

                {settings.aiModeEnabled && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground">Tamanho das respostas</Label>
                      <Select
                        value={settings.aiResponseLength}
                        onValueChange={(value: 'short' | 'medium' | 'detailed') => 
                          onUpdateSetting('aiResponseLength', value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Curta (1-2 frases)</SelectItem>
                          <SelectItem value="medium">Média (2-3 frases)</SelectItem>
                          <SelectItem value="detailed">Detalhada (3-4 frases)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="my-2" />

                    {/* Modo Contínuo */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="continuous-mode" className="text-sm font-medium flex items-center gap-1.5">
                          <Radio className="h-3.5 w-3.5 text-accent" />
                          Escuta contínua
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Jarvis fica sempre atento à wake word
                        </p>
                      </div>
                      <Switch
                        id="continuous-mode"
                        checked={settings.continuousListening}
                        onCheckedChange={(checked) => onUpdateSetting('continuousListening', checked)}
                      />
                    </div>

                    {settings.continuousListening && (
                      <div className="space-y-2">
                        <Label htmlFor="wake-word" className="text-xs text-muted-foreground">
                          Palavra de ativação
                        </Label>
                        <Input
                          id="wake-word"
                          value={settings.wakeWord}
                          onChange={(e) => onUpdateSetting('wakeWord', e.target.value || 'jarvis')}
                          placeholder="jarvis"
                          className="h-9"
                        />
                        <p className="text-xs text-muted-foreground">
                          💡 Diga "{settings.wakeWord}, como está o motor?"
                        </p>
                      </div>
                    )}

                    {!settings.continuousListening && (
                      <p className="text-xs text-muted-foreground">
                        💡 Dica: Pergunte "Como está o carro?" ou "Posso acelerar?"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Seção Cérebro do Jarvis (IA Híbrida) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Cérebro do Jarvis
              </div>
              
              <div className="space-y-4 pl-6">
                {/* Seletor de Provedor de IA */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Provedor de Inteligência</Label>
                  
                  <div className="space-y-2">
                    <div 
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        settings.aiProvider === 'basic' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => onUpdateSetting('aiProvider', 'basic')}
                    >
                      <input 
                        type="radio" 
                        checked={settings.aiProvider === 'basic'} 
                        onChange={() => onUpdateSetting('aiProvider', 'basic')}
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
                        settings.aiProvider === 'openai' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => onUpdateSetting('aiProvider', 'openai')}
                    >
                      <input 
                        type="radio" 
                        checked={settings.aiProvider === 'openai'} 
                        onChange={() => onUpdateSetting('aiProvider', 'openai')}
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
                </div>

                {/* Configurações OpenAI */}
                {settings.aiProvider === 'openai' && (
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
                        <Label htmlFor="openai-tts" className="text-sm font-medium">
                          Voz Premium (TTS)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Usar síntese de voz da OpenAI
                        </p>
                      </div>
                      <Switch
                        id="openai-tts"
                        checked={settings.openaiTTSEnabled}
                        onCheckedChange={(checked) => onUpdateSetting('openaiTTSEnabled', checked)}
                        disabled={!hasApiKey}
                      />
                    </div>

                    {/* Seleção de Voz OpenAI */}
                    {settings.openaiTTSEnabled && hasApiKey && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Voz Premium</Label>
                        <Select
                          value={settings.openaiVoice}
                          onValueChange={(value: OpenAIVoice) => onUpdateSetting('openaiVoice', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione" />
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
                      <p className="text-xs text-yellow-500">
                        ⚠️ Configure a API key para usar recursos avançados
                      </p>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  💡 IA Avançada usa sua chave pessoal da OpenAI (custo por uso)
                </p>
              </div>
            </div>

            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Moon className="h-4 w-4 text-blue-500" />
                Modo Insônia
                {isWakeLockActive && (
                  <span className="ml-auto text-xs text-green-500 flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Ativo
                  </span>
                )}
              </div>
              
              <div className="space-y-4 pl-6">
                {/* Manter Tela Acesa */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="keep-awake" className="text-sm font-medium">
                      Manter Tela Sempre Acesa
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Impede que a tela desligue enquanto conectado
                    </p>
                  </div>
                  <Switch
                    id="keep-awake"
                    checked={settings.keepAwakeEnabled}
                    onCheckedChange={(checked) => onUpdateSetting('keepAwakeEnabled', checked)}
                  />
                </div>

                {/* Reconexão Automática */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-reconnect" className="text-sm font-medium">
                      Reconexão Automática
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Reconecta ao desbloquear se desconectou
                    </p>
                  </div>
                  <Switch
                    id="auto-reconnect"
                    checked={settings.autoReconnectEnabled}
                    onCheckedChange={(checked) => onUpdateSetting('autoReconnectEnabled', checked)}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  💡 Mantém o Bluetooth ativo mesmo com a tela bloqueada
                </p>
              </div>
            </div>

            <Separator />

          {/* Seção de Configurações de Voz */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Volume2 className="h-4 w-4 text-primary" />
              Configurações de Voz
            </div>
            
            <div className="space-y-6 pl-6">
              {/* Volume */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Volume</Label>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(settings.volume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[settings.volume]}
                  onValueChange={([value]) => onUpdateSetting('volume', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
              </div>

              {/* Velocidade */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Velocidade</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.rate < 0.8 ? 'Lento' : settings.rate > 1.2 ? 'Rápido' : 'Normal'}
                  </span>
                </div>
                <Slider
                  value={[settings.rate]}
                  onValueChange={([value]) => onUpdateSetting('rate', value)}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Lento</span>
                  <span>Rápido</span>
                </div>
              </div>

              {/* Tom */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Tom</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.pitch < 0.8 ? 'Grave' : settings.pitch > 1.2 ? 'Agudo' : 'Normal'}
                  </span>
                </div>
                <Slider
                  value={[settings.pitch]}
                  onValueChange={([value]) => onUpdateSetting('pitch', value)}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Grave</span>
                  <span>Agudo</span>
                </div>
              </div>

              {/* Seleção de Voz */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Voz</Label>
                <Select
                  value={getSelectedVoiceName()}
                  onValueChange={handleVoiceChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma voz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Automático (Português BR)
                    </SelectItem>
                    {voicesToShow.map((voice) => (
                      <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {voicesToShow.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma voz disponível no navegador
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          </div>
        </ScrollArea>

        {/* Botões de Ação - Fixed at bottom */}
        <div className="border-t p-4 mt-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onTestVoice}
              disabled={isSpeaking}
              className="flex-1 gap-2"
            >
              <Volume2 className="h-4 w-4" />
              {isSpeaking ? 'Falando...' : 'Testar Voz'}
            </Button>
            <Button
              variant="ghost"
              onClick={onResetToDefaults}
              className="flex-1 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar Padrões
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
