/**
 * DiagnosisCard - Card didático com resultado do diagnóstico
 * Inclui badge do veículo e busca contextualizada
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RiskBadge } from './RiskBadge';
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
  Car
} from 'lucide-react';
import { RISK_CONFIG, type VisionAnalysisResult, type VehicleContextForVision } from '@/types/visionTypes';
import { cn } from '@/lib/utils';

interface DiagnosisCardProps {
  result: VisionAnalysisResult;
  mediaUrl?: string;
  vehicleContext?: VehicleContextForVision;
  onSpeak?: (text: string) => void;
  onReset: () => void;
  isSpeaking?: boolean;
}

export function DiagnosisCard({ 
  result, 
  mediaUrl,
  vehicleContext,
  onSpeak, 
  onReset,
  isSpeaking 
}: DiagnosisCardProps) {
  const riskConfig = RISK_CONFIG[result.riskLevel];
  
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
    // Usa busca contextualizada se tiver veículo
    const url = hasVehicle
      ? VisionService.generateVehicleShoppingLink(result.technicalName, vehicleContext)
      : VisionService.generateShoppingLink(result.technicalName);
    window.open(url, '_blank');
  };
  
  const handleImageSearch = () => {
    window.open(VisionService.generateImageSearchLink(result.technicalName), '_blank');
  };
  
  return (
    <Card className={cn('overflow-hidden border-2', riskConfig.borderColor)}>
      {/* Risk header */}
      <div className={cn('p-4', riskConfig.bgColor)}>
        <div className="flex items-center justify-between gap-4">
          <RiskBadge level={result.riskLevel} size="lg" />
          <div className="flex items-center gap-2">
            {onSpeak && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSpeak}
                disabled={isSpeaking}
                className="gap-2"
              >
                <Volume2 className={cn('h-4 w-4', isSpeaking && 'animate-pulse')} />
                <span className="hidden sm:inline">Ouvir</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Nova análise</span>
            </Button>
          </div>
        </div>
        <p className={cn('mt-2 font-medium', riskConfig.color)}>
          {result.riskMessage}
        </p>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Vehicle badge - exibe se tiver veículo configurado */}
        {vehicleDisplayName && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
            <Car className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {vehicleDisplayName}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              Diagnóstico específico
            </span>
          </div>
        )}
        
        {/* Image preview if available */}
        {mediaUrl && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={mediaUrl}
              alt="Imagem analisada"
              className="w-full h-full object-contain"
            />
          </div>
        )}
        
        {/* Identification */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Info className="h-5 w-5" />
            <h3 className="font-semibold">O que é isso?</h3>
          </div>
          <p className="text-foreground pl-7">{result.identification}</p>
          <p className="text-sm text-muted-foreground pl-7">
            Nome técnico: <span className="font-medium">{result.technicalName}</span>
          </p>
        </div>
        
        <Separator />
        
        {/* Diagnosis */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">O que está acontecendo?</h3>
          </div>
          <p className="text-foreground pl-7">{result.diagnosis}</p>
        </div>
        
        <Separator />
        
        {/* Action */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Wrench className="h-5 w-5" />
            <h3 className="font-semibold">O que fazer agora?</h3>
          </div>
          <p className="text-foreground pl-7">{result.action}</p>
        </div>
        
        {/* Confidence indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Confiança da análise: {result.confidence}%</span>
        </div>
        
        <Separator />
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleShoppingSearch}
            className="flex-1 gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {hasVehicle 
              ? `Peça para ${vehicleContext.model || vehicleContext.brand}`
              : 'Encontrar peça'
            }
          </Button>
          <Button
            variant="outline"
            onClick={handleImageSearch}
            className="flex-1 gap-2"
          >
            <Search className="h-4 w-4" />
            Ver referências
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
