import { forwardRef } from "react";
import {
  Car,
  Bluetooth,
  Gauge,
  AlertTriangle,
  Activity,
  Bot,
  Thermometer,
  Battery,
  Fuel,
  Zap,
  Search,
  Wrench,
  CheckCircle,
  Droplets,
  Eye,
  DollarSign,
  Images,
  RefreshCw,
  Brain,
  CircleDot,
  CloudOff,
} from "lucide-react";

interface ManualSectionProps {
  title: string;
  number: string;
  children: React.ReactNode;
}

const ManualSection = ({ title, number, children }: ManualSectionProps) => (
  <div className="mb-8 break-inside-avoid">
    <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4 flex items-center gap-3">
      <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
        {number}
      </span>
      {title}
    </h2>
    <div className="space-y-3 text-sm">{children}</div>
  </div>
);

const ManualCard = ({ title, description }: { title: string; description: string }) => (
  <div className="p-3 bg-muted/30 rounded-lg border border-border">
    <h4 className="font-semibold text-foreground mb-1">{title}</h4>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

export const UserManual = forwardRef<HTMLDivElement>((_, ref) => {
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div ref={ref} className="bg-background text-foreground p-8 max-w-4xl mx-auto print:p-4">
      {/* Capa */}
      <div className="text-center mb-12 pb-8 border-b-4 border-primary">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
          <Car className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Manual de Uso
        </h1>
        <h2 className="text-xl text-primary font-semibold mb-4">
          OBD-II Scanner com Jarvis AI
        </h2>
        <p className="text-muted-foreground text-sm">
          Versão 2.0 • {currentDate}
        </p>
      </div>

      {/* Índice */}
      <div className="mb-10 p-4 bg-muted/20 rounded-lg border border-border">
        <h3 className="font-bold text-foreground mb-3">📋 Índice</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>1. Introdução</div>
          <div>2. Primeiros Passos</div>
          <div>3. Conexão com o Veículo</div>
          <div>4. Dashboard (Painel)</div>
          <div>5. Scanner de Erros</div>
          <div>6. Catálogo de Veículos</div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
          <div>7. Mecânico Visual (IA)</div>
          <div>8. Controle Financeiro</div>
          <div>9. Monitor de Abastecimento</div>
          <div>10. Assistente Jarvis</div>
          <div>11. Perguntas Frequentes</div>
          <div>12. Glossário</div>
        </div>
      </div>

      {/* 1. Introdução */}
      <ManualSection title="Introdução" number="1">
        <p className="text-muted-foreground mb-4">
          O OBD-II Scanner com Jarvis AI é uma ferramenta completa de diagnóstico automotivo 
          que transforma seu smartphone em um scanner profissional. Com ele você pode:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Monitorar dados do motor em tempo real (RPM, temperatura, velocidade)</li>
          <li>Ler e limpar códigos de erro (DTC) do veículo</li>
          <li>Conversar com o assistente Jarvis para tirar dúvidas</li>
          <li>Verificar qualidade de combustível após abastecer</li>
          <li>Diagnosticar problemas visuais com fotos (IA)</li>
          <li>Controlar ganhos e custos de corridas (Uber/99)</li>
        </ul>
        
        <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
          <h4 className="font-semibold text-foreground mb-1">⚠️ Requisitos</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Adaptador ELM327 Bluetooth Low Energy (BLE)</li>
            <li>• Navegador Chrome, Edge ou Opera (Android/Desktop)</li>
            <li>• Veículo com porta OBD-II (carros fabricados após 1996)</li>
          </ul>
        </div>
      </ManualSection>

      {/* 2. Primeiros Passos */}
      <ManualSection title="Primeiros Passos" number="2">
        <div className="space-y-3">
          <ManualCard
            title="1. Adquira um adaptador ELM327 BLE"
            description="Procure por 'ELM327 Bluetooth 4.0' ou 'ELM327 BLE' em lojas online. Custa entre R$30-100. Evite os muito baratos."
          />
          <ManualCard
            title="2. Encontre a porta OBD-II"
            description="Geralmente fica embaixo do painel, do lado do motorista, perto dos pedais. É uma tomada retangular com 16 pinos."
          />
          <ManualCard
            title="3. Instale o aplicativo"
            description="Acesse o app pelo navegador Chrome no celular. Clique no menu e 'Adicionar à tela inicial' para criar um atalho."
          />
          <ManualCard
            title="4. Conecte e configure"
            description="Plugue o adaptador na porta OBD-II, abra o app, clique em 'Conectar' e selecione seu adaptador na lista."
          />
        </div>
      </ManualSection>

      {/* 3. Conexão */}
      <ManualSection title="Conexão com o Veículo" number="3">
        <div className="flex items-start gap-3 mb-3">
          <Bluetooth className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold">Passo a Passo</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground mt-1">
              <li>Ligue a ignição do veículo (chave na posição ON)</li>
              <li>Conecte o adaptador ELM327 na porta OBD-II</li>
              <li>Abra o app e clique em "Conectar Veículo"</li>
              <li>Selecione "OBD-II" ou "ELM327" na lista de dispositivos</li>
              <li>Aguarde a inicialização (Jarvis dará as boas-vindas)</li>
            </ol>
          </div>
        </div>
        
        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
          <h4 className="font-semibold text-foreground mb-1">🔧 Problemas de Conexão?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Verifique se o Bluetooth está ativado no dispositivo</li>
            <li>• Tente desconectar e reconectar o adaptador</li>
            <li>• Reinicie o navegador</li>
            <li>• Alguns adaptadores não são compatíveis com BLE</li>
          </ul>
        </div>
      </ManualSection>

      {/* 4. Dashboard */}
      <ManualSection title="Dashboard (Painel)" number="4">
        <p className="text-muted-foreground mb-3">
          O painel mostra informações em tempo real. Cores indicam o status:
          <span className="text-green-500"> Verde (normal)</span>,
          <span className="text-yellow-500"> Amarelo (atenção)</span>,
          <span className="text-red-500"> Vermelho (problema)</span>.
        </p>
        
        <div className="grid gap-3">
          <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
            <Gauge className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold">RPM (Rotações por Minuto)</h4>
              <p className="text-sm text-muted-foreground">
                Marcha lenta: 700-900 RPM. Acima de 5000: cuidado!
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
            <Thermometer className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold">Temperatura do Motor</h4>
              <p className="text-sm text-muted-foreground">
                Normal: 85-100°C. Acima de 100°C: superaquecimento!
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
            <Battery className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold">Voltagem da Bateria</h4>
              <p className="text-sm text-muted-foreground">
                Motor ligado: 13.5-14.5V. Abaixo de 12.5V: bateria fraca.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
            <Fuel className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold">Nível de Combustível</h4>
              <p className="text-sm text-muted-foreground">
                Porcentagem no tanque (nem todos os veículos disponibilizam).
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
            <Zap className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold">Carga do Motor</h4>
              <p className="text-sm text-muted-foreground">
                Esforço do motor em %. Acelerar/subir ladeira = carga alta.
              </p>
            </div>
          </div>
        </div>
      </ManualSection>

      {/* 5. Scanner de Erros */}
      <ManualSection title="Scanner de Erros" number="5">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold">O que são códigos DTC?</h4>
            <p className="text-sm text-muted-foreground">
              DTC (Diagnostic Trouble Codes) são "recados" que o carro deixa quando detecta problemas.
              Formato: letra + 4 números (ex: P0300).
            </p>
          </div>
        </div>
        
        <div className="p-3 bg-muted/20 rounded-lg mb-3">
          <h4 className="font-semibold mb-2">Tipos de Códigos:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-red-500 font-mono">P0XXX</span> - Motor/Transmissão</div>
            <div><span className="text-blue-500 font-mono">C0XXX</span> - Chassi (ABS)</div>
            <div><span className="text-yellow-500 font-mono">B0XXX</span> - Carroceria (Airbag)</div>
            <div><span className="text-purple-500 font-mono">U0XXX</span> - Rede de comunicação</div>
          </div>
        </div>
        
        <ManualCard
          title="Como fazer um scan"
          description="Acesse aba 'Mecânico' → Clique 'Iniciar Scan' → Aguarde a varredura de todos os módulos → Veja os resultados com descrição e gravidade."
        />
        
        <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
          <h4 className="font-semibold text-foreground">⚠️ Atenção ao limpar códigos</h4>
          <p className="text-sm text-muted-foreground">
            Não limpe códigos sem resolver o problema! A luz de "check engine" vai voltar.
          </p>
        </div>
      </ManualSection>

      {/* 6. Catálogo de Veículos */}
      <ManualSection title="Catálogo de Veículos" number="6">
        <div className="flex items-start gap-3 mb-3">
          <Search className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold">Base de Dados Premium</h4>
            <p className="text-sm text-muted-foreground">
              O catálogo contém centenas de modelos de veículos brasileiros com 
              informações de motor, câmbio e especificações técnicas.
            </p>
          </div>
        </div>
        
        <ManualCard
          title="Como buscar seu veículo"
          description="Configurações → Trocar Veículo → Use a busca por nome ou navegue pelo carrossel de marcas → Selecione modelo → Configure ano, motor e apelido."
        />
        
        <div className="p-3 bg-muted/20 rounded-lg mt-3">
          <h4 className="font-semibold mb-2">Funcionalidades:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Busca por marca, modelo ou ano</li>
            <li>• Carrossel com logos das marcas</li>
            <li>• Filtros por faixa de ano</li>
            <li>• Configuração de apelido personalizado</li>
            <li>• Seleção de motor e câmbio</li>
          </ul>
        </div>
      </ManualSection>

      {/* 7. Mecânico Visual */}
      <ManualSection title="Mecânico Visual (IA)" number="7">
        <div className="flex items-start gap-3 mb-3">
          <Eye className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold">Diagnóstico por Foto ou Vídeo</h4>
            <p className="text-sm text-muted-foreground">
              Tire uma foto de qualquer problema (luz no painel, vazamento, peça estranha) 
              e a IA analisa e explica o que pode ser.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3 mb-3">
          <Images className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <h4 className="font-semibold">Múltiplas Fotos</h4>
            <p className="text-sm text-muted-foreground">
              Envie até 4 fotos de ângulos diferentes para um diagnóstico mais preciso.
            </p>
          </div>
        </div>
        
        <div className="p-3 bg-muted/20 rounded-lg mb-3">
          <h4 className="font-semibold mb-2">Níveis de Risco:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span>Seguro - Pode continuar dirigindo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Atenção - Agende manutenção em breve</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span>Perigo - Não dirija, procure um mecânico</span>
            </div>
          </div>
        </div>
        
        <ManualCard
          title="Dicas para boas fotos"
          description="Boa iluminação, foto nítida e focada, inclua contexto ao redor do problema, fotografe de ângulos diferentes."
        />
      </ManualSection>

      {/* 8. Controle Financeiro */}
      <ManualSection title="Controle Financeiro" number="8">
        <div className="flex items-start gap-3 mb-3">
          <DollarSign className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold">Para Motoristas de App (Uber/99)</h4>
            <p className="text-sm text-muted-foreground">
              Detecta automaticamente corridas, calcula custo de combustível em tempo real 
              e mostra o lucro real de cada viagem.
            </p>
          </div>
        </div>
        
        <div className="p-3 bg-muted/20 rounded-lg mb-3">
          <h4 className="font-semibold mb-2">Como funciona:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Configure: preço do combustível, consumo médio, custo por km</li>
            <li>Ative a detecção automática nas configurações</li>
            <li>Sistema detecta início (&gt;10km/h por 5s) e fim (parado 30s)</li>
            <li>Informe o valor recebido do passageiro</li>
            <li>Veja: Lucro = Valor Recebido - Custo Combustível</li>
          </ol>
        </div>
        
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <h4 className="font-semibold">Recuperação de Corridas</h4>
            <p className="text-sm text-muted-foreground">
              Se o app fechar durante uma corrida, ao reabrir você pode recuperar 
              os dados e continuar de onde parou.
            </p>
          </div>
        </div>
      </ManualSection>

      {/* 9. Monitor de Abastecimento */}
      <ManualSection title="Monitor de Abastecimento" number="9">
        <div className="flex items-start gap-3 mb-3">
          <Droplets className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold">Verificação de Qualidade com Análise Forense</h4>
            <p className="text-sm text-muted-foreground">
              Sistema inteligente que analisa o Fuel Trim após abastecer, diferencia 
              troca de combustível Flex de adulteração, e monitora o sensor O2 em tempo real.
            </p>
          </div>
        </div>
        
        <ManualCard
          title="Como usar"
          description="Abasteça → Selecione contexto (mesmo combustível, gas→etanol ou etanol→gas) → Informe litros/preço → Inicie monitoramento → Dirija 5km → Veja diagnóstico forense."
        />

        {/* Análise Forense */}
        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 mt-4">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Análise Forense Inteligente (Fuel State Machine)
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Antes de iniciar o monitoramento, selecione o contexto do abastecimento:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li><strong>Mesmo combustível:</strong> Você abasteceu o mesmo tipo (comparação direta)</li>
            <li><strong>Gasolina → Etanol:</strong> Trocou para etanol (STFT sobe, normal)</li>
            <li><strong>Etanol → Gasolina:</strong> Trocou para gasolina (STFT desce, normal)</li>
          </ul>
        </div>

        {/* Estados do Diagnóstico */}
        <div className="p-3 bg-muted/20 rounded-lg mt-3">
          <h4 className="font-semibold mb-2">Estados do Diagnóstico Forense:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span><strong>Estável:</strong> Combustível aprovado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span><strong>Adaptando:</strong> ECU aprendendo (normal em Flex)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span><strong>Suspeito:</strong> Valores fora do normal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span><strong>Contaminado:</strong> Adulteração detectada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-500" />
              <span><strong>Mecânico:</strong> Problema no veículo</span>
            </div>
          </div>
        </div>

        {/* Monitor O2 */}
        <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg mt-3">
          <CircleDot className="h-5 w-5 text-cyan-500 mt-0.5" />
          <div>
            <h4 className="font-semibold">Monitor de Sensor O2 (Sonda Lambda)</h4>
            <p className="text-sm text-muted-foreground">
              Gráfico em tempo real mostra a sonda oscilando. Valores &lt;0.45V = mistura pobre, 
              &gt;0.45V = rica. Se ficar travada, indica problema mecânico.
            </p>
          </div>
        </div>

        {/* Proteção de Motor Frio (Closed Loop) */}
        <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30 mt-3">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            Proteção de Motor Frio (Closed Loop)
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            O sistema verifica se o motor está aquecido antes de coletar dados.
            Se aparecer "Aguardando Aquecimento":
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>Motor está em Open Loop (frio ou acelerando forte)</li>
            <li>Coleta de Fuel Trim pausada automaticamente</li>
            <li>Distância continua sendo contada normalmente</li>
            <li>Quando aquece (~60°C), retoma a análise</li>
            <li>Jarvis anuncia quando está pronto</li>
          </ul>
        </div>

        {/* Modo Offline */}
        <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg mt-3">
          <CloudOff className="h-5 w-5 text-orange-500 mt-0.5" />
          <div>
            <h4 className="font-semibold">Modo Offline</h4>
            <p className="text-sm text-muted-foreground">
              Sem internet, diagnósticos são salvos localmente. Ao reconectar, 
              sincronizam automaticamente. Um indicador mostra itens pendentes.
            </p>
          </div>
        </div>
        
        <div className="p-3 bg-muted/20 rounded-lg mt-3">
          <h4 className="font-semibold mb-2">Interpretação do Fuel Trim (STFT):</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span>-10% a +10%: Combustível normal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>±10% a ±15%: Qualidade suspeita</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span>Fora de ±15%: Possível adulteração</span>
            </div>
          </div>
        </div>
      </ManualSection>

      {/* 10. Assistente Jarvis */}
      <ManualSection title="Assistente Jarvis" number="10">
        <div className="flex items-start gap-3 mb-3">
          <Bot className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold">IA de Voz Integrada</h4>
            <p className="text-sm text-muted-foreground">
              O Jarvis é seu copiloto inteligente. Avisa sobre problemas, responde perguntas 
              e analisa os dados do veículo em tempo real.
            </p>
          </div>
        </div>
        
        <div className="p-3 bg-muted/20 rounded-lg mb-3">
          <h4 className="font-semibold mb-2">Exemplos de perguntas:</h4>
          <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
            <div>• "Como está o motor?"</div>
            <div>• "A temperatura está normal?"</div>
            <div>• "Posso acelerar agora?"</div>
            <div>• "O que significa P0300?"</div>
            <div>• "Quando trocar o óleo?"</div>
            <div>• "Como foi o dia de trabalho?"</div>
          </div>
        </div>
        
        <div className="p-3 bg-muted/20 rounded-lg">
          <h4 className="font-semibold mb-2">Alertas Automáticos:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Boas-vindas ao conectar</li>
            <li>• RPM alto com motor frio</li>
            <li>• Superaquecimento do motor</li>
            <li>• Velocidade acima do limite</li>
            <li>• Bateria fraca</li>
            <li>• Resultado de abastecimento</li>
          </ul>
        </div>
      </ManualSection>

      {/* 11. FAQ */}
      <ManualSection title="Perguntas Frequentes" number="11">
        <div className="space-y-3">
          <ManualCard
            title="A luz do motor acendeu, o que faço?"
            description="Use o Scanner de Erros na aba 'Mecânico'. O app mostra o código e explicação. Se for grave, procure um mecânico."
          />
          <ManualCard
            title="Por que aparece 'NO DATA'?"
            description="Nem todos os veículos disponibilizam todos os sensores via OBD-II. É normal e não significa problema."
          />
          <ManualCard
            title="Por que não funciona no iPhone?"
            description="Safari e iOS não suportam Web Bluetooth. Use Android com Chrome ou computador com Chrome/Edge."
          />
          <ManualCard
            title="Como detectar combustível adulterado?"
            description="Use o Monitor de Abastecimento. Se o STFT médio ficar acima de ±15% após abastecer, há indícios de adulteração."
          />
          <ManualCard
            title="A análise de foto funciona offline?"
            description="Sim! Tire a foto offline e ela será analisada quando a conexão retornar. O histórico é salvo localmente."
          />
          <ManualCard
            title="O que significa 'ECU Adaptando'?"
            description="Em veículos Flex, ao trocar combustível, a ECU precisa aprender nova proporção. STFT alto é normal. O sistema mostra progresso da adaptação."
          />
          <ManualCard
            title="Por que 'Problema Mecânico'?"
            description="Se sensor O2 ficar travado ou LTFT não adaptar após km, indica problema mecânico (sonda defeituosa, vazamento). Procure um mecânico."
          />
          <ManualCard
            title="Por que 'Aguardando Aquecimento'?"
            description="Motor frio (Open Loop) não fornece dados confiáveis de Fuel Trim. O sistema aguarda aquecimento (~60°C) para garantir análise precisa. A distância continua contando."
          />
          <ManualCard
            title="O que é o badge vermelho no botão?"
            description="Indica diagnósticos aguardando sincronização com a nuvem (feitos offline). Quando reconectar à internet, sincronizam automaticamente."
          />
        </div>
      </ManualSection>

      {/* 12. Glossário */}
      <ManualSection title="Glossário" number="12">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">OBD-II</span>
            <p className="text-muted-foreground">Sistema de diagnóstico padrão (desde 1996)</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">DTC</span>
            <p className="text-muted-foreground">Código de erro do veículo</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">ECU/ECM</span>
            <p className="text-muted-foreground">Cérebro do motor</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">PID</span>
            <p className="text-muted-foreground">Identificador de sensor</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">VIN</span>
            <p className="text-muted-foreground">Número único do veículo (17 caracteres)</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">RPM</span>
            <p className="text-muted-foreground">Rotações por minuto do motor</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">ELM327</span>
            <p className="text-muted-foreground">Chip adaptador OBD-II</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">BLE</span>
            <p className="text-muted-foreground">Bluetooth Low Energy</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">STFT</span>
            <p className="text-muted-foreground">Correção imediata ar/combustível</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">LTFT</span>
            <p className="text-muted-foreground">Correção de longo prazo</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">Sensor O2</span>
            <p className="text-muted-foreground">Sonda lambda no escapamento</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">Flex</span>
            <p className="text-muted-foreground">Veículo bicombustível</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">Forense</span>
            <p className="text-muted-foreground">Análise inteligente de padrões</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">Adaptação</span>
            <p className="text-muted-foreground">ECU aprendendo novo combustível</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">Closed Loop</span>
            <p className="text-muted-foreground">ECU usando feedback do O2</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <span className="font-mono font-bold text-primary">Open Loop</span>
            <p className="text-muted-foreground">Valores fixos (motor frio/WOT)</p>
          </div>
        </div>
      </ManualSection>

      {/* Rodapé */}
      <div className="mt-12 pt-6 border-t-2 border-border text-center text-sm text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">OBD-II Scanner com Jarvis AI</p>
        <p>© {new Date().getFullYear()} • Todos os direitos reservados</p>
        <p className="mt-2">
          Dúvidas? Fale com o Jarvis! Ele pode ajudar com perguntas específicas sobre seu veículo.
        </p>
      </div>
    </div>
  );
});

UserManual.displayName = "UserManual";
