/**
 * Battery Forensics Service
 * High-frequency voltage capture and analysis for battery health prediction
 * 
 * Analyzes voltage drop during engine cranking to predict battery lifespan
 * and checks alternator charging after engine start.
 */

// ============= TYPES =============

export interface VoltagePoint {
  timestamp: number;  // ms since test start
  voltage: number;    // Voltage reading
}

export interface BatteryDiagnosis {
  percent: number;
  status: 'excellent' | 'good' | 'weak' | 'critical';
  message: string;
  color: string;
}

export interface AlternatorDiagnosis {
  status: 'ok' | 'weak' | 'fail' | 'unknown';
  message: string;
  color: string;
}

export interface CrankingTestResult {
  // Raw capture data
  voltageData: VoltagePoint[];
  testDurationMs: number;
  
  // Calculated metrics
  preStartVoltage: number;      // Voltage before cranking (resting battery)
  minVoltage: number;           // Lowest point during cranking
  voltageDrop: number;          // Drop (preStart - min)
  postStartVoltage: number;     // Voltage after engine starts
  recoveryTimeMs: number;       // Time to recover above 12V
  
  // Diagnosis
  batteryHealthPercent: number;
  batteryStatus: BatteryDiagnosis['status'];
  batteryMessage: string;
  batteryColor: string;
  
  alternatorStatus: AlternatorDiagnosis['status'];
  alternatorVoltage: number | null;
  alternatorMessage: string;
  alternatorColor: string;
  
  // Timestamps
  crankingStartMs: number | null;
  engineStartMs: number | null;
}

export interface BurstCaptureOptions {
  sendCommand: (cmd: string, timeout?: number) => Promise<string>;
  onVoltageReading: (point: VoltagePoint) => void;
  onPhaseChange: (phase: 'preparing' | 'waiting_start' | 'capturing' | 'post_start') => void;
  onStatusMessage: (message: string) => void;
  onPostStartProgress?: (elapsedMs: number, totalMs: number) => void;
  abortSignal?: AbortSignal;
}

// ============= CONSTANTS =============

// Battery health thresholds (voltage during cranking)
const BATTERY_THRESHOLDS = {
  EXCELLENT: 10.5,  // > 10.5V = Excellent
  GOOD: 9.6,        // 9.6V - 10.5V = Good
  WEAK: 9.0,        // 9.0V - 9.6V = Weak
  // < 9.0V = Critical
};

// Alternator thresholds
const ALTERNATOR_THRESHOLDS = {
  MIN_CHARGING: 13.5,   // Should be > 13.5V when charging
  MAX_CHARGING: 14.8,   // Should be < 14.8V (overcharging)
  WEAK_THRESHOLD: 13.0, // < 13.0V but > 13.5V is weak
};

// Capture settings
const CAPTURE_INTERVAL_MS = 50;     // Read voltage every 50ms
const RPM_CHECK_INTERVAL = 5;       // Check RPM every N voltage readings
const POST_START_DURATION_MS = 10000; // Monitor for 10s after engine starts (alternators with soft-start)
const MAX_TEST_DURATION_MS = 60000; // Maximum test duration (60s timeout)
const ENGINE_START_RPM = 400;       // RPM threshold to detect engine running

// ============= PARSERS =============

/**
 * Parse AT RV response to extract voltage
 * AT RV returns: "12.5V" or "12.5 V" or similar
 */
export function parseATRVResponse(response: string): number | null {
  const cleaned = response.replace(/[\r\n>]/g, '').trim();
  const match = cleaned.match(/(\d{1,2}\.?\d*)\s*V/i);
  if (match) {
    const voltage = parseFloat(match[1]);
    // Sanity check: voltage should be between 0 and 20V
    if (voltage >= 0 && voltage <= 20) {
      return voltage;
    }
  }
  return null;
}

/**
 * Parse RPM response from PID 010C
 */
export function parseRPMResponse(response: string): number | null {
  const cleaned = response.replace(/[\r\n>]/g, '').replace(/\s/g, '');
  // Look for "41 0C XX XX" pattern
  const match = cleaned.match(/410C([0-9A-F]{2})([0-9A-F]{2})/i);
  if (match) {
    const a = parseInt(match[1], 16);
    const b = parseInt(match[2], 16);
    return ((a * 256) + b) / 4;
  }
  return null;
}

