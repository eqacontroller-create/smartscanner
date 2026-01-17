import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Download, HelpCircle, MoreVertical, Volume2, Moon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusIndicator } from '@/components/dashboard/StatusIndicator';
import { SyncStatus } from '@/components/dashboard/SyncStatus';
import { VehicleBadge } from '@/components/dashboard/VehicleBadge';
import { JarvisVoiceButton } from '@/components/dashboard/JarvisVoiceButton';
import { ProfileAvatar } from '@/components/profile';
import type { VehicleProfile, DetectedVehicle } from '@/lib/vehicleProfiles';
import type { ConnectionStatus } from '@/contexts/OBDContext';

interface UserProfileData {
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string;
}

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
  userProfile?: UserProfileData;
  onOpenSettings: () => void;
  onTestAudio: () => void;
  onToggleListening: () => void;
  onOpenProfile?: () => void;
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
  userProfile,
  onOpenSettings,
  onTestAudio,
  onToggleListening,
  onOpenProfile,
}: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 safe-area-top">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo e título */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {themeVehicle ? (
              <div 
                className="animate-header-logo-arrive"
                style={{ animationDelay: '100ms', animationFillMode: 'both' }}
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
                style={{ animationDelay: '100ms', animationFillMode: 'both' }}
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
          
          {/* Ações - Layout simplificado */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Avatar sempre visível */}
            {onOpenProfile && (
              <ProfileAvatar
                avatarUrl={userProfile?.avatarUrl}
                displayName={userProfile?.displayName}
                email={userProfile?.email}
                size="sm"
                onClick={onOpenProfile}
              />
            )}
            
            {/* Sync status compacto */}
            <SyncStatus synced={syncStatus.synced} lastSyncedAt={syncStatus.loading ? null : new Date()} />
            
            {/* Menu dropdown com todas as opções */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px] bg-popover z-50">
                <DropdownMenuItem asChild>
                  <Link to="/instalar" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Instalar App
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/ajuda" className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Central de Ajuda
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onTestAudio} 
                  disabled={!isJarvisSupported || isSpeaking}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Testar Áudio
                </DropdownMenuItem>
                {isWakeLockActive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-blue-400">
                      <Moon className="h-4 w-4 mr-2" />
                      Modo Insônia ativo
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Jarvis voice button */}
            {jarvisEnabled && (
              <JarvisVoiceButton 
                isListening={isListening} 
                isProcessing={isProcessing} 
                isSpeaking={isSpeaking} 
                isSupported={isAISupported} 
                error={aiError} 
                onToggle={onToggleListening} 
              />
            )}
            
            {/* Status indicator */}
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
    prevProps.status === nextProps.status &&
    prevProps.themeVehicle?.vin === nextProps.themeVehicle?.vin &&
    prevProps.syncStatus.synced === nextProps.syncStatus.synced &&
    prevProps.syncStatus.loading === nextProps.syncStatus.loading &&
    prevProps.jarvisEnabled === nextProps.jarvisEnabled &&
    prevProps.isSpeaking === nextProps.isSpeaking &&
    prevProps.isListening === nextProps.isListening &&
    prevProps.isProcessing === nextProps.isProcessing &&
    prevProps.aiError === nextProps.aiError &&
    prevProps.isWakeLockActive === nextProps.isWakeLockActive &&
    prevProps.userProfile?.avatarUrl === nextProps.userProfile?.avatarUrl &&
    prevProps.userProfile?.displayName === nextProps.userProfile?.displayName
  );
}

export const AppHeader = React.memo(AppHeaderComponent, arePropsEqual);
