import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DTCEstimateRequest {
  dtcCode: string;
  dtcName: string;
  dtcDescription?: string;
  vehicleContext?: string;
}

interface DTCEstimateResponse {
  simpleExplanation: string;
  estimatedParts: string[];
  estimatedLabor: string;
  estimatedCostRange: {
    min: number;
    max: number;
  };
  riskLevel: 'critical' | 'moderate' | 'low';
  canDrive: boolean;
  actionMessage: string;
  disclaimer: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dtcCode, dtcName, dtcDescription, vehicleContext } = await req.json() as DTCEstimateRequest;

    if (!dtcCode) {
      return new Response(
        JSON.stringify({ error: "dtcCode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify(getFallbackEstimate(dtcCode, dtcName)),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um consultor automotivo brasileiro experiente que explica problemas de carro para pessoas leigas.
Seu objetivo é ajudar motoristas a entenderem o problema e terem uma noção de custo antes de ir ao mecânico.

REGRAS:
- Sempre responda em português brasileiro
- Use linguagem simples, como se explicasse para uma criança de 10 anos
- Custos devem ser baseados no mercado brasileiro de 2024
- Seja realista nos orçamentos (não subestime nem superestime)
- Considere peças populares/genéricas para o custo mínimo e originais para o máximo`;

    const userPrompt = `Analise o código DTC: ${dtcCode}
Nome técnico: ${dtcName}
${dtcDescription ? `Descrição: ${dtcDescription}` : ''}
${vehicleContext ? `Veículo: ${vehicleContext}` : ''}

Responda SOMENTE com um JSON válido no seguinte formato:
{
  "simpleExplanation": "Uma frase de até 15 palavras explicando o problema como se fosse para uma criança de 10 anos",
  "estimatedParts": ["Lista de peças com nomes populares que provavelmente precisam ser trocadas"],
  "estimatedLabor": "Tempo estimado de mão de obra (ex: '1-2 horas')",
  "estimatedCostRange": {
    "min": número em reais (peças genéricas + mão de obra),
    "max": número em reais (peças originais + mão de obra)
  },
  "riskLevel": "critical" se for perigoso dirigir, "moderate" se precisar ir logo ao mecânico, "low" se pode esperar,
  "canDrive": true se é seguro continuar dirigindo até a oficina, false se deve parar imediatamente,
  "actionMessage": "Mensagem curta e clara de ação para o motorista"
}`;

    console.log(`Requesting estimate for DTC: ${dtcCode}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Fallback to local estimate
      return new Response(
        JSON.stringify(getFallbackEstimate(dtcCode, dtcName)),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI Response:", content);

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not parse JSON from response");
      return new Response(
        JSON.stringify(getFallbackEstimate(dtcCode, dtcName)),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const estimate = JSON.parse(jsonMatch[0]) as Omit<DTCEstimateResponse, 'disclaimer'>;
    
    const result: DTCEstimateResponse = {
      ...estimate,
      disclaimer: "⚠️ Estimativa baseada em média de mercado brasileiro. Consulte sua oficina de confiança para orçamento real. Valores podem variar conforme região e modelo do veículo.",
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in dtc-estimate:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fallback estimates based on DTC prefix
function getFallbackEstimate(dtcCode: string, dtcName: string): DTCEstimateResponse {
  const prefix = dtcCode.charAt(0).toUpperCase();
  const number = parseInt(dtcCode.substring(1, 3)) || 0;
  
  // Determine risk based on DTC patterns
  let riskLevel: 'critical' | 'moderate' | 'low' = 'moderate';
  let canDrive = true;
  let actionMessage = "Vá à oficina em breve para diagnóstico";
  
  // Critical patterns
  if (prefix === 'P' && (number === 0 || number === 1 || number === 2)) {
    // P0xxx, P1xxx, P2xxx - Engine/Transmission
    if (dtcCode.includes('300') || dtcCode.includes('301') || dtcCode.includes('302')) {
      riskLevel = 'critical';
      canDrive = false;
      actionMessage = "⛔ Pare o carro! Problemas de ignição podem danificar o catalisador";
    } else if (dtcCode.includes('171') || dtcCode.includes('172') || dtcCode.includes('174') || dtcCode.includes('175')) {
      riskLevel = 'moderate';
      actionMessage = "⚠️ Vá à oficina. Mistura ar/combustível fora do normal";
    }
  } else if (prefix === 'C') {
    // Chassis - ABS/Freios
    riskLevel = 'critical';
    canDrive = false;
    actionMessage = "⛔ Pare o carro! Problemas no sistema de freios";
  } else if (prefix === 'B') {
    // Body - Usually less critical
    riskLevel = 'low';
    actionMessage = "✅ Pode agendar revisão quando conveniente";
  }

  // Default parts and costs based on prefix
  const partsMap: Record<string, { parts: string[]; labor: string; min: number; max: number }> = {
    'P': { parts: ['Sensor de oxigênio', 'Velas de ignição'], labor: '1-2 horas', min: 200, max: 600 },
    'C': { parts: ['Sensor ABS', 'Módulo de controle'], labor: '2-3 horas', min: 400, max: 1200 },
    'B': { parts: ['Sensor', 'Módulo eletrônico'], labor: '1 hora', min: 150, max: 400 },
    'U': { parts: ['Módulo de comunicação', 'Chicote elétrico'], labor: '1-2 horas', min: 300, max: 800 },
  };

  const config = partsMap[prefix] || partsMap['P'];

  return {
    simpleExplanation: `O carro detectou um problema relacionado a "${dtcName.toLowerCase()}"`,
    estimatedParts: config.parts,
    estimatedLabor: config.labor,
    estimatedCostRange: { min: config.min, max: config.max },
    riskLevel,
    canDrive,
    actionMessage,
    disclaimer: "⚠️ Estimativa básica. Para orçamento preciso, consulte sua oficina de confiança.",
  };
}
