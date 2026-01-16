/**
 * Tipos para contexto do veículo usado no Mecânico Visual
 */

export interface VehicleContext {
  brand: string | null;
  model: string | null;
  year: string | null;
  engine: string | null;
  displayName: string;
}

export function createVehicleContext(
  brand?: string | null,
  model?: string | null,
  year?: string | null,
  engine?: string | null
): VehicleContext {
  const parts: string[] = [];
  
  if (brand) parts.push(brand.charAt(0).toUpperCase() + brand.slice(1));
  if (model) parts.push(model);
  if (year) parts.push(year);
  if (engine) parts.push(engine);
  
  return {
    brand: brand || null,
    model: model || null,
    year: year || null,
    engine: engine || null,
    displayName: parts.length > 0 ? parts.join(' ') : 'Veículo não configurado',
  };
}

export function hasVehicleContext(ctx: VehicleContext): boolean {
  return !!(ctx.brand && ctx.model);
}
