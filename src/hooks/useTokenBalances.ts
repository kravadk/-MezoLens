import { useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { useBtcPrice } from './useBtcPrice';

export interface TokenBalances {
  btc: number;
  mezo: number;
  musd: number;
  btcUsdPrice: number;
  totalUsdValue: number;
}

export function useTokenBalances(): TokenBalances {
  const { isConnected, btcBalance, mezoBalance, refreshBalance } = useWalletStore();
  const btcUsdPrice = useBtcPrice();

  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(refreshBalance, 15000);
    return () => clearInterval(interval);
  }, [isConnected, refreshBalance]);

  return {
    btc: btcBalance,
    mezo: mezoBalance,
    musd: 0,
    btcUsdPrice,
    totalUsdValue: btcBalance * btcUsdPrice,
  };
}
