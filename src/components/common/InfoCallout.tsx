import React from 'react';
import { Info, AlertTriangle, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

type CalloutType = 'info' | 'warning' | 'success';

interface InfoCalloutProps {
  children: React.ReactNode;
  type?: CalloutType;
  className?: string;
}

const config: Record<CalloutType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  info: { bg: 'bg-mezo-lime/10', border: 'border-mezo-lime/20', text: 'text-mezo-sidebar', icon: <Info className="w-4 h-4" /> },
  warning: { bg: 'bg-strategy-aggressive/5', border: 'border-strategy-aggressive/20', text: 'text-strategy-aggressive', icon: <AlertTriangle className="w-4 h-4" /> },
  success: { bg: 'bg-strategy-conservative/5', border: 'border-strategy-conservative/20', text: 'text-strategy-conservative', icon: <Check className="w-4 h-4" /> },
};

export function InfoCallout({ children, type = 'info', className }: InfoCalloutProps) {
  const c = config[type];
  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-2xl border', c.bg, c.border, className)}>
      <div className={cn('shrink-0 mt-0.5', c.text)}>{c.icon}</div>
      <div className={cn('text-[12px] font-bold leading-relaxed', c.text)}>{children}</div>
    </div>
  );
}
