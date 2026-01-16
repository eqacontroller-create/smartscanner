// Componente educativo sobre Fuel Trim e monitoramento de combustível

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { 
  GraduationCap, 
  Gauge, 
  AlertTriangle, 
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FuelEducationProps {
  defaultOpen?: string[];
}

export function FuelEducation({ defaultOpen = ['what-is'] }: FuelEducationProps) {
  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Central de Combustível</h3>
            <p className="text-xs text-muted-foreground">Aprenda como funciona a análise</p>
          </div>
        </div>

        <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
          {/* O que é Fuel Trim */}
          <AccordionItem value="what-is" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <HelpCircle className="h-4 w-4 text-blue-500" />
                O que é Fuel Trim?
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Fuel Trim</strong> é a correção que o motor faz 
                  automaticamente na mistura ar/combustível para manter a queima ideal.
                </p>
                <p>
                  🔹 <strong className="text-primary">STFT</strong> (Short Term Fuel Trim) = Correção instantânea
                  <br />
                  <span className="pl-5 text-xs">Muda a cada segundo baseado na leitura do sensor de oxigênio</span>
                </p>
                <p>
                  🔹 <strong className="text-muted-foreground">LTFT</strong> (Long Term Fuel Trim) = Correção de longo prazo
                  <br />
                  <span className="pl-5 text-xs">Média que o motor "aprende" e armazena na memória</span>
                </p>
                <div className="p-3 rounded-lg bg-muted/50 border mt-3">
                  <p className="text-xs">
                    <strong>💡 Analogia:</strong> É como dirigir em uma estrada. 
                    O STFT é você corrigindo o volante a cada curva, 
                    e o LTFT é você aprendendo que essa estrada puxa para a direita.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Como interpretar */}
          <AccordionItem value="values" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Gauge className="h-4 w-4 text-purple-500" />
                Como interpretar os valores?
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-3">
                {/* Tabela visual de valores */}
                <div className="grid gap-2">
                  <FuelTrimRange 
                    range="-10% a +10%"
                    status="Normal"
                    description="Combustível de boa qualidade, mistura ideal"
                    variant="success"
                  />
                  <FuelTrimRange 
                    range="-15% a -10% ou +10% a +15%"
                    status="Elevado"
                    description="Combustível pode estar adulterado ou sensor precisa de atenção"
                    variant="warning"
                  />
                  <FuelTrimRange 
                    range="Acima de ±15%"
                    status="Crítico"
                    description="Problema sério - combustível ruim ou falha mecânica"
                    variant="danger"
                  />
                </div>
                
                <div className="p-3 rounded-lg bg-muted/50 border mt-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>📊 Valor positivo (+):</strong> Motor adicionando mais combustível
                    <br />
                    <strong>📉 Valor negativo (-):</strong> Motor reduzindo combustível
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Causas de valores anormais */}
          <AccordionItem value="causes" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Causas de valores anormais
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-3 text-sm">
                <div className="space-y-2">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <span className="text-red-500">▲</span> STFT muito positivo (+15% ou mais)
                  </p>
                  <ul className="pl-5 space-y-1 text-muted-foreground text-xs">
                    <li>• Combustível adulterado com excesso de etanol</li>
                    <li>• Vazamento de vácuo no motor</li>
                    <li>• Sensor MAF/MAP sujo ou com defeito</li>
                    <li>• Bico injetor entupido</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <span className="text-blue-500">▼</span> STFT muito negativo (-15% ou menos)
                  </p>
                  <ul className="pl-5 space-y-1 text-muted-foreground text-xs">
                    <li>• Pressão de combustível muito alta</li>
                    <li>• Bico injetor vazando</li>
                    <li>• Sensor de oxigênio com problema</li>
                    <li>• Vazamento no sistema EVAP</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Dicas */}
          <AccordionItem value="tips" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Dicas para abastecer com segurança
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Prefira postos de bandeira conhecida</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Evite abastecer quando o caminhão-tanque acabou de descarregar</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Peça para zerar a bomba antes de abastecer</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Use o Teste Rápido se suspeitar de combustível ruim</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Não ignore alertas de Fuel Trim alto por vários dias</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

// Componente auxiliar para mostrar faixas de valores
interface FuelTrimRangeProps {
  range: string;
  status: string;
  description: string;
  variant: 'success' | 'warning' | 'danger';
}

function FuelTrimRange({ range, status, description, variant }: FuelTrimRangeProps) {
  const colors = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      icon: 'text-green-500',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-500',
    },
    danger: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: 'text-red-500',
    },
  };

  const Icon = variant === 'success' ? CheckCircle2 : variant === 'warning' ? AlertTriangle : XCircle;

  return (
    <div className={cn(
      'p-2.5 rounded-lg border flex items-start gap-2.5',
      colors[variant].bg,
      colors[variant].border
    )}>
      <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', colors[variant].icon)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-medium text-foreground">{range}</span>
          <span className={cn('text-xs font-medium', colors[variant].icon)}>{status}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
