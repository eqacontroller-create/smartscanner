/**
 * RiskBadge - Badge premium pill para exibir nível de risco
 */

import { cn } from '@/lib/utils';
import { RISK_CONFIG, type RiskLevel } from '@/types/visionTypes';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-2.5 py-1 gap-1.5',
  md: 'text-sm px-3.5 py-1.5 gap-2',
  lg: 'text-base px-4 py-2 gap-2.5',
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

// Premium color config with glow
const riskStyles = {
  safe: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    glow: 'shadow-[0_0_12px_-2px] shadow-emerald-500/40',
    border: 'border-emerald-500/30',
  },
  attention: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    dot: 'bg-amber-400 animate-pulse',
    glow: 'shadow-[0_0_12px_-2px] shadow-amber-500/40',
    border: 'border-amber-500/30',
  },
  danger: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    dot: 'bg-red-400 animate-pulse',
    glow: 'shadow-[0_0_15px_-2px] shadow-red-500/50',
    border: 'border-red-500/30',
  },
};

export function RiskBadge({ level, size = 'md', showIcon = true, className }: RiskBadgeProps) {
  const config = RISK_CONFIG[level];
  const styles = riskStyles[level];
  
  return (
    <div
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        'border backdrop-blur-sm',
        'tracking-wide uppercase',
        styles.bg,
        styles.text,
        styles.glow,
        styles.border,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <>
          <span className="text-lg">{config.icon}</span>
          <div className={cn('rounded-full', dotSizes[size], styles.dot)} />
        </>
      )}
      <span>{config.label}</span>
    </div>
  );
}
