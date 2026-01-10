// Configurações de viagem para motoristas de app

export interface TripSettings {
  fuelPrice: number;           // Preço do combustível R$/L
  averageConsumption: number;  // Consumo médio km/L
  vehicleCostPerKm: number;    // Custo adicional por km (depreciação, manutenção)
}

export interface TripData {
  distance: number;        // km percorridos
  cost: number;            // custo total R$
  costPerKm: number;       // custo por km R$
  duration: number;        // tempo em segundos
  averageSpeed: number;    // velocidade média km/h
  isActive: boolean;       // viagem em andamento
  startTime: number | null; // timestamp de início
}

export interface TripHistoryEntry {
  id: string;
  date: string;
  distance: number;
  cost: number;
  costPerKm: number;
  duration: number;
  averageSpeed: number;
}

export const defaultTripSettings: TripSettings = {
  fuelPrice: 6.00,
  averageConsumption: 12,
  vehicleCostPerKm: 0.10,
};

export const initialTripData: TripData = {
  distance: 0,
  cost: 0,
  costPerKm: 0,
  duration: 0,
  averageSpeed: 0,
  isActive: false,
  startTime: null,
};

// Formatar valor monetário brasileiro
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Formatar distância
export function formatDistance(km: number): string {
  return `${km.toFixed(2)} km`;
}

// Formatar duração
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [hours, minutes, secs]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}
