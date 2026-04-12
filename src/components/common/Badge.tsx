import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'lime';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-mezo-border/30 text-mezo-black',
  success: 'bg-strategy-conservative/10 text-strategy-conservative',
  warning: 'bg-strategy-aggressive/10 text-strategy-aggressive',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-strategy-balanced/10 text-strategy-balanced',
  lime: 'bg-mezo-lime/20 text-mezo-sidebar',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
