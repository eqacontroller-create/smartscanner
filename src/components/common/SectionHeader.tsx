import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function SectionHeader({ 
  icon: Icon, 
  title, 
  description,
  badge,
  badgeVariant = 'default'
}: SectionHeaderProps) {
  const badgeColors = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-primary/20 text-primary',
    warning: 'bg-yellow-500/20 text-yellow-500',
    destructive: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 rounded-xl bg-primary/10 shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground truncate">{title}</h2>
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColors[badgeVariant]}`}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}
