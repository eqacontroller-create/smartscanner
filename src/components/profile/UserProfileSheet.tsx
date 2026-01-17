import React, { useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LogOut, 
  Edit, 
  Car, 
  Cloud, 
  CloudOff, 
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileStats } from './ProfileStats';
import { EditProfileDialog, ProfileFormData } from './EditProfileDialog';
import { useUserStats } from '@/hooks/useUserStats';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface VehicleInfo {
  brand?: string | null;
  model?: string | null;
  year?: string | null;
  nickname?: string | null;
}

interface UserProfileData {
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string;
  phone?: string | null;
  city?: string | null;
  driverType?: string;
}

interface UserProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  userEmail: string | undefined;
  profileData: UserProfileData;
  vehicleInfo: VehicleInfo;
  synced: boolean;
  loading: boolean;
  onUpdateProfile: (updates: Partial<UserProfileData>) => Promise<void>;
  onLogout: () => void;
}

const driverTypeLabels: Record<string, string> = {
  particular: 'Particular',
  uber: 'Uber',
  '99': '99',
  taxi: 'Táxi',
  frota: 'Frota',
};

export const UserProfileSheet: React.FC<UserProfileSheetProps> = ({
  open,
  onOpenChange,
  userId,
  userEmail,
  profileData,
  vehicleInfo,
  synced,
  loading,
  onUpdateProfile,
  onLogout,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { stats, loading: statsLoading, refresh: refreshStats } = useUserStats(userId);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      onLogout();
      onOpenChange(false);
      toast.success('Desconectado com sucesso');
    } catch (error) {
      logger.error('[Profile] Logout error:', error);
      toast.error('Erro ao sair');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleEditSave = useCallback(async (data: ProfileFormData) => {
    await onUpdateProfile({
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      phone: data.phone,
      city: data.city,
      driverType: data.driverType,
    });
    toast.success('Perfil atualizado!');
  }, [onUpdateProfile]);

  const editInitialData: ProfileFormData = {
    displayName: profileData.displayName || null,
    avatarUrl: profileData.avatarUrl || null,
    phone: profileData.phone || null,
    city: profileData.city || null,
    driverType: profileData.driverType || 'particular',
  };

  const vehicleDisplay = vehicleInfo.nickname 
    || (vehicleInfo.brand && vehicleInfo.model 
        ? `${vehicleInfo.brand} ${vehicleInfo.model}` 
        : vehicleInfo.brand)
    || null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>Meu Perfil</SheetTitle>
            <SheetDescription>
              Suas informações e estatísticas
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <ProfileAvatar
                avatarUrl={profileData.avatarUrl}
                displayName={profileData.displayName}
                email={userEmail}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold truncate">
                    {profileData.displayName || 'Motorista'}
                  </h3>
                  {profileData.driverType && profileData.driverType !== 'particular' && (
                    <Badge variant="secondary" className="text-xs">
                      {driverTypeLabels[profileData.driverType] || profileData.driverType}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1 mt-1">
                  {userEmail && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{userEmail}</span>
                    </div>
                  )}
                  {profileData.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{profileData.phone}</span>
                    </div>
                  )}
                  {profileData.city && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{profileData.city}</span>
                    </div>
                  )}
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 -ml-2"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </div>

            {/* Sync Status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                {loading ? (
                  <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : synced ? (
                  <Cloud className="h-4 w-4 text-green-500" />
                ) : (
                  <CloudOff className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm">
                  {loading ? 'Sincronizando...' : synced ? 'Sincronizado' : 'Pendente'}
                </span>
              </div>
              <Badge variant={synced ? 'default' : 'secondary'} className="text-xs">
                {synced ? 'Nuvem' : 'Local'}
              </Badge>
            </div>

            <Separator />

            {/* Vehicle Info */}
            {vehicleDisplay && (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    Veículo
                  </h4>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="font-medium">{vehicleDisplay}</p>
                    {vehicleInfo.year && (
                      <p className="text-sm text-muted-foreground">Ano {vehicleInfo.year}</p>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Statistics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Estatísticas</h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={refreshStats}
                  disabled={statsLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <ProfileStats stats={stats} loading={statsLoading} />
            </div>

            <Separator />

            {/* Logout Button */}
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Sair da Conta
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialData={editInitialData}
        email={userEmail}
        userId={userId}
        onSave={handleEditSave}
      />
    </>
  );
};
