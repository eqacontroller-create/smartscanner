// Fuel State Machine - Análise Forense de Combustível
// Lógica PURA (sem React) para determinar qualidade do combustível
// com precisão científica, diferenciando troca Flex de adulteração

import type {
  FuelState,
  FuelChangeContext,
  FuelMonitoringData,
  FuelDiagnosticResult,
  FuelAdaptationProgress,
  O2SensorReading,
  FuelAnalysisThresholds,
} from '@/types/fuelForensics';
import { DEFAULT_FUEL_THRESHOLDS } from '@/types/fuelForensics';

/**
 * Avalia o estado do combustível quando usuário manteve o MESMO combustível
 * Aqui, qualquer desvio significativo indica problema (adulteração ou mecânico)
 */
export function evaluateSameFuel(
  data: FuelMonitoringData,
  thresholds: FuelAnalysisThresholds = DEFAULT_FUEL_THRESHOLDS
): FuelState {
  const totalTrim = Math.abs(data.stftAverage) + Math.abs(data.ltftDelta);
  
  // Se correção total > limite, algo mudou na química do combustível
  if (totalTrim > thresholds.sameFuelMaxTrim) {
    // Verificar O2 para diferenciar adulteração de problema mecânico
    if (data.o2Average !== null) {
      const isO2Frozen = data.o2Readings.some(r => 
        (r.isLean || r.isRich) && 
        data.o2Readings.filter(x => 
          Math.abs(x.timestamp - r.timestamp) < thresholds.o2FrozenDuration * 1000
        ).length >= 3
      );
      
      if (isO2Frozen) {
        // O2 travado por muito tempo = problema mecânico (sonda, vazamento)
        return 'mechanical';
      }
      
      // O2 oscilando normalmente mas STFT alto = combustível adulterado
      return 'contaminated';
    }
    
    // Sem dados de O2, assumir suspeito
    return 'suspicious';
  }
  
  // Verificar se está no limiar de atenção
  if (totalTrim > thresholds.sameFuelWarningTrim) {
    return 'suspicious';
  }
  
  return 'stable';
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
  
  // Caso 3: STFT muito alto (> 35%) mesmo para Flex = problema
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
 */
export function validateWithO2Sensor(
  readings: O2SensorReading[],
  thresholds: FuelAnalysisThresholds = DEFAULT_FUEL_THRESHOLDS
): { isValid: boolean; frozenDuration: number; frozenType: 'lean' | 'rich' | null } {
  if (readings.length < 3) {
    return { isValid: true, frozenDuration: 0, frozenType: null };
  }
  
  // Verificar se O2 está travado em pobre ou rico
  let leanStreak = 0;
  let richStreak = 0;
  let maxLeanStreak = 0;
  let maxRichStreak = 0;
  
  for (const reading of readings) {
    if (reading.isLean) {
      leanStreak++;
      richStreak = 0;
      maxLeanStreak = Math.max(maxLeanStreak, leanStreak);
    } else if (reading.isRich) {
      richStreak++;
      leanStreak = 0;
      maxRichStreak = Math.max(maxRichStreak, richStreak);
    } else {
      leanStreak = 0;
      richStreak = 0;
    }
  }
  
  // Estimar duração assumindo ~500ms entre leituras
  const leanDuration = maxLeanStreak * 0.5;
  const richDuration = maxRichStreak * 0.5;
  
  if (leanDuration >= thresholds.o2FrozenDuration) {
    return { isValid: false, frozenDuration: leanDuration, frozenType: 'lean' };
  }
  
  if (richDuration >= thresholds.o2FrozenDuration) {
    return { isValid: false, frozenDuration: richDuration, frozenType: 'rich' };
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
 * Função principal: Avalia estado do combustível
 * Esta é a "Máquina de Estados" que determina o diagnóstico final
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
  
  // Base do resultado
  const baseResult: Partial<FuelDiagnosticResult> = {
    stftAverage: data.stftAverage,
    ltftDelta: data.ltftDelta,
    o2Average: data.o2Average,
    distanceMonitored: data.distanceMonitored,
    userContext: context,
    analyzedAt,
    evidence: {
      stftOutOfRange: Math.abs(data.stftAverage) > thresholds.sameFuelWarningTrim,
      ltftNotAdapting: context !== 'same_fuel' && Math.abs(data.ltftDelta) < thresholds.ltftMinDelta,
      o2SensorFrozen: !o2Validation.isValid,
      o2FrozenDuration: o2Validation.frozenDuration,
    },
  };
  
  let state: FuelState;
  let adaptationProgress: FuelAdaptationProgress | undefined;
  
  // Escolher algoritmo baseado no contexto
  if (context === 'same_fuel') {
    state = evaluateSameFuel(data, thresholds);
  } else if (context === 'gas_to_ethanol' || context === 'ethanol_to_gas') {
    const result = evaluateFuelSwitch(data, context, thresholds);
    state = result.state;
    adaptationProgress = result.adaptationProgress;
  } else {
    // Contexto desconhecido: usar análise conservadora
    // Se STFT alto mas direção consistente, assumir troca de combustível
    const absSTFT = Math.abs(data.stftAverage);
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
  
  // Determinar confiança
  let confidence: 'low' | 'medium' | 'high';
  if (data.distanceMonitored < thresholds.minAnalysisDistance) {
    confidence = 'low';
  } else if (data.distanceMonitored >= thresholds.recommendedDistance && data.stftSamples.length >= 10) {
    confidence = 'high';
  } else {
    confidence = 'medium';
  }
  
  // Gerar detalhes de anomalia
  let anomalyType: 'contamination' | 'mechanical' | 'sensor_fault' | undefined;
  let anomalyDetails: string | undefined;
  
  if (state === 'contaminated') {
    anomalyType = 'contamination';
    anomalyDetails = `STFT médio de ${data.stftAverage.toFixed(1)}% indica combustível fora de especificação. A ECU está compensando excessivamente.`;
  } else if (state === 'mechanical') {
    if (!o2Validation.isValid) {
      anomalyType = 'sensor_fault';
      anomalyDetails = `Sensor O2 travado em ${o2Validation.frozenType === 'lean' ? 'mistura pobre' : 'mistura rica'} por ${o2Validation.frozenDuration.toFixed(0)}s. Pode indicar problema com sonda lambda ou vazamento de vácuo.`;
    } else {
      anomalyType = 'mechanical';
      anomalyDetails = `STFT alto (${data.stftAverage.toFixed(1)}%) sem adaptação do LTFT. Pode indicar problema mecânico como vazamento de vácuo ou injetor obstruído.`;
    }
  } else if (state === 'suspicious') {
    anomalyDetails = `Valores fora do esperado. STFT: ${data.stftAverage.toFixed(1)}%, LTFT delta: ${data.ltftDelta.toFixed(1)}%. Continuando monitoramento.`;
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
 */
export function addSample(
  data: FuelMonitoringData,
  stft: number,
  ltft: number | null,
  o2?: O2SensorReading
): FuelMonitoringData {
  const newSamples = [...data.stftSamples, stft];
  const newAverage = newSamples.reduce((a, b) => a + b, 0) / newSamples.length;
  
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
