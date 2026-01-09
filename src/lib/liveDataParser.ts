// Parser para dados ao vivo OBD-II (Modo 01)
// Leitura em tempo real de sensores do veículo

export interface LivePID {
  pid: string;
  name: string;
  shortName: string;
  unit: string;
  min: number;
  max: number;
  parse: (a: number, b?: number) => number;
  format?: (value: number) => string;
}

export const LIVE_DATA_PIDS: LivePID[] = [
  {
    pid: '0C',
    name: 'Rotação do Motor',
    shortName: 'RPM',
    unit: 'RPM',
    min: 0,
    max: 8000,
    parse: (a, b = 0) => Math.round((a * 256 + b) / 4),
  },
  {
    pid: '0D',
    name: 'Velocidade do Veículo',
    shortName: 'Velocidade',
    unit: 'km/h',
    min: 0,
    max: 220,
    parse: (a) => a,
  },
  {
    pid: '05',
    name: 'Temperatura do Líquido de Arrefecimento',
    shortName: 'Temp. Motor',
    unit: '°C',
    min: -40,
    max: 150,
    parse: (a) => a - 40,
  },
  {
    pid: '04',
    name: 'Carga Calculada do Motor',
    shortName: 'Carga',
    unit: '%',
    min: 0,
    max: 100,
    parse: (a) => Math.round(a * 100 / 255),
  },
  {
    pid: '0F',
    name: 'Temperatura do Ar de Admissão',
    shortName: 'Temp. Ar',
    unit: '°C',
    min: -40,
    max: 80,
    parse: (a) => a - 40,
  },
  {
    pid: '11',
    name: 'Posição da Borboleta',
    shortName: 'Borboleta',
    unit: '%',
    min: 0,
    max: 100,
    parse: (a) => Math.round(a * 100 / 255),
  },
  {
    pid: '10',
    name: 'Fluxo de Ar MAF',
    shortName: 'MAF',
    unit: 'g/s',
    min: 0,
    max: 500,
    parse: (a, b = 0) => Math.round((a * 256 + b) / 100 * 10) / 10,
  },
  {
    pid: '0B',
    name: 'Pressão do Coletor de Admissão',
    shortName: 'MAP',
    unit: 'kPa',
    min: 0,
    max: 255,
    parse: (a) => a,
  },
  {
    pid: '0E',
    name: 'Avanço de Ignição',
    shortName: 'Avanço',
    unit: '°',
    min: -64,
    max: 64,
    parse: (a) => Math.round(a / 2 - 64),
  },
  {
    pid: '06',
    name: 'Correção de Combustível Curto Prazo (B1)',
    shortName: 'STFT B1',
    unit: '%',
    min: -50,
    max: 50,
    parse: (a) => Math.round((a - 128) * 100 / 128),
  },
  {
    pid: '07',
    name: 'Correção de Combustível Longo Prazo (B1)',
    shortName: 'LTFT B1',
    unit: '%',
    min: -50,
    max: 50,
    parse: (a) => Math.round((a - 128) * 100 / 128),
  },
  {
    pid: '2F',
    name: 'Nível de Combustível',
    shortName: 'Combustível',
    unit: '%',
    min: 0,
    max: 100,
    parse: (a) => Math.round(a * 100 / 255),
  },
  {
    pid: '42',
    name: 'Tensão da Bateria',
    shortName: 'Bateria',
    unit: 'V',
    min: 0,
    max: 20,
    parse: (a, b = 0) => Math.round((a * 256 + b) / 1000 * 10) / 10,
  },
];

// PIDs padrão para monitoramento (mais comuns)
export const DEFAULT_MONITORING_PIDS = ['0C', '0D', '05', '04'];

// Extrai dados de resposta OBD-II Mode 01
export function parseLiveDataResponse(pid: string, response: string): number | null {
  const lines = response.split(/[\r\n]+/).filter(line => line.trim());
  
  for (const line of lines) {
    const clean = line.replace(/\s+/g, '').toUpperCase();
    
    // Ignorar erros
    if (clean.includes('NODATA') || clean.includes('ERROR') || clean === '>') {
      continue;
    }
    
    // Resposta Mode 01: 41 [PID] [Data...]
    // Com header: 7E8 03 41 0C 1A F8
    // Sem header: 41 0C 1A F8
    
    const pidUpper = pid.toUpperCase();
    const responsePrefix = `41${pidUpper}`;
    
    // Com header CAN
    const withHeader = clean.match(/7[0-9A-F]{2}[0-9A-F]{2}(41[0-9A-F]+)/i);
    if (withHeader && withHeader[1].startsWith(responsePrefix)) {
      const dataStart = responsePrefix.length;
      const dataBytes = withHeader[1].substring(dataStart);
      return parseDataBytes(pid, dataBytes);
    }
    
    // Sem header
    if (clean.startsWith(responsePrefix)) {
      const dataBytes = clean.substring(responsePrefix.length);
      return parseDataBytes(pid, dataBytes);
    }
  }
  
  return null;
}

function parseDataBytes(pid: string, dataBytes: string): number | null {
  const pidInfo = LIVE_DATA_PIDS.find(p => p.pid === pid.toUpperCase());
  if (!pidInfo || dataBytes.length < 2) return null;
  
  const a = parseInt(dataBytes.substring(0, 2), 16);
  const b = dataBytes.length >= 4 ? parseInt(dataBytes.substring(2, 4), 16) : 0;
  
  if (isNaN(a)) return null;
  
  return pidInfo.parse(a, b);
}

export function getPIDInfo(pid: string): LivePID | undefined {
  return LIVE_DATA_PIDS.find(p => p.pid === pid.toUpperCase());
}
