// Decodificador de VIN (Vehicle Identification Number)
// O VIN tem 17 caracteres e contém informações sobre fabricante, modelo, ano, etc.

export type ManufacturerGroup = 'VAG' | 'GM' | 'Ford' | 'Toyota' | 'Honda' | 'Hyundai' | 'Nissan' | 'FCA' | 'BMW' | 'Mercedes' | 'Other';

export interface VINInfo {
  vin: string;
  manufacturer: string;
  country: string;
  modelYear: string;
  plantCode: string;
  serialNumber: string;
  manufacturerGroup: ManufacturerGroup;
}

// Mapa de WMI (World Manufacturer Identifier) - primeiros 3 caracteres
const WMI_MAP: Record<string, { manufacturer: string; country: string }> = {
  // Brasil
  '9BW': { manufacturer: 'Volkswagen', country: 'Brasil' },
  '9BG': { manufacturer: 'Chevrolet', country: 'Brasil' },
  '9BD': { manufacturer: 'Fiat', country: 'Brasil' },
  '93Y': { manufacturer: 'Renault', country: 'Brasil' },
  '9BF': { manufacturer: 'Ford', country: 'Brasil' },
  '93H': { manufacturer: 'Honda', country: 'Brasil' },
  '9BR': { manufacturer: 'Toyota', country: 'Brasil' },
  '936': { manufacturer: 'Peugeot', country: 'Brasil' },
  '935': { manufacturer: 'Citroën', country: 'Brasil' },
  '94D': { manufacturer: 'Nissan', country: 'Brasil' },
  '9BM': { manufacturer: 'Mercedes-Benz', country: 'Brasil' },
  '93X': { manufacturer: 'Mitsubishi', country: 'Brasil' },
  '9C2': { manufacturer: 'Honda Motos', country: 'Brasil' },
  '9C6': { manufacturer: 'Yamaha', country: 'Brasil' },
  '93W': { manufacturer: 'Hyundai', country: 'Brasil' },
  '9BS': { manufacturer: 'Scania', country: 'Brasil' },
  // Estados Unidos
  '1G1': { manufacturer: 'Chevrolet', country: 'EUA' },
  '1G2': { manufacturer: 'Pontiac', country: 'EUA' },
  '1G3': { manufacturer: 'Oldsmobile', country: 'EUA' },
  '1G4': { manufacturer: 'Buick', country: 'EUA' },
  '1G6': { manufacturer: 'Cadillac', country: 'EUA' },
  '1GC': { manufacturer: 'Chevrolet Truck', country: 'EUA' },
  '1GT': { manufacturer: 'GMC Truck', country: 'EUA' },
  '1FA': { manufacturer: 'Ford', country: 'EUA' },
  '1FB': { manufacturer: 'Ford', country: 'EUA' },
  '1FC': { manufacturer: 'Ford', country: 'EUA' },
  '1FD': { manufacturer: 'Ford', country: 'EUA' },
  '1FM': { manufacturer: 'Ford', country: 'EUA' },
  '1FT': { manufacturer: 'Ford Truck', country: 'EUA' },
  '1C3': { manufacturer: 'Chrysler', country: 'EUA' },
  '1C4': { manufacturer: 'Chrysler', country: 'EUA' },
  '1C6': { manufacturer: 'Chrysler', country: 'EUA' },
  '1D7': { manufacturer: 'Dodge', country: 'EUA' },
  '1J4': { manufacturer: 'Jeep', country: 'EUA' },
  '1J8': { manufacturer: 'Jeep', country: 'EUA' },
  '1N4': { manufacturer: 'Nissan', country: 'EUA' },
  '1N6': { manufacturer: 'Nissan Truck', country: 'EUA' },
  '1HG': { manufacturer: 'Honda', country: 'EUA' },
  '2HG': { manufacturer: 'Honda', country: 'Canadá' },
  '2HK': { manufacturer: 'Honda', country: 'Canadá' },
  '2HM': { manufacturer: 'Hyundai', country: 'Canadá' },
  '2T1': { manufacturer: 'Toyota', country: 'Canadá' },
  '2T2': { manufacturer: 'Lexus', country: 'Canadá' },
  '3FA': { manufacturer: 'Ford', country: 'México' },
  '3VW': { manufacturer: 'Volkswagen', country: 'México' },
  '3G1': { manufacturer: 'Chevrolet', country: 'México' },
  '3N1': { manufacturer: 'Nissan', country: 'México' },
  '4T1': { manufacturer: 'Toyota', country: 'EUA' },
  '4T3': { manufacturer: 'Toyota', country: 'EUA' },
  '4T4': { manufacturer: 'Toyota', country: 'EUA' },
  '5FN': { manufacturer: 'Honda', country: 'EUA' },
  '5J6': { manufacturer: 'Honda', country: 'EUA' },
  '5NP': { manufacturer: 'Hyundai', country: 'EUA' },
  '5XY': { manufacturer: 'Kia', country: 'EUA' },
  '5YJ': { manufacturer: 'Tesla', country: 'EUA' },
  // Europa
  'WVW': { manufacturer: 'Volkswagen', country: 'Alemanha' },
  'WV1': { manufacturer: 'Volkswagen Comerciais', country: 'Alemanha' },
  'WV2': { manufacturer: 'Volkswagen', country: 'Alemanha' },
  'WAU': { manufacturer: 'Audi', country: 'Alemanha' },
  'WUA': { manufacturer: 'Audi Quattro', country: 'Alemanha' },
  'WBA': { manufacturer: 'BMW', country: 'Alemanha' },
  'WBS': { manufacturer: 'BMW M', country: 'Alemanha' },
  'WDB': { manufacturer: 'Mercedes-Benz', country: 'Alemanha' },
  'WDC': { manufacturer: 'Mercedes-Benz', country: 'Alemanha' },
  'WDD': { manufacturer: 'Mercedes-Benz', country: 'Alemanha' },
  'WMW': { manufacturer: 'Mini', country: 'Reino Unido' },
  'WP0': { manufacturer: 'Porsche', country: 'Alemanha' },
  'WF0': { manufacturer: 'Ford', country: 'Alemanha' },
  'ZFF': { manufacturer: 'Ferrari', country: 'Itália' },
  'ZFA': { manufacturer: 'Fiat', country: 'Itália' },
  'ZAR': { manufacturer: 'Alfa Romeo', country: 'Itália' },
  'ZAM': { manufacturer: 'Maserati', country: 'Itália' },
  'ZHW': { manufacturer: 'Lamborghini', country: 'Itália' },
  'VF1': { manufacturer: 'Renault', country: 'França' },
  'VF3': { manufacturer: 'Peugeot', country: 'França' },
  'VF7': { manufacturer: 'Citroën', country: 'França' },
  'VSS': { manufacturer: 'SEAT', country: 'Espanha' },
  // Ásia
  'JHM': { manufacturer: 'Honda', country: 'Japão' },
  'JT2': { manufacturer: 'Toyota', country: 'Japão' },
  'JT3': { manufacturer: 'Toyota', country: 'Japão' },
  'JTE': { manufacturer: 'Toyota', country: 'Japão' },
  'JN1': { manufacturer: 'Nissan', country: 'Japão' },
  'JN8': { manufacturer: 'Nissan', country: 'Japão' },
  'JA3': { manufacturer: 'Mitsubishi', country: 'Japão' },
  'JA4': { manufacturer: 'Mitsubishi', country: 'Japão' },
  'JM1': { manufacturer: 'Mazda', country: 'Japão' },
  'JMZ': { manufacturer: 'Mazda', country: 'Japão' },
  'JS1': { manufacturer: 'Suzuki', country: 'Japão' },
  'JS2': { manufacturer: 'Suzuki', country: 'Japão' },
  'JF1': { manufacturer: 'Subaru', country: 'Japão' },
  'JF2': { manufacturer: 'Subaru', country: 'Japão' },
  'KMH': { manufacturer: 'Hyundai', country: 'Coreia do Sul' },
  'KNA': { manufacturer: 'Kia', country: 'Coreia do Sul' },
  'KNB': { manufacturer: 'Kia', country: 'Coreia do Sul' },
  'KND': { manufacturer: 'Kia', country: 'Coreia do Sul' },
  'KNM': { manufacturer: 'Renault Samsung', country: 'Coreia do Sul' },
  'LVS': { manufacturer: 'Ford', country: 'China' },
  'LFV': { manufacturer: 'FAW-Volkswagen', country: 'China' },
  'LSV': { manufacturer: 'Shanghai VW', country: 'China' },
  'LBV': { manufacturer: 'BMW Brilliance', country: 'China' },
};

