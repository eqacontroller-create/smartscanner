import type { ParsedDTC } from '@/lib/dtcParser';

// Tipos de comparação de scans
export interface DTCComparisonResult {
  newCodes: string[];           // Códigos que apareceram
  resolvedCodes: string[];      // Códigos que sumiram
  persistentCodes: string[];    // Códigos que permaneceram
  hasChanges: boolean;
  summary: string;
}

// Classificar severidade do código
export function getDTCSeverity(code: string): 'critical' | 'warning' | 'info' {
  if (!code || code.length < 5) return 'info';
  
  const prefix = code[0].toUpperCase();
  const secondChar = code[1];
  
  // Powertrain (motor/transmissão) - mais críticos
  if (prefix === 'P') {
    // P0xxx - Códigos genéricos padronizados
    if (secondChar === '0') {
      // Misfire (P0300-P0312)
      if (code.match(/P030[0-9]|P031[0-2]/)) return 'critical';
      // Fuel system (P0170-P0175)
      if (code.match(/P017[0-5]/)) return 'critical';
      // Oxygen sensors (P0130-P0167)
      if (code.match(/P01[3-6][0-9]/)) return 'warning';
      // Catalytic converter (P0420-P0434)
      if (code.match(/P04[2-3][0-9]/)) return 'warning';
      // EVAP (P0440-P0456)
      if (code.match(/P04[4-5][0-9]/)) return 'warning';
    }
    // P1xxx - Códigos específicos do fabricante
    if (secondChar === '1') return 'warning';
    // P2xxx, P3xxx - Códigos genéricos adicionais
    if (secondChar === '2' || secondChar === '3') return 'warning';
  }
  
  // Chassis - freios, suspensão, direção
  if (prefix === 'C') {
    // ABS related (C0xxx)
    if (secondChar === '0') return 'warning';
    return 'info';
  }
  
  // Body - conforto, ar condicionado, elétrica
  if (prefix === 'B') {
    return 'info';
  }
  
  // Network/Communication - CAN, comunicação entre módulos
  if (prefix === 'U') {
    // Perda de comunicação com módulos críticos
    if (code.match(/U01[0-1][0-9]/)) return 'warning';
    return 'info';
  }
  
  return 'warning';
}

// Obter descrição amigável da severidade
export function getSeverityDescription(severity: 'critical' | 'warning' | 'info'): string {
  switch (severity) {
    case 'critical':
      return 'Erro crítico que pode afetar a segurança ou causar danos ao motor';
    case 'warning':
      return 'Atenção recomendada, mas não é urgente';
    case 'info':
      return 'Informativo, verificar quando possível';
  }
}

// Gerar mensagem para Jarvis (voz)
export function generateVoiceAlert(
  newCodes: string[], 
  resolvedCodes: string[]
): string | null {
  if (newCodes.length === 0 && resolvedCodes.length === 0) {
    return null;
  }
  
  const parts: string[] = [];
  
  if (newCodes.length > 0) {
    // Verificar se há códigos críticos
    const criticalCodes = newCodes.filter(code => getDTCSeverity(code) === 'critical');
    
    if (criticalCodes.length > 0) {
      parts.push(
        `Atenção! ${criticalCodes.length} erro${criticalCodes.length > 1 ? 's' : ''} crítico${criticalCodes.length > 1 ? 's' : ''} detectado${criticalCodes.length > 1 ? 's' : ''}. ` +
        `Código ${criticalCodes[0]}. Recomendo verificar imediatamente.`
      );
    } else {
      parts.push(
        `${newCodes.length} novo${newCodes.length > 1 ? 's' : ''} código${newCodes.length > 1 ? 's' : ''} de erro encontrado${newCodes.length > 1 ? 's' : ''}.`
      );
    }
  }
  
  if (resolvedCodes.length > 0) {
    parts.push(
      `${resolvedCodes.length} erro${resolvedCodes.length > 1 ? 's foram' : ' foi'} resolvido${resolvedCodes.length > 1 ? 's' : ''}.`
    );
  }
  
  return parts.join(' ');
}

// Gerar mensagem resumida para toast
export function generateToastMessage(
  newCodes: string[], 
  resolvedCodes: string[]
): { title: string; description: string; variant: 'default' | 'destructive' } | null {
  if (newCodes.length === 0 && resolvedCodes.length === 0) {
    return null;
  }
  
  if (newCodes.length > 0) {
    const hasCritical = newCodes.some(code => getDTCSeverity(code) === 'critical');
    
    return {
      title: `⚠️ ${newCodes.length} Novo${newCodes.length > 1 ? 's' : ''} Erro${newCodes.length > 1 ? 's' : ''} Detectado${newCodes.length > 1 ? 's' : ''}!`,
      description: newCodes.slice(0, 5).join(', ') + (newCodes.length > 5 ? ` e mais ${newCodes.length - 5}...` : ''),
      variant: hasCritical ? 'destructive' : 'default',
    };
  }
  
  if (resolvedCodes.length > 0) {
    return {
      title: `✅ ${resolvedCodes.length} Erro${resolvedCodes.length > 1 ? 's' : ''} Resolvido${resolvedCodes.length > 1 ? 's' : ''}!`,
      description: resolvedCodes.slice(0, 5).join(', ') + (resolvedCodes.length > 5 ? ` e mais ${resolvedCodes.length - 5}...` : ''),
      variant: 'default',
    };
  }
  
  return null;
}

// Classificar lista de DTCs por severidade
export function sortDTCsBySeverity(dtcs: ParsedDTC[]): ParsedDTC[] {
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  
  return [...dtcs].sort((a, b) => {
    const severityA = getDTCSeverity(a.code);
    const severityB = getDTCSeverity(b.code);
    return severityOrder[severityA] - severityOrder[severityB];
  });
}

// Agrupar DTCs por categoria (prefixo)
export function groupDTCsByCategory(codes: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {
    powertrain: [],
    chassis: [],
    body: [],
    network: [],
  };
  
  for (const code of codes) {
    const prefix = code[0]?.toUpperCase();
    switch (prefix) {
      case 'P':
        groups.powertrain.push(code);
        break;
      case 'C':
        groups.chassis.push(code);
        break;
      case 'B':
        groups.body.push(code);
        break;
      case 'U':
        groups.network.push(code);
        break;
    }
  }
  
  return groups;
}
