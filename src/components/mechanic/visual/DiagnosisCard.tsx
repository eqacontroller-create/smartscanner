/**
 * DiagnosisCard - Card premium didático com resultado do diagnóstico
 * Inclui badge do veículo, busca contextualizada, opção de salvar e celebração
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RiskBadge } from './RiskBadge';
import { Confetti } from '@/components/ui/confetti';
import { useCelebrationSound } from '@/hooks/useCelebrationSound';
import { VisionService } from '@/services/ai/VisionService';
import { 
  ShoppingCart, 
  Search, 
  Volume2, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
  Wrench,
  Car,
  Save,
  Loader2,
  ExternalLink,
  PartyPopper
} from 'lucide-react';
import { RISK_CONFIG, type VisionAnalysisResult, type VehicleContextForVision } from '@/types/visionTypes';
import { cn } from '@/lib/utils';

interface DiagnosisCardProps {
  result: VisionAnalysisResult;
  mediaUrl?: string;
  vehicleContext?: VehicleContextForVision;
  onSpeak?: (text: string) => void;
  onReset: () => void;
  onSave?: () => Promise<void>;
  isSpeaking?: boolean;
  isSaving?: boolean;
  isSaved?: boolean;
}

// Section icons with colored backgrounds
const sectionConfig = {
  identification: { 
    icon: Info, 
    title: 'O que é isso?',
    bgClass: 'bg-blue-500/10',
    iconClass: 'text-blue-500'
  },
  diagnosis: { 
    icon: AlertCircle, 
    title: 'O que está acontecendo?',
    bgClass: 'bg-amber-500/10',
    iconClass: 'text-amber-500'
  },
  action: { 
    icon: Wrench, 
    title: 'O que fazer agora?',
    bgClass: 'bg-emerald-500/10',
    iconClass: 'text-emerald-500'
  },
};

export function DiagnosisCard({ 
  result, 
  mediaUrl,
  vehicleContext,
  onSpeak, 
  onReset,
  onSave,
  isSpeaking,
  isSaving,
  isSaved
}: DiagnosisCardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const riskConfig = RISK_CONFIG[result.riskLevel];
  
  // Celebration sound hook (uses Web Audio API - no external dependencies)
  const { play: playCelebration } = useCelebrationSound({ 
    enabled: true, 
    volume: 0.25 // Suave
  });
  
  // Trigger confetti and sound for safe results
  useEffect(() => {
    if (result.riskLevel === 'safe') {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setShowConfetti(true);
        playCelebration();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [result.riskLevel, playCelebration]);
  
  // Verifica se tem contexto de veículo válido
  const hasVehicle = vehicleContext && (vehicleContext.brand || vehicleContext.model);
  
  // Gera displayName do veículo
  const vehicleDisplayName = hasVehicle 
    ? [
        vehicleContext.brand?.charAt(0).toUpperCase() + vehicleContext.brand?.slice(1),
        vehicleContext.model,
        vehicleContext.year,
        vehicleContext.engine
      ].filter(Boolean).join(' ')
    : null;
  
  // Gera texto para TTS
  const generateSpeechText = () => {
    let text = `${result.identification}. ${result.diagnosis}. ${riskConfig.label}: ${result.riskMessage}. Recomendação: ${result.action}`;
    if (vehicleDisplayName) {
      text = `Para seu ${vehicleDisplayName}: ${text}`;
    }
    return text;
  };
  
  const handleSpeak = () => {
    if (onSpeak) {
      onSpeak(generateSpeechText());
    }
  };
  
  const handleShoppingSearch = () => {
    const url = hasVehicle
      ? VisionService.generateVehicleShoppingLink(result.technicalName, vehicleContext)
      : VisionService.generateShoppingLink(result.technicalName);
    window.open(url, '_blank');
  };
  
  const handleImageSearch = () => {
    window.open(VisionService.generateImageSearchLink(result.technicalName), '_blank');
  };
  
  // Get risk-based gradient
  const getRiskGradient = () => {
    switch (result.riskLevel) {
      case 'safe':
        return 'from-emerald-500/20 via-emerald-500/10 to-transparent';
      case 'attention':
        return 'from-amber-500/20 via-amber-500/10 to-transparent';
      case 'danger':
        return 'from-red-500/20 via-red-500/10 to-transparent';
      default:
        return 'from-muted/50 via-muted/25 to-transparent';
    }
  };
  
  const getRiskOrb = () => {
    switch (result.riskLevel) {
      case 'safe':
        return 'bg-emerald-500/20';
      case 'attention':
        return 'bg-amber-500/20';
      case 'danger':
        return 'bg-red-500/20';
      default:
        return 'bg-muted/50';
    }
  };
  
  return (
    <>
      {/* Confetti celebration for safe results */}
      <Confetti active={showConfetti} duration={3000} particleCount={40} />
      
      <Card className="overflow-hidden border-2 border-border/50 bg-card/90 backdrop-blur-sm">
      {/* Premium gradient header */}
      <div className={cn('relative p-5 overflow-hidden bg-gradient-to-r', getRiskGradient())}>
        {/* Decorative orb */}
        <div className={cn('absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl', getRiskOrb())} />
        
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RiskBadge level={result.riskLevel} size="lg" />
            {result.riskLevel === 'safe' && (
              <div className="animate-celebrate-pop">
                <PartyPopper className="h-6 w-6 text-emerald-400 drop-shadow-[0_0_8px_hsl(142_76%_45%/0.5)]" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onSpeak && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSpeak}
                disabled={isSpeaking}
                className="gap-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              >
                <Volume2 className={cn('h-4 w-4', isSpeaking && 'animate-pulse text-primary')} />
                <span className="hidden sm:inline">Ouvir</span>
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={onReset}
              className="gap-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Nova análise</span>
            </Button>
          </div>
        </div>
        <p className={cn('relative mt-3 font-medium text-foreground')}>
          {result.riskMessage}
        </p>
      </div>
      
      <CardContent className="p-5 space-y-5">
        {/* Premium vehicle badge */}
        {vehicleDisplayName && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-primary block truncate">
                {vehicleDisplayName}
              </span>
              <span className="text-xs text-muted-foreground">
                Diagnóstico específico para seu veículo
              </span>
            </div>
          </div>
        )}
        
        {/* Image preview */}
        {mediaUrl && (
          <div className="aspect-video rounded-xl overflow-hidden bg-black/90 border border-border/50">
            <img
              src={mediaUrl}
              alt="Imagem analisada"
              className="w-full h-full object-contain"
            />
          </div>
        )}
        
        {/* Identification Section */}
        <div className="space-y-2.5 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', sectionConfig.identification.bgClass)}>
              <Info className={cn('h-5 w-5', sectionConfig.identification.iconClass)} />
            </div>
            <h3 className="font-semibold text-foreground">{sectionConfig.identification.title}</h3>
          </div>
          <div className="pl-12">
            <p className="text-foreground">{result.identification}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nome técnico: <span className="font-medium text-foreground">{result.technicalName}</span>
            </p>
          </div>
        </div>
        
        <Separator className="bg-border/50" />
        
        {/* Diagnosis Section */}
        <div className="space-y-2.5 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', sectionConfig.diagnosis.bgClass)}>
              <AlertCircle className={cn('h-5 w-5', sectionConfig.diagnosis.iconClass)} />
            </div>
            <h3 className="font-semibold text-foreground">{sectionConfig.diagnosis.title}</h3>
          </div>
          <p className="text-foreground pl-12">{result.diagnosis}</p>
        </div>
        
        <Separator className="bg-border/50" />
        
        {/* Action Section */}
        <div className="space-y-2.5 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', sectionConfig.action.bgClass)}>
              <Wrench className={cn('h-5 w-5', sectionConfig.action.iconClass)} />
            </div>
            <h3 className="font-semibold text-foreground">{sectionConfig.action.title}</h3>
          </div>
          <p className="text-foreground pl-12">{result.action}</p>
        </div>
        
        {/* Confidence indicator */}
        <div className="flex items-center gap-3 pt-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Confiança:</span>
            <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-1000"
                style={{ width: `${result.confidence}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground">{result.confidence}%</span>
          </div>
        </div>
        
        <Separator className="bg-border/50" />
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <Button
            variant="outline"
            onClick={handleShoppingSearch}
            className="flex-1 gap-2 h-11 rounded-xl border-2 hover:bg-secondary/50 group"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="truncate">
              {hasVehicle 
                ? `Peça para ${vehicleContext.model || vehicleContext.brand}`
                : 'Encontrar peça'
              }
            </span>
            <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
          <Button
            variant="outline"
            onClick={handleImageSearch}
            className="flex-1 gap-2 h-11 rounded-xl border-2 hover:bg-secondary/50 group"
          >
            <Search className="h-4 w-4" />
            Ver referências
            <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>
        
        {/* Save to history button */}
        {onSave && (
          <Button
            onClick={onSave}
            disabled={isSaving || isSaved}
            className={cn(
              'w-full gap-2 h-12 rounded-xl transition-all duration-300',
              isSaved 
                ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-2 border-emerald-500/30' 
                : 'bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px] shadow-primary/40 hover:shadow-[0_0_30px_-5px] hover:shadow-primary/50'
            )}
            variant={isSaved ? "outline" : "default"}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSaved ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span className="font-medium">
              {isSaved ? 'Salvo no histórico' : 'Salvar diagnóstico'}
            </span>
          </Button>
        )}
      </CardContent>
    </Card>
    </>
  );
}
