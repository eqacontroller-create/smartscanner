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
  manufacturerGroup: 'VAG' | 'GM' | 'Ford' | 'Toyota' | 'Honda' | 'Hyundai' | 'Nissan' | 'FCA' | 'BMW' | 'Mercedes' | 'Other';
}

export const ALTERNATIVE_ECU_ADDRESSES: AlternativeModule[] = [
  // VW/Audi/Seat/Skoda (VAG)
  { id: 'vag_airbag', name: 'Airbag (VAG)', shortName: 'SRS-VAG', txHeader: '715', rxFilter: '77F', category: 'body', manufacturer: 'VAG', manufacturerGroup: 'VAG' },
  { id: 'vag_abs', name: 'ABS (VAG)', shortName: 'ABS-VAG', txHeader: '713', rxFilter: '77D', category: 'chassis', manufacturer: 'VAG', manufacturerGroup: 'VAG' },
  { id: 'vag_bcm', name: 'BCM (VAG)', shortName: 'BCM-VAG', txHeader: '765', rxFilter: '76D', category: 'body', manufacturer: 'VAG', manufacturerGroup: 'VAG' },
  { id: 'vag_gateway', name: 'Gateway (VAG)', shortName: 'GW-VAG', txHeader: '76E', rxFilter: '776', category: 'network', manufacturer: 'VAG', manufacturerGroup: 'VAG' },
  { id: 'vag_cluster', name: 'Instrument Cluster (VAG)', shortName: 'IC-VAG', txHeader: '714', rxFilter: '77E', category: 'body', manufacturer: 'VAG', manufacturerGroup: 'VAG' },
  
  // GM/Chevrolet/Opel
  { id: 'gm_bcm', name: 'BCM (GM)', shortName: 'BCM-GM', txHeader: '241', rxFilter: '641', category: 'body', manufacturer: 'GM', manufacturerGroup: 'GM' },
  { id: 'gm_abs', name: 'ABS (GM)', shortName: 'ABS-GM', txHeader: '243', rxFilter: '643', category: 'chassis', manufacturer: 'GM', manufacturerGroup: 'GM' },
  { id: 'gm_srs', name: 'Airbag (GM)', shortName: 'SRS-GM', txHeader: '244', rxFilter: '644', category: 'body', manufacturer: 'GM', manufacturerGroup: 'GM' },
  { id: 'gm_cluster', name: 'Instrument Cluster (GM)', shortName: 'IC-GM', txHeader: '24C', rxFilter: '64C', category: 'body', manufacturer: 'GM', manufacturerGroup: 'GM' },
  
  // Ford
  { id: 'ford_abs', name: 'ABS (Ford)', shortName: 'ABS-Ford', txHeader: '760', rxFilter: '768', category: 'chassis', manufacturer: 'Ford', manufacturerGroup: 'Ford' },
  { id: 'ford_srs', name: 'Airbag (Ford)', shortName: 'SRS-Ford', txHeader: '737', rxFilter: '73F', category: 'body', manufacturer: 'Ford', manufacturerGroup: 'Ford' },
  { id: 'ford_bcm', name: 'BCM (Ford)', shortName: 'BCM-Ford', txHeader: '726', rxFilter: '72E', category: 'body', manufacturer: 'Ford', manufacturerGroup: 'Ford' },
  { id: 'ford_cluster', name: 'Instrument Cluster (Ford)', shortName: 'IC-Ford', txHeader: '720', rxFilter: '728', category: 'body', manufacturer: 'Ford', manufacturerGroup: 'Ford' },
  
  // Toyota/Lexus
  { id: 'toyota_abs', name: 'ABS (Toyota)', shortName: 'ABS-Toyota', txHeader: '7B0', rxFilter: '7B8', category: 'chassis', manufacturer: 'Toyota', manufacturerGroup: 'Toyota' },
  { id: 'toyota_srs', name: 'Airbag (Toyota)', shortName: 'SRS-Toyota', txHeader: '7B4', rxFilter: '7BC', category: 'body', manufacturer: 'Toyota', manufacturerGroup: 'Toyota' },
  { id: 'toyota_bcm', name: 'BCM (Toyota)', shortName: 'BCM-Toyota', txHeader: '750', rxFilter: '758', category: 'body', manufacturer: 'Toyota', manufacturerGroup: 'Toyota' },
  
  // Honda/Acura
  { id: 'honda_abs', name: 'ABS (Honda)', shortName: 'ABS-Honda', txHeader: '18DA30F1', rxFilter: '18DAF130', category: 'chassis', manufacturer: 'Honda', manufacturerGroup: 'Honda' },
  { id: 'honda_srs', name: 'Airbag (Honda)', shortName: 'SRS-Honda', txHeader: '18DA60F1', rxFilter: '18DAF160', category: 'body', manufacturer: 'Honda', manufacturerGroup: 'Honda' },
  { id: 'honda_bcm', name: 'BCM (Honda)', shortName: 'BCM-Honda', txHeader: '18DA40F1', rxFilter: '18DAF140', category: 'body', manufacturer: 'Honda', manufacturerGroup: 'Honda' },
  
  // Hyundai/Kia
  { id: 'hyundai_abs', name: 'ABS (Hyundai)', shortName: 'ABS-Hyundai', txHeader: '7D1', rxFilter: '7D9', category: 'chassis', manufacturer: 'Hyundai', manufacturerGroup: 'Hyundai' },
  { id: 'hyundai_srs', name: 'Airbag (Hyundai)', shortName: 'SRS-Hyundai', txHeader: '7D2', rxFilter: '7DA', category: 'body', manufacturer: 'Hyundai', manufacturerGroup: 'Hyundai' },
  { id: 'hyundai_bcm', name: 'BCM (Hyundai)', shortName: 'BCM-Hyundai', txHeader: '7A0', rxFilter: '7A8', category: 'body', manufacturer: 'Hyundai', manufacturerGroup: 'Hyundai' },
  
  // Nissan/Infiniti
  { id: 'nissan_abs', name: 'ABS (Nissan)', shortName: 'ABS-Nissan', txHeader: '740', rxFilter: '748', category: 'chassis', manufacturer: 'Nissan', manufacturerGroup: 'Nissan' },
  { id: 'nissan_srs', name: 'Airbag (Nissan)', shortName: 'SRS-Nissan', txHeader: '772', rxFilter: '77A', category: 'body', manufacturer: 'Nissan', manufacturerGroup: 'Nissan' },
  { id: 'nissan_bcm', name: 'BCM (Nissan)', shortName: 'BCM-Nissan', txHeader: '745', rxFilter: '74D', category: 'body', manufacturer: 'Nissan', manufacturerGroup: 'Nissan' },
];

// Filtrar endereços por grupo do fabricante
export function getAlternativeAddressesForManufacturer(
  manufacturerGroup: 'VAG' | 'GM' | 'Ford' | 'Toyota' | 'Honda' | 'Hyundai' | 'Nissan' | 'FCA' | 'BMW' | 'Mercedes' | 'Other'
): AlternativeModule[] {
  if (manufacturerGroup === 'Other') {
    // Para fabricantes desconhecidos, retornar todos os endereços comuns
    return ALTERNATIVE_ECU_ADDRESSES;
  }
  return ALTERNATIVE_ECU_ADDRESSES.filter(m => m.manufacturerGroup === manufacturerGroup);
}

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