// ============= ANALYSIS FUNCTIONS =============

/**
 * Analyze battery health based on minimum voltage during cranking
 */
export function analyzeBatteryHealth(minVoltage: number): BatteryDiagnosis {
  if (minVoltage > BATTERY_THRESHOLDS.EXCELLENT) {
    return {
      percent: 100,
      status: 'excellent',
      message: 'Bateria em excelente estado. Capacidade total de arranque.',
      color: 'hsl(var(--chart-2))' // green
    };
  } else if (minVoltage >= BATTERY_THRESHOLDS.GOOD) {
    return {
      percent: 75,
      status: 'good',
      message: 'Bateria em bom estado. Funcionando normalmente.',
      color: 'hsl(var(--chart-2))' // green
    };
  } else if (minVoltage >= BATTERY_THRESHOLDS.WEAK) {
    return {
      percent: 50,
      status: 'weak',
      message: 'Bateria enfraquecida. Pode falhar em dias frios. Considere trocar em breve.',
      color: 'hsl(var(--chart-4))' // yellow/warning
    };
  } else {
    return {
      percent: 25,
      status: 'critical',
      message: 'RISCO DE FALHA! Bateria com capacidade muito baixa. Troque imediatamente.',
      color: 'hsl(var(--destructive))' // red
    };
  }
}

/**
 * Analyze alternator based on post-start voltage
 */
export function analyzeAlternator(postVoltage: number | null): AlternatorDiagnosis {
  if (postVoltage === null) {
    return {
      status: 'unknown',
      message: 'Não foi possível verificar o alternador.',
      color: 'hsl(var(--muted-foreground))'
    };
  }
  
  if (postVoltage > ALTERNATOR_THRESHOLDS.MIN_CHARGING && postVoltage < ALTERNATOR_THRESHOLDS.MAX_CHARGING) {
    return {
      status: 'ok',
      message: `Alternador carregando corretamente (${postVoltage.toFixed(1)}V).`,
      color: 'hsl(var(--chart-2))' // green
    };
  } else if (postVoltage >= ALTERNATOR_THRESHOLDS.WEAK_THRESHOLD && postVoltage <= ALTERNATOR_THRESHOLDS.MIN_CHARGING) {
    return {
      status: 'weak',
      message: `Alternador carregando abaixo do ideal (${postVoltage.toFixed(1)}V). Verifique correia e conexões.`,
      color: 'hsl(var(--chart-4))' // yellow
    };
  } else if (postVoltage >= ALTERNATOR_THRESHOLDS.MAX_CHARGING) {
    return {
      status: 'weak',
      message: `Alternador pode estar sobrecarregando (${postVoltage.toFixed(1)}V). Verifique regulador.`,
      color: 'hsl(var(--chart-4))' // yellow
    };
  } else {
    return {
      status: 'fail',
      message: `ATENÇÃO: Alternador NÃO está carregando a bateria! (${postVoltage.toFixed(1)}V)`,
      color: 'hsl(var(--destructive))' // red
    };
  }
}

/**
 * Calculate recovery time from voltage data
 */
function calculateRecoveryTime(data: VoltagePoint[], minIndex: number): number {
  const recoveryThreshold = 12.0;
  for (let i = minIndex; i < data.length; i++) {
    if (data[i].voltage >= recoveryThreshold) {
      return data[i].timestamp - data[minIndex].timestamp;
    }
  }
  return data.length > 0 ? data[data.length - 1].timestamp - data[minIndex].timestamp : 0;
}

/**
 * Process captured data and generate full test result
 */
