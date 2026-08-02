import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { DecisionType } from '../types';

interface BadgeProps {
  decision: DecisionType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ decision, size = 'md', showIcon = true }) => {
  const configs = {
    Go: {
      label: 'GO',
      bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
      glow: 'shadow-glow-go',
      icon: CheckCircle2,
    },
    Maybe: {
      label: 'MAYBE',
      bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
      glow: 'shadow-glow-maybe',
      icon: AlertTriangle,
    },
    Skip: {
      label: 'SKIP',
      bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
      glow: 'shadow-glow-skip',
      icon: XCircle,
    },
  };

  const current = configs[decision];
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs gap-1 font-bold',
    md: 'px-4 py-1.5 text-sm gap-1.5 font-extrabold',
    lg: 'px-6 py-2.5 text-xl gap-2 font-black tracking-wide',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <span
      className={`inline-flex items-center rounded-xl border backdrop-blur-md transition-all ${current.bg} ${current.glow} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{current.label}</span>
    </span>
  );
};
