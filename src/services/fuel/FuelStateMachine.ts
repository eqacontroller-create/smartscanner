// Fuel State Machine - Análise Forense de Combustível
// Lógica PURA (sem React) para determinar qualidade do combustível
// com precisão científica, diferenciando troca Flex de adulteração
// CORREÇÃO v2: Melhor cálculo de confiança, warm-up de samples, tolerância O2

import type {
  FuelState,
  FuelChangeContext,
  FuelMonitoringData,
  FuelDiagnosticResult,
  FuelAdaptationProgress,
  O2SensorReading,
  FuelAnalysisThresholds,
} from '@/types/fuelForensics';
import { DEFAULT_FUEL_THRESHOLDS, SAMPLE_WARMUP_CONFIG } from '@/types/fuelForensics';

/**
 * Calcula variância de um array de números
 * Usado para medir estabilidade das leituras
 */
export function calculateVariance(samples: number[]): number {
  if (samples.length < 2) return 0;
  
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const squaredDiffs = samples.map(x => Math.pow(x - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / samples.length;
}

/**
 * Calcula média móvel das últimas N amostras, descartando primeiras (warm-up)
 */
export function calculateRollingAverage(samples: number[]): number {
  if (samples.length === 0) return 0;
  
  const { discardFirstSamples, rollingWindowSize } = SAMPLE_WARMUP_CONFIG;
  
  // Descartar primeiras amostras (warm-up)
  const afterWarmup = samples.slice(discardFirstSamples);
  
  if (afterWarmup.length === 0) {
    // Se ainda não temos amostras suficientes, usar todas
    return samples.reduce((a, b) => a + b, 0) / samples.length;
  }
  
  // Pegar últimas N amostras para média móvel
  const recentSamples = afterWarmup.slice(-rollingWindowSize);
  return recentSamples.reduce((a, b) => a + b, 0) / recentSamples.length;
}

/**
 * Avalia o estado do combustível quando usuário manteve o MESMO combustível
 * Aqui, qualquer desvio significativo indica problema (adulteração ou mecânico)
 * CORREÇÃO v3: Análise de Trim Absoluto - detecta quando ECU já se adaptou
 */
export function evaluateSameFuel(
  data: FuelMonitoringData,
  thresholds: FuelAnalysisThresholds = DEFAULT_FUEL_THRESHOLDS
): { state: FuelState; ltftMemoryWarning: boolean } {
  // CORREÇÃO: Usar média móvel em vez de média simples
  const stftAverage = calculateRollingAverage(data.stftSamples);
  const ltftCurrent = data.ltftCurrent ?? 0;
  
  // CORREÇÃO v3: Total Trim = STFT + valor ABSOLUTO do LTFT atual
  // Se LTFT está alto, indica adaptação prévia a combustível diferente
  const totalTrimAbs = Math.abs(stftAverage) + Math.abs(ltftCurrent);
  
  // NOVA REGRA: Verificar memória do LTFT
  // Se |LTFT| > 15% e usuário disse "mesmo combustível", algo está errado
  // A ECU já se adaptou ao combustível diferente
  const ltftMemoryThreshold = 15; // 15% é o limite para combustível "diferente"
  const isLTFTMemoryHigh = Math.abs(ltftCurrent) > ltftMemoryThreshold;
  
  // Caso especial: STFT estável mas LTFT memorizado alto
  // A ECU já se adaptou ao combustível diferente - STFT voltou a zero mas LTFT indica histórico
  if (isLTFTMemoryHigh && Math.abs(stftAverage) < 5) {
    // Retorna 'suspicious' com flag especial para UI
    return { state: 'suspicious', ltftMemoryWarning: true };
  }
  
  // Se Total Trim absoluto > limite máximo (considera LTFT memorizado + STFT atual)
  if (totalTrimAbs > thresholds.sameFuelMaxTrim + ltftMemoryThreshold) {
    // CORREÇÃO: Exigir mais leituras O2 antes de diagnosticar problema mecânico
    if (data.o2Readings.length >= SAMPLE_WARMUP_CONFIG.minO2ForMechanicalDiagnosis) {
      const isO2Frozen = checkO2Frozen(data.o2Readings, thresholds.o2FrozenDuration);
      
      if (isO2Frozen) {
        // O2 travado por muito tempo = problema mecânico (sonda, vazamento)
        return { state: 'mechanical', ltftMemoryWarning: false };
      }
      
      // O2 oscilando normalmente mas STFT alto = combustível adulterado
      return { state: 'contaminated', ltftMemoryWarning: isLTFTMemoryHigh };
    }
    
    // Sem dados suficientes de O2, assumir suspeito (não mecânico)
    return { state: 'suspicious', ltftMemoryWarning: isLTFTMemoryHigh };
  }
  
  // Verificar se está no limiar de atenção (considerando LTFT memorizado)
  if (totalTrimAbs > thresholds.sameFuelWarningTrim + 10) {
    return { state: 'suspicious', ltftMemoryWarning: isLTFTMemoryHigh };
  }
  
  return { state: 'stable', ltftMemoryWarning: false };
}

/**
 * Verifica se sensor O2 está travado em lean ou rich
 * CORREÇÃO v2: Usa duração real em segundos baseada em timestamps
 */
function checkO2Frozen(readings: O2SensorReading[], frozenDurationThreshold: number): boolean {
  if (readings.length < 5) return false;
  
  // Verificar sequência contínua de lean ou rich
  let currentStreak = 0;
  let currentType: 'lean' | 'rich' | null = null;
  let maxStreakDuration = 0;
  let streakStartTime = 0;
  
  for (let i = 0; i < readings.length; i++) {
    const reading = readings[i];
    
    if (reading.isLean) {
      if (currentType === 'lean') {
        // Continua streak lean
        const duration = (reading.timestamp - streakStartTime) / 1000;
        maxStreakDuration = Math.max(maxStreakDuration, duration);
      } else {
        // Nova streak lean
        currentType = 'lean';
        streakStartTime = reading.timestamp;
        currentStreak = 1;
      }
    } else if (reading.isRich) {
      if (currentType === 'rich') {
        // Continua streak rich
        const duration = (reading.timestamp - streakStartTime) / 1000;
        maxStreakDuration = Math.max(maxStreakDuration, duration);
      } else {
        // Nova streak rich
        currentType = 'rich';
        streakStartTime = reading.timestamp;
        currentStreak = 1;
      }
    } else {
      // Reset streak
      currentType = null;
      currentStreak = 0;
    }
  }
  
  return maxStreakDuration >= frozenDurationThreshold;
}

/**
 * Avalia o estado quando usuário TROCOU de combustível (Flex)
 * Aqui, STFT alto é ESPERADO durante adaptação
 */
export function evaluateFuelSwitch(
  data: FuelMonitoringData,
  context: FuelChangeContext,
  thresholds: FuelAnalysisThresholds = DEFAULT_FUEL_THRESHOLDS
): { state: FuelState; adaptationProgress: FuelAdaptationProgress } {
  // Determinar direção esperada
  // Gasolina → Etanol: STFT sobe (positivo) pois etanol tem menos energia
  // Etanol → Gasolina: STFT desce (negativo) pois gasolina tem mais energia
  const expectedDirection = context === 'gas_to_ethanol' ? 'positive' : 'negative';
  
  // Verificar direção atual
  const actualDirection: 'positive' | 'negative' | 'neutral' = 
    data.stftCurrent > 5 ? 'positive' :
    data.stftCurrent < -5 ? 'negative' : 'neutral';
  
  // LTFT está absorvendo a correção?
  const ltftMoving = Math.abs(data.ltftDelta) > thresholds.ltftMinDelta;
  
  // Calcular progresso da adaptação
  // A adaptação está completa quando STFT volta para perto de 0 e LTFT assumiu
  const stftNormalized = Math.abs(data.stftCurrent) < 10;
  const progressPercent = stftNormalized && ltftMoving 
    ? 100 
    : ltftMoving 
      ? Math.min(90, (Math.abs(data.ltftDelta) / thresholds.fuelSwitchExpectedTrim) * 100)
      : Math.min(50, (data.distanceMonitored / thresholds.recommendedDistance) * 50);
  
  const adaptationProgress: FuelAdaptationProgress = {
    isAdapting: !stftNormalized || ltftMoving,
    expectedDirection,
    actualDirection,
    progressPercent,
    ltftAbsorbing: ltftMoving,
    estimatedTimeRemaining: stftNormalized ? 0 : Math.max(0, (100 - progressPercent) * 3), // ~3s por %
  };
  
  // Caso 1: STFT voltou ao normal e LTFT absorveu = adaptação completa
  if (stftNormalized && ltftMoving) {
    return { state: 'stable', adaptationProgress: { ...adaptationProgress, isAdapting: false } };
  }
  
  // Caso 2: Direção oposta ao esperado = algo errado
  if (actualDirection !== 'neutral' && actualDirection !== expectedDirection) {
    // Se trocou Gas→Etanol mas STFT caiu, ou vice-versa
    return { state: 'suspicious', adaptationProgress };
  }
  
  // Caso 3: STFT muito alto (> 40%) mesmo para Flex = problema
  if (Math.abs(data.stftCurrent) > thresholds.fuelSwitchMaxTrim) {
    // LTFT não está absorvendo = pode ser mecânico
    if (!ltftMoving && data.distanceMonitored > thresholds.minAnalysisDistance) {
      return { state: 'mechanical', adaptationProgress };
    }
    return { state: 'suspicious', adaptationProgress };
  }
  
  // Caso 4: STFT alto e LTFT parado por muito tempo = problema mecânico
  if (Math.abs(data.stftCurrent) > thresholds.fuelSwitchExpectedTrim && 
      !ltftMoving && 
      data.distanceMonitored > thresholds.minAnalysisDistance * 2) {
    return { state: 'mechanical', adaptationProgress };
  }
  
  // Caso 5: Adaptação em andamento (normal para Flex)
  return { state: 'adapting', adaptationProgress };
}

/**
 * Valida análise usando sensor O2 (Sonda Lambda)
 * Retorna true se O2 indica operação normal
 * CORREÇÃO v2: Usa timestamps reais para calcular duração
 */
export function validateWithO2Sensor(
  readings: O2SensorReading[],
  thresholds: FuelAnalysisThresholds = DEFAULT_FUEL_THRESHOLDS
): { isValid: boolean; frozenDuration: number; frozenType: 'lean' | 'rich' | null } {
  if (readings.length < SAMPLE_WARMUP_CONFIG.minO2ForMechanicalDiagnosis) {
    // Insuficiente para diagnóstico - assumir válido
    return { isValid: true, frozenDuration: 0, frozenType: null };
  }
  
  // Verificar se O2 está travado em pobre ou rico
  let leanStreakStart: number | null = null;
  let richStreakStart: number | null = null;
  let maxLeanDuration = 0;
  let maxRichDuration = 0;
  
  for (const reading of readings) {
    if (reading.isLean) {
      if (leanStreakStart === null) {
        leanStreakStart = reading.timestamp;
      }
      const duration = (reading.timestamp - leanStreakStart) / 1000;
      maxLeanDuration = Math.max(maxLeanDuration, duration);
      richStreakStart = null; // Reset rich streak
    } else if (reading.isRich) {
      if (richStreakStart === null) {
        richStreakStart = reading.timestamp;
      }
      const duration = (reading.timestamp - richStreakStart) / 1000;
      maxRichDuration = Math.max(maxRichDuration, duration);
      leanStreakStart = null; // Reset lean streak
    } else {
      leanStreakStart = null;
      richStreakStart = null;
    }
  }
  
  if (maxLeanDuration >= thresholds.o2FrozenDuration) {
    return { isValid: false, frozenDuration: maxLeanDuration, frozenType: 'lean' };
  }
  
  if (maxRichDuration >= thresholds.o2FrozenDuration) {
    return { isValid: false, frozenDuration: maxRichDuration, frozenType: 'rich' };
  }
  
  return { isValid: true, frozenDuration: 0, frozenType: null };
}

/**
 * Analisa tendência do Fuel Trim ao longo do tempo
 * Útil para detectar se está melhorando ou piorando
 */
export function analyzeTrend(
  samples: number[]
): { trend: 'improving' | 'worsening' | 'stable'; slope: number } {
  if (samples.length < 5) {
    return { trend: 'stable', slope: 0 };
  }
  
  // Pegar últimas 10 amostras
  const recent = samples.slice(-10);
  
  // Calcular média da primeira e segunda metade
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const avgFirst = firstHalf.reduce((a, b) => a + Math.abs(b), 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + Math.abs(b), 0) / secondHalf.length;
  
  const slope = avgSecond - avgFirst;
  
  if (slope < -2) {
    return { trend: 'improving', slope };
  }
  if (slope > 2) {
    return { trend: 'worsening', slope };
  }
  return { trend: 'stable', slope };
}

/**
 * Calcula confiança baseada em múltiplos fatores
 * CORREÇÃO v2: Sistema de pontuação mais preciso
 */
export function calculateConfidence(
  data: FuelMonitoringData,
  thresholds: FuelAnalysisThresholds
): { confidence: 'low' | 'medium' | 'high'; score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];
  
  // 1. Distância percorrida (0-30 pontos)
  if (data.distanceMonitored >= thresholds.recommendedDistance) {
    score += 30;
    details.push(`Distância: ${data.distanceMonitored.toFixed(1)}km (ótimo)`);
  } else if (data.distanceMonitored >= thresholds.minAnalysisDistance) {
    score += 15;
    details.push(`Distância: ${data.distanceMonitored.toFixed(1)}km (adequado)`);
  } else {
    details.push(`Distância: ${data.distanceMonitored.toFixed(1)}km (insuficiente)`);
  }
  
  // 2. Quantidade de amostras STFT (0-30 pontos)
  const stftCount = data.stftSamples.length;
  if (stftCount >= SAMPLE_WARMUP_CONFIG.minSTFTForHighConfidence) {
    score += 30;
    details.push(`Amostras STFT: ${stftCount} (ótimo)`);
  } else if (stftCount >= SAMPLE_WARMUP_CONFIG.minSamplesForAverage) {
    score += 15;
    details.push(`Amostras STFT: ${stftCount} (adequado)`);
  } else {
    details.push(`Amostras STFT: ${stftCount} (insuficiente)`);
  }
  
  // 3. Leituras O2 (0-20 pontos)
  const o2Count = data.o2Readings.length;
  if (o2Count >= SAMPLE_WARMUP_CONFIG.minO2ForMechanicalDiagnosis) {
    score += 20;
    details.push(`Leituras O2: ${o2Count} (ótimo)`);
  } else if (o2Count >= 5) {
    score += 10;
    details.push(`Leituras O2: ${o2Count} (básico)`);
  } else if (o2Count > 0) {
    score += 5;
    details.push(`Leituras O2: ${o2Count} (limitado)`);
  } else {
    details.push('Sem leituras O2');
  }
  
  // 4. Estabilidade/Consistência STFT (0-20 pontos)
  if (stftCount >= 5) {
    const variance = calculateVariance(data.stftSamples);
    if (variance < 25) { // Desvio padrão < 5%
      score += 20;
      details.push(`Variância STFT: ${variance.toFixed(1)} (estável)`);
    } else if (variance < 100) { // Desvio padrão < 10%
      score += 10;
      details.push(`Variância STFT: ${variance.toFixed(1)} (moderado)`);
    } else {
      details.push(`Variância STFT: ${variance.toFixed(1)} (instável)`);
    }
  }
  
  // Mapear score para nível de confiança
  const confidence: 'low' | 'medium' | 'high' = 
    score >= 70 ? 'high' : 
    score >= 40 ? 'medium' : 
    'low';
  
  return { confidence, score, details };
}

/**
 * Função principal: Avalia estado do combustível
 * Esta é a "Máquina de Estados" que determina o diagnóstico final
 * CORREÇÃO v2: Usa novo sistema de confiança e média móvel
 */
export function evaluateFuelState(
  data: FuelMonitoringData,
  context: FuelChangeContext,
  thresholds: FuelAnalysisThresholds = DEFAULT_FUEL_THRESHOLDS
): FuelDiagnosticResult {
  const analyzedAt = Date.now();
  
  // Validar O2 Sensor
  const o2Validation = validateWithO2Sensor(data.o2Readings, thresholds);
  
  // Analisar tendência
  const { trend, slope } = analyzeTrend(data.stftSamples);
  
  // CORREÇÃO: Usar média móvel
  const rollingAverage = calculateRollingAverage(data.stftSamples);
  const ltftCurrent = data.ltftCurrent ?? 0;
  
  // CORREÇÃO v3: Detectar LTFT memorizado alto
  const ltftMemoryThreshold = 15;
  const isLTFTMemoryHigh = Math.abs(ltftCurrent) > ltftMemoryThreshold;
  
  let state: FuelState;
  let adaptationProgress: FuelAdaptationProgress | undefined;
  let ltftMemoryWarning = false;
  
  // Escolher algoritmo baseado no contexto
  if (context === 'same_fuel') {
    const sameFuelResult = evaluateSameFuel(data, thresholds);
    state = sameFuelResult.state;
    ltftMemoryWarning = sameFuelResult.ltftMemoryWarning;
  } else if (context === 'gas_to_ethanol' || context === 'ethanol_to_gas') {
    const result = evaluateFuelSwitch(data, context, thresholds);
    state = result.state;
    adaptationProgress = result.adaptationProgress;
  } else {
    // Contexto desconhecido: usar análise conservadora
    // Se STFT alto mas direção consistente, assumir troca de combustível
    const absSTFT = Math.abs(rollingAverage);
    if (absSTFT > thresholds.fuelSwitchExpectedTrim) {
      // STFT muito alto
      if (Math.abs(data.ltftDelta) > thresholds.ltftMinDelta) {
        state = 'adapting'; // LTFT adaptando, provavelmente troca
      } else {
        state = 'suspicious';
      }
    } else if (absSTFT > thresholds.sameFuelMaxTrim) {
      state = 'suspicious';
    } else {
      state = 'stable';
    }
  }
  
  // Base do resultado (movido para depois de determinar state para usar ltftMemoryWarning)
  const baseResult: Partial<FuelDiagnosticResult> = {
    stftAverage: rollingAverage, // Usar média móvel
    ltftDelta: data.ltftDelta,
    o2Average: data.o2Average,
    distanceMonitored: data.distanceMonitored,
    userContext: context,
    analyzedAt,
    evidence: {
      stftOutOfRange: Math.abs(rollingAverage) > thresholds.sameFuelWarningTrim,
      ltftNotAdapting: context !== 'same_fuel' && Math.abs(data.ltftDelta) < thresholds.ltftMinDelta,
      o2SensorFrozen: !o2Validation.isValid,
      o2FrozenDuration: o2Validation.frozenDuration,
      ltftMemoryHigh: ltftMemoryWarning || isLTFTMemoryHigh,
      ltftMemoryValue: ltftCurrent,
    },
  };
  
  // CORREÇÃO v2: Usar novo sistema de confiança baseado em múltiplos fatores
  const { confidence, score, details } = calculateConfidence(data, thresholds);
  
  // Gerar detalhes de anomalia
  let anomalyType: 'contamination' | 'mechanical' | 'sensor_fault' | undefined;
  let anomalyDetails: string | undefined;
  
  if (state === 'contaminated') {
    anomalyType = 'contamination';
    anomalyDetails = `STFT médio de ${rollingAverage.toFixed(1)}% indica combustível fora de especificação. A ECU está compensando excessivamente.`;
  } else if (state === 'mechanical') {
    if (!o2Validation.isValid) {
      anomalyType = 'sensor_fault';
      anomalyDetails = `Sensor O2 travado em ${o2Validation.frozenType === 'lean' ? 'mistura pobre' : 'mistura rica'} por ${o2Validation.frozenDuration.toFixed(0)}s. Pode indicar problema com sonda lambda ou vazamento de vácuo.`;
    } else {
      anomalyType = 'mechanical';
      anomalyDetails = `STFT alto (${rollingAverage.toFixed(1)}%) sem adaptação do LTFT. Pode indicar problema mecânico como vazamento de vácuo ou injetor obstruído.`;
    }
  } else if (state === 'suspicious') {
    // CORREÇÃO v3: Mensagem especial quando LTFT memorizado alto
    if (ltftMemoryWarning && Math.abs(rollingAverage) < 5) {
      anomalyDetails = `Atenção: A memória da injeção (LTFT: ${ltftCurrent > 0 ? '+' : ''}${ltftCurrent.toFixed(1)}%) indica que o combustível é diferente do informado, mesmo que o motor esteja estável agora.`;
    } else {
      anomalyDetails = `Valores fora do esperado. STFT: ${rollingAverage.toFixed(1)}%, LTFT: ${ltftCurrent.toFixed(1)}%. Continuando monitoramento.`;
    }
  }
  
  // Gerar recomendação
  let recommendation: string;
  switch (state) {
    case 'stable':
      recommendation = 'Combustível aprovado. Operação normal.';
      break;
    case 'adapting':
      recommendation = `ECU está adaptando ao novo combustível. ${trend === 'improving' ? 'Tendência de melhora.' : 'Continue dirigindo por mais alguns quilômetros.'}`;
      break;
    case 'suspicious':
      recommendation = 'Mantenha o monitoramento. Se os valores persistirem, considere abastecer em outro posto.';
      break;
    case 'contaminated':
      recommendation = 'Combustível possivelmente adulterado. Considere drenar o tanque e abastecer em posto de confiança.';
      break;
    case 'mechanical':
      recommendation = 'Problema mecânico detectado. Recomendamos verificar vazamentos de vácuo, sonda lambda e sistema de injeção.';
      break;
  }
  
  return {
    ...baseResult,
    state,
    confidence,
    adaptationProgress,
    adaptationComplete: state === 'stable' && (context === 'gas_to_ethanol' || context === 'ethanol_to_gas'),
    anomalyDetected: state === 'contaminated' || state === 'mechanical' || state === 'suspicious',
    anomalyType,
    anomalyDetails,
    recommendation,
  } as FuelDiagnosticResult;
}

/**
 * Cria dados de monitoramento iniciais
 */
export function createInitialMonitoringData(): FuelMonitoringData {
  return {
    stftCurrent: 0,
    stftAverage: 0,
    stftSamples: [],
    ltftInitial: null,
    ltftCurrent: null,
    ltftDelta: 0,
    o2Readings: [],
    o2Average: null,
    distanceMonitored: 0,
    monitoringStartTime: Date.now(),
    monitoringDuration: 0,
  };
}

/**
 * Adiciona uma amostra aos dados de monitoramento
 * CORREÇÃO v2: Usa média móvel (rolling average) em vez de média simples
 */
export function addSample(
  data: FuelMonitoringData,
  stft: number,
  ltft: number | null,
  o2?: O2SensorReading
): FuelMonitoringData {
  const newSamples = [...data.stftSamples, stft];
  
  // CORREÇÃO: Usar média móvel
  const newAverage = calculateRollingAverage(newSamples);
  
  // Primeira leitura de LTFT define o inicial
  const ltftInitial = data.ltftInitial ?? ltft;
  const ltftDelta = ltft !== null && ltftInitial !== null ? ltft - ltftInitial : data.ltftDelta;
  
  const newO2Readings = o2 ? [...data.o2Readings, o2] : data.o2Readings;
  const o2Average = newO2Readings.length > 0
    ? newO2Readings.reduce((a, b) => a + b.voltage, 0) / newO2Readings.length
    : null;
  
  return {
    ...data,
    stftCurrent: stft,
    stftAverage: newAverage,
    stftSamples: newSamples,
    ltftInitial,
    ltftCurrent: ltft,
    ltftDelta,
    o2Readings: newO2Readings,
    o2Average,
    monitoringDuration: (Date.now() - data.monitoringStartTime) / 1000,
  };
}
