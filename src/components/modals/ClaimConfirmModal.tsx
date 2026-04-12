import React from 'react';
import { Download, Info } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';

interface ClaimConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  positionId: number;
  claimAmount: string;
  fee: string;
  netAmount: string;
  onConfirm: () => void;
}

export function ClaimConfirmModal({ isOpen, onClose, positionId, claimAmount, fee, netAmount, onConfirm }: ClaimConfirmModalProps) {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Claim Rewards">
      <div className="space-y-6">
        <div className="p-6 rounded-2xl border border-mezo-black bg-mezo-border/5 space-y-4">
          <div className="flex justify-between text-[14px]">
            <span className="text-mezo-grey">Position</span>
            <span className="font-bold text-mezo-black">#{positionId}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-mezo-grey">Gross rewards</span>
            <span className="font-bold text-mezo-black">{claimAmount}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-mezo-grey">Performance fee (0.3%)</span>
            <span className="font-bold text-mezo-muted">-{fee}</span>
          </div>
          <div className="flex justify-between text-[16px] pt-4 border-t border-mezo-border">
            <span className="font-bold text-mezo-black">You receive</span>
            <span className="font-extrabold text-strategy-conservative">{netAmount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-strategy-aggressive/5 rounded-xl border border-strategy-aggressive/20">
          <Info className="w-4 h-4 text-strategy-aggressive shrink-0" />
          <p className="text-[11px] text-strategy-aggressive font-medium">
            Manual claim does NOT re-lock rewards. For auto-compound, use "Trigger Compound" instead.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-mezo-black text-mezo-black font-bold hover:bg-mezo-border/20 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-mezo-sidebar text-white font-extrabold flex items-center justify-center gap-2 hover:bg-black transition-colors">
            <Download className="w-4 h-4" />
            Claim Rewards
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
