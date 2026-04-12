import React, { useState } from 'react';
import { Zap, Info, Heart } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';

interface MusdYieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  positionId: number;
  currentPercent: number;
  onConfirm: (percent: number) => void;
  onDisable: () => void;
}

export function MusdYieldModal({ isOpen, onClose, positionId, currentPercent, onConfirm, onDisable }: MusdYieldModalProps) {
  const [percent, setPercent] = useState(currentPercent || 20);
  const isEnabled = currentPercent > 0;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={isEnabled ? 'MUSD Yield Settings' : 'Enable MUSD Yield'}>
      <div className="space-y-6">
        {/* Health preview */}
        {isEnabled && (
          <div className="p-4 bg-strategy-conservative/5 rounded-xl border border-strategy-conservative/20 flex items-center gap-3">
            <Heart className="w-5 h-5 text-strategy-conservative" />
            <div>
              <div className="text-[14px] font-bold text-mezo-black">CDP Health: 182%</div>
              <div className="text-[12px] text-mezo-muted">Liquidation price: $48,200</div>
            </div>
          </div>
        )}

        {/* Allocation slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-bold text-mezo-black">MUSD Allocation</span>
            <span className="text-[20px] font-extrabold text-mezo-black">{percent}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="50"
            step="5"
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            className="w-full h-1.5 bg-mezo-border rounded-full appearance-none cursor-pointer accent-mezo-sidebar"
          />
          <div className="flex justify-between text-[11px] text-mezo-muted font-bold">
            <span>10%</span>
            <span>50%</span>
          </div>
        </div>

        <p className="text-[13px] text-mezo-grey">
          {percent}% of your compound rewards will be routed through MUSD LP for additional yield.
        </p>

        <div className="flex items-center gap-2 p-3 bg-strategy-aggressive/5 rounded-xl border border-strategy-aggressive/20">
          <Info className="w-4 h-4 text-strategy-aggressive shrink-0" />
          <p className="text-[11px] text-strategy-aggressive font-medium">
            This adds a 1% borrow cost. Net positive only if LP APR &gt; 1%.
          </p>
        </div>

        <div className="flex gap-3">
          {isEnabled ? (
            <>
              <button onClick={onDisable} className="flex-1 py-3 rounded-2xl border border-red-200 text-red-500 font-bold hover:bg-red-50 transition-colors">
                Disable MUSD
              </button>
              <button onClick={() => onConfirm(percent)} className="flex-1 py-3 rounded-2xl bg-mezo-sidebar text-white font-bold hover:bg-black transition-colors">
                Update
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-mezo-black text-mezo-black font-bold hover:bg-mezo-border/20 transition-colors">
                Cancel
              </button>
              <button onClick={() => onConfirm(percent)} className="flex-1 py-3 rounded-2xl bg-mezo-lime text-mezo-sidebar font-extrabold flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                <Zap className="w-4 h-4" />
                Enable MUSD Yield
              </button>
            </>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
