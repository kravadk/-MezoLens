import React from 'react';
import { cn } from '../../lib/utils';

interface PillProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Pill({ children, active, onClick, className }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-5 py-2 rounded-full text-[13px] font-bold capitalize transition-all',
        active
          ? 'bg-mezo-sidebar text-white'
          : 'bg-mezo-border/30 text-mezo-muted hover:bg-mezo-border/50',
        className
      )}
    >
      {children}
    </button>
  );
}

interface PillTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}

export function PillTabs({ tabs, activeTab, onChange, className }: PillTabsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {tabs.map((tab) => (
        <Pill key={tab} active={activeTab === tab} onClick={() => onChange(tab)}>
          {tab}
        </Pill>
      ))}
    </div>
  );
}
