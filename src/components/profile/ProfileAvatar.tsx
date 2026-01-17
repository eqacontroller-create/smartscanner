import React, { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  editable?: boolean;
  userId?: string;
  onAvatarChange?: (url: string) => void;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-xl',
  xl: 'text-3xl',
};

const cameraSizes = {
  sm: 'h-4 w-4 -bottom-0.5 -right-0.5',
  md: 'h-5 w-5 -bottom-0.5 -right-0.5',
  lg: 'h-6 w-6 -bottom-1 -right-1',
  xl: 'h-8 w-8 -bottom-1 -right-1',
};

function getInitials(displayName?: string | null, email?: string): string {
  if (displayName) {
    const parts = displayName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }
  
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  
  return 'U';
}

function getGravatarUrl(email?: string): string | undefined {
  if (!email) return undefined;
  
  // Simple hash function for demo - in production use proper MD5
  const hash = email.toLowerCase().trim();
  return `https://www.gravatar.com/avatar/${btoa(hash)}?d=mp&s=200`;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarUrl,
  displayName,
  email,
  size = 'md',
  className,
  onClick,
  editable = false,
  userId,
  onAvatarChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initials = getInitials(displayName, email);
  const fallbackUrl = getGravatarUrl(email);
  const imageUrl = avatarUrl || fallbackUrl;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      // Nome do arquivo: userId/avatar-timestamp.ext
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Upload para o bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Callback para atualizar o perfil
      onAvatarChange?.(publicUrl);
      toast.success('Foto atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
      // Limpar input para permitir reselecionar o mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (editable && userId) {
      fileInputRef.current?.click();
    } else if (onClick) {
      onClick();
    }
  };
  
  return (
    <div className="relative inline-block">
      <Avatar
        className={cn(
          sizeClasses[size],
          (onClick || editable) && 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all',
          uploading && 'opacity-50',
          className
        )}
        onClick={handleClick}
      >
        <AvatarImage src={imageUrl || undefined} alt={displayName || 'Avatar'} />
        <AvatarFallback className={cn('bg-primary/10 text-primary font-medium', textSizes[size])}>
          {initials || <User className={iconSizes[size]} />}
        </AvatarFallback>
      </Avatar>

      {/* Indicador de upload / botão de edição */}
      {editable && userId && (
        <div 
          className={cn(
            'absolute bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90 transition-colors',
            cameraSizes[size]
          )}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {uploading ? (
            <Loader2 className="h-full w-full animate-spin" />
          ) : (
            <Camera className="h-full w-full" />
          )}
        </div>
      )}

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />
    </div>
  );
};
