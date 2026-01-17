import { useState, useEffect } from 'react';
import { 
  Wrench, AlertTriangle, Lightbulb, Loader2, Sparkles, Snowflake, Zap,
  DollarSign, OctagonX, Clock, Package, Baby, Share2, MessageCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { ParsedDTC } from '@/lib/dtcParser';
import { getDTCInfo, getDefaultDTCInfo, type DTCInfo } from '@/lib/dtcDatabase';
import { analyzeDTC, type AIProvider } from '@/lib/dtcAnalyzer';
import { FreezeFrameData } from './FreezeFrameData';
import { useJarvisSettings } from '@/hooks/useJarvisSettings';
import { getDTCEstimate, type DTCEstimate } from '@/services/ai/DTCEstimateService';

interface DTCModalProps {
  dtc: ParsedDTC | null;
  isOpen: boolean;
  onClose: () => void;
  sendCommand?: (command: string, timeout?: number) => Promise<string>;
  addLog?: (message: string) => void;
  vehicleContext?: string;
}

const severityConfig = {
  low: { label: 'Baixa', className: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  medium: { label: 'Média', className: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  high: { label: 'Alta', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

const riskConfig = {
  critical: {
    bgClass: 'bg-red-500/20 border-red-500/50',
    textClass: 'text-red-500',
    icon: OctagonX,
    label: 'CRÍTICO',
  },
  moderate: {
    bgClass: 'bg-yellow-500/20 border-yellow-500/50',
    textClass: 'text-yellow-500',
    icon: AlertTriangle,
    label: 'ATENÇÃO',
  },
  low: {
    bgClass: 'bg-green-500/20 border-green-500/50',
    textClass: 'text-green-500',
    icon: Lightbulb,
    label: 'BAIXO',
  },
};

export function DTCModal({ dtc, isOpen, onClose, sendCommand, addLog, vehicleContext = 'Ford Focus' }: DTCModalProps) {
  const { settings } = useJarvisSettings();
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<'local' | 'openai'>('local');
  
  // Budget estimate state
  const [estimate, setEstimate] = useState<DTCEstimate | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (isOpen && dtc) {
      fetchAIExplanation(dtc.code);
      setActiveTab('info');
      setEstimate(null);
      setEstimateError(null);
    } else {
      setAiExplanation(null);
      setAiError(null);
      setAiSource('local');
      setEstimate(null);
      setEstimateError(null);
    }
  }, [isOpen, dtc?.code, settings.aiProvider, settings.openaiApiKey]);

  // Load estimate when budget tab is selected
  useEffect(() => {
    if (isOpen && dtc && activeTab === 'budget' && !estimate && !isLoadingEstimate) {
      fetchEstimate(dtc);
    }
  }, [isOpen, dtc, activeTab]);

  const fetchAIExplanation = async (code: string) => {
    setIsLoadingAI(true);
    setAiError(null);
    
    try {
      const result = await analyzeDTC(
        code,
        settings.aiProvider as AIProvider,
        settings.openaiApiKey,
        vehicleContext
      );

      setAiExplanation(result.explanation);
      setAiSource(result.source);
      
      if (result.error) {
        setAiError(`Fallback para IA local: ${result.error}`);
      }
    } catch (err) {
      console.error('AI explanation error:', err);
      setAiError(err instanceof Error ? err.message : 'Erro ao consultar IA');
      
      // Fallback final para banco local
      const info = getDTCInfo(code) || getDefaultDTCInfo(code);
      setAiExplanation(`📋 ${info.name}\n\n${info.description}\n\nCausas comuns:\n${info.causes.map((c, i) => `${i + 1}. ${c}`).join('\n')}`);
      setAiSource('local');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const fetchEstimate = async (dtcData: ParsedDTC) => {
    setIsLoadingEstimate(true);
    setEstimateError(null);
    
    try {
      const info = getDTCInfo(dtcData.code) || getDefaultDTCInfo(dtcData.code);
      const result = await getDTCEstimate({
        dtcCode: dtcData.code,
        dtcName: info.name,
        dtcDescription: info.description,
        vehicleContext,
      });
      setEstimate(result);
    } catch (err) {
      console.error('Estimate error:', err);
      setEstimateError(err instanceof Error ? err.message : 'Erro ao buscar orçamento');
    } finally {
      setIsLoadingEstimate(false);
    }
  };

  if (!dtc) return null;

  const info: DTCInfo = getDTCInfo(dtc.code) || getDefaultDTCInfo(dtc.code);
  const severity = severityConfig[info.severity];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-3 sm:mx-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Badge 
              variant="outline" 
              className="font-mono text-sm sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1 bg-destructive/10 text-destructive border-destructive/30"
            >
              {dtc.code}
            </Badge>
            <Badge variant="outline" className={`text-[10px] sm:text-xs ${severity.className}`}>
              Severidade: {severity.label}
            </Badge>
          </div>
          <DialogTitle className="text-base sm:text-xl mt-3 sm:mt-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="line-clamp-2">{info.name}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="info" className="gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm touch-target">
              <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Info</span>
              <span className="xs:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm touch-target">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Orçamento</span>
            </TabsTrigger>
            <TabsTrigger value="freeze" className="gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm touch-target" disabled={!sendCommand}>
              <Snowflake className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Freeze</span>
              <span className="xs:hidden">FF</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
            {/* Descrição */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                O que significa
              </h4>
              <p className="text-sm sm:text-base text-foreground">
                {info.description}
              </p>
            </div>

            {/* Causas Comuns */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2 flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Causas comuns
              </h4>
              <ul className="space-y-1">
                {info.causes.map((cause, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm sm:text-base text-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    {cause}
                  </li>
                ))}
              </ul>
            </div>

            {/* Explicação IA */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-medium text-primary mb-1.5 sm:mb-2 flex items-center gap-2">
                {aiSource === 'openai' ? (
                  <>
                    <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                    <span>Análise Premium (GPT-4o-mini)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Análise do Mecânico IA</span>
                  </>
                )}
              </h4>
              
              {isLoadingAI && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground py-3 sm:py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {settings.aiProvider === 'openai' && settings.openaiApiKey 
                    ? 'Consultando GPT-4o-mini...' 
                    : 'Consultando IA...'}
                </div>
              )}
              
              {aiError && (
                <div className="text-xs sm:text-sm text-yellow-500 mb-2">
                  ⚠️ {aiError}
                </div>
              )}
              
              {aiExplanation && !isLoadingAI && (
                <div className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {aiExplanation}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-4 mt-3 sm:mt-4">
            {isLoadingEstimate && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Consultando orçamento...</p>
              </div>
            )}

            {estimateError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{estimateError}</AlertDescription>
              </Alert>
            )}

            {estimate && !isLoadingEstimate && (
              <>
                {/* Risk Action Banner */}
                <RiskActionBanner 
                  riskLevel={estimate.riskLevel} 
                  actionMessage={estimate.actionMessage}
                  canDrive={estimate.canDrive}
                />

                {/* Simple Explanation for Laymen */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Baby className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-blue-500 font-medium">Para leigos:</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {estimate.simpleExplanation}
                  </p>
                </div>

                {/* Estimated Parts */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" />
                    Peças Prováveis
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {estimate.estimatedParts.map((part, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        🔧 {part}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Estimated Labor */}
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Mão de Obra Estimada
                  </h4>
                  <p className="text-sm text-foreground">{estimate.estimatedLabor}</p>
                </div>

                {/* Cost Range */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-green-600 mb-2 flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5" />
                    Custo Estimado
                  </h4>
                  <p className="text-2xl font-bold text-foreground">
                    R$ {estimate.estimatedCostRange.min.toLocaleString('pt-BR')} - R$ {estimate.estimatedCostRange.max.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Peças genéricas (min) / Originais (max)
                  </p>
                </div>

                {/* Disclaimer */}
                <Alert className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-xs text-yellow-600">
                    {estimate.disclaimer}
                  </AlertDescription>
                </Alert>

                {/* Share Button */}
                <ShareWhatsAppButton 
                  dtcCode={dtc.code}
                  dtcName={info.name}
                  estimate={estimate}
                  vehicleContext={vehicleContext}
                />
              </>
            )}
          </TabsContent>
          
          <TabsContent value="freeze" className="mt-3 sm:mt-4">
            {sendCommand && addLog ? (
              <FreezeFrameData 
                dtcCode={dtc.code}
                sendCommand={sendCommand}
                addLog={addLog}
              />
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Snowflake className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Freeze Frame não disponível</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 sm:mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose} className="min-h-[44px] touch-target">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Risk Action Banner Component
function RiskActionBanner({ 
  riskLevel, 
  actionMessage,
  canDrive 
}: { 
  riskLevel: 'critical' | 'moderate' | 'low';
  actionMessage: string;
  canDrive: boolean;
}) {
  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-3 ${config.bgClass} ${riskLevel === 'critical' ? 'animate-pulse' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${config.bgClass}`}>
          <Icon className={`h-5 w-5 ${config.textClass}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`text-xs ${config.bgClass} ${config.textClass} border-0`}>
              {config.label}
            </Badge>
            <Badge variant="outline" className={`text-xs ${canDrive ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}`}>
              {canDrive ? '✅ Pode dirigir' : '⛔ Não dirija'}
            </Badge>
          </div>
          <p className={`text-sm font-bold ${config.textClass}`}>
            {actionMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

// Share via WhatsApp Button
function ShareWhatsAppButton({
  dtcCode,
  dtcName,
  estimate,
  vehicleContext,
}: {
  dtcCode: string;
  dtcName: string;
  estimate: DTCEstimate;
  vehicleContext: string;
}) {
  const handleShare = () => {
    const riskEmoji = estimate.riskLevel === 'critical' ? '🔴' : estimate.riskLevel === 'moderate' ? '🟡' : '🟢';
    const driveStatus = estimate.canDrive ? '✅ Pode dirigir até oficina' : '⛔ NÃO DIRIJA!';
    
    const message = `🔧 *DIAGNÓSTICO VEICULAR*
━━━━━━━━━━━━━━━━━━━━

🚗 *Veículo:* ${vehicleContext}

⚠️ *Código do Erro:* ${dtcCode}
📋 *Problema:* ${dtcName}

💡 *Explicação Simples:*
${estimate.simpleExplanation}

${riskEmoji} *Nível de Risco:* ${estimate.riskLevel === 'critical' ? 'CRÍTICO' : estimate.riskLevel === 'moderate' ? 'Moderado' : 'Baixo'}
${driveStatus}

🔧 *Peças Prováveis:*
${estimate.estimatedParts.map(p => `• ${p}`).join('\n')}

⏱️ *Mão de Obra:* ${estimate.estimatedLabor}

💰 *Custo Estimado:*
R$ ${estimate.estimatedCostRange.min.toLocaleString('pt-BR')} - R$ ${estimate.estimatedCostRange.max.toLocaleString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━
_Estimativa gerada por SmartScanner_
_Consulte sua oficina para orçamento real_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Abrindo WhatsApp...');
  };

  return (
    <Button
      onClick={handleShare}
      className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
    >
      <MessageCircle className="h-4 w-4" />
      Enviar para Mecânico via WhatsApp
    </Button>
  );
}
