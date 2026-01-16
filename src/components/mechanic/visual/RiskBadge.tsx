/**
 * RiskBadge - Badge colorido para exibir nível de risco
 */

import { cn } from '@/lib/utils';
import { RISK_CONFIG, type RiskLevel } from '@/types/visionTypes';
import { Shield, AlertTriangle, XOctagon } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function RiskBadge({ level, size = 'md', showIcon = true, className }: RiskBadgeProps) {
  const config = RISK_CONFIG[level];
  
  const IconComponent = level === 'safe' 
    ? Shield 
    : level === 'attention' 
      ? AlertTriangle 
      : XOctagon;
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 font-bold rounded-full',
        config.bgColor,
        config.color,
        config.borderColor,
        'border-2',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <>
          <span className="text-lg">{config.icon}</span>
          <IconComponent className={iconSizes[size]} />
        </>
      )}
      <span>{config.label}</span>
    </div>
  );
}
