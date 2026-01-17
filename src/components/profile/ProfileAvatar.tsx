import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
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
}) => {
  const initials = getInitials(displayName, email);
  const fallbackUrl = getGravatarUrl(email);
  const imageUrl = avatarUrl || fallbackUrl;
  
  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        onClick && 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all',
        className
      )}
      onClick={onClick}
    >
      <AvatarImage src={imageUrl || undefined} alt={displayName || 'Avatar'} />
      <AvatarFallback className={cn('bg-primary/10 text-primary font-medium', textSizes[size])}>
        {initials || <User className={iconSizes[size]} />}
      </AvatarFallback>
    </Avatar>
  );
};
