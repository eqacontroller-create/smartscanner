import { X, Wrench, AlertTriangle, Lightbulb, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ParsedDTC } from '@/lib/dtcParser';
import { getDTCInfo, getDefaultDTCInfo, type DTCInfo } from '@/lib/dtcDatabase';

interface DTCModalProps {
  dtc: ParsedDTC | null;
  isOpen: boolean;
  onClose: () => void;
}

const severityConfig = {
  low: { label: 'Baixa', className: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  medium: { label: 'Média', className: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  high: { label: 'Alta', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export function DTCModal({ dtc, isOpen, onClose }: DTCModalProps) {
  if (!dtc) return null;

  const info: DTCInfo = getDTCInfo(dtc.code) || getDefaultDTCInfo(dtc.code);
  const severity = severityConfig[info.severity];

  // Simular explicação de IA (preparado para integração real)
  const aiExplanation = generateAIExplanation(dtc.code, info);

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

        <div className="space-y-6 mt-4">
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

          {/* Explicação IA */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
              🤖 Análise IA para Ford Focus
            </h4>
            <p className="text-sm text-foreground leading-relaxed">
              {aiExplanation}
            </p>
            
            {/* Banner para configurar API */}
            <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Settings className="h-3 w-3" />
                <span>
                  Configure sua API Key da OpenAI nas configurações para obter explicações personalizadas em tempo real.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Função de simulação de IA - será substituída por chamada real à API
function generateAIExplanation(code: string, info: DTCInfo): string {
  const explanations: Record<string, string> = {
    'P0300': 'No Ford Focus, falhas múltiplas de ignição geralmente indicam problemas com as bobinas de ignição ou velas. Recomendo verificar primeiro as velas de ignição - o Focus 2.0 Duratec costuma precisar de troca a cada 60.000 km. Se as velas estiverem boas, verifique as bobinas individuais, pois é comum falharem após 100.000 km.',
    'P0171': 'Este código de mistura pobre no Ford Focus frequentemente está relacionado a vazamentos de vácuo no coletor de admissão ou mangueiras. Verifique especialmente a mangueira do freio a vácuo e as juntas do coletor. Outra causa comum é o sensor MAF sujo - uma limpeza com spray específico pode resolver.',
    'P0420': 'No Ford Focus, antes de substituir o catalisador, verifique se não há vazamentos de escape e se os sensores de O2 estão funcionando. Muitas vezes, o problema é simplesmente um sensor traseiro envelhecido, que é muito mais barato de substituir.',
    'P0442': 'Vazamentos pequenos no sistema EVAP do Focus geralmente são causados por tampa do tanque mal fechada ou ressecada. Verifique se a tampa fecha com "cliques" audíveis. Se persistir, verifique as mangueiras de vapor próximas ao tanque.',
  };

  return explanations[code] || 
    `Para o Ford Focus, este código (${code}) indica: ${info.description.toLowerCase()} As causas mais comuns incluem ${info.causes.slice(0, 2).join(' e ').toLowerCase()}. Recomendo levar a um mecânico especializado em Ford para diagnóstico preciso com equipamento profissional.`;
}
