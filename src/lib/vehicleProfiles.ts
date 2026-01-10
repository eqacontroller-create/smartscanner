// Sistema de Perfis de Veículo para Scanner Universal
// Mapeamento WMI (World Manufacturer Identifier) para marcas

export type VehicleBrand = 
  | 'volkswagen' 
  | 'ford' 
  | 'chevrolet' 
  | 'honda' 
  | 'fiat' 
  | 'toyota' 
  | 'hyundai' 
  | 'renault'
  | 'nissan'
  | 'jeep'
  | 'bmw'
  | 'mercedes'
  | 'audi'
  | 'generic';

export interface VehicleProfile {
  brand: VehicleBrand;
  displayName: string;
  slogan: string;
  // Cores HSL para CSS variables
  colors: {
    primary: string; // HSL format: "h s% l%"
    accent: string;
    primaryForeground: string;
  };
}

export interface DetectedVehicle {
  vin: string | null;
  brand: VehicleBrand;
  manufacturer: string;
  modelYear: string | null;
  country: string | null;
  profile: VehicleProfile;
}

// Perfis de cada marca com cores e configurações
export const VEHICLE_PROFILES: Record<VehicleBrand, VehicleProfile> = {
  volkswagen: {
    brand: 'volkswagen',
    displayName: 'Volkswagen',
    slogan: 'Das Auto',
    colors: {
      primary: '214 100% 16%', // Azul escuro VW #001E50
      accent: '195 100% 41%', // Azul claro #00A0D2
      primaryForeground: '0 0% 100%',
    },
  },
  ford: {
    brand: 'ford',
    displayName: 'Ford',
    slogan: 'Built Ford Tough',
    colors: {
      primary: '212 100% 22%', // Azul Ford #003478
      accent: '199 89% 48%', // Azul claro
      primaryForeground: '0 0% 100%',
    },
  },
  chevrolet: {
    brand: 'chevrolet',
    displayName: 'Chevrolet',
    slogan: 'Find New Roads',
    colors: {
      primary: '43 73% 52%', // Dourado #D4AF37
      accent: '0 0% 20%', // Preto
      primaryForeground: '0 0% 10%',
    },
  },
  honda: {
    brand: 'honda',
    displayName: 'Honda',
    slogan: 'The Power of Dreams',
    colors: {
      primary: '0 100% 40%', // Vermelho Honda #CC0000
      accent: '0 0% 75%', // Prata
      primaryForeground: '0 0% 100%',
    },
  },
  fiat: {
    brand: 'fiat',
    displayName: 'Fiat',
    slogan: 'Driven by Passion',
    colors: {
      primary: '352 74% 41%', // Vermelho Fiat #B81E2D
      accent: '0 0% 100%', // Branco
      primaryForeground: '0 0% 100%',
    },
  },
  toyota: {
    brand: 'toyota',
    displayName: 'Toyota',
    slogan: "Let's Go Places",
    colors: {
      primary: '0 92% 48%', // Vermelho Toyota #EB0A1E
      accent: '0 0% 50%', // Cinza
      primaryForeground: '0 0% 100%',
    },
  },
  hyundai: {
    brand: 'hyundai',
    displayName: 'Hyundai',
    slogan: 'New Thinking. New Possibilities.',
    colors: {
      primary: '212 100% 19%', // Azul marinho #002C5F
      accent: '0 0% 75%', // Prata
      primaryForeground: '0 0% 100%',
    },
  },
  renault: {
    brand: 'renault',
    displayName: 'Renault',
    slogan: 'Passion for Life',
    colors: {
      primary: '48 100% 50%', // Amarelo #FFCC00
      accent: '0 0% 20%', // Preto
      primaryForeground: '0 0% 10%',
    },
  },
  nissan: {
    brand: 'nissan',
    displayName: 'Nissan',
    slogan: 'Innovation that Excites',
    colors: {
      primary: '0 0% 20%', // Preto/Cinza escuro
      accent: '0 100% 50%', // Vermelho
      primaryForeground: '0 0% 100%',
    },
  },
  jeep: {
    brand: 'jeep',
    displayName: 'Jeep',
    slogan: 'Go Anywhere. Do Anything.',
    colors: {
      primary: '80 50% 30%', // Verde oliva militar
      accent: '0 0% 20%', // Preto
      primaryForeground: '0 0% 100%',
    },
  },
  bmw: {
    brand: 'bmw',
    displayName: 'BMW',
    slogan: 'The Ultimate Driving Machine',
    colors: {
      primary: '210 100% 30%', // Azul BMW
      accent: '0 0% 90%', // Branco/Prata
      primaryForeground: '0 0% 100%',
    },
  },
  mercedes: {
    brand: 'mercedes',
    displayName: 'Mercedes-Benz',
    slogan: 'The Best or Nothing',
    colors: {
      primary: '0 0% 15%', // Preto elegante
      accent: '0 0% 75%', // Prata
      primaryForeground: '0 0% 100%',
    },
  },
  audi: {
    brand: 'audi',
    displayName: 'Audi',
    slogan: 'Vorsprung durch Technik',
    colors: {
      primary: '0 0% 15%', // Preto
      accent: '0 100% 50%', // Vermelho
      primaryForeground: '0 0% 100%',
    },
  },
  generic: {
    brand: 'generic',
    displayName: 'Veículo',
    slogan: 'Scanner Universal OBD-II',
    colors: {
      primary: '142 76% 45%', // Verde padrão do app
      accent: '199 89% 48%', // Azul
      primaryForeground: '222 47% 11%',
    },
  },
};

