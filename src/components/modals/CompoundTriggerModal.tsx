import React from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';

interface CompoundTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  positionId: number;
  estimatedGain: string;
  gasCost: string;
  keeperIncentive: string;
  onConfirm: () => void;
}

export function CompoundTriggerModal({ isOpen, onClose, positionId, estimatedGain, gasCost, keeperIncentive, onConfirm }: CompoundTriggerModalProps) {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Trigger Compound">
      <div className="space-y-6">
        <div className="p-6 bg-mezo-lime/10 rounded-2xl border border-mezo-lime/20">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-mezo-sidebar" />
            <span className="text-[15px] font-bold text-mezo-black">Compound Position #{positionId}</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-[14px]">
              <span className="text-mezo-grey">Estimated gain</span>
              <span className="font-extrabold text-strategy-conservative">{estimatedGain}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-mezo-grey">Your gas cost</span>
              <span className="font-bold text-mezo-black">{gasCost}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-mezo-grey">Keeper incentive</span>
              <span className="font-bold text-mezo-black">{keeperIncentive}</span>
            </div>
          </div>
        </div>

        <p className="text-[13px] text-mezo-muted">
          This will claim pending rewards and re-lock them as veBTC. You'll receive a keeper incentive for triggering the compound.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-mezo-black text-mezo-black font-bold hover:bg-mezo-border/20 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-mezo-lime text-mezo-sidebar font-extrabold flex items-center justify-center gap-2 hover:opacity-90 transition-all">
            <RefreshCw className="w-4 h-4" />
            Compound Now
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
