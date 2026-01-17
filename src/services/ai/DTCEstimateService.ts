/**
 * DTC Estimate Service
 * Consulta a IA para gerar orçamentos e explicações simplificadas de códigos de erro
 */

import { supabase } from '@/integrations/supabase/client';

export interface DTCEstimate {
  simpleExplanation: string;
  estimatedParts: string[];
  estimatedLabor: string;
  estimatedCostRange: {
    min: number;
    max: number;
  };
  riskLevel: 'critical' | 'moderate' | 'low';
  canDrive: boolean;
  actionMessage: string;
  disclaimer: string;
}

export interface DTCEstimateRequest {
  dtcCode: string;
  dtcName: string;
  dtcDescription?: string;
  vehicleContext?: string;
}

/**
 * Obtém estimativa de custo e explicação simplificada para um código DTC
 */
export async function getDTCEstimate(request: DTCEstimateRequest): Promise<DTCEstimate> {
  try {
    const { data, error } = await supabase.functions.invoke('dtc-estimate', {
      body: request,
    });

    if (error) {
      console.error('Error calling dtc-estimate:', error);
      throw new Error(error.message || 'Erro ao consultar estimativa');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data as DTCEstimate;
  } catch (err) {
    console.error('DTCEstimateService error:', err);
    throw err;
  }
}

export const DTCEstimateService = {
  getEstimate: getDTCEstimate,
};
