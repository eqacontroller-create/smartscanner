// Tipos para sistema de manutenção inteligente por marca

import type { VehicleBrand } from '@/lib/vehicleProfiles';

export type MaintenanceType = 
  | 'oil_change'
  | 'oil_filter'
  | 'air_filter'
  | 'cabin_filter'
  | 'spark_plugs'
  | 'timing_belt'
  | 'brake_fluid'
  | 'coolant'
  | 'transmission_fluid'
  | 'differential_fluid'
  | 'fuel_filter'
  | 'brake_pads'
  | 'battery'
  | 'tires'
  | 'alignment'
  | 'inspection';

export interface MaintenanceInterval {
  type: MaintenanceType;
  name: string;
  intervalKm: number;
  intervalMonths?: number;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  description: string;
  warningKmBefore: number; // Avisar X km antes
}

export interface MaintenanceRecord {
  id: string;
  type: MaintenanceType;
  mileageAtService: number;
  datePerformed: string;
  notes?: string;
}

export interface MaintenanceAlert {
  type: MaintenanceType;
  name: string;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  kmRemaining: number;
  kmOverdue: number;
  isOverdue: boolean;
  message: string;
}

export interface MaintenanceSchedule {
  brand: VehicleBrand;
  intervals: MaintenanceInterval[];
}

// Intervalos padrão de manutenção (genérico)
export const DEFAULT_MAINTENANCE_INTERVALS: MaintenanceInterval[] = [
  {
    type: 'oil_change',
    name: 'Troca de Óleo',
    intervalKm: 10000,
    intervalMonths: 12,
    priority: 'alta',
    description: 'Troca de óleo do motor e filtro',
    warningKmBefore: 1000,
  },
  {
    type: 'oil_filter',
    name: 'Filtro de Óleo',
    intervalKm: 10000,
    priority: 'alta',
    description: 'Substituição do filtro de óleo',
    warningKmBefore: 1000,
  },
  {
    type: 'air_filter',
    name: 'Filtro de Ar',
    intervalKm: 20000,
    priority: 'media',
    description: 'Substituição do filtro de ar do motor',
    warningKmBefore: 2000,
  },
  {
    type: 'cabin_filter',
    name: 'Filtro de Cabine',
    intervalKm: 15000,
    priority: 'baixa',
    description: 'Substituição do filtro de ar-condicionado',
    warningKmBefore: 2000,
  },
  {
    type: 'spark_plugs',
    name: 'Velas de Ignição',
    intervalKm: 40000,
    priority: 'media',
    description: 'Substituição das velas de ignição',
    warningKmBefore: 5000,
  },
  {
    type: 'timing_belt',
    name: 'Correia Dentada',
    intervalKm: 60000,
    priority: 'critica',
    description: 'Substituição da correia dentada e tensor',
    warningKmBefore: 10000,
  },
  {
    type: 'brake_fluid',
    name: 'Fluido de Freio',
    intervalKm: 30000,
    intervalMonths: 24,
    priority: 'alta',
    description: 'Substituição do fluido de freio DOT4',
    warningKmBefore: 5000,
  },
  {
    type: 'coolant',
    name: 'Líquido de Arrefecimento',
    intervalKm: 40000,
    intervalMonths: 36,
    priority: 'media',
    description: 'Troca do líquido de arrefecimento',
    warningKmBefore: 5000,
  },
  {
    type: 'transmission_fluid',
    name: 'Óleo do Câmbio',
    intervalKm: 60000,
    priority: 'media',
    description: 'Troca do óleo da transmissão',
    warningKmBefore: 5000,
  },
  {
    type: 'fuel_filter',
    name: 'Filtro de Combustível',
    intervalKm: 30000,
    priority: 'media',
    description: 'Substituição do filtro de combustível',
    warningKmBefore: 3000,
  },
  {
    type: 'brake_pads',
    name: 'Pastilhas de Freio',
    intervalKm: 40000,
    priority: 'alta',
    description: 'Verificar e substituir pastilhas de freio',
    warningKmBefore: 5000,
  },
  {
    type: 'battery',
    name: 'Bateria',
    intervalKm: 50000,
    intervalMonths: 48,
    priority: 'media',
    description: 'Verificar condição da bateria',
    warningKmBefore: 5000,
  },
  {
    type: 'alignment',
    name: 'Alinhamento e Balanceamento',
    intervalKm: 10000,
    priority: 'baixa',
    description: 'Alinhamento e balanceamento das rodas',
    warningKmBefore: 2000,
  },
  {
    type: 'inspection',
    name: 'Revisão Geral',
    intervalKm: 20000,
    intervalMonths: 12,
    priority: 'alta',
    description: 'Revisão completa do veículo',
    warningKmBefore: 2000,
  },
];

