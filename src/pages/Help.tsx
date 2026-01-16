import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HelpSection } from "@/components/help/HelpSection";
import { HelpCard } from "@/components/help/HelpCard";
import { StepByStep } from "@/components/help/StepByStep";
import { GlossaryItem } from "@/components/help/GlossaryItem";
import { FAQItem } from "@/components/help/FAQItem";
import { BenefitCard } from "@/components/help/BenefitCard";
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
  Droplets,
  Cloud,
  TrendingUp,
  Scale,
  Sparkles,
  PiggyBank,
  Shield,
  Brain,
  Smartphone,
  Users,
  Star,
  Download,
  Eye,
  Images,
  Camera,
  DollarSign,
  Timer,
  RefreshCw,
  History,
  Settings,
  FileText,
} from "lucide-react";

export default function Help() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-area-top">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" asChild className="h-10 w-10 min-h-[44px]">
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Central de Ajuda</h1>
            </div>
          </div>
          
          {/* Download Manual Button */}
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to="/manual">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Baixar Manual</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl space-y-4 safe-area-x">
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

        {/* Benefícios - Seção Comercial */}
        <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent rounded-2xl border border-primary/20 p-5 mb-6">
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
              <Sparkles className="h-4 w-4" />
              Por que usar nosso app?
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Diagnóstico Profissional no seu Bolso
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Tudo que você precisa para cuidar do seu veículo
            </p>
          </div>

          {/* Grid de Benefícios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-5">
            <BenefitCard 
              icon={PiggyBank} 
              title="Economize Dinheiro" 
              description="Evite oficinas desnecessárias. Saiba exatamente o problema antes de gastar."
              highlight
            />
            <BenefitCard 
              icon={Shield} 
              title="Previna Quebras" 
              description="Monitore em tempo real e detecte falhas antes que se tornem graves."
            />
            <BenefitCard 
              icon={Brain} 
              title="IA Inteligente" 
              description="Jarvis explica erros, dá dicas e responde suas dúvidas por voz."
              highlight
            />
            <BenefitCard 
              icon={Smartphone} 
              title="Super Prático" 
              description="Diagnóstico completo só com celular. Sem ferramentas caras."
            />
            <BenefitCard 
              icon={Droplets} 
              title="Detecte Fraudes" 
              description="Analise qualidade do combustível e precisão das bombas de postos."
            />
            <BenefitCard 
              icon={Cloud} 
              title="Sincronização" 
              description="Seus dados seguros na nuvem. Acesse de qualquer dispositivo."
            />
          </div>

          {/* Funcionalidades Exclusivas */}
          <div className="bg-background/60 backdrop-blur rounded-xl p-4 border border-border mb-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              Funcionalidades Exclusivas
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Assistente de voz Jarvis com IA</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Scanner de 8 módulos (ABS, Airbag...)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Monitor de qualidade de combustível</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Verificador de fraude em bombas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Mecânico Visual com IA (fotos)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Controle financeiro para motoristas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Catálogo de veículos premium</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Histórico sincronizado na nuvem</span>
              </li>
            </ul>
          </div>

          {/* Para quem é ideal */}
          <div className="bg-background/40 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Para quem é ideal:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Motoristas de app (Uber, 99)</span>
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Entusiastas</span>
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Frotas</span>
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Taxistas</span>
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Quem quer economizar</span>
            </div>
          </div>
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
            <div className="flex flex-wrap gap-1.5 xs:gap-2 mt-2">
              <span className="text-[10px] xs:text-xs px-1.5 xs:px-2 py-1 bg-green-500/20 text-green-500 rounded">✓ Chrome</span>
              <span className="text-[10px] xs:text-xs px-1.5 xs:px-2 py-1 bg-green-500/20 text-green-500 rounded">✓ Edge</span>
              <span className="text-[10px] xs:text-xs px-1.5 xs:px-2 py-1 bg-green-500/20 text-green-500 rounded">✓ Opera</span>
              <span className="text-[10px] xs:text-xs px-1.5 xs:px-2 py-1 bg-red-500/20 text-red-500 rounded">✗ Safari</span>
              <span className="text-[10px] xs:text-xs px-1.5 xs:px-2 py-1 bg-red-500/20 text-red-500 rounded">✗ iOS</span>
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

        {/* Catálogo de Veículos - NOVA SEÇÃO */}
        <HelpSection id="catalogo-veiculos" title="Catálogo de Veículos" icon={Car}>
          <HelpCard
            title="Base de Dados Premium"
            description="O catálogo contém centenas de modelos de veículos brasileiros com informações detalhadas de motor, câmbio e especificações técnicas. Use a busca inteligente ou navegue pelo carrossel de marcas."
            icon={Search}
            variant="info"
          />

          <StepByStep
            steps={[
              {
                title: "Acesse Configurações",
                description: "Clique na aba 'Configurações' e depois no botão 'Trocar Veículo' para abrir o catálogo.",
                icon: Settings,
              },
              {
                title: "Busque ou navegue",
                description: "Use a barra de busca para encontrar por nome, ou clique em uma marca no carrossel de logos.",
                icon: Search,
              },
              {
                title: "Selecione o modelo",
                description: "Escolha seu modelo na grade de veículos. Cada card mostra marca, modelo e anos disponíveis.",
                icon: Car,
              },
              {
                title: "Configure os detalhes",
                description: "Defina o ano do modelo, motorização, tipo de câmbio e dê um apelido para identificar seu veículo.",
                icon: Wrench,
              },
            ]}
          />

          <HelpCard
            title="Filtros por Ano"
            description="Use os chips de filtro para ver apenas veículos de uma faixa de anos específica. Útil para encontrar modelos mais novos ou clássicos."
            icon={History}
            variant="default"
          />

          <HelpCard
            title="Carrossel de Marcas"
            description="Na parte superior do catálogo, você encontra os logos das principais montadoras. Clique em uma marca para filtrar automaticamente os modelos dela."
            icon={Car}
            variant="default"
          />
        </HelpSection>

        {/* Mecânico Visual - NOVA SEÇÃO */}
        <HelpSection id="mecanico-visual" title="Mecânico Visual (IA)" icon={Eye}>
          <HelpCard
            title="Diagnóstico por Foto ou Vídeo"
            description="Tire uma foto de qualquer problema no veículo (luz no painel, vazamento, peça estranha) e a Inteligência Artificial analisa e explica o que pode estar errado."
            icon={Camera}
            variant="info"
          />

          <HelpCard
            title="Até 4 Fotos para Maior Precisão"
            description="Fotografe de ângulos diferentes para um diagnóstico mais preciso. Mais fotos significam mais contexto para a IA analisar o problema."
            icon={Images}
            variant="success"
          />

          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Níveis de Risco:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-foreground font-medium">Seguro</span>
                <span className="text-muted-foreground">- Pode continuar dirigindo normalmente</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-foreground font-medium">Atenção</span>
                <span className="text-muted-foreground">- Agende manutenção em breve</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-foreground font-medium">Perigo</span>
                <span className="text-muted-foreground">- Não dirija, procure um mecânico</span>
              </div>
            </div>
          </div>

          <StepByStep
            steps={[
              {
                title: "Acesse a aba 'Mecânico'",
                description: "Na aba Mecânico, role até encontrar a seção 'Mecânico Visual' ou clique no ícone de câmera.",
                icon: Wrench,
              },
              {
                title: "Tire a foto",
                description: "Use a câmera do dispositivo ou selecione uma imagem da galeria. Você pode adicionar até 4 fotos.",
                icon: Camera,
              },
              {
                title: "Aguarde a análise",
                description: "A IA vai processar as imagens e identificar possíveis problemas. Pode levar alguns segundos.",
                icon: Brain,
              },
              {
                title: "Veja o diagnóstico",
                description: "O resultado mostra: título do problema, descrição, nível de risco, recomendações e peças possivelmente envolvidas.",
                icon: CheckCircle,
              },
            ]}
          />

          <HelpCard
            title="Funciona Offline"
            description="Você pode tirar a foto sem internet! A análise será feita automaticamente quando a conexão retornar. O histórico de diagnósticos também é salvo localmente."
            icon={Cloud}
            variant="default"
          />

          <HelpCard
            title="Dicas para Boas Fotos"
            description="Para melhores resultados: use boa iluminação, mantenha a câmera estável, inclua contexto ao redor do problema e evite fotos muito distantes ou borradas."
            icon={Camera}
            variant="info"
          />
        </HelpSection>

        {/* Controle Financeiro - NOVA SEÇÃO */}
        <HelpSection id="controle-financeiro" title="Controle Financeiro (Uber/99)" icon={PiggyBank}>
          <HelpCard
            title="Feito para Motoristas de App"
            description="Detecta automaticamente quando você inicia e finaliza uma corrida, calculando o custo de combustível em tempo real e mostrando o lucro real de cada viagem."
            icon={DollarSign}
            variant="info"
          />

          <StepByStep
            steps={[
              {
                title: "Configure seus custos",
                description: "Vá em Configurações e informe: preço do combustível (R$/L), consumo médio do veículo (km/L) e custo adicional por km (manutenção, depreciação).",
                icon: Settings,
              },
              {
                title: "Ative a detecção automática",
                description: "O sistema detecta início de corrida (velocidade > 10km/h por 5 segundos) e fim (parado por 30 segundos). Você pode ajustar esses valores.",
                icon: Timer,
              },
              {
                title: "Informe o valor recebido",
                description: "Ao finalizar a corrida, uma tela aparece pedindo quanto você recebeu do passageiro. Digite o valor do aplicativo.",
                icon: DollarSign,
              },
              {
                title: "Veja seu lucro real",
                description: "O app calcula: Lucro = Valor Recebido - Custo de Combustível - Custos Adicionais. Veja exatamente quanto sobrou no bolso.",
                icon: TrendingUp,
              },
            ]}
          />

          <HelpCard
            title="Histórico do Dia (Fechamento de Caixa)"
            description="No final do dia, veja um resumo completo: total de corridas, quilômetros rodados, custo total e lucro líquido. Ótimo para controle financeiro."
            icon={History}
            variant="success"
          />

          <HelpCard
            title="Recuperação de Corridas"
            description="Se o app fechar durante uma corrida (bateria, travamento), ao reabrir você pode recuperar os dados da corrida em andamento e continuar de onde parou."
            icon={RefreshCw}
            variant="default"
          />

          <HelpCard
            title="Relatório por Voz (Jarvis)"
            description="Pergunte ao Jarvis: 'Como foi o dia de trabalho?' e ele resume verbalmente suas corridas, ganhos e custos do dia."
            icon={Bot}
            variant="default"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <p>• "Como está o motor?"</p>
              <p>• "A temperatura está normal?"</p>
              <p>• "Posso acelerar agora?"</p>
              <p>• "O que significa o código P0300?"</p>
              <p>• "Quando devo trocar o óleo?"</p>
              <p>• "A bateria está boa?"</p>
              <p>• "Como foi o dia de trabalho?"</p>
              <p>• "Qual o lucro das corridas hoje?"</p>
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
            description="O Jarvis avisa automaticamente sobre: RPM alto com motor frio, superaquecimento, velocidade alta, bateria fraca, lembretes de manutenção e resultados de abastecimento."
            icon={Bell}
            variant="default"
          />

          <HelpCard
            title="Integração com Diagnóstico Visual"
            description="Após uma análise de foto pelo Mecânico Visual, você pode perguntar ao Jarvis detalhes sobre o problema detectado ou pedir recomendações adicionais."
            icon={Eye}
            variant="success"
          />

          <HelpCard
            title="Dica: Modo Conversa"
            description="Além de alertas, você pode ter conversas naturais com o Jarvis. Ele analisa os dados do veículo em tempo real para responder suas perguntas de forma precisa."
            icon={MessageSquare}
            variant="success"
          />
        </HelpSection>

        {/* Monitor de Abastecimento */}
        <HelpSection id="abastecimento" title="Monitor de Abastecimento" icon={Droplets}>
          <HelpCard
            title="O que é o Monitor de Abastecimento?"
            description="Uma ferramenta inteligente que analisa a qualidade do combustível após abastecer, detectando possível adulteração e verificando a precisão da bomba do posto."
            icon={Droplets}
            variant="info"
          />

          <StepByStep
            steps={[
              {
                title: "Abasteça o veículo",
                description: "Vá ao posto e abasteça normalmente. Anote (ou lembre) o preço por litro e a quantidade de litros.",
                icon: Fuel,
              },
              {
                title: "Clique em 'Abastecer'",
                description: "Com o OBD conectado, um botão verde 'Abastecer' aparece no canto inferior da tela. Clique nele.",
                icon: Droplets,
              },
              {
                title: "Preencha os dados",
                description: "Informe o preço por litro e a quantidade de litros. O app calcula o total automaticamente.",
                icon: Scale,
              },
              {
                title: "Inicie o monitoramento",
                description: "Clique em 'Iniciar Monitoramento'. O Jarvis vai confirmar que os dados foram registrados e a análise iniciará.",
                icon: Activity,
              },
              {
                title: "Dirija normalmente",
                description: "Dirija por 5 km (configurável). O sistema monitora os sensores Fuel Trim em tempo real durante o trajeto.",
                icon: Car,
              },
              {
                title: "Veja o resultado",
                description: "Após a distância, o sistema mostra a qualidade do combustível (verde/amarelo/vermelho) e a precisão da bomba.",
                icon: CheckCircle,
              },
            ]}
          />

          <HelpCard
            title="O que é Fuel Trim (STFT/LTFT)?"
            description="Fuel Trim é a correção que o motor faz na mistura ar/combustível. STFT é a correção imediata, LTFT é a de longo prazo. Se o combustível é ruim, o motor precisa corrigir mais."
            icon={TrendingUp}
            variant="default"
          >
            <div className="text-xs space-y-1 mt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span>-10% a +10%: Combustível normal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>±10% a ±15%: Atenção, qualidade suspeita</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span>Fora de ±15%: Combustível adulterado</span>
              </div>
            </div>
          </HelpCard>

          <HelpCard
            title="Verificação de Precisão da Bomba"
            description="O sistema compara os litros que você disse ter abastecido com a variação real no sensor de combustível do veículo. Assim detectamos se a bomba entregou menos que o marcado."
            icon={Scale}
            variant="default"
          >
            <div className="text-xs mt-2 p-2 bg-background rounded border border-border">
              <strong>⚠️ Limitação:</strong> Funciona apenas em veículos que disponibilizam 
              leitura do nível de combustível via OBD-II (PID 012F). 
              Nem todos os carros suportam essa leitura.
            </div>
          </HelpCard>

          <HelpCard
            title="Sincronização na Nuvem"
            description="Se você estiver logado, o histórico de abastecimentos é salvo automaticamente na nuvem. Você pode acessar de qualquer dispositivo e acompanhar a qualidade do combustível ao longo do tempo."
            icon={Cloud}
            variant="success"
          >
            <div className="text-xs mt-2 text-muted-foreground">
              O ícone de nuvem no botão "Abastecer" indica que a sincronização está ativa.
            </div>
          </HelpCard>

          <HelpCard
            title="Alertas do Jarvis"
            description="Durante e após o monitoramento, o Jarvis anuncia: início da análise, detecção de anomalias, resultado da qualidade do combustível, precisão da bomba e status de salvamento na nuvem."
            icon={Bot}
            variant="default"
          />

          <HelpCard
            title="Limitações do Sistema"
            description="O monitor de qualidade (Fuel Trim) funciona em praticamente todos os veículos. Já a verificação da bomba depende do suporte ao sensor de nível de combustível, que varia por modelo."
            icon={Info}
            variant="warning"
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
            <FAQItem
              id="faq-9"
              question="Como saber se o combustível é adulterado?"
              answer="O Monitor de Abastecimento analisa o Fuel Trim (STFT) após você abastecer. Se o STFT médio ficar acima de ±15% durante os primeiros quilômetros, há indícios de adulteração. O resultado aparece em verde (ok), amarelo (atenção) ou vermelho (crítico)."
            />
            <FAQItem
              id="faq-10"
              question="Por que não aparece a verificação da bomba?"
              answer="A verificação de precisão da bomba só funciona se seu veículo enviar o nível de combustível via OBD-II (PID 012F). Muitos carros não suportam essa leitura. O monitor de qualidade (Fuel Trim) funciona em todos os veículos."
            />
            <FAQItem
              id="faq-11"
              question="Preciso estar logado para usar o monitor de abastecimento?"
              answer="Não, você pode usar sem login. Porém, se estiver logado, o histórico de abastecimentos é salvo na nuvem para consulta futura em qualquer dispositivo."
            />
            <FAQItem
              id="faq-12"
              question="O que significa a % de precisão da bomba?"
              answer="É a comparação entre os litros que você disse ter abastecido e o que o sensor do carro detectou. 100% significa que bateu exato. Abaixo de 85% indica possível fraude na bomba - considere denunciar ao INMETRO."
            />
            <FAQItem
              id="faq-13"
              question="Quanto tempo leva a análise do combustível?"
              answer="O padrão é monitorar por 5 km. Você pode ajustar essa distância nas configurações de abastecimento. Quanto mais distância, mais precisa é a análise."
            />
            <FAQItem
              id="faq-14"
              question="Como funciona a detecção automática de corridas?"
              answer="O sistema detecta quando você está acima de 10 km/h por 5 segundos (início da corrida) e quando fica parado por 30 segundos (fim). Você pode ajustar esses valores nas configurações da aba Financeiro."
            />
            <FAQItem
              id="faq-15"
              question="A análise de foto funciona offline?"
              answer="Sim! Você pode tirar a foto sem internet e ela será analisada automaticamente quando a conexão retornar. O histórico de diagnósticos visuais também é salvo localmente no dispositivo."
            />
            <FAQItem
              id="faq-16"
              question="Como seleciono meu veículo no catálogo?"
              answer="Acesse Configurações → Trocar Veículo. Use a busca por nome ou navegue pelo carrossel de marcas. Selecione seu modelo, configure ano, motor e câmbio, dê um apelido e salve."
            />
            <FAQItem
              id="faq-17"
              question="O Jarvis consegue resumir minhas corridas?"
              answer="Sim! Pergunte 'Como foi o dia de trabalho?' ou 'Qual o lucro das corridas hoje?' e o Jarvis resume verbalmente: total de corridas, quilômetros, custos e lucro líquido."
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
            <GlossaryItem
              term="STFT"
              definition="Short Term Fuel Trim - Correção imediata da mistura ar/combustível feita pelo motor em tempo real."
              analogy="É como ajustar o tempero de uma comida enquanto você está cozinhando."
            />
            <GlossaryItem
              term="LTFT"
              definition="Long Term Fuel Trim - Correção de longo prazo que o motor memoriza baseado no histórico."
              analogy="É como seu paladar se adaptar a um tempero ao longo do tempo."
            />
            <GlossaryItem
              term="Fuel Trim"
              definition="Ajuste que o motor faz na quantidade de combustível injetado para manter a mistura ideal."
              analogy="É o motor 'compensando' quando o combustível é diferente do ideal esperado."
            />
            <GlossaryItem
              term="Mecânico Visual"
              definition="Ferramenta de IA que analisa fotos e vídeos do seu veículo para identificar possíveis problemas."
              analogy="É como ter um mecânico experiente olhando sua foto e dizendo o que pode estar errado."
            />
            <GlossaryItem
              term="Detecção Automática"
              definition="Sistema que identifica início e fim de corridas baseado em velocidade e tempo parado."
              analogy="É como um cronômetro inteligente que sabe quando você começou e terminou uma viagem."
            />
            <GlossaryItem
              term="Lucro Líquido"
              definition="O valor que realmente sobra no bolso após descontar todos os custos (combustível, manutenção, etc)."
              analogy="É a diferença entre o que você recebeu e o que gastou para fazer a corrida."
            />
          </div>
        </HelpSection>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border mt-8">
          <p className="text-sm text-muted-foreground mb-4">
            Ainda tem dúvidas? Fale com o Jarvis! Ele pode ajudar com perguntas específicas sobre seu veículo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/manual">
                <FileText className="mr-2 h-4 w-4" />
                Baixar Manual (PDF)
              </Link>
            </Button>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao App
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
