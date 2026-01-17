import { useState, useCallback, useMemo } from "react";

interface SearchResult {
  id: string;
  title: string;
  type: "section" | "faq" | "glossary";
  preview?: string;
}

interface SearchableItem {
  id: string;
  title: string;
  type: "section" | "faq" | "glossary";
  keywords: string[];
  content: string;
}

// All searchable content from the Help page
const searchableItems: SearchableItem[] = [
  // Sections
  {
    id: "primeiros-passos",
    title: "Primeiros Passos",
    type: "section",
    keywords: ["início", "começar", "adaptador", "elm327", "obd", "porta", "navegador", "chrome"],
    content: "O que é um Scanner OBD-II, qual adaptador comprar, onde fica a porta OBD-II, navegadores compatíveis",
  },
  {
    id: "como-conectar",
    title: "Como Conectar ao Veículo",
    type: "section",
    keywords: ["conectar", "bluetooth", "parear", "ignição", "adaptador", "problemas"],
    content: "Ligue a ignição, conecte o adaptador, clique em conectar, selecione seu adaptador, problemas de conexão",
  },
  {
    id: "painel",
    title: "Entendendo o Painel (Dashboard)",
    type: "section",
    keywords: ["rpm", "velocidade", "temperatura", "bateria", "combustível", "carga", "motor", "dashboard"],
    content: "RPM, velocidade, temperatura do motor, voltagem da bateria, nível de combustível, carga do motor",
  },
  {
    id: "scanner-erros",
    title: "Scanner de Erros (Diagnóstico)",
    type: "section",
    keywords: ["dtc", "código", "erro", "diagnóstico", "check engine", "luz", "scan", "limpar"],
    content: "Códigos DTC, tipos de códigos P C B U, como fazer scan, limpar códigos de erro",
  },
  {
    id: "catalogo-veiculos",
    title: "Catálogo de Veículos",
    type: "section",
    keywords: ["veículo", "carro", "marca", "modelo", "ano", "motor", "câmbio", "catálogo", "buscar"],
    content: "Base de dados premium, busca por marca modelo ou ano, carrossel de marcas, configurar veículo",
  },
  {
    id: "mecanico-visual",
    title: "Mecânico Visual (IA)",
    type: "section",
    keywords: ["foto", "imagem", "câmera", "ia", "diagnóstico", "visual", "análise", "risco"],
    content: "Diagnóstico por foto ou vídeo, até 4 fotos, níveis de risco, funciona offline",
  },
  {
    id: "controle-financeiro",
    title: "Controle Financeiro (Uber/99)",
    type: "section",
    keywords: ["uber", "99", "corrida", "lucro", "custo", "combustível", "motorista", "financeiro", "dinheiro"],
    content: "Detecção automática de corridas, cálculo de custo, valor recebido, lucro real, histórico",
  },
  {
    id: "dados-vivo",
    title: "Monitor de Dados ao Vivo",
    type: "section",
    keywords: ["tempo real", "gráfico", "sensor", "monitorar", "gravar", "exportar", "csv"],
    content: "Monitor de dados ao vivo, selecionar sensores, gráficos em tempo real, gravar e exportar",
  },
  {
    id: "jarvis",
    title: "Assistente Jarvis (IA de Voz)",
    type: "section",
    keywords: ["jarvis", "voz", "falar", "assistente", "ia", "microfone", "alerta", "perguntar"],
    content: "Assistente de voz inteligente, alertas automáticos, perguntas por voz, modo conversa",
  },
  {
    id: "abastecimento",
    title: "Monitor de Abastecimento",
    type: "section",
    keywords: ["combustível", "gasolina", "álcool", "etanol", "posto", "bomba", "fraude", "adulterado", "fuel trim", "stft", "ltft", "forense", "adaptação", "flex", "o2", "sonda", "lambda", "offline"],
    content: "Verificar qualidade do combustível, detectar fraude em bombas, fuel trim, STFT, LTFT, análise forense, adaptação Flex, sensor O2, modo offline",
  },
  {
    id: "faq",
    title: "Perguntas Frequentes",
    type: "section",
    keywords: ["faq", "perguntas", "dúvidas", "respostas"],
    content: "Perguntas frequentes sobre o aplicativo",
  },
  {
    id: "glossario",
    title: "Glossário de Termos",
    type: "section",
    keywords: ["glossário", "termos", "significado", "definição"],
    content: "Definições de termos técnicos automotivos",
  },

  // FAQs
  {
    id: "faq-1",
    title: "A luz do motor acendeu, o que faço?",
    type: "faq",
    keywords: ["luz", "motor", "check engine", "acendeu"],
    content: "Use o Scanner de Erros na aba Mecânico para verificar o problema",
  },
  {
    id: "faq-2",
    title: "Por que aparece 'NO DATA' em alguns sensores?",
    type: "faq",
    keywords: ["no data", "sensor", "dado", "aparece"],
    content: "Nem todos os veículos disponibilizam todos os sensores via OBD-II",
  },
  {
    id: "faq-7",
    title: "Por que não funciona no meu iPhone?",
    type: "faq",
    keywords: ["iphone", "ios", "safari", "apple", "não funciona"],
    content: "Safari e iOS não suportam Web Bluetooth necessário para conectar ao adaptador",
  },
  {
    id: "faq-9",
    title: "Como saber se o combustível é adulterado?",
    type: "faq",
    keywords: ["combustível", "adulterado", "fraude", "gasolina", "qualidade"],
    content: "O Monitor de Abastecimento analisa o Fuel Trim após abastecer",
  },
  {
    id: "faq-14",
    title: "Como funciona a detecção automática de corridas?",
    type: "faq",
    keywords: ["corrida", "uber", "99", "automático", "detectar"],
    content: "Sistema detecta velocidade acima de 10km/h por 5 segundos para início",
  },
  {
    id: "faq-15",
    title: "A análise de foto funciona offline?",
    type: "faq",
    keywords: ["offline", "foto", "internet", "sem conexão"],
    content: "Sim, a foto será analisada quando a conexão retornar",
  },
  {
    id: "faq-16",
    title: "Como seleciono meu veículo no catálogo?",
    type: "faq",
    keywords: ["selecionar", "veículo", "catálogo", "escolher", "carro"],
    content: "Acesse Configurações, Trocar Veículo, busque ou navegue pelo carrossel",
  },
  {
    id: "faq-17",
    title: "O Jarvis consegue resumir minhas corridas?",
    type: "faq",
    keywords: ["jarvis", "corrida", "resumo", "dia", "trabalho"],
    content: "Pergunte Como foi o dia de trabalho para um resumo verbal",
  },
  {
    id: "faq-18",
    title: "O que significa 'ECU Adaptando'?",
    type: "faq",
    keywords: ["ecu", "adaptando", "flex", "etanol", "gasolina", "troca", "aprendendo"],
    content: "Quando troca de combustível em veículo Flex, a ECU precisa aprender nova proporção. STFT alto é normal.",
  },
  {
    id: "faq-19",
    title: "Por que aparece 'Problema Mecânico'?",
    type: "faq",
    keywords: ["mecânico", "problema", "sonda", "o2", "ltft", "travado"],
    content: "Sensor O2 travado ou LTFT não adaptando indica problema mecânico como sonda defeituosa ou vazamento",
  },
  {
    id: "faq-20",
    title: "O que é o gráfico de sensor O2?",
    type: "faq",
    keywords: ["o2", "sensor", "sonda", "lambda", "gráfico", "voltagem", "oscilando"],
    content: "Gráfico mostra voltagem da sonda lambda oscilando em tempo real entre mistura pobre e rica",
  },
  {
    id: "faq-21",
    title: "Os diagnósticos de combustível funcionam offline?",
    type: "faq",
    keywords: ["offline", "internet", "sincronização", "nuvem", "combustível", "diagnóstico"],
    content: "Diagnósticos salvos localmente e sincronizados automaticamente quando reconectar à internet",
  },

  // Glossary
  {
    id: "glossario-obd",
    title: "OBD-II",
    type: "glossary",
    keywords: ["obd", "diagnóstico", "sistema"],
    content: "On-Board Diagnostics II - Sistema de diagnóstico padrão presente em todos os carros desde 1996",
  },
  {
    id: "glossario-dtc",
    title: "DTC",
    type: "glossary",
    keywords: ["dtc", "código", "erro", "trouble"],
    content: "Diagnostic Trouble Code - Código de erro que indica um problema detectado pelo veículo",
  },
  {
    id: "glossario-ecu",
    title: "ECU / ECM",
    type: "glossary",
    keywords: ["ecu", "ecm", "módulo", "cérebro", "motor"],
    content: "Engine Control Unit - O cérebro do motor que controla injeção, ignição e emissões",
  },
  {
    id: "glossario-rpm",
    title: "RPM",
    type: "glossary",
    keywords: ["rpm", "rotação", "motor", "minuto"],
    content: "Rotações Por Minuto - Quantas vezes o motor gira completamente em um minuto",
  },
  {
    id: "glossario-elm327",
    title: "ELM327",
    type: "glossary",
    keywords: ["elm327", "adaptador", "chip", "bluetooth"],
    content: "Chip/adaptador que faz a comunicação entre o carro e seu dispositivo via Bluetooth",
  },
  {
    id: "glossario-stft",
    title: "STFT",
    type: "glossary",
    keywords: ["stft", "fuel trim", "combustível", "correção"],
    content: "Short Term Fuel Trim - Correção imediata da mistura ar/combustível",
  },
  {
    id: "glossario-ltft",
    title: "LTFT",
    type: "glossary",
    keywords: ["ltft", "fuel trim", "combustível", "longo prazo"],
    content: "Long Term Fuel Trim - Correção de longo prazo que o motor memoriza",
  },
  {
    id: "glossario-o2",
    title: "Sensor O2 (Sonda Lambda)",
    type: "glossary",
    keywords: ["o2", "sonda", "lambda", "oxigênio", "escapamento", "sensor"],
    content: "Sensor que mede oxigênio no escapamento para ajustar mistura ar-combustível",
  },
  {
    id: "glossario-flex",
    title: "Veículo Flex",
    type: "glossary",
    keywords: ["flex", "bicombustível", "etanol", "gasolina"],
    content: "Veículo que funciona com gasolina, etanol ou mistura de ambos",
  },
  {
    id: "glossario-forense",
    title: "Análise Forense",
    type: "glossary",
    keywords: ["forense", "análise", "diagnóstico", "combustível", "state machine"],
    content: "Análise inteligente que diferencia troca de combustível Flex de adulteração usando padrões de Fuel Trim",
  },
  {
    id: "glossario-adaptacao",
    title: "Adaptação Flex",
    type: "glossary",
    keywords: ["adaptação", "flex", "ecu", "aprendendo", "troca"],
    content: "Processo onde a ECU aprende nova proporção de combustível após troca entre gasolina e etanol",
  },
];

