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
    const { message, vehicleContext, conversationHistory, engineProfile, tripData, autoRideData, stream = false } = await req.json() as {
      message: string;
      vehicleContext: VehicleContext;
      conversationHistory: Message[];
      engineProfile?: EngineProfile;
      tripData?: TripData;
      autoRideData?: AutoRideData;
      stream?: boolean;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

    // Construir contexto compacto do veículo
    const vehicleStatus = buildCompactStatus(vehicleContext);
    const engineContext = engineProfile ? buildCompactEngine(engineProfile) : '';
    const tripContext = tripData && tripData.distance > 0.01 ? buildCompactTrip(tripData) : '';
    const rideContext = autoRideData && autoRideData.todayRidesCount > 0 ? buildCompactRide(autoRideData) : '';

    // Prompt otimizado e compacto
    const systemPrompt = `Você é Jarvis, copiloto automotivo inteligente e didático.

VEÍCULO: ${vehicleStatus}
${engineContext}${tripContext}${rideContext}

REGRAS:
• Responda em 1-2 frases curtas e diretas
• Use analogias simples (motor quente = febre, bateria = celular)
• SEMPRE diga se é seguro continuar dirigindo
• Trate como "Piloto" de forma amigável
• Se valor null: "sem leitura disponível"
• Priorize: segurança > clareza > detalhes`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-4), // Reduzido de 6 para 4
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
        max_tokens: 200,
        temperature: 0.5,
        stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "rate_limit",
          response: "Muitas solicitações. Tente novamente em alguns segundos." 
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

    // Streaming: retornar stream SSE diretamente
    if (stream) {
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming: retornar JSON
    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Desculpe, não entendi.";

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Jarvis AI error:", error);
    return new Response(JSON.stringify({ 
      error: "internal_error",
      response: "Problema ao processar. Tente novamente."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Contexto compacto do veículo (inline)
function buildCompactStatus(ctx: VehicleContext): string {
  const parts: string[] = [];
  
  if (!ctx.isConnected) return "Desconectado";
  
  if (ctx.rpm !== null) parts.push(`RPM:${ctx.rpm}`);
  if (ctx.speed !== null) parts.push(`Vel:${ctx.speed}km/h`);
  
  if (ctx.temperature !== null) {
    const tempStatus = ctx.temperature > 100 ? '⚠️QUENTE' : ctx.temperature < 60 ? 'frio' : 'ok';
    parts.push(`Temp:${ctx.temperature}°C(${tempStatus})`);
  }
  
  if (ctx.voltage !== null) {
    const voltStatus = ctx.voltage < 12.5 ? '⚠️BAIXA' : ctx.voltage > 15 ? '⚠️ALTA' : 'ok';
    parts.push(`Bat:${ctx.voltage}V(${voltStatus})`);
  }
  
  if (ctx.fuelLevel !== null) {
    const fuelStatus = ctx.fuelLevel <= 10 ? '⚠️RESERVA' : ctx.fuelLevel <= 20 ? 'baixo' : 'ok';
    parts.push(`Comb:${ctx.fuelLevel}%(${fuelStatus})`);
  }
  
  if (ctx.engineLoad !== null) {
    parts.push(`Carga:${ctx.engineLoad}%`);
  }
  
  // Adicionar marca se disponível
  if (ctx.brand && ctx.brand !== 'generic') {
    parts.push(`Marca:${ctx.brand}${ctx.modelYear ? `(${ctx.modelYear})` : ''}`);
  }
  
  return parts.join(' | ') || "Conectado, aguardando dados";
}

// Contexto compacto do motor
function buildCompactEngine(profile: EngineProfile): string {
  const fuelNames: Record<string, string> = {
    gasoline: 'Gasolina',
    ethanol: 'Etanol', 
    flex: 'Flex',
    diesel: 'Diesel'
  };
  const ecoRPM = Math.round(profile.redlineRPM * 0.4);
  return `\nMOTOR: ${fuelNames[profile.fuelType] || profile.fuelType} | Redline:${profile.redlineRPM} | Eco:${ecoRPM}RPM`;
}

// Contexto compacto de viagem
function buildCompactTrip(trip: TripData): string {
  const mins = Math.floor(trip.duration / 60);
  return `\nVIAGEM: ${trip.distance.toFixed(1)}km | R$${trip.cost.toFixed(2)} | ${mins}min | ${trip.isActive ? 'ativa' : 'pausada'}`;
}

// Contexto compacto de corridas
function buildCompactRide(ride: AutoRideData): string {
  return `\nCORRIDAS HOJE: ${ride.todayRidesCount}x | ${ride.todayTotalDistance.toFixed(1)}km | Lucro:R$${ride.todayTotalProfit.toFixed(2)}`;
}
