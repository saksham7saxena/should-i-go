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
      bg: 'bg-emerald-100/80 border-emerald-300 text-emerald-900',
      icon: CheckCircle2,
    },
    Maybe: {
      label: 'MAYBE',
      bg: 'bg-amber-100/80 border-amber-300 text-amber-900',
      icon: AlertTriangle,
    },
    Skip: {
      label: 'SKIP',
      bg: 'bg-rose-100/80 border-rose-300 text-rose-900',
      icon: XCircle,
    },
  };

  const current = configs[decision];
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'px-3 py-0.5 text-xs gap-1 font-semibold rounded-full border',
    md: 'px-4 py-1 text-xs gap-1.5 font-bold rounded-full border',
    lg: 'px-6 py-2 text-base gap-2 font-extrabold tracking-wide rounded-full border shadow-sm',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span className={`inline-flex items-center transition-all ${current.bg} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{current.label}</span>
    </span>
  );
};
