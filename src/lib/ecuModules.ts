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

// Endereços alternativos por fabricante
// Muitos fabricantes usam endereços CAN diferentes dos padrões ISO
export interface AlternativeAddress {
  txHeader: string;
  rxFilter: string;
  manufacturer: string;
}

export interface AlternativeModule extends ECUModule {
  manufacturer: string;
  alternativeAddresses?: AlternativeAddress[];
}

export const ALTERNATIVE_ECU_ADDRESSES: AlternativeModule[] = [
  // VW/Audi/Seat/Skoda (VAG)
  { id: 'vag_airbag', name: 'Airbag (VAG)', shortName: 'SRS-VAG', txHeader: '715', rxFilter: '77F', category: 'body', manufacturer: 'VAG' },
  { id: 'vag_abs', name: 'ABS (VAG)', shortName: 'ABS-VAG', txHeader: '713', rxFilter: '77D', category: 'chassis', manufacturer: 'VAG' },
  { id: 'vag_bcm', name: 'BCM (VAG)', shortName: 'BCM-VAG', txHeader: '765', rxFilter: '76D', category: 'body', manufacturer: 'VAG' },
  
  // GM/Chevrolet/Opel
  { id: 'gm_bcm', name: 'BCM (GM)', shortName: 'BCM-GM', txHeader: '241', rxFilter: '641', category: 'body', manufacturer: 'GM' },
  { id: 'gm_abs', name: 'ABS (GM)', shortName: 'ABS-GM', txHeader: '243', rxFilter: '643', category: 'chassis', manufacturer: 'GM' },
  { id: 'gm_srs', name: 'Airbag (GM)', shortName: 'SRS-GM', txHeader: '244', rxFilter: '644', category: 'body', manufacturer: 'GM' },
  
  // Ford
  { id: 'ford_abs', name: 'ABS (Ford)', shortName: 'ABS-Ford', txHeader: '760', rxFilter: '768', category: 'chassis', manufacturer: 'Ford' },
  { id: 'ford_srs', name: 'Airbag (Ford)', shortName: 'SRS-Ford', txHeader: '737', rxFilter: '73F', category: 'body', manufacturer: 'Ford' },
  { id: 'ford_bcm', name: 'BCM (Ford)', shortName: 'BCM-Ford', txHeader: '726', rxFilter: '72E', category: 'body', manufacturer: 'Ford' },
  
  // Toyota/Lexus
  { id: 'toyota_abs', name: 'ABS (Toyota)', shortName: 'ABS-Toyota', txHeader: '7B0', rxFilter: '7B8', category: 'chassis', manufacturer: 'Toyota' },
  { id: 'toyota_srs', name: 'Airbag (Toyota)', shortName: 'SRS-Toyota', txHeader: '7B4', rxFilter: '7BC', category: 'body', manufacturer: 'Toyota' },
  
  // Honda/Acura
  { id: 'honda_abs', name: 'ABS (Honda)', shortName: 'ABS-Honda', txHeader: '18DA30F1', rxFilter: '18DAF130', category: 'chassis', manufacturer: 'Honda' },
  { id: 'honda_srs', name: 'Airbag (Honda)', shortName: 'SRS-Honda', txHeader: '18DA60F1', rxFilter: '18DAF160', category: 'body', manufacturer: 'Honda' },
];

// Status masks UDS para 19 02 - usar em ordem de prioridade
export const UDS_STATUS_MASKS = [
  { mask: '08', description: 'Confirmed DTCs' },
  { mask: '09', description: 'Confirmed + Test failed this cycle' },
  { mask: '2F', description: 'All stored DTCs' },
  { mask: 'AF', description: 'Stored + Pending + Permanent' },
  { mask: 'FF', description: 'All status bits (fallback)' },
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
