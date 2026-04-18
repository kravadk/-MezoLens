import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZO_BORROW_CONTRACTS, MUSD_TOKEN_ABI } from '../config/contracts';

export function useMusdBalance(address: string | null): number {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!address) {
      setBalance(0);
      return;
    }

    const load = async () => {
      try {
        const raw = await readContract(wagmiConfig, {
          address: MEZO_BORROW_CONTRACTS.musdToken,
          abi: MUSD_TOKEN_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
          chainId: mezoTestnet.id,
        }) as bigint;
        setBalance(parseFloat(formatUnits(raw, 18)));
      } catch {
        setBalance(0);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [address]);

  return balance;
}
