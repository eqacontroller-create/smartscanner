// Definições de módulos ECU para scan multi-módulo OBD-II
// Cada módulo tem um endereço de transmissão (TX) e recepção (RX)

export interface ECUModule {
  id: string;
  name: string;
  shortName: string;
  txHeader: string;  // Endereço para enviar (AT SH)
  rxFilter: string;  // Filtro de recepção (AT CRA)
  category: 'powertrain' | 'body' | 'chassis' | 'network';
}

export const KNOWN_ECU_MODULES: ECUModule[] = [
  { 
    id: 'ecm', 
    name: 'Engine Control Module', 
    shortName: 'ECM', 
    txHeader: '7E0', 
    rxFilter: '7E8', 
    category: 'powertrain' 
  },
  { 
    id: 'tcm', 
    name: 'Transmission Control Module', 
    shortName: 'TCM', 
    txHeader: '7E1', 
    rxFilter: '7E9', 
    category: 'powertrain' 
  },
  { 
    id: 'bcm', 
    name: 'Body Control Module', 
    shortName: 'BCM', 
    txHeader: '7E2', 
    rxFilter: '7EA', 
    category: 'body' 
  },
  { 
    id: 'abs', 
    name: 'ABS / Stability Control', 
    shortName: 'ABS', 
    txHeader: '7E3', 
    rxFilter: '7EB', 
    category: 'chassis' 
  },
  { 
    id: 'srs', 
    name: 'Airbag / SRS Module', 
    shortName: 'SRS', 
    txHeader: '7E4', 
    rxFilter: '7EC', 
    category: 'body' 
  },
  { 
    id: 'ic', 
    name: 'Instrument Cluster', 
    shortName: 'IC', 
    txHeader: '7E5', 
    rxFilter: '7ED', 
    category: 'body' 
  },
];

export interface ModuleDTC {
  code: string;
  raw: string;
  module: ECUModule;
}

export const getCategoryLabel = (category: ECUModule['category']): string => {
  const labels: Record<ECUModule['category'], string> = {
    powertrain: 'Trem de Força',
    body: 'Carroceria',
    chassis: 'Chassi',
    network: 'Rede',
  };
  return labels[category];
};

export const getCategoryIcon = (category: ECUModule['category']): string => {
  const icons: Record<ECUModule['category'], string> = {
    powertrain: '⚙️',
    body: '🚗',
    chassis: '🛞',
    network: '🔗',
  };
  return icons[category];
};