// Mapa de ano do modelo (posição 10 do VIN)
const YEAR_MAP: Record<string, string> = {
  'A': '2010', 'B': '2011', 'C': '2012', 'D': '2013', 'E': '2014',
  'F': '2015', 'G': '2016', 'H': '2017', 'J': '2018', 'K': '2019',
  'L': '2020', 'M': '2021', 'N': '2022', 'P': '2023', 'R': '2024',
  'S': '2025', 'T': '2026', 'V': '2027', 'W': '2028', 'X': '2029',
  'Y': '2030',
  '1': '2001', '2': '2002', '3': '2003', '4': '2004', '5': '2005',
  '6': '2006', '7': '2007', '8': '2008', '9': '2009',
};

// Parser para resposta do comando 0902 (VIN)
export function parseVINResponse(response: string): string | null {
  const lines = response.split(/[\r\n]+/).filter(line => line.trim());
  let allData = '';
  
  for (const line of lines) {
    const clean = line.replace(/\s+/g, ' ').trim().toUpperCase();
    
    // Ignorar linhas de prompt, comandos ou erros
    if (clean === '>' || 
        clean.startsWith('09') || 
        clean.includes('NODATA') || 
        clean.includes('NO DATA') ||
        clean.includes('ERROR') ||
        clean.includes('UNABLE')) {
      continue;
    }
    
    // Resposta positiva do modo 09 PID 02: começa com 49 02
    // Formato com header: "7E8 10 14 49 02 01 XX XX XX XX"
    // Formato sem header: "49 02 01 XX XX XX XX"
    
    // Com header CAN - extrair dados após 49 02
    const withHeader = clean.match(/7[0-9A-F]{2}\s+[0-9A-F]{2}\s+(49\s*02[0-9A-F\s]+)/i);
    if (withHeader) {
      allData += withHeader[1].replace(/\s/g, '');
      continue;
    }
    
    // Sem header - procurar 49 02
    const withoutHeader = clean.match(/(49\s*02[0-9A-F\s]+)/i);
    if (withoutHeader) {
      allData += withoutHeader[1].replace(/\s/g, '');
      continue;
    }
    
    // Linhas de continuação (multi-frame): 0:, 1:, 2: ou apenas hex
    const continuation = clean.match(/^[0-2]?:?\s*([0-9A-F\s]+)/i);
    if (continuation) {
      const data = continuation[1].replace(/\s/g, '');
      if (/^[0-9A-F]+$/.test(data)) {
        allData += data;
      }
    }
  }
  
  // Verificar se tem resposta válida do modo 09 02
  if (!allData.includes('4902')) {
    return null;
  }
  
  // Remover prefixo 4902 e o byte de contagem (geralmente 01)
  const startIdx = allData.indexOf('4902');
  let vinHex = allData.substring(startIdx + 4);
  
  // Remover byte de contagem se presente (01, 02, etc)
  if (vinHex.startsWith('01') || vinHex.startsWith('00')) {
    vinHex = vinHex.substring(2);
  }
  
  // Converter hex para ASCII
  let vin = '';
  for (let i = 0; i < vinHex.length && vin.length < 17; i += 2) {
    const hexByte = vinHex.substring(i, i + 2);
    const charCode = parseInt(hexByte, 16);
    
    // Caracteres válidos de VIN são ASCII imprimíveis (exceto I, O, Q)
    if (charCode >= 32 && charCode <= 126) {
      vin += String.fromCharCode(charCode);
    }
  }
  
  // VIN deve ter exatamente 17 caracteres
  if (vin.length >= 17) {
    return vin.substring(0, 17);
  }
  
  return vin.length >= 11 ? vin : null;
}