// Mapeamento WMI para marcas
// WMI = World Manufacturer Identifier (primeiros 3 caracteres do VIN)
const WMI_TO_BRAND: Record<string, VehicleBrand> = {
  // Volkswagen
  '9BW': 'volkswagen', '93W': 'volkswagen', '3VW': 'volkswagen', 
  'WVW': 'volkswagen', 'WV1': 'volkswagen', 'WV2': 'volkswagen',
  'WV3': 'volkswagen', 'AAV': 'volkswagen',
  
  // Audi (parte do grupo VW)
  'WAU': 'audi', 'WUA': 'audi', 'TRU': 'audi', '93V': 'audi',
  
  // Ford
  '9BF': 'ford', '1FA': 'ford', '1FB': 'ford', '1FC': 'ford',
  '1FD': 'ford', '1FM': 'ford', '1FT': 'ford', '3FA': 'ford',
  'WF0': 'ford', '6FP': 'ford', 'NM0': 'ford',
  
  // GM/Chevrolet
  '9BG': 'chevrolet', '1G1': 'chevrolet', '1G2': 'chevrolet',
  '1G4': 'chevrolet', '1G6': 'chevrolet', '1GC': 'chevrolet',
  '1GT': 'chevrolet', '3G1': 'chevrolet', '8AG': 'chevrolet',
  
  // Honda
  '93H': 'honda', 'JHM': 'honda', '1HG': 'honda', '2HG': 'honda',
  '5FN': 'honda', '5J6': 'honda', 'MLH': 'honda',
  
  // Fiat
  '9BD': 'fiat', 'ZFA': 'fiat', 'ZAR': 'fiat', 'ZFF': 'fiat',
  'ZLA': 'fiat', 'ZAM': 'fiat',
  
  // Toyota
  '9BR': 'toyota', 'JT2': 'toyota', 'JT3': 'toyota', 'JTE': 'toyota',
  '4T1': 'toyota', '4T3': 'toyota', '2T1': 'toyota', 'MR0': 'toyota',
  'JTD': 'toyota', 'JTN': 'toyota', 'JTM': 'toyota',
  
  // Hyundai
  'KMH': 'hyundai', '5NP': 'hyundai', '2HM': 'hyundai',
  'KMF': 'hyundai', 'MAL': 'hyundai',
  
  // Renault
  '93Y': 'renault', 'VF1': 'renault', 'VF2': 'renault',
  'KNM': 'renault',
  
  // Nissan
  '94D': 'nissan', 'JN1': 'nissan', '1N4': 'nissan', '1N6': 'nissan',
  '3N1': 'nissan', '5N1': 'nissan', 'JN8': 'nissan',
  
  // Jeep
  '1J4': 'jeep', '1J8': 'jeep', '1C4': 'jeep', 'WK2': 'jeep',
  
  // BMW
  'WBA': 'bmw', 'WBS': 'bmw', 'WBY': 'bmw', '5UX': 'bmw',
  
  // Mercedes-Benz
  'WDB': 'mercedes', 'WDC': 'mercedes', 'WDD': 'mercedes',
  'WDF': 'mercedes', '4JG': 'mercedes', 'WMX': 'mercedes',
};

/**
 * Detecta a marca do veículo baseado no VIN
 */
export function detectBrandFromVIN(vin: string): VehicleBrand {
  if (!vin || vin.length < 3) return 'generic';
  
  const wmi = vin.substring(0, 3).toUpperCase();
  
  // Busca exata
  if (WMI_TO_BRAND[wmi]) {
    return WMI_TO_BRAND[wmi];
  }
  
  // Busca por prefixo de 2 caracteres (para alguns casos especiais)
  const prefix2 = wmi.substring(0, 2);
  for (const [key, brand] of Object.entries(WMI_TO_BRAND)) {
    if (key.startsWith(prefix2)) {
      return brand;
    }
  }
  
  return 'generic';
}

/**
 * Obtém o perfil completo do veículo
 */
export function getVehicleProfile(brand: VehicleBrand): VehicleProfile {
  return VEHICLE_PROFILES[brand] || VEHICLE_PROFILES.generic;
}

/**
 * Detecta e retorna informações completas do veículo
 */
export function detectVehicle(vin: string | null, manufacturer?: string, modelYear?: string, country?: string): DetectedVehicle {
  const brand = vin ? detectBrandFromVIN(vin) : 'generic';
  const profile = getVehicleProfile(brand);
  
  return {
    vin,
    brand,
    manufacturer: manufacturer || profile.displayName,
    modelYear: modelYear || null,
    country: country || null,
    profile,
  };
}
