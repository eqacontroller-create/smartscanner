import { useContext } from 'react';
import { OBDContext, OBDContextType } from '@/contexts/OBDContext';

/**
 * Hook consumidor do OBDContext
 * Fornece acesso ao estado global do Bluetooth e dados do veículo
 * 
 * IMPORTANTE: Este hook deve ser usado dentro de um OBDProvider
 * A conexão Bluetooth persiste entre navegações de página
 * 
 * === MUTEX GLOBAL ===
 * O barramento Bluetooth ELM327 não suporta comandos concorrentes.
 * Use as funções de mutex para coordenar acesso entre componentes:
 * 
 * - acquireOBDLock(owner, priority?, timeout?) - Adquire lock exclusivo
 * - releaseOBDLock(owner) - Libera o lock
 * - sendCommandWithLock(owner, command, options?) - Envia com lock automático
 * - isOBDBusy - Verifica se barramento está ocupado
 * - obdLockOwner - Quem está usando o barramento
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
export type { OBDLockPriority, OBDMutexState } from '@/services/obd/OBDMutexService';