// Decodificar informações do VIN
export function decodeVIN(vin: string): VINInfo | null {
  if (!vin || vin.length < 11) return null;
  
  const upperVIN = vin.toUpperCase();
  const wmi = upperVIN.substring(0, 3);
  
  // Buscar fabricante pelo WMI
  const wmiInfo = WMI_MAP[wmi] || {
    manufacturer: getManufacturerByFirstChar(wmi[0]),
    country: getCountryByFirstChar(wmi[0]),
  };
  
  // Ano do modelo (posição 10, índice 9)
  const yearChar = upperVIN.length >= 10 ? upperVIN[9] : '';
  const modelYear = YEAR_MAP[yearChar] || 'Desconhecido';
  
  // Código da planta (posição 11, índice 10)
  const plantCode = upperVIN.length >= 11 ? upperVIN[10] : '';
  
  // Número serial (posições 12-17)
  const serialNumber = upperVIN.length >= 17 ? upperVIN.substring(11, 17) : '';
  
  // Determinar grupo do fabricante para endereços CAN
  const manufacturerGroup = getManufacturerGroup(wmiInfo.manufacturer);
  
  return {
    vin: upperVIN,
    manufacturer: wmiInfo.manufacturer,
    country: wmiInfo.country,
    modelYear,
    plantCode,
    serialNumber,
    manufacturerGroup,
  };
}

