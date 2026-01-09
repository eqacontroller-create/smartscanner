// Base de dados de códigos DTC comuns com descrições
// Focado em códigos frequentes para Ford Focus

export interface DTCInfo {
  name: string;
  description: string;
  causes: string[];
  severity: 'low' | 'medium' | 'high';
}

export const dtcDatabase: Record<string, DTCInfo> = {
  // Códigos de Motor (P0XXX)
  'P0100': {
    name: 'Circuito do Sensor de Fluxo de Ar (MAF)',
    description: 'Problema no circuito do sensor de massa de ar. O sensor MAF mede a quantidade de ar que entra no motor.',
    causes: ['Sensor MAF sujo ou danificado', 'Fiação danificada', 'Vazamento de ar na admissão'],
    severity: 'medium',
  },
  'P0101': {
    name: 'Sensor MAF - Faixa/Desempenho',
    description: 'O sensor de fluxo de ar está fora da faixa esperada de operação.',
    causes: ['Filtro de ar entupido', 'Vazamento no sistema de admissão', 'Sensor MAF contaminado'],
    severity: 'medium',
  },
  'P0103': {
    name: 'Sensor MAF - Sinal Alto',
    description: 'O sensor de fluxo de ar está enviando um sinal acima do esperado.',
    causes: ['Curto-circuito na fiação', 'Sensor MAF defeituoso', 'Problema no módulo de controle'],
    severity: 'medium',
  },
  'P0106': {
    name: 'Sensor MAP - Faixa/Desempenho',
    description: 'Pressão do coletor de admissão fora da faixa esperada.',
    causes: ['Vazamento de vácuo', 'Sensor MAP defeituoso', 'Mangueira de vácuo desconectada'],
    severity: 'medium',
  },
  'P0113': {
    name: 'Sensor de Temperatura do Ar - Sinal Alto',
    description: 'O sensor de temperatura do ar de admissão está reportando temperatura muito alta.',
    causes: ['Sensor IAT defeituoso', 'Curto-circuito na fiação', 'Conector corroído'],
    severity: 'low',
  },
  'P0120': {
    name: 'Sensor de Posição do Acelerador - Circuito',
    description: 'Problema no circuito do sensor de posição do pedal do acelerador.',
    causes: ['Sensor TPS defeituoso', 'Fiação danificada', 'Conector solto'],
    severity: 'high',
  },
  'P0130': {
    name: 'Sensor de Oxigênio (Banco 1, Sensor 1)',
    description: 'Problema no sensor de oxigênio antes do catalisador.',
    causes: ['Sensor de O2 desgastado', 'Vazamento de escape', 'Problema de fiação'],
    severity: 'medium',
  },
  'P0133': {
    name: 'Sensor O2 - Resposta Lenta (B1S1)',
    description: 'O sensor de oxigênio está respondendo lentamente às mudanças de combustível.',
    causes: ['Sensor de O2 envelhecido', 'Contaminação do sensor', 'Vazamento de escape'],
    severity: 'medium',
  },
  'P0171': {
    name: 'Mistura Pobre - Banco 1',
    description: 'O sistema detectou que a mistura ar/combustível está muito pobre (muito ar, pouco combustível).',
    causes: ['Vazamento de vácuo', 'Bomba de combustível fraca', 'Injetores sujos', 'Sensor MAF sujo'],
    severity: 'medium',
  },
  'P0172': {
    name: 'Mistura Rica - Banco 1',
    description: 'O sistema detectou que a mistura ar/combustível está muito rica (muito combustível, pouco ar).',
    causes: ['Injetores com vazamento', 'Regulador de pressão defeituoso', 'Sensor de O2 defeituoso'],
    severity: 'medium',
  },
  'P0300': {
    name: 'Falhas Múltiplas de Ignição Detectadas',
    description: 'Múltiplos cilindros estão apresentando falhas de ignição aleatórias.',
    causes: ['Velas de ignição gastas', 'Cabos de ignição danificados', 'Bobina de ignição defeituosa', 'Baixa compressão'],
    severity: 'high',
  },
  'P0301': {
    name: 'Falha de Ignição - Cilindro 1',
    description: 'O cilindro 1 está falhando na ignição.',
    causes: ['Vela de ignição do cilindro 1', 'Bobina do cilindro 1', 'Injetor do cilindro 1'],
    severity: 'high',
  },
  'P0302': {
    name: 'Falha de Ignição - Cilindro 2',
    description: 'O cilindro 2 está falhando na ignição.',
    causes: ['Vela de ignição do cilindro 2', 'Bobina do cilindro 2', 'Injetor do cilindro 2'],
    severity: 'high',
  },
  'P0303': {
    name: 'Falha de Ignição - Cilindro 3',
    description: 'O cilindro 3 está falhando na ignição.',
    causes: ['Vela de ignição do cilindro 3', 'Bobina do cilindro 3', 'Injetor do cilindro 3'],
    severity: 'high',
  },
  'P0304': {
    name: 'Falha de Ignição - Cilindro 4',
    description: 'O cilindro 4 está falhando na ignição.',
    causes: ['Vela de ignição do cilindro 4', 'Bobina do cilindro 4', 'Injetor do cilindro 4'],
    severity: 'high',
  },
  'P0325': {
    name: 'Sensor de Detonação - Circuito',
    description: 'Problema no circuito do sensor de detonação (knock sensor).',
    causes: ['Sensor de detonação defeituoso', 'Fiação danificada', 'Conector corroído'],
    severity: 'medium',
  },
  'P0340': {
    name: 'Sensor de Posição do Comando de Válvulas',
    description: 'Problema no sensor de posição do eixo de comando.',
    causes: ['Sensor CMP defeituoso', 'Correia dentada esticada', 'Problema de sincronização'],
    severity: 'high',
  },
  'P0401': {
    name: 'Fluxo EGR Insuficiente',
    description: 'O sistema de recirculação de gases de escape não está funcionando adequadamente.',
    causes: ['Válvula EGR entupida', 'Passagens de EGR bloqueadas', 'Sensor de posição EGR defeituoso'],
    severity: 'medium',
  },
  'P0420': {
    name: 'Eficiência do Catalisador Abaixo do Limite',
    description: 'O conversor catalítico não está funcionando com a eficiência esperada.',
    causes: ['Catalisador desgastado', 'Vazamento de escape', 'Sensor de O2 traseiro defeituoso'],
    severity: 'medium',
  },
  'P0440': {
    name: 'Sistema de Controle de Emissões Evaporativas',
    description: 'Problema geral no sistema EVAP que controla vapores de combustível.',
    causes: ['Tampa do tanque solta', 'Vazamento no sistema EVAP', 'Válvula de purga defeituosa'],
    severity: 'low',
  },
  'P0442': {
    name: 'Sistema EVAP - Vazamento Pequeno Detectado',
    description: 'Foi detectado um pequeno vazamento no sistema de emissões evaporativas.',
    causes: ['Tampa do tanque mal fechada', 'Mangueira EVAP rachada', 'Válvula de purga com vazamento'],
    severity: 'low',
  },
  'P0455': {
    name: 'Sistema EVAP - Vazamento Grande Detectado',
    description: 'Foi detectado um grande vazamento no sistema de emissões evaporativas.',
    causes: ['Tampa do tanque ausente', 'Mangueira EVAP desconectada', 'Cânister danificado'],
    severity: 'medium',
  },
  'P0500': {
    name: 'Sensor de Velocidade do Veículo',
    description: 'Problema no sensor de velocidade do veículo (VSS).',
    causes: ['Sensor VSS defeituoso', 'Fiação danificada', 'Problema no cluster de instrumentos'],
    severity: 'medium',
  },
  'P0505': {
    name: 'Sistema de Controle de Marcha Lenta',
    description: 'Problema no sistema de controle de marcha lenta do motor.',
    causes: ['Válvula IAC suja', 'Corpo de borboleta sujo', 'Vazamento de vácuo'],
    severity: 'medium',
  },
  'P0507': {
    name: 'Marcha Lenta Alta',
    description: 'A rotação de marcha lenta está acima do esperado.',
    causes: ['Vazamento de vácuo', 'Corpo de borboleta sujo', 'Válvula IAC defeituosa'],
    severity: 'low',
  },
  'P0562': {
    name: 'Tensão do Sistema Baixa',
    description: 'A tensão do sistema elétrico está abaixo do normal.',
    causes: ['Bateria fraca', 'Alternador defeituoso', 'Conexões de bateria corroídas'],
    severity: 'medium',
  },
  'P0600': {
    name: 'Comunicação Serial - Link de Dados',
    description: 'Problema de comunicação entre módulos do veículo.',
    causes: ['Problema no barramento CAN', 'Módulo defeituoso', 'Fiação danificada'],
    severity: 'high',
  },
  'P0700': {
    name: 'Sistema de Controle da Transmissão',
    description: 'Indica que há um código de falha armazenado no módulo da transmissão.',
    causes: ['Verificar códigos específicos da transmissão', 'Problema no TCM'],
    severity: 'high',
  },
  'P0715': {
    name: 'Sensor de Rotação de Entrada da Transmissão',
    description: 'Problema no sensor de velocidade de entrada da transmissão.',
    causes: ['Sensor de entrada defeituoso', 'Fiação danificada', 'Baixo nível de fluido'],
    severity: 'high',
  },
};

export function getDTCInfo(code: string): DTCInfo | null {
  return dtcDatabase[code] || null;
}

export function getDefaultDTCInfo(code: string): DTCInfo {
  return {
    name: `Código de Diagnóstico ${code}`,
    description: `Este é um código de diagnóstico OBD-II. Consulte um mecânico para diagnóstico detalhado.`,
    causes: ['Consulte o manual do veículo', 'Diagnóstico profissional recomendado'],
    severity: 'medium',
  };
}
