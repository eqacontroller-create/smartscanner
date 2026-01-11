import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VehicleContext {
  rpm: number | null;
  speed: number | null;
  temperature: number | null;
  voltage: number | null;
  fuelLevel: number | null;
  engineLoad: number | null;
  isConnected: boolean;
  isPolling: boolean;
  // Novos campos para contexto da marca
  brand?: string;
  brandCharacteristics?: string;
  modelYear?: string;
}

interface EngineProfile {
  fuelType: 'gasoline' | 'ethanol' | 'flex' | 'diesel';
  redlineRPM: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TripData {
  distance: number;
  cost: number;
  costPerKm: number;
  duration: number;
  averageSpeed: number;
  isActive: boolean;
}

interface AutoRideData {
  rideStatus: 'idle' | 'detecting' | 'in_ride' | 'finishing';
  todayRidesCount: number;
  todayTotalDistance: number;
  todayTotalCost: number;
  todayTotalProfit: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, vehicleContext, conversationHistory, engineProfile, tripData, autoRideData } = await req.json() as {
      message: string;
      vehicleContext: VehicleContext;
      conversationHistory: Message[];
      engineProfile?: EngineProfile;
      tripData?: TripData;
      autoRideData?: AutoRideData;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

    // Construir contexto do veículo para o prompt
    const vehicleStatus = buildVehicleStatus(vehicleContext);
    const engineContext = buildEngineContext(engineProfile);
    const tripContext = buildTripContext(tripData);
    const autoRideContext = buildAutoRideContext(autoRideData);
    const brandContext = buildBrandContext(vehicleContext);

    const systemPrompt = `Você é Jarvis, uma inteligência automotiva UNIVERSAL integrada a qualquer veículo. Seu papel é ser um copiloto inteligente e DIDÁTICO, explicando tudo de forma simples para pessoas leigas.

${brandContext}

DADOS DO VEÍCULO EM TEMPO REAL:
${vehicleStatus}

${engineContext}

${tripContext}

${autoRideContext}

MODO DIDÁTICO (USUÁRIO LEIGO):
- Explique problemas mecânicos como se falasse com alguém que NÃO entende de carros
- Use ANALOGIAS simples do dia a dia:
  * Motor quente = "É como uma pessoa com febre alta"
  * Bateria baixa = "É como um celular com pouca carga"
  * Carga do motor = "É como o esforço que você faz subindo escada"
  * RPM alto = "O motor está girando muito rápido, como bater o liquidificador na velocidade máxima"
  * Lugging (motor forçando) = "É como pedalar uma bicicleta em marcha pesada subindo morro"
- SEMPRE informe se é SEGURO continuar dirigindo ou não
- Sugira ações práticas (ex: "Pare em um posto", "Ligue o ar-condicionado para ajudar a esfriar")

REGRAS UNIVERSAIS DE LINGUAGEM:
- NUNCA mencione marcas ou modelos específicos de veículos
- Use SEMPRE termos genéricos: "Piloto", "Motor", "Veículo", "Seu carro"
- Trate o usuário como "Piloto" de forma amigável
- Adapte as dicas ao tipo de combustível quando relevante

PERSONALIDADE E ESTILO:
- Responda de forma CONCISA (máximo 2-3 frases curtas)
- Use linguagem natural e amigável, como um amigo experiente em carros
- Seja proativo em avisar sobre problemas quando detectar valores preocupantes
- Adapte o tom: relaxado quando tudo está ok, urgente quando há problemas
- Não seja robótico - fale como humano

CAPACIDADES:
- Informar dados do veículo em tempo real (RPM, velocidade, temperatura, voltagem, nível de combustível, carga do motor)
- Explicar situações do motor e dar conselhos de forma simples
- Responder perguntas sobre o carro e condução
- Alertar sobre problemas potenciais (bateria baixa, superaquecimento, combustível baixo, etc)
- Dar dicas de economia de combustível e manutenção
- Orientar sobre pontos ideais de troca de marcha

REGRAS IMPORTANTES:
- Se não tiver dados (valores null), diga que ainda não há leitura disponível
- Sempre arredonde valores para números inteiros ao falar
- Use graus Celsius para temperatura
- Use quilômetros por hora para velocidade
- Seja direto e objetivo nas respostas
- Quando houver problema, sempre diga se pode continuar dirigindo ou não`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6), // Últimas 6 mensagens para contexto
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "rate_limit",
          response: "Estou processando muitas solicitações. Tente novamente em alguns segundos." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "payment_required",
          response: "Limite de uso atingido. Entre em contato com o suporte." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao processar resposta da IA");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua solicitação.";

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Jarvis AI error:", error);
    return new Response(JSON.stringify({ 
      error: "internal_error",
      response: "Houve um problema ao processar sua solicitação. Tente novamente."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildTripContext(tripData?: TripData): string {
  if (!tripData || tripData.distance < 0.01) {
    return 'DADOS DA VIAGEM: Nenhuma viagem em andamento';
  }
  
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes} minutos`;
  };
  
  const lines = [
    'DADOS DA VIAGEM (TAXÍMETRO):',
    `- Status: ${tripData.isActive ? 'Em andamento' : 'Pausada'}`,
    `- Distância percorrida: ${tripData.distance.toFixed(2)} km`,
    `- Custo estimado: R$ ${tripData.cost.toFixed(2)}`,
    `- Custo por km: R$ ${tripData.costPerKm.toFixed(2)}`,
    `- Tempo de viagem: ${formatDuration(tripData.duration)}`,
    `- Velocidade média: ${tripData.averageSpeed.toFixed(0)} km/h`,
  ];
  
  return lines.join('\n');
}

function buildAutoRideContext(autoRideData?: AutoRideData): string {
  if (!autoRideData) {
    return 'AUDITORIA DE CORRIDAS: Não configurada';
  }
  
  const statusNames: Record<string, string> = {
    idle: 'Aguardando corrida',
    detecting: 'Detectando início de corrida',
    in_ride: 'Corrida em andamento',
    finishing: 'Finalizando corrida',
  };
  
  const lines = [
    'AUDITORIA AUTOMÁTICA DE CORRIDAS (MOTORISTA DE APP):',
    `- Status atual: ${statusNames[autoRideData.rideStatus] || autoRideData.rideStatus}`,
    `- Corridas hoje: ${autoRideData.todayRidesCount}`,
    `- Total rodado hoje: ${autoRideData.todayTotalDistance.toFixed(1)} km`,
    `- Total gasto em combustível: R$ ${autoRideData.todayTotalCost.toFixed(2)}`,
    `- Lucro líquido do dia: R$ ${autoRideData.todayTotalProfit.toFixed(2)}`,
  ];
  
  if (autoRideData.todayRidesCount > 0) {
    lines.push(`- Média por corrida: R$ ${(autoRideData.todayTotalProfit / autoRideData.todayRidesCount).toFixed(2)}`);
  }
  
  return lines.join('\n');
}

function buildEngineContext(profile?: EngineProfile): string {
  if (!profile) {
    return 'PERFIL DO MOTOR: Não configurado (usando padrões)';
  }
  
  const fuelTypeNames: Record<string, string> = {
    gasoline: 'Gasolina',
    ethanol: 'Etanol',
    flex: 'Flex (Gasolina/Etanol)',
    diesel: 'Diesel'
  };
  
  const ecoPoint = Math.round(profile.redlineRPM * 0.4);
  const sportPoint = Math.round(profile.redlineRPM * 0.9);
  const luggingPoint = Math.round(profile.redlineRPM * 0.25);
  
  const lines = [
    'PERFIL DO MOTOR:',
    `- Tipo de combustível: ${fuelTypeNames[profile.fuelType] || profile.fuelType}`,
    `- Limite de giro (redline): ${profile.redlineRPM} RPM`,
    `- Ponto de troca econômico: ${ecoPoint} RPM (40%)`,
    `- Ponto de troca esportivo: ${sportPoint} RPM (90%)`,
    `- Limite de lugging: Abaixo de ${luggingPoint} RPM com carga alta`,
  ];
  
  // Dicas específicas por tipo de combustível
  if (profile.fuelType === 'diesel') {
    lines.push('- NOTA: Motores diesel têm menor rotação máxima e mais torque em baixas rotações');
  } else if (profile.fuelType === 'ethanol') {
    lines.push('- NOTA: Etanol pode exigir RPM um pouco mais alto para mesma potência');
  }
  
  return lines.join('\n');
}

function buildVehicleStatus(ctx: VehicleContext): string {
  const lines: string[] = [];
  
  lines.push(`- Conexão: ${ctx.isConnected ? 'Conectado' : 'Desconectado'}`);
  lines.push(`- Leitura ativa: ${ctx.isPolling ? 'Sim' : 'Não'}`);
  
  if (ctx.rpm !== null) {
    lines.push(`- RPM: ${ctx.rpm}`);
  } else {
    lines.push(`- RPM: Sem leitura`);
  }
  
  if (ctx.speed !== null) {
    lines.push(`- Velocidade: ${ctx.speed} km/h`);
  } else {
    lines.push(`- Velocidade: Sem leitura`);
  }
  
  if (ctx.temperature !== null) {
    lines.push(`- Temperatura do motor: ${ctx.temperature}°C`);
    if (ctx.temperature < 60) {
      lines.push(`  (Motor frio - abaixo da temperatura ideal)`);
    } else if (ctx.temperature >= 60 && ctx.temperature < 90) {
      lines.push(`  (Motor aquecendo)`);
    } else if (ctx.temperature >= 90 && ctx.temperature <= 100) {
      lines.push(`  (Temperatura ideal de operação)`);
    } else {
      lines.push(`  (⚠️ ATENÇÃO: Motor quente demais!)`);
    }
  } else {
    lines.push(`- Temperatura: Sem leitura`);
  }
  
  // Voltagem da Bateria - Sistema Elétrico
  if (ctx.voltage !== null) {
    lines.push(`- Voltagem da bateria: ${ctx.voltage}V`);
    if (ctx.voltage < 12.0) {
      lines.push(`  (⚠️ CRÍTICO: Bateria muito baixa! Risco de pane elétrica)`);
    } else if (ctx.voltage < 12.5) {
      lines.push(`  (⚠️ ATENÇÃO: Bateria baixa, verificar alternador)`);
    } else if (ctx.voltage > 15.0) {
      lines.push(`  (⚠️ ATENÇÃO: Sobrecarga - possível problema no regulador de tensão)`);
    } else if (ctx.voltage >= 13.5 && ctx.voltage <= 14.5) {
      lines.push(`  (✓ Ideal - alternador carregando corretamente)`);
    } else {
      lines.push(`  (Normal - sistema elétrico operando)`);
    }
  } else {
    lines.push(`- Voltagem: Sem leitura`);
  }
  
  // Nível de Combustível
  if (ctx.fuelLevel !== null) {
    lines.push(`- Nível de combustível: ${ctx.fuelLevel}%`);
    if (ctx.fuelLevel <= 10) {
      lines.push(`  (⚠️ CRÍTICO: Reserva! Abasteça imediatamente)`);
    } else if (ctx.fuelLevel <= 20) {
      lines.push(`  (⚠️ ATENÇÃO: Combustível baixo, procure um posto)`);
    } else if (ctx.fuelLevel >= 80) {
      lines.push(`  (✓ Tanque cheio)`);
    } else {
      lines.push(`  (Normal)`);
    }
  } else {
    lines.push(`- Nível de combustível: Sem leitura (sensor pode não ser suportado)`);
  }
  
  // Carga do Motor
  if (ctx.engineLoad !== null) {
    lines.push(`- Carga do motor: ${ctx.engineLoad}%`);
    if (ctx.engineLoad > 80) {
      lines.push(`  (Motor em alta demanda)`);
    } else if (ctx.engineLoad > 50) {
      lines.push(`  (Carga moderada)`);
    } else {
      lines.push(`  (Carga leve)`);
    }
  } else {
    lines.push(`- Carga do motor: Sem leitura`);
  }
  
  return lines.join('\n');
}

function buildBrandContext(ctx: VehicleContext): string {
  if (!ctx.brand || ctx.brand === 'generic') {
    return '';
  }
  
  const lines = [
    'CONTEXTO DO VEÍCULO DETECTADO:',
    `- Marca: ${ctx.brand}${ctx.modelYear ? ` (${ctx.modelYear})` : ''}`,
  ];
  
  if (ctx.brandCharacteristics) {
    lines.push(`- Características: ${ctx.brandCharacteristics}`);
  }
  
  lines.push('');
  lines.push('IMPORTANTE: Use seu conhecimento sobre esta marca para dar dicas mais precisas. Mencione características específicas quando relevante.');
  
  return lines.join('\n');
}
