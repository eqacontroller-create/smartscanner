export interface BrandAsset {
  color: string;
  accent: string;
  initial: string;
  premium: boolean;
  displayName: string;
}

export const BRAND_ASSETS: Record<string, BrandAsset> = {
  volkswagen: {
    color: '210 100% 16%',
    accent: '195 100% 41%',
    initial: 'VW',
    premium: false,
    displayName: 'Volkswagen'
  },
  fiat: {
    color: '0 72% 51%',
    accent: '0 0% 100%',
    initial: 'FT',
    premium: false,
    displayName: 'Fiat'
  },
  ford: {
    color: '214 100% 35%',
    accent: '0 0% 100%',
    initial: 'FD',
    premium: false,
    displayName: 'Ford'
  },
  chevrolet: {
    color: '45 100% 50%',
    accent: '210 11% 15%',
    initial: 'CH',
    premium: false,
    displayName: 'Chevrolet'
  },
  honda: {
    color: '0 79% 43%',
    accent: '0 0% 100%',
    initial: 'HD',
    premium: false,
    displayName: 'Honda'
  },
  toyota: {
    color: '0 79% 43%',
    accent: '0 0% 100%',
    initial: 'TY',
    premium: false,
    displayName: 'Toyota'
  },
  hyundai: {
    color: '210 100% 35%',
    accent: '0 0% 100%',
    initial: 'HY',
    premium: false,
    displayName: 'Hyundai'
  },
  nissan: {
    color: '0 0% 15%',
    accent: '0 79% 43%',
    initial: 'NS',
    premium: false,
    displayName: 'Nissan'
  },
  renault: {
    color: '48 100% 50%',
    accent: '0 0% 0%',
    initial: 'RN',
    premium: false,
    displayName: 'Renault'
  },
  peugeot: {
    color: '210 100% 25%',
    accent: '0 0% 100%',
    initial: 'PG',
    premium: false,
    displayName: 'Peugeot'
  },
  citroen: {
    color: '0 79% 43%',
    accent: '0 0% 100%',
    initial: 'CT',
    premium: false,
    displayName: 'Citroën'
  },
  jeep: {
    color: '120 25% 25%',
    accent: '45 100% 50%',
    initial: 'JP',
    premium: false,
    displayName: 'Jeep'
  },
  mitsubishi: {
    color: '0 79% 43%',
    accent: '0 0% 0%',
    initial: 'MT',
    premium: false,
    displayName: 'Mitsubishi'
  },
  kia: {
    color: '0 79% 43%',
    accent: '0 0% 100%',
    initial: 'KA',
    premium: false,
    displayName: 'Kia'
  },
  bmw: {
    color: '210 100% 35%',
    accent: '0 0% 100%',
    initial: 'BMW',
    premium: true,
    displayName: 'BMW'
  },
  'mercedes-benz': {
    color: '200 20% 15%',
    accent: '0 0% 75%',
    initial: 'MB',
    premium: true,
    displayName: 'Mercedes-Benz'
  },
  audi: {
    color: '0 0% 10%',
    accent: '0 0% 75%',
    initial: 'AD',
    premium: true,
    displayName: 'Audi'
  },
  volvo: {
    color: '210 100% 25%',
    accent: '0 0% 100%',
    initial: 'VV',
    premium: true,
    displayName: 'Volvo'
  },
  'land rover': {
    color: '120 25% 25%',
    accent: '45 100% 50%',
    initial: 'LR',
    premium: true,
    displayName: 'Land Rover'
  },
  porsche: {
    color: '0 0% 10%',
    accent: '0 79% 43%',
    initial: 'PS',
    premium: true,
    displayName: 'Porsche'
  },
  caoa: {
    color: '0 0% 20%',
    accent: '0 79% 43%',
    initial: 'CA',
    premium: false,
    displayName: 'CAOA'
  },
  'caoa chery': {
    color: '0 0% 20%',
    accent: '0 79% 43%',
    initial: 'CC',
    premium: false,
    displayName: 'CAOA Chery'
  },
  ram: {
    color: '0 0% 10%',
    accent: '0 79% 43%',
    initial: 'RM',
    premium: false,
    displayName: 'RAM'
  },
  suzuki: {
    color: '210 100% 35%',
    accent: '0 79% 43%',
    initial: 'SZ',
    premium: false,
    displayName: 'Suzuki'
  },
  subaru: {
    color: '210 100% 35%',
    accent: '45 100% 50%',
    initial: 'SB',
    premium: false,
    displayName: 'Subaru'
  }
};

export function getBrandAsset(brand: string): BrandAsset {
  const normalizedBrand = brand.toLowerCase().trim();
  return BRAND_ASSETS[normalizedBrand] || {
    color: '0 0% 50%',
    accent: '0 0% 100%',
    initial: brand.slice(0, 2).toUpperCase(),
    premium: false,
    displayName: brand
  };
}

export function getBrandColor(brand: string): string {
  const asset = getBrandAsset(brand);
  return `hsl(${asset.color})`;
}

export function getBrandAccent(brand: string): string {
  const asset = getBrandAsset(brand);
  return `hsl(${asset.accent})`;
}
