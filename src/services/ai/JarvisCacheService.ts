// Jarvis Cache Service
// Cache inteligente para perguntas frequentes, evitando chamadas desnecessárias à IA

import { VehicleContext } from './JarvisService';

// Tipos de intenção detectáveis
type IntentType = 
  | 'motor_status'
  | 'battery_status'
  | 'temperature_status'
  | 'fuel_status'
  | 'speed_status'
  | 'general_status'
  | 'trip_info'
  | 'connection_status'
  | 'greeting'
  | 'thanks'
  | 'unknown';

interface CachedResponse {
  intent: IntentType;
  patterns: RegExp[];
  generateResponse: (ctx: VehicleContext, tripData?: TripData) => string | null;
}

interface TripData {
  distance: number;
  cost: number;
  duration: number;
  averageSpeed: number;
  costPerKm: number;
}

// Padrões de perguntas frequentes e suas respostas dinâmicas
const CACHED_RESPONSES: CachedResponse[] = [
  // Motor Status
  {
    intent: 'motor_status',
    patterns: [
      /como\s+(est[áa]|anda|vai)\s*(o\s*)?(motor|carro|ve[ií]culo)/i,
      /status\s*(do\s*)?(motor|ve[ií]culo)/i,
      /situa[çc][ãa]o\s*(do\s*)?(motor|carro)/i,
      /motor\s+(est[áa]|anda)\s+(bem|ok|bom)/i,
      /tudo\s+(bem|ok|certo)\s+com\s+(o\s*)?(motor|carro)/i,
    ],
    generateResponse: (ctx) => {
      if (!ctx.isConnected) {
        return 'Chefe, não estou conectado ao veículo. Conecte o scanner para eu poder verificar.';
      }
      if (!ctx.isPolling) {
        return 'Estou conectado, mas não recebendo dados ainda. Aguarde o monitoramento iniciar.';
      }
      
      const issues: string[] = [];
      const good: string[] = [];
      
      // Temperatura
      if (ctx.temperature !== null) {
        if (ctx.temperature > 100) {
          issues.push(`temperatura alta em ${ctx.temperature}°C`);
        } else if (ctx.temperature < 60) {
          good.push('motor ainda aquecendo');
        } else {
          good.push('temperatura normal');
        }
      }
      
      // RPM
      if (ctx.rpm !== null) {
        if (ctx.rpm > 4000) {
          issues.push(`rotação elevada em ${ctx.rpm} RPM`);
        } else {
          good.push(`${ctx.rpm} RPM`);
        }
      }
      
      // Carga
      if (ctx.engineLoad !== null) {
        if (ctx.engineLoad > 80) {
          issues.push(`carga alta em ${ctx.engineLoad}%`);
        }
      }
      
      if (issues.length > 0) {
        return `Atenção chefe! ${issues.join(', ')}. Recomendo diminuir a exigência.`;
      }
      
      const statusParts = good.filter(Boolean);
      return `Motor tranquilo, chefe! ${statusParts.join(', ')}.`;
    },
  },
  
  // Battery Status
  {
    intent: 'battery_status',
    patterns: [
      /como\s+(est[áa]|anda)\s*(a\s*)?(bateria|voltagem)/i,
      /status\s*(da\s*)?(bateria|voltagem)/i,
      /bateria\s+(est[áa]|anda)\s+(boa|bem|ok)/i,
      /voltagem\s+(est[áa]|anda)\s+(boa|bem|ok|normal)/i,
      /tens[ãa]o\s*(da\s*)?bateria/i,
    ],
    generateResponse: (ctx) => {
      if (!ctx.isConnected) {
        return 'Preciso estar conectado para verificar a bateria, chefe.';
      }
      if (ctx.voltage === null) {
        return 'Não estou recebendo dados de voltagem no momento.';
      }
      
      if (ctx.voltage >= 14.0 && ctx.voltage <= 14.8) {
        return `Bateria excelente, chefe! ${ctx.voltage.toFixed(1)}V com alternador carregando perfeitamente.`;
      } else if (ctx.voltage >= 13.5) {
        return `Bateria boa em ${ctx.voltage.toFixed(1)}V. Sistema elétrico funcionando bem.`;
      } else if (ctx.voltage >= 12.4) {
        return `Bateria em ${ctx.voltage.toFixed(1)}V. Normal para motor desligado ou recém-ligado.`;
      } else if (ctx.voltage >= 11.8) {
        return `Atenção! Bateria em ${ctx.voltage.toFixed(1)}V está baixa. Pode ter dificuldade para ligar.`;
      } else {
        return `Alerta! Bateria crítica em ${ctx.voltage.toFixed(1)}V. Risco de pane elétrica!`;
      }
    },
  },
  
  // Temperature Status
  {
    intent: 'temperature_status',
    patterns: [
      /como\s+(est[áa]|anda)\s*(a\s*)?(temperatura|temp)/i,
      /temperatura\s+(do\s*)?(motor|carro)/i,
      /motor\s+(est[áa])?\s*(quente|frio|aquecido)/i,
      /superaquec(endo|ido|imento)/i,
    ],
    generateResponse: (ctx) => {
      if (!ctx.isConnected) {
        return 'Conecte o scanner para eu verificar a temperatura, chefe.';
      }
      if (ctx.temperature === null) {
        return 'Não estou recebendo dados de temperatura agora.';
      }
      
      if (ctx.temperature >= 110) {
        return `PERIGO! Motor a ${ctx.temperature}°C! Pare imediatamente e desligue!`;
      } else if (ctx.temperature >= 100) {
        return `Atenção! Temperatura em ${ctx.temperature}°C está alta. Reduza a carga e observe.`;
      } else if (ctx.temperature >= 85 && ctx.temperature < 100) {
        return `Temperatura perfeita em ${ctx.temperature}°C. Motor na faixa ideal de operação.`;
      } else if (ctx.temperature >= 60) {
        return `Motor aquecendo, ${ctx.temperature}°C. Quase na temperatura ideal.`;
      } else {
        return `Motor ainda frio em ${ctx.temperature}°C. Evite acelerações fortes por enquanto.`;
      }
    },
  },
  
  // Fuel Status
  {
    intent: 'fuel_status',
    patterns: [
      /como\s+(est[áa]|anda)\s*(o\s*)?(combust[ií]vel|tanque|gasolina|[áa]lcool|etanol)/i,
      /quanto\s+(tem|tenho)\s*(de\s*)?(combust[ií]vel|gasolina)/i,
      /n[ií]vel\s*(de\s*)?(combust[ií]vel|tanque)/i,
      /preciso\s+abastecer/i,
      /vou\s+ficar\s+sem\s+combust[ií]vel/i,
    ],
    generateResponse: (ctx) => {
      if (!ctx.isConnected) {
        return 'Preciso estar conectado para ver o nível de combustível.';
      }
      if (ctx.fuelLevel === null) {
        return 'Sensor de combustível não disponível neste veículo via OBD.';
      }
      
      if (ctx.fuelLevel <= 10) {
        return `Alerta! Apenas ${ctx.fuelLevel}% de combustível. Abasteça urgente, chefe!`;
      } else if (ctx.fuelLevel <= 25) {
        return `Combustível em ${ctx.fuelLevel}%. Recomendo abastecer em breve.`;
      } else if (ctx.fuelLevel <= 50) {
        return `Tanque com ${ctx.fuelLevel}%. Ainda dá pra rodar tranquilo.`;
      } else {
        return `Tanque em ${ctx.fuelLevel}%, bem abastecido chefe!`;
      }
    },
  },
  
  // Speed Status
  {
    intent: 'speed_status',
    patterns: [
      /(qual|quanta?)\s+(a\s*)?velocidade/i,
      /a\s+quanto\s+(estou|estamos)\s*(indo)?/i,
      /velocidade\s+atual/i,
      /qu[ãa]o\s+r[áa]pido/i,
    ],
    generateResponse: (ctx) => {
      if (!ctx.isConnected) {
        return 'Conecte o scanner para ver a velocidade.';
      }
      if (ctx.speed === null) {
        return 'Não estou recebendo dados de velocidade.';
      }
      
      if (ctx.speed === 0) {
        return 'Veículo parado no momento.';
      } else if (ctx.speed < 60) {
        return `Velocidade atual: ${ctx.speed} km/h. Trânsito urbano tranquilo.`;
      } else if (ctx.speed < 100) {
        return `A ${ctx.speed} km/h. Velocidade normal de estrada.`;
      } else if (ctx.speed < 120) {
        return `A ${ctx.speed} km/h. Atenção aos limites, chefe!`;
      } else {
        return `A ${ctx.speed} km/h. Velocidade alta! Cuidado!`;
      }
    },
  },
  
  // General Status
  {
    intent: 'general_status',
    patterns: [
      /como\s+(est[áa]|vai|anda)\s+tudo/i,
      /resumo\s+(geral|do\s+ve[ií]culo)/i,
      /tudo\s+(ok|bem|certo)\s*\?/i,
      /algum\s+problema/i,
      /status\s+geral/i,
    ],
    generateResponse: (ctx) => {
      if (!ctx.isConnected) {
        return 'Chefe, conecte o scanner para eu fazer um diagnóstico completo.';
      }
      
      const issues: string[] = [];
      
      if (ctx.temperature !== null && ctx.temperature > 100) {
        issues.push(`temperatura alta (${ctx.temperature}°C)`);
      }
      if (ctx.voltage !== null && ctx.voltage < 12.5) {
        issues.push(`bateria baixa (${ctx.voltage.toFixed(1)}V)`);
      }
      if (ctx.rpm !== null && ctx.rpm > 4500) {
        issues.push(`RPM elevado (${ctx.rpm})`);
      }
      if (ctx.fuelLevel !== null && ctx.fuelLevel < 15) {
        issues.push(`combustível baixo (${ctx.fuelLevel}%)`);
      }
      
      if (issues.length === 0) {
        const parts: string[] = [];
        if (ctx.temperature !== null) parts.push(`${ctx.temperature}°C`);
        if (ctx.rpm !== null) parts.push(`${ctx.rpm} RPM`);
        if (ctx.voltage !== null) parts.push(`${ctx.voltage.toFixed(1)}V`);
        
        return `Tudo tranquilo, chefe! ${parts.join(', ')}. Pode rodar sossegado.`;
      } else if (issues.length === 1) {
        return `Atenção: ${issues[0]}. Resto está normal.`;
      } else {
        return `Chefe, alguns alertas: ${issues.join(', ')}. Recomendo atenção!`;
      }
    },
  },
  
  // Trip Info
  {
    intent: 'trip_info',
    patterns: [
      /como\s+(est[áa]|vai|anda)\s*(a\s*)?(viagem|corrida|trip)/i,
      /quanto\s+(j[áa]\s+)?(rodei|andei|percorri)/i,
      /dist[âa]ncia\s+(percorrida|total)/i,
      /custo\s+(da\s+)?(viagem|corrida)/i,
    ],
    generateResponse: (ctx, tripData) => {
      if (!tripData || tripData.distance === 0) {
        return 'Nenhuma viagem em andamento no momento, chefe.';
      }
      
      const duration = Math.floor(tripData.duration / 60);
      return `Viagem em andamento: ${tripData.distance.toFixed(1)}km em ${duration} minutos. ` +
             `Custo estimado R$${tripData.cost.toFixed(2)}. ` +
             `Velocidade média ${tripData.averageSpeed.toFixed(0)}km/h.`;
    },
  },
  
  // Connection Status
  {
    intent: 'connection_status',
    patterns: [
      /est[áa]\s+conectado/i,
      /conex[ãa]o\s+(ativa|ok|funcionando)/i,
      /scanner\s+(conectado|funcionando)/i,
      /bluetooth\s+(conectado|ativo)/i,
    ],
    generateResponse: (ctx) => {
      if (!ctx.isConnected) {
        return 'Não estou conectado ao veículo, chefe. Clique em Conectar para parear.';
      }
      if (!ctx.isPolling) {
        return 'Conectado, mas aguardando início do monitoramento.';
      }
      return `Conectado e monitorando! Recebendo dados em tempo real${ctx.brand ? ` do seu ${ctx.brand}` : ''}.`;
    },
  },
  
  // Greeting
  {
    intent: 'greeting',
    patterns: [
      /^(oi|ol[áa]|e\s+a[ií]|fala|bom\s+dia|boa\s+tarde|boa\s+noite)\s*(jarvis)?$/i,
      /jarvis\s*$/i,
      /^(oi|ol[áa])\s*,?\s*(jarvis)?$/i,
    ],
    generateResponse: () => {
      const greetings = [
        'Olá chefe! Em que posso ajudar?',
        'Fala chefe! Tô aqui pra ajudar.',
        'E aí chefe! O que precisa?',
        'Opa! Às ordens, chefe!',
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    },
  },
  
  // Thanks
  {
    intent: 'thanks',
    patterns: [
      /^(obrigado|valeu|thanks|brigadão?|vlw)\s*(jarvis)?$/i,
      /muito\s+obrigado/i,
    ],
    generateResponse: () => {
      const responses = [
        'Por nada, chefe! Precisando, é só chamar.',
        'Às ordens! Tô aqui pra isso.',
        'Disponha, chefe!',
        'Tranquilo! Qualquer coisa, só chamar.',
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    },
  },
];

// Cache dinâmico para respostas recentes (TTL 30 segundos)
interface DynamicCacheEntry {
  response: string;
  timestamp: number;
  contextHash: string;
}

const dynamicCache = new Map<string, DynamicCacheEntry>();
const CACHE_TTL_MS = 30000; // 30 segundos

// Gerar hash simples do contexto para invalidação
function generateContextHash(ctx: VehicleContext): string {
  return [
    ctx.isConnected ? '1' : '0',
    ctx.rpm !== null ? Math.floor(ctx.rpm / 100) : 'n',
    ctx.temperature !== null ? Math.floor(ctx.temperature / 5) : 'n',
    ctx.voltage !== null ? Math.floor(ctx.voltage * 10) : 'n',
    ctx.fuelLevel !== null ? Math.floor(ctx.fuelLevel / 10) : 'n',
    ctx.speed !== null ? Math.floor(ctx.speed / 10) : 'n',
  ].join('-');
}

// Normalizar texto para comparação
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remover acentos
    .replace(/[^\w\s]/g, '') // remover pontuação
    .trim();
}

export const JarvisCacheService = {
  /**
   * Tenta encontrar resposta no cache para uma pergunta
   * Retorna null se não encontrar ou cache expirado
   */
  getCachedResponse(
    message: string,
    vehicleContext: VehicleContext,
    tripData?: TripData
  ): { response: string; intent: IntentType } | null {
    const normalizedMessage = normalizeText(message);
    const contextHash = generateContextHash(vehicleContext);
    
    // 1. Verificar cache dinâmico primeiro
    const cacheKey = `${normalizedMessage}-${contextHash}`;
    const cachedEntry = dynamicCache.get(cacheKey);
    
    if (cachedEntry) {
      const age = Date.now() - cachedEntry.timestamp;
      if (age < CACHE_TTL_MS && cachedEntry.contextHash === contextHash) {
        console.log('[JarvisCache] Hit no cache dinâmico:', normalizedMessage);
        return { response: cachedEntry.response, intent: 'unknown' };
      } else {
        // Cache expirado ou contexto mudou
        dynamicCache.delete(cacheKey);
      }
    }
    
    // 2. Verificar padrões de respostas pré-definidas
    for (const cached of CACHED_RESPONSES) {
      for (const pattern of cached.patterns) {
        if (pattern.test(message)) {
          const response = cached.generateResponse(vehicleContext, tripData);
          if (response) {
            console.log('[JarvisCache] Match em pattern:', cached.intent);
            
            // Salvar no cache dinâmico
            dynamicCache.set(cacheKey, {
              response,
              timestamp: Date.now(),
              contextHash,
            });
            
            return { response, intent: cached.intent };
          }
        }
      }
    }
    
    return null;
  },
  
  /**
   * Salva uma resposta da IA no cache dinâmico
   */
  cacheResponse(
    message: string,
    response: string,
    vehicleContext: VehicleContext
  ): void {
    const normalizedMessage = normalizeText(message);
    const contextHash = generateContextHash(vehicleContext);
    const cacheKey = `${normalizedMessage}-${contextHash}`;
    
    dynamicCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      contextHash,
    });
    
    console.log('[JarvisCache] Resposta cacheada para:', normalizedMessage);
  },
  
  /**
   * Limpa o cache dinâmico
   */
  clearCache(): void {
    dynamicCache.clear();
    console.log('[JarvisCache] Cache limpo');
  },
  
  /**
   * Remove entradas expiradas do cache
   */
  pruneExpiredEntries(): void {
    const now = Date.now();
    let pruned = 0;
    
    for (const [key, entry] of dynamicCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        dynamicCache.delete(key);
        pruned++;
      }
    }
    
    if (pruned > 0) {
      console.log(`[JarvisCache] ${pruned} entradas expiradas removidas`);
    }
  },
  
  /**
   * Retorna estatísticas do cache
   */
  getStats(): { size: number; oldestEntry: number | null } {
    let oldestTimestamp: number | null = null;
    
    for (const entry of dynamicCache.values()) {
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }
    
    return {
      size: dynamicCache.size,
      oldestEntry: oldestTimestamp ? Date.now() - oldestTimestamp : null,
    };
  },
};
