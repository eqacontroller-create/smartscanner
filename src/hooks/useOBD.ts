import { useContext } from 'react';
import { OBDContext, OBDContextType } from '@/contexts/OBDContext';

/**
 * Hook consumidor do OBDContext
 * Fornece acesso ao estado global do Bluetooth e dados do veículo
 * 
 * IMPORTANTE: Este hook deve ser usado dentro de um OBDProvider
 * A conexão Bluetooth persiste entre navegações de página
 */
export function useOBD(): OBDContextType {
  const context = useContext(OBDContext);
  
  if (!context) {
    throw new Error(
      'useOBD deve ser usado dentro de OBDProvider. ' +
      'Verifique se App.tsx está envolvido com <OBDProvider>.'
    );
  }
  
  return context;
}

// Re-export types for convenience
export type { ConnectionStatus, VehicleData, DetectedVehicleInfo } from '@/contexts/OBDContext';
