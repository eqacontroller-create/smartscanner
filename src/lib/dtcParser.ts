// Parser para converter resposta hexadecimal OBD-II em códigos DTC legíveis
// Suporta respostas com/sem headers CAN e protocolo UDS (serviço 19)

import type { ECUModule } from './ecuModules';

export interface ParsedDTC {
  code: string;
  raw: string;
  module?: ECUModule;
}

const DTC_TYPE_MAP: Record<string, string> = {
  '0': 'P0',
  '1': 'P1',
  '2': 'P2',
  '3': 'P3',
  '4': 'C0',
  '5': 'C1',
  '6': 'C2',
  '7': 'C3',
  '8': 'B0',
  '9': 'B1',
  'A': 'B2',
  'B': 'B3',
  'C': 'U0',
  'D': 'U1',
  'E': 'U2',
  'F': 'U3',
};

// Extrai os dados de uma resposta que pode ter headers CAN
// Exemplos:
// "7E8 06 43 01 23 00 00" -> "430123"
// "7EA 03 43 B1 C7" -> "43B1C7"  
// "43 01 23 00 00" -> "4301230000"
function extractOBD2Data(response: string): string {
  const lines = response.split(/[\r\n]+/).filter(line => line.trim());
  let allData = '';
  
  for (const line of lines) {
    const clean = line.replace(/\s+/g, ' ').trim().toUpperCase();
    
    // Ignorar linhas de prompt ou comandos
    if (clean === '>' || clean.startsWith('AT') || clean.startsWith('03')) {
      continue;
    }
    
    // Padrão com header CAN: "7E8 06 43 XX XX XX XX"
    // O header é 3 caracteres hex, seguido de length byte, depois dados
    const withHeader = clean.match(/^7[0-9A-F]{2}\s+[0-9A-F]{2}\s+(43[0-9A-F\s]+)/i);
    if (withHeader) {
      allData += withHeader[1].replace(/\s/g, '');
      continue;
    }
    
    // Padrão sem header: "43 XX XX XX XX"
    const withoutHeader = clean.match(/^(43[0-9A-F\s]+)/i);
    if (withoutHeader) {
      allData += withoutHeader[1].replace(/\s/g, '');
      continue;
    }
    
    // Multi-frame: linhas que começam com número (0:, 1:, 2:) ou só dados hex
    const multiFrame = clean.match(/^[0-2]?:?\s*([0-9A-F\s]+)/i);
    if (multiFrame && !clean.includes('NO') && !clean.includes('ERROR')) {
      const data = multiFrame[1].replace(/\s/g, '');
      // Se parece com dados hex válidos
      if (/^[0-9A-F]+$/.test(data) && data.length >= 4) {
        allData += data;
      }
    }
  }
  
  return allData;
}

// Parser para respostas UDS (serviço 19 02)
// Resposta: 59 02 FF [DTC High][DTC Mid][DTC Low][Status] ...
export function parseUDSResponse(response: string): ParsedDTC[] {
  const lines = response.split(/[\r\n]+/).filter(line => line.trim());
  let allData = '';
  
  for (const line of lines) {
    const clean = line.replace(/\s+/g, ' ').trim().toUpperCase();
    
    // Com header CAN: "7E8 XX 59 02 FF ..."
    const withHeader = clean.match(/7[0-9A-F]{2}\s+[0-9A-F]{2}\s+(59[0-9A-F\s]+)/i);
    if (withHeader) {
      allData += withHeader[1].replace(/\s/g, '');
      continue;
    }
    
    // Sem header: "59 02 FF ..."
    const withoutHeader = clean.match(/^(59[0-9A-F\s]+)/i);
    if (withoutHeader) {
      allData += withoutHeader[1].replace(/\s/g, '');
    }
  }
  
  // Verificar se é resposta positiva do serviço 19 02
  if (!allData.startsWith('5902')) {
    return [];
  }
  
  // Remover "5902" e status mask (geralmente FF)
  let dtcData = allData.substring(4);
  if (dtcData.startsWith('FF')) {
    dtcData = dtcData.substring(2);
  }
  
  const dtcs: ParsedDTC[] = [];
  
  // Cada DTC no UDS: 3 bytes DTC + 1 byte status = 4 bytes = 8 hex chars
  for (let i = 0; i + 8 <= dtcData.length; i += 8) {
    const dtcBytes = dtcData.substring(i, i + 6); // 3 bytes = 6 chars
    // const statusByte = dtcData.substring(i + 6, i + 8); // 1 byte status
    
    if (dtcBytes === '000000') continue;
    
    // Primeiro byte determina o tipo
    const firstNibble = dtcBytes[0];
    const prefix = DTC_TYPE_MAP[firstNibble] || 'P0';
    const suffix = dtcBytes.substring(1, 4); // Próximos 3 caracteres
    
    const code = prefix + suffix;
    
    dtcs.push({
      code,
      raw: dtcBytes,
    });
  }
  
  return dtcs;
}

export function parseDTCResponse(response: string): ParsedDTC[] {
  const dtcData = extractOBD2Data(response);
  
  // Se não encontrou dados válidos
  if (!dtcData || dtcData.length < 2) {
    return [];
  }
  
  // Verificar se começa com 43 (resposta modo 03)
  if (!dtcData.startsWith('43')) {
    return [];
  }
  
  // Remover o prefixo "43"
  const rawDTCs = dtcData.substring(2);
  
  // Se for vazio ou só zeros
  if (!rawDTCs || rawDTCs === '00' || rawDTCs === '0000' || /^0+$/.test(rawDTCs)) {
    return [];
  }

  const dtcs: ParsedDTC[] = [];

  // Cada DTC tem 4 caracteres hexadecimais (2 bytes)
  for (let i = 0; i + 4 <= rawDTCs.length; i += 4) {
    const rawCode = rawDTCs.substring(i, i + 4);
    
    // Ignorar códigos vazios
    if (rawCode === '0000' || /^0+$/.test(rawCode)) {
      continue;
    }

    const firstChar = rawCode[0];
    const prefix = DTC_TYPE_MAP[firstChar] || 'P0';
    const suffix = rawCode.substring(1);
    
    const code = prefix + suffix;
    
    dtcs.push({
      code,
      raw: rawCode,
    });
  }

  return dtcs;
}

export function isNoErrorsResponse(response: string): boolean {
  const dtcData = extractOBD2Data(response);
  
  // Se não há dados ou é só 43 sem DTCs
  if (!dtcData || dtcData === '43') return true;
  
  // Se começa com 43 e o resto são zeros
  if (dtcData.startsWith('43')) {
    const rest = dtcData.substring(2);
    return !rest || /^0+$/.test(rest);
  }
  
  return false;
}
