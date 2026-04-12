import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZO_PASSPORT_ADDRESS, MEZO_PASSPORT_ABI } from '../config/contracts';
import { useWalletStore } from '../store/walletStore';

export type PassportStatus = 'loading' | 'verified' | 'missing' | 'unavailable';

export function usePassport() {
  const [status, setStatus] = useState<PassportStatus>('loading');
  const { fullAddress, isConnected } = useWalletStore();

  useEffect(() => {
    if (!isConnected || !fullAddress) {
      setStatus('missing');
      return;
    }
    // Passport contract not deployed yet — mark as unavailable so UI shows CTA
    if (MEZO_PASSPORT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      setStatus('unavailable');
      return;
    }
    const check = async () => {
      try {
        const balance = await readContract(wagmiConfig, {
          address: MEZO_PASSPORT_ADDRESS,
          abi: MEZO_PASSPORT_ABI,
          functionName: 'balanceOf',
          args: [fullAddress as `0x${string}`],
          chainId: mezoTestnet.id,
        }) as bigint;
        setStatus(balance > 0n ? 'verified' : 'missing');
      } catch {
        setStatus('unavailable');
      }
    };
    check();
  }, [isConnected, fullAddress]);

  return status;
}
