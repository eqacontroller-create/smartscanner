// Parser para dados Freeze Frame (Modo 02 OBD-II)
// Freeze Frame captura as condições do motor no momento em que o DTC foi registrado

export interface FreezeFrameData {
  dtcThatTriggered?: string;
  engineLoad?: number;        // % (0-100)
  coolantTemp?: number;       // °C
  rpm?: number;               // RPM
  speed?: number;             // km/h
  timingAdvance?: number;     // ° before TDC
  intakeAirTemp?: number;     // °C
  mafAirFlow?: number;        // g/s
  throttlePosition?: number;  // % (0-100)
  fuelPressure?: number;      // kPa
  shortTermFuelTrim?: number; // % (-100 to 100)
  longTermFuelTrim?: number;  // % (-100 to 100)
  runTimeSinceStart?: number; // segundos
  distanceWithMIL?: number;   // km
  fuelSystemStatus?: string;
  rawData: Record<string, string>;
}

// PIDs comuns para Freeze Frame
export const FREEZE_FRAME_PIDS = [
  { pid: '02', name: 'DTC que causou Freeze Frame', unit: '' },
  { pid: '04', name: 'Carga do Motor', unit: '%' },
  { pid: '05', name: 'Temperatura do Líquido de Arrefecimento', unit: '°C' },
  { pid: '0C', name: 'Rotação do Motor (RPM)', unit: 'RPM' },
  { pid: '0D', name: 'Velocidade do Veículo', unit: 'km/h' },
  { pid: '0E', name: 'Avanço de Ignição', unit: '°' },
  { pid: '0F', name: 'Temperatura do Ar de Admissão', unit: '°C' },
  { pid: '10', name: 'Fluxo de Ar MAF', unit: 'g/s' },
  { pid: '11', name: 'Posição da Borboleta', unit: '%' },
  { pid: '06', name: 'Correção de Combustível Curto Prazo', unit: '%' },
  { pid: '07', name: 'Correção de Combustível Longo Prazo', unit: '%' },
  { pid: '0A', name: 'Pressão de Combustível', unit: 'kPa' },
  { pid: '1F', name: 'Tempo desde Partida', unit: 's' },
  { pid: '21', name: 'Distância com MIL Ligada', unit: 'km' },
];

// Extrai dados hex de resposta OBD-II (com ou sem headers)
function extractResponseData(response: string, expectedPrefix: string): string | null {
  const lines = response.split(/[\r\n]+/).filter(line => line.trim());
  
  for (const line of lines) {
    const clean = line.replace(/\s+/g, '').toUpperCase();
    
    // Ignorar linhas de erro
    if (clean.includes('NODATA') || clean.includes('ERROR') || clean === '>') {
      continue;
    }
    
    // Com header CAN: "7E8 03 42 0C 1A F8"
    const withHeader = clean.match(/7[0-9A-F]{2}[0-9A-F]{2}(42[0-9A-F]+)/i);
    if (withHeader) {
      return withHeader[1];
    }
    
    // Sem header: "42 0C 1A F8"
    if (clean.startsWith('42')) {
      return clean;
    }
  }
  
  return null;
}

