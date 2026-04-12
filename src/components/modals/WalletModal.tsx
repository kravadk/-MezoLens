import React from 'react';
import { Wallet, Eye, Loader2 } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';
import { useWalletStore } from '../../store/walletStore';
import { useUIStore } from '../../store/uiStore';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, connecting, error } = useWalletStore();
  const { showToast } = useUIStore();

  const handleConnect = async () => {
    await connect();
    const { isConnected, error: err } = useWalletStore.getState();
    if (isConnected) {
      onClose();
      showToast('Wallet connected successfully', 'success');
    } else if (err) {
      showToast(err, 'error');
    }
  };

  const hasEthereum = typeof window !== 'undefined' && !!(window as any).ethereum;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Connect Wallet">
      <p className="text-[14px] text-mezo-grey mb-6">
        Connect your wallet to deposit BTC, manage positions, and earn auto-compound yield.
      </p>

      <div className="space-y-3">
        {hasEthereum ? (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-mezo-black hover:border-mezo-lime/50 hover:bg-mezo-lime/5 transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mezo-lime/10 flex items-center justify-center">
                {connecting ? (
                  <Loader2 className="w-5 h-5 text-mezo-sidebar animate-spin" />
                ) : (
                  <Wallet className="w-5 h-5 text-mezo-sidebar" />
                )}
              </div>
              <div className="text-left">
                <div className="text-[15px] font-bold text-mezo-black">
                  {connecting ? 'Connecting...' : 'Browser Wallet'}
                </div>
                <div className="text-[12px] text-mezo-muted">
                  Rabby, MetaMask, or any EVM wallet
                </div>
              </div>
            </div>
            {!connecting && (
              <span className="text-[12px] font-bold text-mezo-lime bg-mezo-lime/10 px-3 py-1 rounded-full">
                Detected
              </span>
            )}
          </button>
        ) : (
          <div className="p-4 rounded-2xl border-2 border-dashed border-mezo-border text-center">
            <p className="text-[14px] font-bold text-mezo-black mb-1">No wallet detected</p>
            <p className="text-[12px] text-mezo-muted mb-3">
              Install a browser wallet extension to continue
            </p>
            <div className="flex justify-center gap-3">
              <a
                href="https://rabby.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-bold text-mezo-sidebar hover:underline"
              >
                Get Rabby →
              </a>
              <a
                href="https://metamask.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-bold text-mezo-muted hover:underline"
              >
                Get MetaMask →
              </a>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-[12px] text-red-600 font-medium">
          {error}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-mezo-border flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 bg-mezo-lime rounded-full animate-pulse" />
        <span className="text-[12px] text-mezo-muted">Mezo Testnet (Chain ID: 31611)</span>
      </div>
    </ModalWrapper>
  );
}
