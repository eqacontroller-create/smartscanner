/**
 * DiagnosisCard - Card didático com resultado do diagnóstico
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  Wrench
} from 'lucide-react';
import { RISK_CONFIG, type VisionAnalysisResult } from '@/types/visionTypes';
import { cn } from '@/lib/utils';

interface DiagnosisCardProps {
  result: VisionAnalysisResult;
  mediaUrl?: string;
  onSpeak?: (text: string) => void;
  onReset: () => void;
  isSpeaking?: boolean;
}

export function DiagnosisCard({ 
  result, 
  mediaUrl, 
  onSpeak, 
  onReset,
  isSpeaking 
}: DiagnosisCardProps) {
  const riskConfig = RISK_CONFIG[result.riskLevel];
  
  // Gera texto para TTS
  const generateSpeechText = () => {
    return `${result.identification}. ${result.diagnosis}. ${riskConfig.label}: ${result.riskMessage}. Recomendação: ${result.action}`;
  };
  
  const handleSpeak = () => {
    if (onSpeak) {
      onSpeak(generateSpeechText());
    }
  };
  
  const handleShoppingSearch = () => {
    window.open(VisionService.generateShoppingLink(result.technicalName), '_blank');
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
            Encontrar peça
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
