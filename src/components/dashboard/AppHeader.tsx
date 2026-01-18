import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Download, HelpCircle, Volume2, Moon, Sun, Settings, User, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { StatusIndicator } from '@/components/dashboard/StatusIndicator';
import { VehicleBadge } from '@/components/dashboard/VehicleBadge';
import { JarvisVoiceButton } from '@/components/dashboard/JarvisVoiceButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };
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
          
          {/* Ações - Layout limpo: Avatar(menu) + Jarvis + Status */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Avatar como trigger do menu principal */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-all hover:opacity-80">
                  <Avatar className="h-8 w-8 border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
                    {userProfile?.avatarUrl ? (
                      <AvatarImage src={userProfile.avatarUrl} alt={userProfile.displayName || 'Usuário'} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {userProfile?.displayName?.charAt(0)?.toUpperCase() || 
                       userProfile?.email?.charAt(0)?.toUpperCase() || 
                       <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px] bg-popover z-50">
                {/* Status de Sincronização */}
                <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground py-2">
                  {syncStatus.loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Sincronizando...</span>
                    </>
                  ) : syncStatus.synced ? (
                    <>
                      <Cloud className="h-3.5 w-3.5 text-green-500" />
                      <span>Dados sincronizados</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="h-3.5 w-3.5 text-amber-500" />
                      <span>Offline - dados locais</span>
                    </>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Meu Perfil */}
                {onOpenProfile && (
                  <DropdownMenuItem onClick={onOpenProfile}>
                    <User className="h-4 w-4 mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={onOpenSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
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
                
                <DropdownMenuItem 
                  onClick={onTestAudio} 
                  disabled={!isJarvisSupported || isSpeaking}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Testar Áudio
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Toggle Tema */}
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDark ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Tema Claro
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Tema Escuro
                    </>
                  )}
                </DropdownMenuItem>
                
                {isWakeLockActive && (
                  <DropdownMenuItem disabled className="text-blue-400">
                    <Moon className="h-4 w-4 mr-2" />
                    Modo Insônia ativo
                  </DropdownMenuItem>
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