// Parser para resposta do modo 02
export function parseFreezeFrameResponse(pid: string, response: string): number | string | null {
  const data = extractResponseData(response, '42');
  
  if (!data) return null;
  
  // Formato: 42 [PID] [Frame#] [Data bytes...]
  // ou: 42 [PID] [Data bytes...]
  const pidUpper = pid.toUpperCase();
  
  // Verificar se o PID na resposta corresponde
  if (!data.includes(`42${pidUpper}`)) {
    return null;
  }
  
  // Extrair bytes de dados após "42" + PID (+ opcional frame number)
  const startIdx = data.indexOf(`42${pidUpper}`) + 2 + pidUpper.length;
  let dataBytes = data.substring(startIdx);
  
  // Se tem frame number (00), pular
  if (dataBytes.startsWith('00')) {
    dataBytes = dataBytes.substring(2);
  }
  
  // Converter baseado no PID
  switch (pidUpper) {
    case '02': // DTC que causou freeze frame
      if (dataBytes.length >= 4) {
        const dtcBytes = dataBytes.substring(0, 4);
        return decodeDTC(dtcBytes);
      }
      return null;
      
    case '04': // Engine load (A * 100 / 255)
      if (dataBytes.length >= 2) {
        const a = parseInt(dataBytes.substring(0, 2), 16);
        return Math.round(a * 100 / 255);
      }
      return null;
      
    case '05': // Coolant temp (A - 40)
    case '0F': // Intake air temp (A - 40)
      if (dataBytes.length >= 2) {
        const a = parseInt(dataBytes.substring(0, 2), 16);
        return a - 40;
      }
      return null;
      
    case '0C': // RPM ((A * 256 + B) / 4)
      if (dataBytes.length >= 4) {
        const a = parseInt(dataBytes.substring(0, 2), 16);
        const b = parseInt(dataBytes.substring(2, 4), 16);
        return Math.round((a * 256 + b) / 4);
      }
      return null;
      
    case '0D': // Vehicle speed (A)
      if (dataBytes.length >= 2) {
        return parseInt(dataBytes.substring(0, 2), 16);
      }
      return null;
      
    case '0E': // Timing advance (A / 2 - 64)
      if (dataBytes.length >= 2) {
        const a = parseInt(dataBytes.substring(0, 2), 16);
        return Math.round(a / 2 - 64);
      }
      return null;
      
    case '10': // MAF air flow ((A * 256 + B) / 100)
      if (dataBytes.length >= 4) {
        const a = parseInt(dataBytes.substring(0, 2), 16);
        const b = parseInt(dataBytes.substring(2, 4), 16);
        return Math.round((a * 256 + b) / 100 * 10) / 10;
      }
      return null;
      
    case '11': // Throttle position (A * 100 / 255)
      if (dataBytes.length >= 2) {
        const a = parseInt(dataBytes.substring(0, 2), 16);
        return Math.round(a * 100 / 255);
      }
      return null;
      
    case '06': // Short term fuel trim ((A - 128) * 100 / 128)
    case '07': // Long term fuel trim
      if (dataBytes.length >= 2) {
        const a = parseInt(dataBytes.substring(0, 2), 16);
        return Math.round((a - 128) * 100 / 128);
      }
      return null;
      
    case '0A': // Fuel pressure (A * 3)
      if (dataBytes.length >= 2) {
        const a = parseInt(dataBytes.substring(0, 2), 16);
        return a * 3;
      }
      return null;
      
    case '1F': // Run time since engine start (A * 256 + B)
    case '21': // Distance traveled with MIL on
      if (dataBytes.length >= 4) {
        const a = parseInt(dataBytes.substring(0, 2), 16);
        const b = parseInt(dataBytes.substring(2, 4), 16);
        return a * 256 + b;
      }
      return null;
      
    default:
      return dataBytes;
  }
}

// Decodificar DTC de bytes hex
function decodeDTC(hexBytes: string): string {
  const DTC_TYPE_MAP: Record<string, string> = {
    '0': 'P0', '1': 'P1', '2': 'P2', '3': 'P3',
    '4': 'C0', '5': 'C1', '6': 'C2', '7': 'C3',
    '8': 'B0', '9': 'B1', 'A': 'B2', 'B': 'B3',
    'C': 'U0', 'D': 'U1', 'E': 'U2', 'F': 'U3',
  };
  
  const firstChar = hexBytes[0].toUpperCase();
  const prefix = DTC_TYPE_MAP[firstChar] || 'P0';
  const suffix = hexBytes.substring(1, 4).toUpperCase();
  
  return prefix + suffix;
}

// Formatar valor para exibição
export function formatFreezeFrameValue(pid: string, value: number | string | null): string {
  if (value === null) return 'N/A';
  
  const pidInfo = FREEZE_FRAME_PIDS.find(p => p.pid === pid.toUpperCase());
  const unit = pidInfo?.unit || '';
  
  if (typeof value === 'string') return value;
  
  return `${value}${unit ? ' ' + unit : ''}`;
}

// Nome do PID para exibição
export function getPIDName(pid: string): string {
  const pidInfo = FREEZE_FRAME_PIDS.find(p => p.pid === pid.toUpperCase());
  return pidInfo?.name || `PID ${pid}`;
}
