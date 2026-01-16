import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'premium' | 'success' | 'warning' | 'destructive';
  animationDelay?: number;
}

export function AnimatedCard({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  className,
  variant = 'default',
  animationDelay = 0
}: AnimatedCardProps) {
  const variants = {
    default: 'bg-card border-border',
    premium: 'bg-gradient-to-br from-card to-card/80 border-primary/20 shadow-lg shadow-primary/5',
    success: 'bg-primary/5 border-primary/30',
    warning: 'bg-yellow-500/5 border-yellow-500/30',
    destructive: 'bg-destructive/5 border-destructive/30',
  };

  return (
    <Card 
      className={cn(
        'animate-fade-in transition-all duration-300 hover:shadow-md',
        variants[variant],
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {(title || Icon) && (
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className={cn(
                'p-1.5 rounded-lg',
                variant === 'premium' ? 'bg-primary/20' : 'bg-muted'
              )}>
                <Icon className={cn(
                  'h-4 w-4',
                  variant === 'premium' ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
            )}
            {title && <CardTitle className="text-base">{title}</CardTitle>}
          </div>
          {description && (
            <CardDescription className="text-sm">{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={!title && !Icon ? 'pt-4' : ''}>
        {children}
      </CardContent>
    </Card>
  );
}