export function processTestData(
  data: VoltagePoint[],
  crankingStartMs: number | null,
  engineStartMs: number | null
): CrankingTestResult {
  if (data.length === 0) {
    throw new Error('Nenhum dado capturado');
  }
  
  // Find pre-start voltage (average of first 5 readings or all if less)
  const preStartCount = Math.min(5, data.length);
  const preStartVoltage = data.slice(0, preStartCount).reduce((sum, p) => sum + p.voltage, 0) / preStartCount;
  
  // Find minimum voltage and its index
  let minVoltage = Infinity;
  let minIndex = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].voltage < minVoltage) {
      minVoltage = data[i].voltage;
      minIndex = i;
    }
  }
  
  // Find post-start voltage (average of last 5 readings)
  const postStartCount = Math.min(5, data.length);
  const postStartVoltage = data.slice(-postStartCount).reduce((sum, p) => sum + p.voltage, 0) / postStartCount;
  
  // Calculate metrics
  const voltageDrop = preStartVoltage - minVoltage;
  const recoveryTimeMs = calculateRecoveryTime(data, minIndex);
  const testDurationMs = data.length > 0 ? data[data.length - 1].timestamp : 0;
  
  // Analyze battery and alternator
  const batteryDiag = analyzeBatteryHealth(minVoltage);
  const alternatorDiag = analyzeAlternator(engineStartMs ? postStartVoltage : null);
  
  return {
    voltageData: data,
    testDurationMs,
    preStartVoltage,
    minVoltage,
    voltageDrop,
    postStartVoltage,
    recoveryTimeMs,
    batteryHealthPercent: batteryDiag.percent,
    batteryStatus: batteryDiag.status,
    batteryMessage: batteryDiag.message,
    batteryColor: batteryDiag.color,
    alternatorStatus: alternatorDiag.status,
    alternatorVoltage: engineStartMs ? postStartVoltage : null,
    alternatorMessage: alternatorDiag.message,
    alternatorColor: alternatorDiag.color,
    crankingStartMs,
    engineStartMs,
  };
}

// ============= BURST CAPTURE =============

/**
 * Utility function to delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Configure ELM327 for maximum speed burst capture
 */
async function configureForBurst(sendCommand: (cmd: string, timeout?: number) => Promise<string>): Promise<boolean> {
  try {
    await sendCommand('AT E0', 1000);  // Echo off
    await sendCommand('AT H0', 1000);  // Headers off  
    await sendCommand('AT S0', 1000);  // Spaces off
    await sendCommand('AT L0', 1000);  // Linefeeds off
    return true;
  } catch {
    return false;
  }
}

/**
 * Start high-frequency voltage capture (Burst Mode)
 * Captures voltage readings at maximum speed until engine starts + 5 seconds
 */
