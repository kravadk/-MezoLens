import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZOLENS_CONTRACTS, EARN_VAULT_ABI } from '../config/contracts';
import { useWalletStore } from '../store/walletStore';

export interface Position {
  id: number;
  strategy: 'Conservative' | 'Balanced' | 'Aggressive';
  btcDeposited: number;
  btcCompounded: number;
  mezoLocked: number;
  boostMultiplier: number;
  lockStart: number;
  lockDuration: number;
  lastCompoundEpoch: number;
  totalFeesPaid: number;
  musdPercent: number;
  active: boolean;
  compoundCount: number;
}

const STRATEGY_NAMES: Record<number, 'Conservative' | 'Balanced' | 'Aggressive'> = {
  0: 'Conservative',
  1: 'Balanced',
  2: 'Aggressive',
};

export function usePositions(userAddress?: string) {
  const { fullAddress, isConnected } = useWalletStore();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addr = fullAddress || userAddress;

  useEffect(() => {
    if (!isConnected || !addr) {
      setPositions([]);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        // Get user position IDs
        const ids = await readContract(wagmiConfig, {
          address: MEZOLENS_CONTRACTS.earnVault,
          abi: EARN_VAULT_ABI,
          functionName: 'getUserPositionIds',
          args: [addr as `0x${string}`],
          chainId: mezoTestnet.id,
        }) as bigint[];

        if (!ids || ids.length === 0) {
          setPositions([]);
          setIsLoading(false);
          return;
        }

        // Fetch each position
        const results: Position[] = [];
        for (const id of ids) {
          try {
            const pos = await readContract(wagmiConfig, {
              address: MEZOLENS_CONTRACTS.earnVault,
              abi: EARN_VAULT_ABI,
              functionName: 'getPosition',
              args: [id],
              chainId: mezoTestnet.id,
            }) as any;

            results.push({
              id: Number(id),
              strategy: STRATEGY_NAMES[Number(pos.strategy)] || 'Conservative',
              btcDeposited: parseFloat(formatUnits(pos.btcDeposited, 18)),
              btcCompounded: parseFloat(formatUnits(pos.btcCompounded, 18)),
              mezoLocked: parseFloat(formatUnits(pos.mezoLocked, 18)),
              boostMultiplier: Number(pos.boostMultiplier),
              lockStart: Number(pos.lockStart),
              lockDuration: Number(pos.lockDuration),
              lastCompoundEpoch: Number(pos.lastCompoundEpoch),
              totalFeesPaid: parseFloat(formatUnits(pos.totalFeesPaid, 18)),
              musdPercent: Number(pos.musdPercent),
              active: pos.active,
              compoundCount: 0, // Not tracked in contract struct
            });
          } catch {
            // Skip positions that fail to read
          }
        }
        setPositions(results);
      } catch {
        setPositions([]);
      }
      setIsLoading(false);
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [isConnected, addr]);

  const totalValue = positions.reduce((acc, p) => acc + p.btcDeposited + p.btcCompounded, 0);
  const totalCompoundGains = positions.reduce((acc, p) => acc + p.btcCompounded, 0);
  const activeCount = positions.filter(p => p.active).length;

  return {
    positions,
    totalValue,
    totalCompoundGains,
    activeCount,
    isLoading,
  };
}
