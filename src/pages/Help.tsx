import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HelpSection } from "@/components/help/HelpSection";
import { HelpCard } from "@/components/help/HelpCard";
import { StepByStep } from "@/components/help/StepByStep";
import { GlossaryItem } from "@/components/help/GlossaryItem";
import { FAQItem } from "@/components/help/FAQItem";
import {
  ArrowLeft,
  Bluetooth,
  Car,
  Gauge,
  AlertTriangle,
  Activity,
  Bot,
  BookOpen,
  HelpCircle,
  Plug,
  MonitorSmartphone,
  Chrome,
  Thermometer,
  Battery,
  Fuel,
  Zap,
  Search,
  Trash2,
  Mic,
  MessageSquare,
  Bell,
  Wrench,
  CheckCircle,
  XCircle,
  Info,
  Key,
} from "lucide-react";

export default function Help() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Central de Ajuda</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-4">
        {/* Intro */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo ao OBD-II Scanner! 🚗
          </h2>
          <p className="text-muted-foreground">
            Aqui você encontra tutoriais e explicações simples para aproveitar
            ao máximo o diagnóstico do seu veículo.
          </p>
        </div>

        {/* Primeiros Passos */}
        <HelpSection id="primeiros-passos" title="Primeiros Passos" icon={BookOpen} defaultOpen>
          <HelpCard
            title="O que é um Scanner OBD-II?"
            description="OBD-II (On-Board Diagnostics) é um sistema presente em todos os carros desde 1996. É como o 'modo de diagnóstico' que os médicos usam para verificar sua saúde - mas para o carro!"
            icon={Car}
            variant="info"
          />

          <HelpCard
            title="Qual adaptador comprar?"
            description="Você precisa de um adaptador ELM327 com Bluetooth Low Energy (BLE). Custa entre R$30-100 em lojas online. Evite adaptadores muito baratos pois podem ser instáveis."
            icon={Bluetooth}
            variant="default"
          >
            <div className="text-xs text-muted-foreground mt-2 p-2 bg-background rounded">
              <strong>Dica:</strong> Procure por "ELM327 Bluetooth 4.0" ou "ELM327 BLE"
            </div>
          </HelpCard>

          <HelpCard
            title="Onde fica a porta OBD-II?"
            description="A porta OBD-II geralmente fica embaixo do painel, do lado do motorista. Procure uma tomada retangular com 16 pinos, normalmente perto do volante ou na área dos pedais."
            icon={Plug}
            variant="default"
          />

          <HelpCard
            title="Navegadores Compatíveis"
            description="O app funciona em Chrome, Edge e Opera no computador e Android. Infelizmente, Safari, Firefox e iOS (iPhone/iPad) não suportam a tecnologia Bluetooth necessária."
            icon={Chrome}
            variant="warning"
          >
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded">✓ Chrome</span>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded">✓ Edge</span>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded">✓ Opera</span>
              <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded">✗ Safari</span>
              <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded">✗ iOS</span>
            </div>
          </HelpCard>
        </HelpSection>

        {/* Como Conectar */}
        <HelpSection id="como-conectar" title="Como Conectar ao Veículo" icon={Bluetooth}>
          <StepByStep
            steps={[
              {
                title: "Ligue a ignição",
                description: "Gire a chave para a posição 'ligado' (ACC ou ON). Não precisa dar partida no motor, mas ele pode estar ligado se preferir.",
                icon: Key,
              },
              {
                title: "Conecte o adaptador",
                description: "Encaixe o adaptador ELM327 na porta OBD-II do veículo. A luz do adaptador deve acender indicando que está alimentado.",
                icon: Plug,
              },
              {
                title: "Abra o app e clique em 'Conectar'",
                description: "Na tela principal, clique no botão 'Conectar Veículo'. Uma janela do navegador vai aparecer mostrando dispositivos Bluetooth disponíveis.",
                icon: MonitorSmartphone,
              },
              {
                title: "Selecione seu adaptador",
                description: "Procure por 'OBD-II' ou 'ELM327' na lista e clique para parear. O app vai inicializar o adaptador automaticamente.",
                icon: Bluetooth,
              },
              {
                title: "Pronto!",
                description: "Quando conectado, você verá os dados do veículo aparecendo em tempo real no painel. O Jarvis vai te dar as boas-vindas!",
                icon: CheckCircle,
              },
            ]}
          />

          <HelpCard
            title="Problemas de Conexão?"
            description="Se não conseguir conectar: 1) Verifique se o Bluetooth está ligado no dispositivo. 2) Tente desconectar e reconectar o adaptador. 3) Reinicie o navegador. 4) Alguns adaptadores podem não ser compatíveis."
            icon={XCircle}
            variant="danger"
          />
        </HelpSection>

        {/* Entendendo o Painel */}
        <HelpSection id="painel" title="Entendendo o Painel (Dashboard)" icon={Gauge}>
          <p className="text-sm text-muted-foreground mb-4">
            O painel mostra informações em tempo real do seu veículo. Cada medidor tem cores
            que indicam se está tudo bem (verde), atenção (amarelo) ou problema (vermelho).
          </p>

          <div className="grid gap-3">
            <HelpCard
              title="RPM (Rotações por Minuto)"
              description="Mostra quantas vezes o motor 'gira' por minuto. É como o coração do carro. Em marcha lenta, deve ficar entre 700-900 RPM."
              icon={Gauge}
              variant="default"
            >
              <div className="text-xs space-y-1 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span>0 - 3.000 RPM: Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>3.000 - 5.000 RPM: Alto</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Acima de 5.000 RPM: Cuidado!</span>
                </div>
              </div>
            </HelpCard>

            <HelpCard
              title="Velocidade"
              description="Velocidade atual do veículo em km/h. Útil para verificar se o velocímetro do carro está calibrado corretamente."
              icon={Activity}
              variant="default"
            />

            <HelpCard
              title="Temperatura do Motor"
              description="Temperatura do líquido de arrefecimento. O motor precisa aquecer antes de acelerar forte. Temperatura normal: 85-100°C."
              icon={Thermometer}
              variant="default"
            >
              <div className="text-xs space-y-1 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Abaixo de 60°C: Motor frio</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span>60 - 100°C: Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Acima de 100°C: Superaquecimento!</span>
                </div>
              </div>
            </HelpCard>

            <HelpCard
              title="Voltagem da Bateria"
              description="Mede a 'força' da bateria e do alternador. Com o motor ligado, deve ficar entre 13.5V e 14.5V. É como medir a pressão arterial do sistema elétrico."
              icon={Battery}
              variant="default"
            >
              <div className="text-xs space-y-1 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Abaixo de 12.5V: Bateria fraca</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span>12.5 - 14.5V: Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Acima de 14.8V: Alternador alto</span>
                </div>
              </div>
            </HelpCard>

            <HelpCard
              title="Nível de Combustível"
              description="Porcentagem de combustível no tanque. Nem todos os veículos disponibilizam essa informação via OBD-II."
              icon={Fuel}
              variant="default"
            />

            <HelpCard
              title="Carga do Motor"
              description="Mostra quanto 'esforço' o motor está fazendo em porcentagem. Subindo uma ladeira ou acelerando forte, a carga aumenta."
              icon={Zap}
              variant="default"
            />
          </div>
        </HelpSection>

        {/* Scanner de Erros */}
        <HelpSection id="scanner-erros" title="Scanner de Erros (Diagnóstico)" icon={AlertTriangle}>
          <HelpCard
            title="O que são códigos de erro (DTC)?"
            description="DTC (Diagnostic Trouble Codes) são 'recados' que o carro deixa quando detecta um problema. Cada código começa com uma letra e tem 4 números, como P0300."
            icon={AlertTriangle}
            variant="info"
          />

          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Tipos de Códigos:</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-red-500">P0XXX</span>
                <span className="text-muted-foreground">Powertrain - Problemas no motor e transmissão</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-500">C0XXX</span>
                <span className="text-muted-foreground">Chassis - Problemas no chassi (ABS, suspensão)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-yellow-500">B0XXX</span>
                <span className="text-muted-foreground">Body - Problemas na carroceria (airbag, travas)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-purple-500">U0XXX</span>
                <span className="text-muted-foreground">Network - Problemas de comunicação entre módulos</span>
              </div>
            </div>
          </div>

          <StepByStep
            steps={[
              {
                title: "Acesse a aba 'Mecânico'",
                description: "No app, clique na aba 'Mecânico' para acessar as ferramentas de diagnóstico.",
                icon: Wrench,
              },
              {
                title: "Clique em 'Iniciar Scan'",
                description: "O scanner vai verificar todos os módulos do veículo procurando por códigos de erro.",
                icon: Search,
              },
              {
                title: "Veja os resultados",
                description: "Se houver erros, eles aparecerão na lista com descrição e possíveis causas. Códigos vermelhos são mais graves.",
                icon: AlertTriangle,
              },
            ]}
          />

          <HelpCard
            title="Limitações do OBD-II"
            description="O padrão OBD-II só lê códigos do motor (ECM). Erros de airbag, ABS, direção elétrica e outros sistemas precisam de scanner profissional com protocolos específicos da marca."
            icon={Info}
            variant="warning"
          />

          <HelpCard
            title="Limpar Códigos de Erro"
            description="Você pode limpar os códigos de erro após resolver o problema. Isso apaga a luz de 'check engine'. ATENÇÃO: Não limpe códigos sem resolver o problema, pois ele vai voltar!"
            icon={Trash2}
            variant="danger"
          />

          <HelpCard
            title="Quando procurar um mecânico?"
            description="Procure um mecânico se: o código indicar problema grave, a luz de motor voltar após limpar, você não souber o que o código significa, ou se notar comportamento anormal no veículo."
            icon={Wrench}
            variant="info"
          />
        </HelpSection>

        {/* Monitor de Dados ao Vivo */}
        <HelpSection id="dados-vivo" title="Monitor de Dados ao Vivo" icon={Activity}>
          <HelpCard
            title="Para que serve?"
            description="O monitor de dados ao vivo mostra informações detalhadas dos sensores em tempo real, com gráficos. É útil para diagnósticos avançados e identificar problemas intermitentes."
            icon={Activity}
            variant="info"
          />

          <StepByStep
            steps={[
              {
                title: "Acesse a aba 'Dados ao Vivo'",
                description: "No menu principal, clique em 'Dados ao Vivo' para abrir o monitor.",
                icon: Activity,
              },
              {
                title: "Selecione os sensores",
                description: "Escolha quais sensores você quer monitorar. Você pode selecionar vários ao mesmo tempo.",
                icon: CheckCircle,
              },
              {
                title: "Observe os gráficos",
                description: "Os valores aparecem em tempo real com gráficos que mostram o histórico. Útil para ver variações.",
                icon: Activity,
              },
              {
                title: "Grave e exporte (opcional)",
                description: "Você pode gravar os dados e exportar em CSV para análise posterior ou para mostrar ao mecânico.",
                icon: BookOpen,
              },
            ]}
          />

          <HelpCard
            title="Uso Prático"
            description="O monitor é excelente para: verificar se sensores estão funcionando, identificar falhas que só acontecem em certas condições, e acompanhar a saúde do motor ao longo do tempo."
            icon={Wrench}
            variant="success"
          />
        </HelpSection>

        {/* Assistente Jarvis */}
        <HelpSection id="jarvis" title="Assistente Jarvis (IA de Voz)" icon={Bot}>
          <HelpCard
            title="O que o Jarvis pode fazer?"
            description="O Jarvis é seu assistente de voz inteligente. Ele avisa sobre problemas, responde perguntas sobre o veículo e dá dicas de manutenção. Ele também pode analisar os dados em tempo real!"
            icon={Bot}
            variant="info"
          />

          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Exemplos de perguntas:
            </h4>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p>• "Como está o motor?"</p>
              <p>• "A temperatura está normal?"</p>
              <p>• "Posso acelerar agora?"</p>
              <p>• "O que significa o código P0300?"</p>
              <p>• "Quando devo trocar o óleo?"</p>
              <p>• "A bateria está boa?"</p>
            </div>
          </div>

          <HelpCard
            title="Ativar e Desativar"
            description="Use o botão do microfone para falar com o Jarvis. Nas configurações, você pode ativar a 'Escuta Contínua' e definir uma 'Palavra de Ativação' como 'Jarvis'."
            icon={Mic}
            variant="default"
          />

          <HelpCard
            title="Alertas Automáticos"
            description="O Jarvis pode avisar automaticamente sobre: RPM alto com motor frio, superaquecimento, velocidade alta, bateria fraca, e lembretes de manutenção. Configure nas preferências."
            icon={Bell}
            variant="default"
          />

          <HelpCard
            title="Dica: Modo Conversa"
            description="Além de alertas, você pode ter conversas naturais com o Jarvis. Ele analisa os dados do veículo em tempo real para responder suas perguntas de forma precisa."
            icon={MessageSquare}
            variant="success"
          />
        </HelpSection>

        {/* FAQ */}
        <HelpSection id="faq" title="Perguntas Frequentes" icon={HelpCircle}>
          <div className="space-y-1">
            <FAQItem
              id="faq-1"
              question="A luz do motor acendeu, o que faço?"
              answer="Use o Scanner de Erros na aba 'Mecânico' para verificar qual é o problema. O app vai mostrar o código de erro e uma explicação. Se for algo grave ou você não entender, procure um mecânico."
            />
            <FAQItem
              id="faq-2"
              question="Por que aparece 'NO DATA' em alguns sensores?"
              answer="Nem todos os veículos disponibilizam todos os sensores via OBD-II. É normal alguns sensores mostrarem 'NO DATA'. Isso não significa problema, apenas que o carro não envia essa informação."
            />
            <FAQItem
              id="faq-3"
              question="O app funciona com o carro desligado?"
              answer="Parcialmente. Com a chave na ignição (sem dar partida), você pode ler códigos de erro e algumas informações básicas. Para dados em tempo real como RPM e velocidade, o motor precisa estar ligado."
            />
            <FAQItem
              id="faq-4"
              question="Posso usar enquanto dirijo?"
              answer="O app funciona enquanto dirige, mas NÃO RECOMENDAMOS mexer no celular dirigindo. Configure os alertas do Jarvis para avisar verbalmente sobre problemas. Segurança primeiro!"
            />
            <FAQItem
              id="faq-5"
              question="Os dados ficam salvos?"
              answer="Os scans de erro ficam salvos no histórico. Você pode ver diagnósticos anteriores. Os dados ao vivo podem ser gravados e exportados em CSV quando você quiser."
            />
            <FAQItem
              id="faq-6"
              question="Limpar código apaga a luz do painel?"
              answer="Sim, limpar o código de erro apaga a luz de 'check engine'. Porém, se o problema não foi resolvido, o código vai voltar e a luz vai acender novamente."
            />
            <FAQItem
              id="faq-7"
              question="Por que não funciona no meu iPhone?"
              answer="O Safari e iOS não suportam a API Web Bluetooth necessária para conectar ao adaptador OBD-II. Use um dispositivo Android com Chrome ou um computador com Chrome/Edge."
            />
            <FAQItem
              id="faq-8"
              question="O adaptador esquenta muito, é normal?"
              answer="É normal ficar morno, mas não deveria ficar muito quente. Se estiver muito quente, desconecte e verifique se o adaptador é de boa qualidade. Adaptadores baratos podem ter problemas."
            />
          </div>
        </HelpSection>

        {/* Glossário */}
        <HelpSection id="glossario" title="Glossário de Termos" icon={BookOpen}>
          <div className="grid gap-3">
            <GlossaryItem
              term="OBD-II"
              definition="On-Board Diagnostics II - Sistema de diagnóstico padrão presente em todos os carros desde 1996."
              analogy="É como o 'modo de diagnóstico' que médicos usam, mas para carros."
            />
            <GlossaryItem
              term="DTC"
              definition="Diagnostic Trouble Code - Código de erro que indica um problema detectado pelo veículo."
              analogy="São 'recados' que o carro deixa para o mecânico entender o problema."
            />
            <GlossaryItem
              term="ECU / ECM"
              definition="Engine Control Unit / Module - O 'cérebro' do motor que controla injeção, ignição e emissões."
              analogy="É como o computador de bordo que gerencia tudo no motor."
            />
            <GlossaryItem
              term="PID"
              definition="Parameter ID - Identificador de um sensor ou dado específico do veículo."
              analogy="É como um 'endereço' para acessar cada informação do carro."
            />
            <GlossaryItem
              term="VIN"
              definition="Vehicle Identification Number - Número de 17 caracteres único de cada veículo."
              analogy="É como o 'CPF' do carro - identifica marca, modelo, ano e fábrica."
            />
            <GlossaryItem
              term="RPM"
              definition="Rotações Por Minuto - Quantas vezes o motor gira completamente em um minuto."
              analogy="É como a 'pulsação' do motor - em repouso fica baixo, acelerando fica alto."
            />
            <GlossaryItem
              term="ELM327"
              definition="Chip/adaptador que faz a comunicação entre o carro e seu dispositivo via Bluetooth."
              analogy="É o 'tradutor' que converte a linguagem do carro para seu celular entender."
            />
            <GlossaryItem
              term="BLE"
              definition="Bluetooth Low Energy - Versão do Bluetooth que consome menos energia."
              analogy="É um Bluetooth mais econômico, ideal para dispositivos pequenos como adaptadores."
            />
          </div>
        </HelpSection>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border mt-8">
          <p className="text-sm text-muted-foreground">
            Ainda tem dúvidas? Fale com o Jarvis! Ele pode ajudar com perguntas específicas sobre seu veículo.
          </p>
          <Button asChild className="mt-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao App
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