export async function startBurstCapture(options: BurstCaptureOptions): Promise<CrankingTestResult> {
  const { sendCommand, onVoltageReading, onPhaseChange, onStatusMessage, abortSignal } = options;
  const data: VoltagePoint[] = [];
  const startTime = Date.now();
  
  let crankingStartMs: number | null = null;
  let engineStartMs: number | null = null;
  let lastRPM = 0;
  let readingCount = 0;
  let crankingDetected = false;
  let engineRunning = false;
  
  // Phase: Preparing
  onPhaseChange('preparing');
  onStatusMessage('Configurando scanner para captura de alta frequência...');
  
  const configured = await configureForBurst(sendCommand);
  if (!configured) {
    throw new Error('Falha ao configurar scanner para captura');
  }
  
  // Check initial RPM - must be 0
  onStatusMessage('Verificando se o motor está desligado...');
  const initialRpmResponse = await sendCommand('01 0C', 2000);
  const initialRpm = parseRPMResponse(initialRpmResponse);
  
  if (initialRpm !== null && initialRpm > 100) {
    throw new Error('Motor está ligado. Desligue o motor e tente novamente.');
  }
  
  // Phase: Waiting for user to start engine
  onPhaseChange('waiting_start');
  onStatusMessage('✅ Pronto! Dê a partida no motor quando quiser.');
  
  // Capture loop
  while (!abortSignal?.aborted) {
    const now = Date.now() - startTime;
    
    // Safety timeout
    if (now > MAX_TEST_DURATION_MS) {
      onStatusMessage('Tempo limite atingido. Finalizando teste.');
      break;
    }
    
    // Read voltage with AT RV (faster than PID)
    try {
      const voltageResponse = await sendCommand('AT RV', 500);
      const voltage = parseATRVResponse(voltageResponse);
      
      if (voltage !== null) {
        const point = { timestamp: now, voltage };
        data.push(point);
        onVoltageReading(point);
        readingCount++;
        
        // Detect cranking start (voltage drops below 11V suddenly)
        if (!crankingDetected && voltage < 11.0 && data.length > 5) {
          const avgPrevious = data.slice(-6, -1).reduce((s, p) => s + p.voltage, 0) / 5;
          if (avgPrevious > 11.5) {
            crankingDetected = true;
            crankingStartMs = now;
            onPhaseChange('capturing');
            onStatusMessage('📊 Partida detectada! Capturando dados...');
          }
        }
      }
    } catch {
      // Ignore read errors, continue capturing
    }
    
    // Check RPM periodically (every N voltage readings)
    if (readingCount % RPM_CHECK_INTERVAL === 0 && crankingDetected) {
      try {
        const rpmResponse = await sendCommand('01 0C', 800);
        const rpm = parseRPMResponse(rpmResponse);
        
        if (rpm !== null) {
          lastRPM = rpm;
          
          // Engine just started?
          if (!engineRunning && rpm > ENGINE_START_RPM) {
            engineRunning = true;
            engineStartMs = now;
            onPhaseChange('post_start');
            onStatusMessage('🚗 Motor ligado! Verificando alternador...');
          }
        }
      } catch {
        // Ignore RPM read errors
      }
    }
    
    // Stop POST_START_DURATION_MS after engine starts (to check alternator)
    if (engineRunning && engineStartMs) {
      const elapsedPostStart = now - engineStartMs;
      
      // Report post-start progress
      if (options.onPostStartProgress) {
        options.onPostStartProgress(elapsedPostStart, POST_START_DURATION_MS);
      }
      
      if (elapsedPostStart > POST_START_DURATION_MS) {
        onStatusMessage('✅ Captura completa!');
        break;
      }
    }
    
    // Minimum delay between readings
    await delay(CAPTURE_INTERVAL_MS);
  }
  
  if (data.length < 10) {
    throw new Error('Dados insuficientes capturados. Tente novamente.');
  }
  
  return processTestData(data, crankingStartMs, engineStartMs);
}

// ============= JARVIS INTEGRATION =============

/**
 * Generate Jarvis voice message for test result
 */
export function generateJarvisMessage(result: CrankingTestResult): string {
  const batteryPart = result.batteryHealthPercent >= 75
    ? `Bateria com ${result.batteryHealthPercent}% de saúde. ${result.batteryMessage}`
    : `Atenção: ${result.batteryMessage}`;
  
  let alternatorPart = '';
  if (result.alternatorStatus === 'ok') {
    alternatorPart = 'O alternador está operando normalmente.';
  } else if (result.alternatorStatus === 'weak') {
    alternatorPart = 'O alternador está carregando abaixo do ideal. Recomendo verificar.';
  } else if (result.alternatorStatus === 'fail') {
    alternatorPart = 'Atenção! O alternador não está carregando! Procure um eletricista automotivo.';
  }
  
  return `Análise elétrica concluída. ${batteryPart} ${alternatorPart}`.trim();
}

/**
 * Get battery status icon name for UI
 */
export function getBatteryIcon(status: BatteryDiagnosis['status']): string {
  switch (status) {
    case 'excellent': return 'BatteryFull';
    case 'good': return 'BatteryMedium';
    case 'weak': return 'BatteryLow';
    case 'critical': return 'BatteryWarning';
    default: return 'Battery';
  }
}

// ============= PARASITIC DRAW TEST =============

export interface ParasiticDrawDiagnosis {
  drawLevel: 'normal' | 'moderate' | 'excessive' | 'critical';
  estimatedDrawMilliamps: number;
  message: string;
  recommendation: string;
  color: string;
}

export interface ParasiticDrawResult {
  // Raw capture data
  voltageData: VoltagePoint[];
  testDurationMs: number;
  testDurationMinutes: number;
  
  // Calculated metrics
  startVoltage: number;
  endVoltage: number;
  totalDropMv: number;
  dropPerHourMv: number;
  
