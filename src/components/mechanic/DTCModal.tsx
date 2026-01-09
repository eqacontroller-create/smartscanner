import { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, Lightbulb, Loader2, Sparkles, Snowflake } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import type { ParsedDTC } from '@/lib/dtcParser';
import { getDTCInfo, getDefaultDTCInfo, type DTCInfo } from '@/lib/dtcDatabase';
import { FreezeFrameData } from './FreezeFrameData';

interface DTCModalProps {
  dtc: ParsedDTC | null;
  isOpen: boolean;
  onClose: () => void;
  sendCommand?: (command: string, timeout?: number) => Promise<string>;
  addLog?: (message: string) => void;
}

const severityConfig = {
  low: { label: 'Baixa', className: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  medium: { label: 'Média', className: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  high: { label: 'Alta', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export function DTCModal({ dtc, isOpen, onClose, sendCommand, addLog }: DTCModalProps) {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && dtc) {
      fetchAIExplanation(dtc.code);
    } else {
      setAiExplanation(null);
      setAiError(null);
    }
  }, [isOpen, dtc?.code]);

  const fetchAIExplanation = async (code: string) => {
    setIsLoadingAI(true);
    setAiError(null);
    
    try {
      const info = getDTCInfo(code) || getDefaultDTCInfo(code);
      
      const { data, error } = await supabase.functions.invoke('explain-dtc', {
        body: { dtcCode: code, dtcDescription: info.description }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setAiExplanation(data.explanation);
    } catch (err) {
      console.error('AI explanation error:', err);
      setAiError(err instanceof Error ? err.message : 'Erro ao consultar IA');
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (!dtc) return null;

  const info: DTCInfo = getDTCInfo(dtc.code) || getDefaultDTCInfo(dtc.code);
  const severity = severityConfig[info.severity];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className="font-mono text-lg px-3 py-1 bg-destructive/10 text-destructive border-destructive/30"
              >
                {dtc.code}
              </Badge>
              <Badge variant="outline" className={severity.className}>
                Severidade: {severity.label}
              </Badge>
            </div>
          </div>
          <DialogTitle className="text-xl mt-4 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            {info.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="gap-2">
              <Wrench className="h-4 w-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="freeze" className="gap-2" disabled={!sendCommand}>
              <Snowflake className="h-4 w-4" />
              Freeze Frame
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-6 mt-4">
            {/* Descrição */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                O que significa
              </h4>
              <p className="text-foreground">
                {info.description}
              </p>
            </div>

            {/* Causas Comuns */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Causas comuns
              </h4>
              <ul className="space-y-1">
                {info.causes.map((cause, index) => (
                  <li key={index} className="flex items-start gap-2 text-foreground">
                    <span className="text-primary mt-1">•</span>
                    {cause}
                  </li>
                ))}
              </ul>
            </div>

            {/* Explicação IA Real */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Análise do Mecânico IA
              </h4>
              
              {isLoadingAI && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Consultando IA...
                </div>
              )}
              
              {aiError && (
                <div className="text-sm text-destructive">
                  {aiError}
                </div>
              )}
              
              {aiExplanation && !isLoadingAI && (
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {aiExplanation}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="freeze" className="mt-4">
            {sendCommand && addLog ? (
              <FreezeFrameData 
                dtcCode={dtc.code}
                sendCommand={sendCommand}
                addLog={addLog}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Snowflake className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Freeze Frame não disponível</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
