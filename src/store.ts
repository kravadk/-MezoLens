/**
 * Unified store facade — delegates to modular stores in store/
 * All existing imports from '../store' continue to work.
 */
import { useUIStore } from './store/uiStore';
import { useWalletStore } from './store/walletStore';

export type { Page } from './store/uiStore';

/** Backwards-compatible hook that combines UI + Wallet state */
export function useStore() {
  const { currentPage, setCurrentPage } = useUIStore();
  const { isConnected, address, connect, disconnect } = useWalletStore();

  return {
    currentPage,
    setCurrentPage,
    isWalletConnected: isConnected,
    walletAddress: address,
    connectWallet: connect,
    disconnectWallet: disconnect,
  };
}
