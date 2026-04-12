import React, { useState } from 'react';
import { Shield, Scale, Flame, Check, ArrowRight } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';
import { cn } from '../../lib/utils';

interface StrategyChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStrategy: string;
  onConfirm: (newStrategy: string) => void;
}

const strategies = [
  { id: 'conservative', name: 'Conservative', boost: '1x', apr: '5-7%', icon: <Shield className="w-5 h-5" />, color: '#1A8C52' },
  { id: 'balanced', name: 'Balanced', boost: '2x', apr: '7-10%', icon: <Scale className="w-5 h-5" />, color: '#5B6DEC' },
  { id: 'aggressive', name: 'Aggressive', boost: '5x', apr: '10-15%', icon: <Flame className="w-5 h-5" />, color: '#D4940A' },
];

export function StrategyChangeModal({ isOpen, onClose, currentStrategy, onConfirm }: StrategyChangeModalProps) {
  const [selected, setSelected] = useState(currentStrategy);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Change Strategy">
      <div className="space-y-4">
        {strategies.map((s) => {
          const isCurrent = s.id === currentStrategy;
          const isSelected = s.id === selected;
          return (
            <button
              key={s.id}
              onClick={() => !isCurrent && setSelected(s.id)}
              disabled={isCurrent}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                isCurrent ? "border-mezo-border opacity-50 cursor-not-allowed" :
                isSelected ? "border-mezo-sidebar bg-mezo-sidebar/5" :
                "border-mezo-border hover:border-mezo-black/20"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: s.color }}>
                  {s.icon}
                </div>
                <div className="text-left">
                  <div className="text-[15px] font-bold text-mezo-black">{s.name}</div>
                  <div className="text-[12px] text-mezo-muted">{s.apr} APR with {s.boost} boost</div>
                </div>
              </div>
              {isCurrent && <span className="text-[11px] font-bold text-mezo-muted uppercase">Current</span>}
              {isSelected && !isCurrent && (
                <div className="w-6 h-6 rounded-full bg-mezo-sidebar flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-mezo-black text-mezo-black font-bold hover:bg-mezo-border/20 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => onConfirm(selected)}
          disabled={selected === currentStrategy}
          className="flex-1 py-3 rounded-2xl bg-mezo-lime text-mezo-sidebar font-extrabold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
        >
          Confirm Change <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </ModalWrapper>
  );
}