  // Diagnosis
  drawLevel: ParasiticDrawDiagnosis['drawLevel'];
  estimatedDrawMilliamps: number;
  message: string;
  recommendation: string;
  color: string;
}

export interface ParasiticDrawOptions {
  sendCommand: (cmd: string, timeout?: number) => Promise<string>;
  onVoltageReading: (point: VoltagePoint) => void;
  onProgress: (percent: number, remainingMinutes: number) => void;
  onStatusMessage: (message: string) => void;
  testDurationMinutes?: number;
  samplingIntervalSeconds?: number;
  abortSignal?: AbortSignal;
}

/**
 * Analyze parasitic draw based on voltage drop rate
 * 
 * | Drop/Hour | Diagnosis | Estimated Draw |
 * |-----------|-----------|----------------|
 * | < 10mV/h  | Normal    | < 50mA         |
 * | 10-30mV/h | Moderate  | 50-150mA       |
 * | 30-100mV/h| Excessive | 150-500mA      |
 * | > 100mV/h | Critical  | > 500mA        |
 */
export function analyzeParasiticDraw(
  startVoltage: number,
  endVoltage: number,
  durationMs: number
): ParasiticDrawDiagnosis {
  const totalDropMv = (startVoltage - endVoltage) * 1000;
  const durationHours = durationMs / (1000 * 60 * 60);
  const dropPerHour = durationHours > 0 ? totalDropMv / durationHours : 0;
  
  // Estimate current draw: ~10mV/h drop ≈ 50mA for typical 60Ah battery
  const estimatedMilliamps = Math.round((dropPerHour / 10) * 50);
  
  if (dropPerHour < 10) {
    return {
      drawLevel: 'normal',
      estimatedDrawMilliamps: Math.max(0, estimatedMilliamps),
      message: 'Consumo de repouso normal. Nenhum dreno parasita detectado.',
      recommendation: 'Bateria está descarregando na taxa esperada.',
      color: 'hsl(var(--chart-2))'
    };
  } else if (dropPerHour < 30) {
    return {
      drawLevel: 'moderate',
      estimatedDrawMilliamps: estimatedMilliamps,
      message: 'Consumo levemente elevado. Possível módulo ativo.',
      recommendation: 'Verifique se há algum acessório ligado (luz de porta, alarme, etc).',
      color: 'hsl(var(--chart-3))'
    };
  } else if (dropPerHour < 100) {
    return {
      drawLevel: 'excessive',
      estimatedDrawMilliamps: estimatedMilliamps,
      message: 'CONSUMO PARASITA DETECTADO! Algo está drenando a bateria.',
      recommendation: 'Verifique: alarme aftermarket, módulos de conforto, som automotivo, luzes internas.',
      color: 'hsl(var(--chart-4))'
    };
  } else {
    return {
      drawLevel: 'critical',
      estimatedDrawMilliamps: estimatedMilliamps,
      message: 'DRENO SEVERO! Bateria será completamente descarregada em poucas horas.',
      recommendation: 'Desconecte o negativo da bateria quando não usar. Procure um eletricista automotivo.',
      color: 'hsl(var(--destructive))'
    };
  }
}

/**
 * Start parasitic draw test - monitors voltage over extended period with engine off
 */
