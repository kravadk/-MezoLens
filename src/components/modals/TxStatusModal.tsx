import React from 'react';
import { motion } from 'motion/react';
import { Check, Loader2, X, ExternalLink } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';
import { getExplorerUrl } from '../../utils/constants';

type TxStatus = 'pending' | 'success' | 'error';

interface TxStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TxStatus;
  txHash?: string;
  title?: string;
  message?: string;
}

export function TxStatusModal({ isOpen, onClose, status, txHash, title, message }: TxStatusModalProps) {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={title || 'Transaction Status'}>
      <div className="flex flex-col items-center text-center py-6 space-y-6">
        {status === 'pending' && (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Loader2 className="w-16 h-16 text-mezo-sidebar" />
          </motion.div>
        )}
        {status === 'success' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <div className="w-16 h-16 rounded-full bg-strategy-conservative flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        )}
        {status === 'error' && (
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
            <X className="w-8 h-8 text-white" />
          </div>
        )}

        <div>
          <h4 className="text-[18px] font-extrabold text-mezo-black">
            {status === 'pending' && 'Confirming Transaction...'}
            {status === 'success' && 'Transaction Confirmed!'}
            {status === 'error' && 'Transaction Failed'}
          </h4>
          <p className="text-[14px] text-mezo-muted mt-2">
            {message || (status === 'pending' ? 'Please wait while your transaction is being confirmed on Mezo.' : status === 'success' ? 'Your transaction has been successfully confirmed.' : 'Something went wrong. Please try again.')}
          </p>
        </div>

        {txHash && (
          <a
            href={getExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] font-bold text-mezo-sidebar hover:underline"
          >
            View on Explorer <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {status !== 'pending' && (
          <button onClick={onClose} className="px-8 py-3 bg-mezo-sidebar text-white rounded-2xl font-bold hover:bg-black transition-colors">
            {status === 'success' ? 'Done' : 'Close'}
          </button>
        )}
      </div>
    </ModalWrapper>
  );
}
