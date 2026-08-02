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
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      icon: CheckCircle2,
    },
    Maybe: {
      label: 'MAYBE',
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      icon: AlertTriangle,
    },
    Skip: {
      label: 'SKIP',
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      icon: XCircle,
    },
  };

  const current = configs[decision];
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs gap-1 font-bold rounded-full',
    md: 'px-3.5 py-1 text-xs gap-1.5 font-extrabold rounded-full',
    lg: 'px-5 py-2 text-lg gap-2 font-black tracking-wide rounded-full',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center border transition-all ${current.bg} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{current.label}</span>
    </span>
  );
};
