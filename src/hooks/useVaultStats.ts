import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZOLENS_CONTRACTS, EARN_VAULT_ABI } from '../config/contracts';

export interface KeeperInfo {
  address: string;
  compounds: number;
  totalCompounded: number;
  earned: number;
}

export interface VaultStatsData {
  totalBtcInVault: number;
  totalAutoCompounded: number;
  totalPositions: number;
  protocolRevenue: number;
  keepers: KeeperInfo[];
  strategyDistribution: { conservative: number; balanced: number; aggressive: number };
}

export function useVaultStats(): VaultStatsData {
  const [data, setData] = useState<VaultStatsData>({
    totalBtcInVault: 0,
    totalAutoCompounded: 0,
    totalPositions: 0,
    protocolRevenue: 0,
    keepers: [],
    strategyDistribution: { conservative: 0, balanced: 0, aggressive: 0 },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const result = await readContract(wagmiConfig, {
          address: MEZOLENS_CONTRACTS.earnVault,
          abi: EARN_VAULT_ABI,
          functionName: 'getVaultStats',
          chainId: mezoTestnet.id,
        }) as any;

        setData({
          totalBtcInVault: parseFloat(formatUnits(result.totalBtcLocked, 18)),
          totalAutoCompounded: parseFloat(formatUnits(result.totalCompounded, 18)),
          totalPositions: Number(result.totalPositions),
          protocolRevenue: parseFloat(formatUnits(result.totalFeesCollected, 18)),
          keepers: [],
          strategyDistribution: { conservative: 0, balanced: 0, aggressive: 0 },
        });
      } catch (e) { if (process.env.NODE_ENV === 'development') console.warn('RPC call failed:', e); }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return data;
}
