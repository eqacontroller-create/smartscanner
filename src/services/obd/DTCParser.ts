// Parser para converter resposta hexadecimal OBD-II em códigos DTC legíveis
// Suporta respostas com/sem headers CAN, protocolo UDS (serviço 19) e multi-frame

import type { ECUModule } from '@/lib/ecuModules';
import logger from '@/lib/logger';

export interface ParsedDTC {
  code: string;
  raw: string;
  module?: ECUModule;
  status?: string; // Status byte do UDS
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

// Headers CAN conhecidos que NÃO são DTCs (ECU response addresses)
const CAN_HEADERS = new Set([
  '7E8', '7E9', '7EA', '7EB', '7EC', '7ED', '7EE', '7EF', // Respostas ECU padrão
  '7E0', '7E1', '7E2', '7E3', '7E4', '7E5', '7E6', '7E7', // Requests ECU
  '7DF', // Broadcast address
  '7F0', '7F1', '7F2', '7F3', '7F4', '7F5', '7F6', '7F7', // Extended addresses
  '7F8', '7F9', '7FA', '7FB', '7FC', '7FD', '7FE', '7FF',
]);

// ===== NOISE FILTER: Valida dados brutos antes de parsear =====
function isValidDTCData(data: string): boolean {
  // Mínimo 4 caracteres hex para 1 DTC
  if (data.length < 4) return false;
  
  // Deve conter apenas hex válido
  if (!/^[0-9A-Fa-f]+$/.test(data)) return false;
  
  // Não pode ser só caracteres repetidos (buffer lixo)
  if (/^(.)\1+$/.test(data)) return false;
  
  // Padrões de lixo conhecidos
  const junkPatterns = [
    /^FF+$/i,      // Buffer cheio de FFs
    /^00+$/,       // Buffer zerado
    /^55+$/,       // Sync pattern
    /^AA+$/i,      // Outro sync
    /^(.{2})\1+$/, // Bytes repetidos (ex: "ABABABAB")
  ];
  
  for (const pattern of junkPatterns) {
    if (pattern.test(data)) {
      logger.debug(`[DTC Parser] Dados descartados: buffer inválido (${data.substring(0, 20)})`);
      return false;
    }
  }
  
  return true;
}

// ===== NOISE FILTER: Valida formato de código DTC (mais rigoroso) =====
function isPlausibleDTC(code: string): boolean {
  // Formato: P/C/B/U + dígito (0-3) + 3 hex
  if (!/^[PCBU][0-3][0-9A-F]{3}$/i.test(code)) return false;
  
  // Filtrar códigos estatisticamente improváveis (nunca existem em veículos reais)
  const impossiblePatterns = [
    /^[PCBU]0000$/i,     // Código zerado
    /^[PCBU][0-3]FFF$/i, // Buffer overflow
    /^[PCBU]7E[0-9A-F]{2}$/i, // Parece header 7Exx
    /^[PCBU]7F[0-9A-F]{2}$/i, // Parece header 7Fxx
    /^[PCBU]0F{3}$/i,    // Padding comum
    /^[PCBU][0-3](.)\1{2}$/i, // Padrão repetido (ex: P0111, P0AAA)
  ];
  
  for (const pattern of impossiblePatterns) {
    if (pattern.test(code)) {
      logger.debug(`[DTC Parser] Código improvável descartado: ${code}`);
      return false;
    }
  }
  
  return true;
}

// Valida se um código DTC é válido (não é header CAN ou código inválido)
function isValidDTCCode(code: string): boolean {
  if (!code || code.length < 5) return false;
  
  // Verificar formato: Letra (P/C/B/U) + dígito (0-3) + 3 hex
  if (!/^[PCBU][0-3][0-9A-F]{3}$/i.test(code)) return false;
  
  // NOVO: Usar filtro de plausibilidade
  if (!isPlausibleDTC(code)) return false;
  
  // Extrair a parte numérica do código
  const numericPart = code.substring(1);
  
  // Verificar se parece com um header CAN (7Ex, 7Fx patterns)
  const rawEquivalent = code[0] === 'P' ? code.substring(2) :
                        code[0] === 'C' ? '4' + code.substring(2) :
                        code[0] === 'B' ? '8' + code.substring(2) :
                        'C' + code.substring(2);
                        
  // Se o raw começa com 7E ou 7F, provavelmente é header
  if (rawEquivalent.startsWith('7E') || rawEquivalent.startsWith('7F')) {
    return false;
  }
  
  // Verificar padrões específicos que indicam headers ou ruído
  // P7E8 = 7E8x (header), P7EA = 7EAx (header), etc.
  if (/^[78][0-9A-F]{3}$/.test(numericPart)) {
    logger.debug(`[DTC Parser] Rejeitando código suspeito (parece header): ${code}`);
    return false;
  }
  
  // Verificar se é código 0000 disfarçado
  if (numericPart === '0000') return false;
  
  return true;
}

// Valida raw hex para não ser um header CAN
function isNotCANHeader(rawHex: string): boolean {
  const upper = rawHex.toUpperCase();
  
  // Verificar diretamente se é um header conhecido
  if (CAN_HEADERS.has(upper.substring(0, 3))) return false;
  
  // Verificar padrão 7Exx ou 7Fxx
  if (/^7[EF][0-9A-F]/i.test(upper)) return false;
  
  return true;
}

// Extrai e concatena dados de respostas multi-frame ISO-TP
// Formato: 
// - Single frame: 0X [data]
// - First frame: 1X XX [data] 
// - Consecutive: 2X [data]
function extractMultiFrameData(response: string): string {
  const lines = response.split(/[\r\n]+/).filter(line => line.trim());
  let allData = '';
  let isMultiFrame = false;
  
  for (const line of lines) {
    const clean = line.replace(/\s+/g, ' ').trim().toUpperCase();
    
    // Ignorar linhas de prompt ou comandos
    if (clean === '>' || clean.startsWith('AT') || clean.length < 4) {
      continue;
    }
    
    // Detectar e extrair dados com header CAN (ex: "7E8 06 59 02 FF ...")
    const withHeader = clean.match(/^7[0-9A-F]{2}\s+([0-9A-F]{2})\s+([0-9A-F\s]+)/i);
    if (withHeader) {
      const pci = withHeader[1]; // Protocol Control Information byte
      const data = withHeader[2].replace(/\s/g, '');
      
      // Single frame (0X) - length in lower nibble
      if (pci[0] === '0') {
        allData += data;
      }
      // First frame (1X XX) - multi-frame start
      else if (pci[0] === '1') {
        isMultiFrame = true;
        // Skip first byte (part of length), rest is data
        allData += data.substring(2);
      }
      // Consecutive frame (2X)
      else if (pci[0] === '2' && isMultiFrame) {
        allData += data;
      }
      continue;
    }
    
    // Sem header - dados diretos
    const directData = clean.replace(/\s/g, '');
    if (/^[0-9A-F]+$/.test(directData)) {
      allData += directData;
    }
  }
  
  return allData;
}

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
// Resposta: 59 02 [mask] [DTC High][DTC Mid][DTC Low][Status] ...
// Suporta single-frame e multi-frame
export function parseUDSResponse(response: string): ParsedDTC[] {
  // Primeiro tentar extrair dados multi-frame
  let allData = extractMultiFrameData(response);
  
  // Se não funcionou, tentar método legado
  if (!allData.includes('5902') && !allData.includes('59 02')) {
    const lines = response.split(/[\r\n]+/).filter(line => line.trim());
    allData = '';
    
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
  }
  
  // Verificar se é resposta positiva do serviço 19 02
  if (!allData.includes('5902')) {
    return [];
  }
  
  // Encontrar início dos dados (depois de 5902)
  const startIdx = allData.indexOf('5902');
  let dtcData = allData.substring(startIdx + 4);
  
  // Remover status mask (geralmente FF, 08, 09, 2F, AF)
  if (/^[0-9A-F]{2}/.test(dtcData)) {
    dtcData = dtcData.substring(2);
  }
  
  const dtcs: ParsedDTC[] = [];
  const seenCodes = new Set<string>();
  
  // Cada DTC no UDS: 3 bytes DTC + 1 byte status = 4 bytes = 8 hex chars
  for (let i = 0; i + 8 <= dtcData.length; i += 8) {
    const dtcBytes = dtcData.substring(i, i + 6).toUpperCase(); // 3 bytes = 6 chars
    const statusByte = dtcData.substring(i + 6, i + 8); // 1 byte status
    
    // Ignorar códigos vazios
    if (dtcBytes === '000000' || /^0+$/.test(dtcBytes)) continue;
    
    // NOVO: Verificar se não é um header CAN disfarçado
    if (!isNotCANHeader(dtcBytes.substring(0, 3))) {
      logger.debug(`[DTC Parser UDS] Ignorando header CAN: ${dtcBytes}`);
      continue;
    }
    
    // Converter bytes para código DTC
    // Formato UDS: [High][Mid][Low] onde High determina a letra
    const firstNibble = dtcBytes[0];
    const prefix = DTC_TYPE_MAP[firstNibble] || 'P0';
    const suffix = dtcBytes.substring(1, 4);
    
    // Validar que o código parece válido
    if (!/^[0-9A-F]+$/.test(suffix)) continue;
    
    const code = prefix + suffix;
    
    // NOVO: Validar formato do código DTC
    if (!isValidDTCCode(code)) {
      logger.debug(`[DTC Parser UDS] Ignorando código inválido: ${code} (raw: ${dtcBytes})`);
      continue;
    }
    
    // NOVO: Evitar duplicatas
    if (seenCodes.has(code)) {
      continue;
    }
    seenCodes.add(code);
    
    dtcs.push({
      code,
      raw: dtcBytes,
      status: statusByte,
    });
  }
  
  return dtcs;
}

// Parser para resposta negativa UDS (7F)
export function isNegativeResponse(response: string): boolean {
  const clean = response.replace(/[\s\r\n]/g, '').toUpperCase();
  return clean.includes('7F19') || clean.includes('7F 19');
}

// Extrai código de erro negativo UDS
export function getNegativeResponseCode(response: string): string | null {
  const clean = response.replace(/[\s\r\n]/g, '').toUpperCase();
  const match = clean.match(/7F19([0-9A-F]{2})/);
  if (match) {
    const nrc = match[1];
    const nrcMap: Record<string, string> = {
      '10': 'General Reject',
      '11': 'Service Not Supported',
      '12': 'Sub-Function Not Supported',
      '13': 'Incorrect Message Length',
      '14': 'Response Too Long',
      '22': 'Conditions Not Correct',
      '31': 'Request Out Of Range',
      '33': 'Security Access Denied',
      '35': 'Invalid Key',
      '72': 'General Programming Failure',
      '78': 'Request Correctly Received - Response Pending',
    };
    return nrcMap[nrc] || `Unknown NRC: ${nrc}`;
  }
  return null;
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
  
  // NOVO: Validar dados brutos antes de parsear (Noise Filter)
  if (!isValidDTCData(rawDTCs)) {
    return [];
  }

  const dtcs: ParsedDTC[] = [];
  const seenCodes = new Set<string>();

  // Cada DTC tem 4 caracteres hexadecimais (2 bytes)
  for (let i = 0; i + 4 <= rawDTCs.length; i += 4) {
    const rawCode = rawDTCs.substring(i, i + 4).toUpperCase();
    
    // Ignorar códigos vazios ou padding
    if (rawCode === '0000' || /^0+$/.test(rawCode)) {
      continue;
    }
    
    // NOVO: Verificar se não é um header CAN
    if (!isNotCANHeader(rawCode)) {
      logger.debug(`[DTC Parser] Ignorando header CAN: ${rawCode}`);
      continue;
    }

    const firstChar = rawCode[0];
    const prefix = DTC_TYPE_MAP[firstChar] || 'P0';
    const suffix = rawCode.substring(1);
    
    const code = prefix + suffix;
    
    // NOVO: Validar formato do código DTC
    if (!isValidDTCCode(code)) {
      logger.debug(`[DTC Parser] Ignorando código inválido: ${code} (raw: ${rawCode})`);
      continue;
    }
    
    // NOVO: Evitar duplicatas
    if (seenCodes.has(code)) {
      continue;
    }
    seenCodes.add(code);
    
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
