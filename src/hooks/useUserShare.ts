import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZOLENS_CONTRACTS, EARN_VAULT_ABI } from '../config/contracts';

export interface UserShare {
  weight: number;
  totalWeight: number;
  sharePercent: number;
}

export function useUserShare(positionId?: number): UserShare | null {
  const [share, setShare] = useState<UserShare | null>(null);

  useEffect(() => {
    if (positionId === undefined) {
      setShare(null);
      return;
    }

    const load = async () => {
      try {
        const result = await readContract(wagmiConfig, {
          address: MEZOLENS_CONTRACTS.earnVault,
          abi: EARN_VAULT_ABI,
          functionName: 'getUserShare',
          args: [BigInt(positionId)],
          chainId: mezoTestnet.id,
        }) as any;

        setShare({
          weight: Number(result.weight),
          totalWeight: Number(result.totalWeight),
          sharePercent: Number(result.sharePercent),
        });
      } catch {
        setShare(null);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [positionId]);

  return share;
}
