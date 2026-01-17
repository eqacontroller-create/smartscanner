import { getDTCInfo, getDefaultDTCInfo, type DTCInfo } from '@/lib/dtcDatabase';
import { decryptApiKey } from '@/lib/encryption';

export type AIProvider = 'basic' | 'openai';

interface DTCAnalysisResult {
  explanation: string;
  source: 'local' | 'openai';
  error?: string;
}

// Formata resposta do banco local
function formatLocalDTCResponse(info: DTCInfo): string {
  const severityMap = {
    low: '🟡 Baixa',
    medium: '🟠 Média',
    high: '🔴 Alta',
  };
  
  return `📋 **${info.name}**

🔧 **O que significa:**
${info.description}

⚠️ **Gravidade:** ${severityMap[info.severity]}

💡 **Causas comuns:**
${info.causes.map((c, i) => `${i + 1}. ${c}`).join('\n')}

_Análise baseada em banco de dados local._`;
}

// Analisa DTC usando IA básica (banco local) ou OpenAI
export async function analyzeDTC(
  code: string,
  provider: AIProvider,
  apiKey: string | null,
  vehicleContext?: string
): Promise<DTCAnalysisResult> {
  const info = getDTCInfo(code) || getDefaultDTCInfo(code);
  
  // IA Básica: usa banco de dados local
  if (provider === 'basic' || !apiKey) {
    return {
      explanation: formatLocalDTCResponse(info),
      source: 'local',
    };
  }
  
  // IA Avançada: chama OpenAI GPT-4o-mini
  try {
    const decryptedKey = decryptApiKey(apiKey);
    
    if (!decryptedKey) {
      throw new Error('API key inválida');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${decryptedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um mecânico automotivo especialista com 20 anos de experiência. 
Analise códigos de diagnóstico OBD-II de forma clara e prática para motoristas comuns.
Responda em português brasileiro, de forma amigável e direta.
Inclua: causa provável, gravidade (1-10), se é seguro dirigir, e custo estimado de reparo no Brasil.
Seja conciso mas completo.`,
          },
          {
            role: 'user',
            content: `Analise o código de erro ${code} (${info.name}) no contexto de um ${vehicleContext || 'veículo comum'}. 
            
Descrição técnica: ${info.description}

Forneça:
1. Explicação simples do problema
2. Gravidade de 1 a 10
3. É seguro continuar dirigindo?
4. Causas mais prováveis
5. Custo estimado de reparo (R$)
6. O que fazer agora`,
          },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erro ${response.status}`);
    }
    
    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content;
    
    if (!explanation) {
      throw new Error('Resposta vazia da IA');
    }
    
    return {
      explanation,
      source: 'openai',
    };
  } catch (error) {
    console.error('Erro ao analisar DTC com OpenAI:', error);
    
    // Fallback para banco local em caso de erro
    return {
      explanation: formatLocalDTCResponse(info),
      source: 'local',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