export async function startParasiticDrawTest(
  options: ParasiticDrawOptions
): Promise<ParasiticDrawResult> {
  const {
    sendCommand,
    onVoltageReading,
    onProgress,
    onStatusMessage,
    testDurationMinutes = 30,
    samplingIntervalSeconds = 10,
    abortSignal,
  } = options;
  
  const testDurationMs = testDurationMinutes * 60 * 1000;
  const samplingIntervalMs = samplingIntervalSeconds * 1000;
  const data: VoltagePoint[] = [];
  const startTime = Date.now();
  
  // Check if engine is off
  onStatusMessage('Verificando se o motor está desligado...');
  try {
    const rpmResponse = await sendCommand('01 0C', 2000);
    const rpm = parseRPMResponse(rpmResponse);
    if (rpm !== null && rpm > 50) {
      throw new Error('Motor está ligado. Desligue o motor e aguarde 5 minutos antes de iniciar.');
    }
  } catch (e) {
    // If we can't read RPM, continue anyway - might be key off
    if (e instanceof Error && e.message.includes('Motor está ligado')) {
      throw e;
    }
  }
  
  // Capture initial voltage
  onStatusMessage('Medindo voltagem de referência...');
  const initialVoltageResponse = await sendCommand('AT RV', 1000);
  const startVoltage = parseATRVResponse(initialVoltageResponse);
  
  if (startVoltage === null) {
    throw new Error('Não foi possível ler a voltagem da bateria.');
  }
  
  data.push({ timestamp: 0, voltage: startVoltage });
  onVoltageReading({ timestamp: 0, voltage: startVoltage });
  
  onStatusMessage(`Iniciando monitoramento de ${testDurationMinutes} minutos...`);
  
  // Monitoring loop
  while (!abortSignal?.aborted) {
    const elapsed = Date.now() - startTime;
    
    if (elapsed >= testDurationMs) {
      onStatusMessage('✅ Teste concluído!');
      break;
    }
    
    // Update progress
    const percent = Math.round((elapsed / testDurationMs) * 100);
    const remainingMs = testDurationMs - elapsed;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    onProgress(percent, remainingMinutes);
    
    // Wait for next sample
    await delay(samplingIntervalMs);
    
    // Check abort again after delay
    if (abortSignal?.aborted) break;
    
    // Read voltage
    try {
      const response = await sendCommand('AT RV', 1000);
      const voltage = parseATRVResponse(response);
      
      if (voltage !== null) {
        const newElapsed = Date.now() - startTime;
        const point = { timestamp: newElapsed, voltage };
        data.push(point);
        onVoltageReading(point);
      }
    } catch {
      // Continue monitoring even with read errors
    }
  }
  
  // Process result
  if (data.length < 3) {
    throw new Error('Dados insuficientes para análise. Teste precisa de pelo menos 3 leituras.');
  }
  
  const endVoltage = data[data.length - 1].voltage;
  const actualDurationMs = data[data.length - 1].timestamp;
  
  const diagnosis = analyzeParasiticDraw(startVoltage, endVoltage, actualDurationMs);
  
  const totalDropMv = Math.round((startVoltage - endVoltage) * 1000);
  const durationHours = actualDurationMs / (1000 * 60 * 60);
  const dropPerHourMv = durationHours > 0 ? Math.round(totalDropMv / durationHours) : 0;
  
  return {
    voltageData: data,
    testDurationMs: actualDurationMs,
    testDurationMinutes: Math.round(actualDurationMs / 60000),
    startVoltage,
    endVoltage,
    totalDropMv,
    dropPerHourMv,
    drawLevel: diagnosis.drawLevel,
    estimatedDrawMilliamps: diagnosis.estimatedDrawMilliamps,
    message: diagnosis.message,
    recommendation: diagnosis.recommendation,
    color: diagnosis.color,
  };
}

/**
 * Generate Jarvis voice message for parasitic draw test result
 */
export function generateParasiticDrawMessage(result: ParasiticDrawResult): string {
  const dropMv = result.totalDropMv;
  const duration = result.testDurationMinutes;
  
  switch (result.drawLevel) {
    case 'normal':
      return `Teste de consumo parasita concluído. Em ${duration} minutos, a voltagem caiu apenas ${dropMv} milivolts. Consumo normal, nenhum dreno detectado.`;
    case 'moderate':
      return `Teste concluído. Queda de ${dropMv} milivolts em ${duration} minutos. Consumo levemente elevado, estimado em ${result.estimatedDrawMilliamps} miliamperes. Verifique acessórios.`;
    case 'excessive':
      return `ATENÇÃO! Consumo parasita detectado! Queda de ${dropMv} milivolts em ${duration} minutos. Algo está drenando sua bateria mesmo com o carro desligado.`;
    case 'critical':
      return `ALERTA CRÍTICO! Dreno severo de bateria detectado! Consumo estimado de ${result.estimatedDrawMilliamps} miliamperes. Sua bateria será descarregada em poucas horas se permanecer parada.`;
  }
}
