// Painel de status de conexão e alertas

import React, { useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConnectionButton } from '@/components/dashboard/ConnectionButton';
import { VehicleBadge } from '@/components/dashboard/VehicleBadge';
import { ScannerLocator } from '@/components/onboarding';
import type { DetectedVehicle } from '@/lib/vehicleProfiles';
import type { ConnectionStatus } from '@/contexts/OBDContext';

interface ConnectionPanelProps {
  status: ConnectionStatus;
  error: string | null;
  isSupported: boolean;
  themeVehicle: DetectedVehicle | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionPanel({ 
  status, 
  error, 
  isSupported, 
  themeVehicle, 
  onConnect, 
  onDisconnect 
}: ConnectionPanelProps) {
  const [locatorOpen, setLocatorOpen] = useState(false);
  const isReady = status === 'ready';
  const isDisconnected = status === 'disconnected';

  const handleLocatorReady = () => {
    onConnect();
  };

  return (
    <>
      {/* Browser Warning */}
      {!isSupported && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium text-destructive text-sm sm:text-base">
                Navegador não suportado
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                A Web Bluetooth API não é suportada neste navegador. 
                Use o Chrome, Edge ou Opera em desktop, ou Chrome no Android.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium text-destructive text-sm sm:text-base">
                Erro de Conexão
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                {error}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Detection Info */}
      {themeVehicle && isReady && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <VehicleBadge 
              brand={themeVehicle.brand} 
              profile={themeVehicle.profile} 
              modelYear={themeVehicle.modelYear} 
            />
          </CardContent>
        </Card>
      )}

      {/* Connection Button */}
      <div className="flex flex-col items-center gap-3">
        <ConnectionButton 
          status={status} 
          onConnect={onConnect} 
          onDisconnect={onDisconnect} 
          disabled={!isSupported} 
        />

        {/* Help Button - Only show when disconnected */}
        {isDisconnected && isSupported && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocatorOpen(true)}
            className="text-muted-foreground hover:text-primary"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Precisa de ajuda para conectar?
          </Button>
        )}
      </div>

      {/* Scanner Locator Modal */}
      <ScannerLocator
        open={locatorOpen}
        onOpenChange={setLocatorOpen}
        onReady={handleLocatorReady}
      />
    </>
  );
}