// Intervalos específicos por marca
export const BRAND_MAINTENANCE_SCHEDULES: Partial<Record<VehicleBrand, Partial<Record<MaintenanceType, Partial<MaintenanceInterval>>>>> = {
  volkswagen: {
    oil_change: { intervalKm: 15000, description: 'Óleo sintético 5W30 recomendado para motores TSI' },
    timing_belt: { intervalKm: 90000, description: 'Motores EA211 têm corrente, verificar tensor' },
    transmission_fluid: { intervalKm: 60000, description: 'Câmbio DSG requer óleo específico G052182A2' },
    spark_plugs: { intervalKm: 60000, description: 'Velas de irídio para motores TSI' },
  },
  honda: {
    oil_change: { intervalKm: 10000, description: 'Óleo 0W20 para motores i-VTEC' },
    timing_belt: { intervalKm: 160000, description: 'Motores modernos usam corrente de distribuição' },
    transmission_fluid: { intervalKm: 40000, description: 'CVT requer fluido HCF-2' },
    spark_plugs: { intervalKm: 100000, description: 'Velas de irídio NGK específicas' },
  },
  toyota: {
    oil_change: { intervalKm: 10000, description: 'Óleo 0W20 ou 5W30 conforme manual' },
    timing_belt: { intervalKm: 150000, description: 'Corrente de distribuição na maioria dos modelos' },
    coolant: { intervalKm: 160000, description: 'Super Long Life Coolant Toyota' },
    spark_plugs: { intervalKm: 100000, description: 'Velas Denso de irídio' },
  },
  hyundai: {
    oil_change: { intervalKm: 10000, description: 'Óleo sintético 5W30 para motores GDI' },
    timing_belt: { intervalKm: 90000, description: 'Corrente em motores Gamma e Nu' },
    transmission_fluid: { intervalKm: 40000, description: 'DCT requer fluido específico' },
    brake_fluid: { intervalKm: 20000, description: 'DOT4 para sistemas ABS modernos' },
  },
  kia: {
    oil_change: { intervalKm: 10000, description: 'Óleo 5W30 sintético recomendado' },
    timing_belt: { intervalKm: 90000, description: 'Verificar tipo (corrente ou correia)' },
    transmission_fluid: { intervalKm: 40000, description: 'CVT requer SP-CVT1' },
    cabin_filter: { intervalKm: 12000, description: 'Filtro de ar-condicionado com carvão ativado' },
  },
  nissan: {
    oil_change: { intervalKm: 10000, description: 'Óleo 0W20 para economia de combustível' },
    transmission_fluid: { intervalKm: 40000, description: 'CVT Xtronic requer NS-3' },
    timing_belt: { intervalKm: 160000, description: 'Corrente de distribuição padrão' },
    coolant: { intervalKm: 80000, description: 'Nissan Long Life Coolant' },
  },
  mitsubishi: {
    oil_change: { intervalKm: 10000, description: 'Diesel: óleo 5W30 DPF compatível' },
    fuel_filter: { intervalKm: 20000, description: 'Crítico em motores diesel 2.4' },
    timing_belt: { intervalKm: 100000, description: 'Correia dentada em alguns modelos' },
    differential_fluid: { intervalKm: 40000, description: 'Fluido Super Select 4WD' },
  },
  fiat: {
    oil_change: { intervalKm: 10000, description: 'Óleo 5W30 ou 5W40 para motores Fire' },
    timing_belt: { intervalKm: 50000, description: 'Motor Fire: trocar preventivamente!' },
    spark_plugs: { intervalKm: 30000, description: 'Velas NGK ou Bosch' },
    air_filter: { intervalKm: 15000, description: 'Substituir mais frequentemente em cidade' },
  },
  chevrolet: {
    oil_change: { intervalKm: 10000, description: 'Óleo 5W30 Dexos1 Gen2' },
    timing_belt: { intervalKm: 100000, description: 'Corrente na maioria dos motores Ecotec' },
    transmission_fluid: { intervalKm: 50000, description: 'ATF Dexron VI para câmbio automático' },
    coolant: { intervalKm: 60000, description: 'Dex-Cool laranja GM' },
  },
  ford: {
    oil_change: { intervalKm: 15000, description: 'Óleo 5W30 sintético para EcoBoost' },
    timing_belt: { intervalKm: 100000, description: 'Corrente em motores Sigma e EcoBoost' },
    spark_plugs: { intervalKm: 60000, description: 'Velas de platina dupla' },
    transmission_fluid: { intervalKm: 60000, description: 'PowerShift: verificar recalls' },
  },
  renault: {
    oil_change: { intervalKm: 15000, description: 'Óleo 5W40 para motores TCe' },
    timing_belt: { intervalKm: 90000, description: 'Correia crítica em motores 1.6' },
    transmission_fluid: { intervalKm: 60000, description: 'EDC requer óleo específico' },
    coolant: { intervalKm: 60000, description: 'Tipo D Renault' },
  },
  bmw: {
    oil_change: { intervalKm: 15000, description: 'Óleo LL-01 ou LL-04 sintético' },
    timing_belt: { intervalKm: 200000, description: 'Corrente duplex de longa duração' },
    brake_fluid: { intervalKm: 30000, description: 'DOT4 LV de baixa viscosidade' },
    coolant: { intervalKm: 80000, description: 'Anticorrosivo BMW azul' },
  },
  mercedes: {
    oil_change: { intervalKm: 15000, description: 'Óleo MB 229.5 ou superior' },
    timing_belt: { intervalKm: 200000, description: 'Corrente de distribuição' },
    transmission_fluid: { intervalKm: 60000, description: 'ATF MB 236.14 para 9G-Tronic' },
    brake_fluid: { intervalKm: 20000, description: 'DOT4 Plus Mercedes' },
  },
  audi: {
    oil_change: { intervalKm: 15000, description: 'Óleo 504/507 para Longlife' },
    timing_belt: { intervalKm: 120000, description: 'Corrente em motores TFSI' },
    transmission_fluid: { intervalKm: 60000, description: 'S tronic: óleo específico' },
    spark_plugs: { intervalKm: 60000, description: 'Velas de platina NGK' },
  },
};

