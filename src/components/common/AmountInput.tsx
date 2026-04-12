import React from 'react';
import { cn } from '../../lib/utils';

interface AmountInputProps {
  label: string;
  sublabel?: string;
  balance?: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  onMax?: () => void;
  placeholder?: string;
  className?: string;
}

export function AmountInput({ label, sublabel, balance, icon, value, onChange, onMax, placeholder = '0.00', className }: AmountInputProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-mezo-muted">{sublabel}</span>
          <h4 className="text-[18px] font-extrabold text-mezo-black">{label}</h4>
        </div>
        {balance && (
          <span className="text-[12px] font-bold text-mezo-muted">
            Balance: <span className="text-mezo-black">{balance}</span>
          </span>
        )}
      </div>
      <div className="relative">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <div className="text-mezo-muted">{icon}</div>
          <div className="w-px h-6 bg-mezo-black mx-2" />
        </div>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-mezo-border/30 border-2 border-transparent rounded-[24px] pl-20 pr-24 py-6 text-[32px] font-extrabold focus:border-mezo-sidebar focus:bg-white outline-none transition-all placeholder:text-mezo-border"
        />
        {onMax && (
          <button
            onClick={onMax}
            className="absolute right-6 top-1/2 -translate-y-1/2 px-4 py-2 bg-mezo-sidebar text-white rounded-xl text-[12px] font-extrabold hover:bg-black transition-colors"
          >
            MAX
          </button>
        )}
      </div>
    </div>
  );
}