export function useHelpSearch() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    
    const scored = searchableItems
      .map((item) => {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const contentLower = item.content.toLowerCase();
        const keywordsJoined = item.keywords.join(" ").toLowerCase();

        for (const term of searchTerms) {
          // Exact title match (highest priority)
          if (titleLower === term) score += 100;
          // Title starts with term
          else if (titleLower.startsWith(term)) score += 50;
          // Title contains term
          else if (titleLower.includes(term)) score += 30;
          // Keyword exact match
          if (item.keywords.some(k => k.toLowerCase() === term)) score += 40;
          // Keyword contains term
          else if (keywordsJoined.includes(term)) score += 20;
          // Content contains term
          if (contentLower.includes(term)) score += 10;
        }

        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return scored.map(({ item }): SearchResult => ({
      id: item.id,
      title: item.title,
      type: item.type,
      preview: item.content,
    }));
  }, [query]);

  const handleSearch = useCallback((newQuery: string) => {
    setIsSearching(true);
    setQuery(newQuery);
    // Simulate async search (for future API integration)
    setTimeout(() => setIsSearching(false), 50);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    // For glossary items, scroll to glossario section
    const targetId = id.startsWith("glossario-") ? "glossario" : id.startsWith("faq-") ? "faq" : id;
    
    const element = document.querySelector(`[data-section-id="${targetId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      
      // Open the accordion if it's closed
      const trigger = element.querySelector('[data-state="closed"]');
      if (trigger instanceof HTMLElement) {
        trigger.click();
      }
    }
  }, []);

  return {
    query,
    results,
    isSearching,
    handleSearch,
    scrollToSection,
  };
}