// Função para obter intervalos de manutenção por marca
export function getMaintenanceIntervalsForBrand(brand: VehicleBrand): MaintenanceInterval[] {
  const brandOverrides = BRAND_MAINTENANCE_SCHEDULES[brand] || {};
  
  return DEFAULT_MAINTENANCE_INTERVALS.map(interval => {
    const override = brandOverrides[interval.type];
    if (override) {
      return {
        ...interval,
        ...override,
      };
    }
    return interval;
  });
}

// Função para calcular alertas de manutenção
export function calculateMaintenanceAlerts(
  brand: VehicleBrand,
  currentMileage: number,
  maintenanceHistory: MaintenanceRecord[]
): MaintenanceAlert[] {
  const intervals = getMaintenanceIntervalsForBrand(brand);
  const alerts: MaintenanceAlert[] = [];
  
  for (const interval of intervals) {
    // Encontrar último serviço deste tipo
    const lastService = maintenanceHistory
      .filter(r => r.type === interval.type)
      .sort((a, b) => b.mileageAtService - a.mileageAtService)[0];
    
    const lastServiceMileage = lastService?.mileageAtService || 0;
    const nextServiceMileage = lastServiceMileage + interval.intervalKm;
    const kmRemaining = nextServiceMileage - currentMileage;
    const isOverdue = kmRemaining < 0;
    const kmOverdue = isOverdue ? Math.abs(kmRemaining) : 0;
    
    // Criar alerta se estiver próximo ou atrasado
    if (kmRemaining <= interval.warningKmBefore) {
      let message: string;
      let priority = interval.priority;
      
      if (isOverdue) {
        message = `${interval.name} atrasada em ${kmOverdue.toLocaleString('pt-BR')} km`;
        // Aumentar prioridade se atrasado
        if (priority === 'baixa') priority = 'media';
        if (priority === 'media') priority = 'alta';
        if (priority === 'alta') priority = 'critica';
      } else {
        message = `${interval.name} em ${kmRemaining.toLocaleString('pt-BR')} km`;
      }
      
      alerts.push({
        type: interval.type,
        name: interval.name,
        priority,
        kmRemaining,
        kmOverdue,
        isOverdue,
        message,
      });
    }
  }
  
  // Ordenar por prioridade (crítica primeiro) e depois por km restante
  const priorityOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
  return alerts.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.kmRemaining - b.kmRemaining;
  });
}

// Gerar mensagem falada para o Jarvis
export function generateMaintenanceVoiceMessage(alerts: MaintenanceAlert[]): string | null {
  if (alerts.length === 0) return null;
  
  const criticalAlerts = alerts.filter(a => a.priority === 'critica');
  const highAlerts = alerts.filter(a => a.priority === 'alta');
  const overdueAlerts = alerts.filter(a => a.isOverdue);
  
  const parts: string[] = [];
  
  if (overdueAlerts.length > 0) {
    const first = overdueAlerts[0];
    parts.push(`Atenção: ${first.name} está atrasada em ${first.kmOverdue} quilômetros.`);
  }
  
  if (criticalAlerts.length > 0 && !overdueAlerts.includes(criticalAlerts[0])) {
    const first = criticalAlerts[0];
    parts.push(`Manutenção crítica: ${first.name} em ${Math.abs(first.kmRemaining)} quilômetros.`);
  }
  
  if (highAlerts.length > 1) {
    parts.push(`Mais ${highAlerts.length - 1} manutenções pendentes.`);
  }
  
  return parts.length > 0 ? parts.join(' ') : null;
}
