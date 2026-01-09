import { Volume2, RotateCcw, Bell, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
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
import { JarvisSettings } from '@/types/jarvisSettings';
import { Separator } from '@/components/ui/separator';

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
}: JarvisSettingsSheetProps) {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-primary" />
            Configurações do Jarvis
          </SheetTitle>
          <SheetDescription>
            Personalize o assistente de voz do seu veículo
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Seção de Alertas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bell className="h-4 w-4 text-primary" />
              Alertas de Voz
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

          {/* Botões de Ação */}
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
