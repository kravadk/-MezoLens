import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZOLENS_CONTRACTS, EARN_VAULT_ABI } from '../config/contracts';
import { useBtcPrice } from './useBtcPrice';

export interface MusdHealth {
  collateralRatio: number;
  liquidationPrice: number;
  currentBtcPrice: number;
  safeMargin: number;
  safe: boolean;
}

export function useMusdHealth(positionId?: number): MusdHealth | null {
  const [health, setHealth] = useState<MusdHealth | null>(null);
  const btcPrice = useBtcPrice();

  useEffect(() => {
    if (positionId === undefined) {
      setHealth(null);
      return;
    }

    const load = async () => {
      try {
        const result = await readContract(wagmiConfig, {
          address: MEZOLENS_CONTRACTS.earnVault,
          abi: EARN_VAULT_ABI,
          functionName: 'getMusdHealth',
          args: [BigInt(positionId)],
          chainId: mezoTestnet.id,
        }) as any;

        const ratio = Number(result.collateralRatio);
        const liqPrice = parseFloat(formatUnits(result.liquidationPrice, 18));

        if (ratio === 0) {
          setHealth(null);
          return;
        }

        setHealth({
          collateralRatio: ratio,
          liquidationPrice: liqPrice,
          currentBtcPrice: btcPrice,
          safeMargin: Math.max(0, ((ratio - 150) / 150) * 100),
          safe: result.safe,
        });
      } catch {
        setHealth(null);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [positionId, btcPrice]);

  return health;
}