// Mapear fabricante para grupo (para endereços CAN alternativos)
export function getManufacturerGroup(manufacturer: string): ManufacturerGroup {
  const upper = manufacturer.toUpperCase();
  
  // VAG Group (Volkswagen, Audi, Seat, Skoda, Porsche, Lamborghini)
  if (upper.includes('VOLKSWAGEN') || upper.includes('VW') ||
      upper.includes('AUDI') || upper.includes('SEAT') ||
      upper.includes('SKODA') || upper.includes('PORSCHE') ||
      upper.includes('LAMBORGHINI')) {
    return 'VAG';
  }
  
  // GM Group (Chevrolet, GMC, Buick, Cadillac, Opel, Vauxhall)
  if (upper.includes('CHEVROLET') || upper.includes('GMC') ||
      upper.includes('BUICK') || upper.includes('CADILLAC') ||
      upper.includes('OPEL') || upper.includes('VAUXHALL') ||
      upper.includes('OLDSMOBILE') || upper.includes('PONTIAC')) {
    return 'GM';
  }
  
  // Ford Group (Ford, Lincoln, Mercury)
  if (upper.includes('FORD') || upper.includes('LINCOLN') ||
      upper.includes('MERCURY')) {
    return 'Ford';
  }
  
  // Toyota Group (Toyota, Lexus, Scion)
  if (upper.includes('TOYOTA') || upper.includes('LEXUS') ||
      upper.includes('SCION')) {
    return 'Toyota';
  }
  
  // Honda Group (Honda, Acura)
  if (upper.includes('HONDA') || upper.includes('ACURA')) {
    return 'Honda';
  }
  
  // Hyundai-Kia Group
  if (upper.includes('HYUNDAI') || upper.includes('KIA') ||
      upper.includes('GENESIS')) {
    return 'Hyundai';
  }
  
  // Nissan Group (Nissan, Infiniti, Datsun)
  if (upper.includes('NISSAN') || upper.includes('INFINITI') ||
      upper.includes('DATSUN') || upper.includes('RENAULT')) {
    return 'Nissan';
  }
  
  // FCA/Stellantis (Fiat, Chrysler, Jeep, Dodge, Ram, Alfa Romeo, Maserati, Peugeot, Citroën)
  if (upper.includes('FIAT') || upper.includes('CHRYSLER') ||
      upper.includes('JEEP') || upper.includes('DODGE') ||
      upper.includes('RAM') || upper.includes('ALFA') ||
      upper.includes('MASERATI') || upper.includes('PEUGEOT') ||
      upper.includes('CITRO')) {
    return 'FCA';
  }
  
  // BMW Group (BMW, Mini, Rolls-Royce)
  if (upper.includes('BMW') || upper.includes('MINI') ||
      upper.includes('ROLLS')) {
    return 'BMW';
  }
  
  // Mercedes Group (Mercedes, Smart, Maybach)
  if (upper.includes('MERCEDES') || upper.includes('SMART') ||
      upper.includes('MAYBACH')) {
    return 'Mercedes';
  }
  
  return 'Other';
}

function getManufacturerByFirstChar(char: string): string {
  const firstCharMap: Record<string, string> = {
    '1': 'Fabricante EUA',
    '2': 'Fabricante Canadá',
    '3': 'Fabricante México',
    '4': 'Fabricante EUA',
    '5': 'Fabricante EUA',
    '6': 'Fabricante Austrália',
    '7': 'Fabricante Nova Zelândia',
    '8': 'Fabricante Argentina',
    '9': 'Fabricante Brasil',
    'J': 'Fabricante Japão',
    'K': 'Fabricante Coreia',
    'L': 'Fabricante China',
    'S': 'Fabricante Reino Unido',
    'V': 'Fabricante França/Espanha',
    'W': 'Fabricante Alemanha',
    'X': 'Fabricante Rússia',
    'Y': 'Fabricante Suécia/Finlândia',
    'Z': 'Fabricante Itália',
  };
  return firstCharMap[char] || 'Fabricante Desconhecido';
}

function getCountryByFirstChar(char: string): string {
  const countryMap: Record<string, string> = {
    '1': 'EUA', '2': 'Canadá', '3': 'México', '4': 'EUA', '5': 'EUA',
    '6': 'Austrália', '7': 'Nova Zelândia', '8': 'Argentina', '9': 'Brasil',
    'J': 'Japão', 'K': 'Coreia do Sul', 'L': 'China',
    'S': 'Reino Unido', 'V': 'França/Espanha', 'W': 'Alemanha',
    'X': 'Rússia', 'Y': 'Suécia/Finlândia', 'Z': 'Itália',
  };
  return countryMap[char] || 'Desconhecido';
}
