import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_IMAGES = 4;

// Gera prompt da persona "Amigo Mecânico" com contexto do veículo
function getMechanicSystemPrompt(vehicleContext?: { brand?: string; model?: string; year?: string; engine?: string }, imageCount?: number): string {
  let vehicleInfo = '';
  if (vehicleContext && (vehicleContext.brand || vehicleContext.model)) {
    const parts = [];
    if (vehicleContext.brand) parts.push(vehicleContext.brand);
    if (vehicleContext.model) parts.push(vehicleContext.model);
    if (vehicleContext.year) parts.push(vehicleContext.year);
    if (vehicleContext.engine) parts.push(`motor ${vehicleContext.engine}`);
    vehicleInfo = `\n\nVEÍCULO DO CLIENTE: ${parts.join(' ')}
- Considere as características específicas deste modelo ao diagnosticar
- Use o nome exato das peças compatíveis com este veículo
- Se conhecer problemas comuns deste modelo, mencione se for relevante`;
  }

  let multiImageInfo = '';
  if (imageCount && imageCount > 1) {
    multiImageInfo = `\n\nO cliente enviou ${imageCount} FOTOS do mesmo problema de diferentes ângulos.
INSTRUÇÕES ESPECIAIS para múltiplas imagens:
- Analise TODAS as imagens em conjunto para um diagnóstico mais preciso
- Compare detalhes visíveis em cada foto
- Use informações de diferentes ângulos para confirmar seu diagnóstico
- Se uma foto mostrar algo que outra não mostra, mencione
- Dê um diagnóstico CONSOLIDADO considerando todas as evidências`;
  }

  return `Você é um mecânico experiente, honesto e paciente chamado "Amigo Mecânico".
Seu cliente é uma pessoa LEIGA que não entende nada de carros e precisa de explicações simples.${vehicleInfo}${multiImageInfo}

ANALISE a imagem/vídeo enviada e forneça:

1. IDENTIFICAÇÃO: O que é isso? (nome popular que qualquer pessoa entende)
2. NOME TÉCNICO: Nome técnico da peça para buscar em lojas${vehicleInfo ? ' (específico para o veículo do cliente)' : ''}
3. DIAGNÓSTICO: O que parece errado? (linguagem simples, sem termos técnicos)
4. SEMÁFORO DE SEGURANÇA - escolha UM:
   - safe: Tudo normal, pode dirigir tranquilo
   - attention: Precisa de atenção, procure oficina essa semana
   - danger: PARE o carro! Risco de quebra ou acidente
5. AÇÃO: O que fazer agora? (passos práticos e simples)

REGRAS IMPORTANTES:
- Use analogias do dia-a-dia para explicar (ex: "é como o sangue do carro")
- Nunca use termos técnicos sem explicar o que significam
- Seja gentil e tranquilizador, mas HONESTO sobre os riscos
- Se for uma luz do painel, explique o que ela significa
- Se não conseguir identificar com certeza, seja honesto sobre isso
- Sempre priorize a SEGURANÇA do usuário`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Detecta se é request de múltiplas imagens ou imagem única
    const isMultipleImages = Array.isArray(requestBody.media);
    
    let mediaContents: Array<{ type: 'image_url'; image_url: { url: string } }> = [];
    let imageCount = 0;
    
    if (isMultipleImages) {
      // Request com múltiplas imagens
      const { media, analysisType, userQuestion, vehicleContext } = requestBody;
      
      if (!media || media.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Nenhuma mídia fornecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Valida limite de imagens
      if (media.length > MAX_IMAGES) {
        return new Response(
          JSON.stringify({ success: false, error: `Máximo de ${MAX_IMAGES} imagens permitidas` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      imageCount = media.length;
      
      // Cria array de conteúdos de imagem
      mediaContents = media.map((item: { base64: string; type: string; label?: string }) => ({
        type: 'image_url' as const,
        image_url: {
          url: `data:${item.type};base64,${item.base64}`
        }
      }));
      
    } else {
      // Request com imagem única (compatibilidade)
      const { mediaBase64, mediaType } = requestBody;
      
      if (!mediaBase64 || !mediaType) {
        return new Response(
          JSON.stringify({ success: false, error: 'Mídia não fornecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      imageCount = 1;
      mediaContents = [{
        type: 'image_url',
        image_url: {
          url: `data:${mediaType};base64,${mediaBase64}`
        }
      }];
    }

    const { analysisType, userQuestion, vehicleContext } = requestBody;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Serviço de IA não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar prompt do usuário
    let userPrompt = '';
    if (imageCount > 1) {
      userPrompt = `Analise estas ${imageCount} fotos do problema. Cada foto mostra um ângulo diferente. Dê um diagnóstico consolidado.`;
    } else if (analysisType === 'video') {
      userPrompt = 'Analise este vídeo do motor funcionando. Identifique qualquer barulho estranho ou problema visível.';
    } else {
      userPrompt = 'Analise esta imagem. Identifique o que é e se há algum problema.';
    }
    
    if (userQuestion) {
      userPrompt += `\n\nPergunta adicional do usuário: ${userQuestion}`;
    }

    // Usar tool calling para resposta estruturada
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: getMechanicSystemPrompt(vehicleContext, imageCount) },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              ...mediaContents
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_diagnosis',
              description: 'Fornece o diagnóstico estruturado da análise visual',
              parameters: {
                type: 'object',
                properties: {
                  identification: {
                    type: 'string',
                    description: 'Nome popular da peça/luz identificada'
                  },
                  technicalName: {
                    type: 'string',
                    description: 'Nome técnico da peça para busca em lojas'
                  },
                  diagnosis: {
                    type: 'string',
                    description: 'Diagnóstico em linguagem simples'
                  },
                  riskLevel: {
                    type: 'string',
                    enum: ['safe', 'attention', 'danger'],
                    description: 'Nível de risco: safe, attention, ou danger'
                  },
                  riskMessage: {
                    type: 'string',
                    description: 'Mensagem sobre segurança para dirigir'
                  },
                  action: {
                    type: 'string',
                    description: 'Ação prática recomendada'
                  },
                  confidence: {
                    type: 'number',
                    description: 'Confiança da análise de 0 a 100'
                  }
                },
                required: ['identification', 'technicalName', 'diagnosis', 'riskLevel', 'riskMessage', 'action', 'confidence']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_diagnosis' } }
      }),
    });

    // Handle rate limits
    if (response.status === 429) {
      return new Response(
        JSON.stringify({ success: false, error: 'Muitas solicitações. Aguarde um momento e tente novamente.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 402) {
      return new Response(
        JSON.stringify({ success: false, error: 'Limite de uso atingido. Entre em contato com o suporte.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao processar imagem. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extrair resultado do tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'provide_diagnosis') {
      console.error('Unexpected response format:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ success: false, error: 'Não foi possível analisar a imagem. Tente com outra foto.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Vision mechanic error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
