import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZOLENS_CONTRACTS, FEE_COLLECTOR_ABI } from '../config/contracts';

export interface FeeData {
  totalPerformance: number;
  totalManagement: number;
  totalMusdSpread: number;
  totalRevenue: number;
  epochPerformance: number;
  epochManagement: number;
  epochMusdSpread: number;
}

export function useFeeData(): FeeData {
  const [data, setData] = useState<FeeData>({
    totalPerformance: 0,
    totalManagement: 0,
    totalMusdSpread: 0,
    totalRevenue: 0,
    epochPerformance: 0,
    epochManagement: 0,
    epochMusdSpread: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const total = await readContract(wagmiConfig, {
          address: MEZOLENS_CONTRACTS.feeCollector,
          abi: FEE_COLLECTOR_ABI,
          functionName: 'getTotalCollected',
          chainId: mezoTestnet.id,
        }) as any;

        const epoch = await readContract(wagmiConfig, {
          address: MEZOLENS_CONTRACTS.feeCollector,
          abi: FEE_COLLECTOR_ABI,
          functionName: 'getCollectedThisEpoch',
          chainId: mezoTestnet.id,
        }) as any;

        setData({
          totalPerformance: parseFloat(formatUnits(total.performance, 18)),
          totalManagement: parseFloat(formatUnits(total.management, 18)),
          totalMusdSpread: parseFloat(formatUnits(total.spread, 18)),
          totalRevenue: parseFloat(formatUnits(total.total, 18)),
          epochPerformance: parseFloat(formatUnits(epoch.performance, 18)),
          epochManagement: parseFloat(formatUnits(epoch.management, 18)),
          epochMusdSpread: parseFloat(formatUnits(epoch.spread, 18)),
        });
      } catch (e) { if (process.env.NODE_ENV === 'development') console.warn('RPC call failed:', e); }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return data;
}
