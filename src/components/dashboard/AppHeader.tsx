import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Download, HelpCircle, MoreVertical, Volume2, Moon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusIndicator } from '@/components/dashboard/StatusIndicator';
import { SyncStatus } from '@/components/dashboard/SyncStatus';
import { VehicleBadge } from '@/components/dashboard/VehicleBadge';
import { JarvisTestButton } from '@/components/dashboard/JarvisTestButton';
import { JarvisVoiceButton } from '@/components/dashboard/JarvisVoiceButton';
import type { VehicleProfile, VehicleBrand, DetectedVehicle } from '@/lib/vehicleProfiles';
import type { ConnectionStatus } from '@/contexts/OBDContext';

interface AppHeaderProps {
  themeVehicle: DetectedVehicle | null;
  currentProfile: VehicleProfile;
  syncStatus: { synced: boolean; loading: boolean };
  status: ConnectionStatus;
  jarvisEnabled: boolean;
  isJarvisSupported: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isAISupported: boolean;
  aiError: string | null;
  isWakeLockActive: boolean;
  onOpenSettings: () => void;
  onTestAudio: () => void;
  onToggleListening: () => void;
}

function AppHeaderComponent({
  themeVehicle,
  currentProfile,
  syncStatus,
  status,
  jarvisEnabled,
  isJarvisSupported,
  isSpeaking,
  isListening,
  isProcessing,
  isAISupported,
  aiError,
  isWakeLockActive,
  onOpenSettings,
  onTestAudio,
  onToggleListening,
}: AppHeaderProps) {
  // Check if logo has landed from splash transition
  const logoLanded = typeof document !== 'undefined' 
    ? document.querySelector('[data-logo-landed="true"]') !== null 
    : true;
  
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 safe-area-top">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {themeVehicle ? (
              <div 
                className="animate-header-logo-arrive"
                style={{ 
                  animationDelay: '100ms',
                  animationFillMode: 'both',
                }}
              >
                <VehicleBadge 
                  brand={themeVehicle.brand} 
                  profile={themeVehicle.profile}
                  modelYear={themeVehicle.modelYear}
                  compact
                />
              </div>
            ) : (
              <div 
                className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0 animate-header-logo-arrive"
                style={{ 
                  animationDelay: '100ms',
                  animationFillMode: 'both',
                }}
              >
                <Car className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            )}
            <div className="min-w-0 animate-header-text-arrive" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <h1 className="text-base sm:text-xl font-bold text-foreground truncate">
                {themeVehicle ? 'Scanner OBD-II' : 'OBD-II Scanner'}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">
                {themeVehicle ? currentProfile.slogan : 'Scanner Universal Didático'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <SyncStatus synced={syncStatus.synced} lastSyncedAt={syncStatus.loading ? null : new Date()} />
            
            <div className="hidden xs:flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9">
                <Link to="/instalar"><Download className="h-4 w-4 sm:h-5 sm:w-5" /></Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9">
                <Link to="/ajuda"><HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" /></Link>
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="xs:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuItem asChild>
                  <Link to="/instalar" className="flex items-center gap-2"><Download className="h-4 w-4" />Instalar App</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/ajuda" className="flex items-center gap-2"><HelpCircle className="h-4 w-4" />Central de Ajuda</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenSettings}>
                  <Settings className="h-4 w-4 mr-2" />Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onTestAudio} disabled={!isJarvisSupported || isSpeaking}>
                  <Volume2 className="h-4 w-4 mr-2" />Testar Áudio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {jarvisEnabled && (
              <JarvisVoiceButton isListening={isListening} isProcessing={isProcessing} isSpeaking={isSpeaking} isSupported={isAISupported} error={aiError} onToggle={onToggleListening} />
            )}
            
            <div className="hidden xs:flex items-center gap-1 sm:gap-2">
              {/* Settings button now navigates to Config tab */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onOpenSettings}
                className="h-8 w-8 sm:h-9 sm:w-9"
                title="Configurações"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <JarvisTestButton onTest={onTestAudio} isSpeaking={isSpeaking} isSupported={isJarvisSupported} />
            </div>
            
            {isWakeLockActive && <div className="flex items-center text-blue-400" title="Modo Insônia ativo"><Moon className="h-4 w-4" /></div>}
            <StatusIndicator status={status} />
          </div>
        </div>
      </div>
    </header>
  );
}

// Custom comparator to prevent re-renders during OBD polling
function arePropsEqual(prevProps: AppHeaderProps, nextProps: AppHeaderProps): boolean {
  return (
    // Connection status
    prevProps.status === nextProps.status &&
    
    // Vehicle (compare by VIN to avoid object comparison)
    prevProps.themeVehicle?.vin === nextProps.themeVehicle?.vin &&
    
    // Sync status
    prevProps.syncStatus.synced === nextProps.syncStatus.synced &&
    prevProps.syncStatus.loading === nextProps.syncStatus.loading &&
    
    // Jarvis states (change during voice interaction)
    prevProps.jarvisEnabled === nextProps.jarvisEnabled &&
    prevProps.isSpeaking === nextProps.isSpeaking &&
    prevProps.isListening === nextProps.isListening &&
    prevProps.isProcessing === nextProps.isProcessing &&
    prevProps.aiError === nextProps.aiError &&
    
    // Wake lock
    prevProps.isWakeLockActive === nextProps.isWakeLockActive
  );
}

export const AppHeader = React.memo(AppHeaderComponent, arePropsEqual);
