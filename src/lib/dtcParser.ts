// Parser para converter resposta hexadecimal OBD-II em códigos DTC legíveis
// Formato: XYZZ onde X determina o tipo (P, C, B, U)

export interface ParsedDTC {
  code: string;
  raw: string;
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

export function parseDTCResponse(response: string): ParsedDTC[] {
  // Limpar resposta
  const cleanResponse = response
    .replace(/[\r\n>\s]/g, '')
    .toUpperCase();

  // Verificar se é resposta válida de DTCs (começa com 43)
  if (!cleanResponse.startsWith('43')) {
    return [];
  }

  // Remover o prefixo "43" (resposta do modo 03)
  const dtcData = cleanResponse.substring(2);

  // Se for "00" ou vazio, não há erros
  if (dtcData === '00' || dtcData === '' || dtcData === '0000') {
    return [];
  }

  const dtcs: ParsedDTC[] = [];

  // Cada DTC tem 4 caracteres hexadecimais
  for (let i = 0; i < dtcData.length; i += 4) {
    const rawCode = dtcData.substring(i, i + 4);
    
    // Ignorar códigos vazios (0000)
    if (rawCode === '0000' || rawCode.length < 4) {
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
  const cleanResponse = response
    .replace(/[\r\n>\s]/g, '')
    .toUpperCase();

  // "43" sozinho ou "4300" indica sem erros
  return cleanResponse === '43' || 
         cleanResponse === '4300' || 
         cleanResponse === '430000' ||
         cleanResponse.startsWith('43') && cleanResponse.substring(2).replace(/0/g, '') === '';
}
