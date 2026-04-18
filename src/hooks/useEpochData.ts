import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZOLENS_CONTRACTS, EARN_VAULT_ABI } from '../config/contracts';

export interface EpochData {
  number: number;
  startTime: number;
  endTime: number;
  progress: number;
  timeRemaining: { days: number; hours: number; minutes: number };
  feeBreakdown: { swap: number; borrow: number; bridge: number };
}

function buildFallbackEpoch() {
  return {
    number: 0,
    startTime: 0,
    endTime: 0,
    progress: 0,
    timeRemaining: { days: 0, hours: 0, minutes: 0 },
    feeBreakdown: { swap: 0, borrow: 0, bridge: 0 },
  };
}

export function useEpochData(): EpochData {
  const [epoch, setEpoch] = useState<EpochData>(buildFallbackEpoch);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await readContract(wagmiConfig, {
          address: MEZOLENS_CONTRACTS.earnVault,
          abi: EARN_VAULT_ABI,
          functionName: 'getCurrentEpoch',
          chainId: mezoTestnet.id,
        }) as any;

        const num = Number(result[0] ?? result.number ?? 0);
        const start = Number(result[1] ?? result.start ?? 0) * 1000;
        const end = Number(result[2] ?? result.end ?? 0) * 1000;
        const now = Date.now();
        const duration = end - start;
        const progress = duration > 0 ? Math.min(((now - start) / duration) * 100, 100) : 0;
        const remaining = Math.max(end - now, 0);

        setEpoch({
          number: num,
          startTime: start / 1000,
          endTime: end / 1000,
          progress,
          timeRemaining: {
            days: Math.floor(remaining / (24 * 60 * 60 * 1000)),
            hours: Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
            minutes: Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000)),
          },
          feeBreakdown: { swap: 0, borrow: 0, bridge: 0 },
        });
      } catch {
        // Keep fallback (already set as initial state)
      }
    };

    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return epoch;
}
