// OBD-II Response Parser
// Parsing de respostas do ELM327 e dados do veículo

import { OBD_PIDS, getPIDByCode, type PIDDefinition } from './OBDProtocol';

export interface ParseResult {
  success: boolean;
  value: number | null;
  raw: string;
  noData?: boolean;
}

export interface VINInfo {
  vin: string;
  manufacturer: string | null;
  modelYear: string | null;
  country: string | null;
}

// Limpa resposta OBD-II removendo caracteres especiais
export function cleanResponse(response: string): string {
  return response.replace(/[\r\n>\s]/g, '').toUpperCase();
}

// Verifica se a resposta indica erro ou sem dados
export function isErrorResponse(cleanedResponse: string): boolean {
  return (
    cleanedResponse.includes('NODATA') ||
    cleanedResponse.includes('ERROR') ||
    cleanedResponse.includes('STOPPED') ||
    cleanedResponse.startsWith('7F') ||
    cleanedResponse.includes('UNABLE') ||
    cleanedResponse.includes('SEARCHING') ||
    cleanedResponse === '>' ||
    cleanedResponse.length < 4
  );
}

// Parse resposta OBD-II Mode 01 para um PID específico
export function parseOBDResponse(pidCode: string, response: string): ParseResult {
  const clean = cleanResponse(response);
  const pidDef = getPIDByCode(pidCode);
  
  if (!pidDef) {
    return { success: false, value: null, raw: clean };
  }

  // Verificar NODATA (sensor não disponível)
  if (clean.includes('NODATA')) {
    return { success: true, value: null, raw: clean, noData: true };
  }

  // Verificar erros
  if (isErrorResponse(clean)) {
    return { success: false, value: null, raw: clean };
  }

  // Resposta Mode 01: 41 [PID] [Data...]
  const responsePrefix = `41${pidCode.toUpperCase()}`;
  
  // Tentar match com ou sem header CAN
  let dataBytes: string | null = null;
  
  // Com header CAN: 7E8 03 41 0C 1A F8
  const withHeader = clean.match(/7[0-9A-F]{2}[0-9A-F]{2}(41[0-9A-F]+)/i);
  if (withHeader && withHeader[1].startsWith(responsePrefix)) {
    dataBytes = withHeader[1].substring(responsePrefix.length);
  }
  
  // Sem header: 41 0C 1A F8
  if (!dataBytes && clean.includes(responsePrefix)) {
    const idx = clean.indexOf(responsePrefix);
    dataBytes = clean.substring(idx + responsePrefix.length);
  }

  if (!dataBytes || dataBytes.length < 2) {
    return { success: false, value: null, raw: clean };
  }

  return parseDataBytes(pidDef, dataBytes, clean);
}

// Parse bytes de dados usando a definição do PID
function parseDataBytes(pidDef: PIDDefinition, dataBytes: string, raw: string): ParseResult {
  const a = parseInt(dataBytes.substring(0, 2), 16);
  
  if (isNaN(a)) {
    return { success: false, value: null, raw };
  }

  let value: number;
  
  if (pidDef.bytes === 2 && dataBytes.length >= 4) {
    const b = parseInt(dataBytes.substring(2, 4), 16);
    value = pidDef.decode(a, isNaN(b) ? 0 : b);
  } else {
    value = pidDef.decode(a);
  }

  return { success: true, value, raw };
}

// Parse resposta do VIN (Mode 09 PID 02)
export function parseVINResponse(response: string): VINInfo | null {
  try {
    const lines = response.split(/[\r\n]+/).filter(line => line.trim());
    let hexData = '';
    
    for (const line of lines) {
      const clean = line.replace(/\s+/g, '').toUpperCase();
      
      if (isErrorResponse(clean)) {
        continue;
      }
      
      if (clean.includes('4902')) {
        const idx = clean.indexOf('4902');
        hexData += clean.substring(idx + 4);
      } else if (clean.match(/^[0-9A-F]+$/)) {
        hexData += clean;
      }
    }
    
    if (hexData.length < 34) return null;
    
    let vin = '';
    for (let i = 0; i < Math.min(hexData.length, 40); i += 2) {
      const byte = parseInt(hexData.substring(i, i + 2), 16);
      if (byte >= 32 && byte <= 126) {
        vin += String.fromCharCode(byte);
      }
    }
    
    vin = vin.replace(/[^A-Z0-9]/gi, '').substring(0, 17);
    
    if (vin.length !== 17) return null;
    
    const wmi = vin.substring(0, 3);
    const yearChar = vin.charAt(9);
    
    return {
      vin,
      manufacturer: getManufacturerFromWMI(wmi),
      modelYear: getYearFromVIN(yearChar),
      country: getCountryFromWMI(wmi),
    };
  } catch {
    return null;
  }
}

// Mapas de decodificação VIN
const WMI_MANUFACTURER_MAP: Record<string, string> = {
  '9BW': 'Volkswagen', '93W': 'Volkswagen', '3VW': 'Volkswagen', 'WVW': 'Volkswagen',
  '9BF': 'Ford', '1FA': 'Ford', '3FA': 'Ford', 'WF0': 'Ford',
  '9BG': 'Chevrolet', '1G1': 'Chevrolet', '3G1': 'Chevrolet',
  '93H': 'Honda', 'JHM': 'Honda', '1HG': 'Honda',
  '9BD': 'Fiat', 'ZFA': 'Fiat',
  '9BR': 'Toyota', 'JT2': 'Toyota', '4T1': 'Toyota',
  'KMH': 'Hyundai', '5NP': 'Hyundai',
  'VF1': 'Renault', '93Y': 'Renault',
  'JN1': 'Nissan', '1N4': 'Nissan',
  '1J4': 'Jeep', '1C4': 'Jeep',
  'WBA': 'BMW', 'WBS': 'BMW',
  'WDB': 'Mercedes-Benz', 'WDC': 'Mercedes-Benz',
  'WAU': 'Audi', 'WUA': 'Audi',
};

const VIN_YEAR_MAP: Record<string, string> = {
  'A': '2010', 'B': '2011', 'C': '2012', 'D': '2013', 'E': '2014',
  'F': '2015', 'G': '2016', 'H': '2017', 'J': '2018', 'K': '2019',
  'L': '2020', 'M': '2021', 'N': '2022', 'P': '2023', 'R': '2024',
  'S': '2025', 'T': '2026', 'V': '2027', 'W': '2028', 'X': '2029',
  'Y': '2030',
  '1': '2001', '2': '2002', '3': '2003', '4': '2004', '5': '2005',
  '6': '2006', '7': '2007', '8': '2008', '9': '2009',
};

const WMI_COUNTRY_MAP: Record<string, string> = {
  '1': 'Estados Unidos', '2': 'Canadá', '3': 'México',
  '9': 'Brasil', 'J': 'Japão', 'K': 'Coreia do Sul',
  'W': 'Alemanha', 'V': 'França', 'Z': 'Itália',
  'S': 'Reino Unido', 'Y': 'Suécia/Finlândia',
};

function getManufacturerFromWMI(wmi: string): string | null {
  return WMI_MANUFACTURER_MAP[wmi] || null;
}

function getYearFromVIN(char: string): string | null {
  return VIN_YEAR_MAP[char.toUpperCase()] || null;
}

function getCountryFromWMI(wmi: string): string | null {
  return WMI_COUNTRY_MAP[wmi.charAt(0).toUpperCase()] || null;
}

// Exportar todos os PIDs como array para compatibilidade
export function getAllPIDs(): PIDDefinition[] {
  return Object.values(OBD_PIDS);
}
