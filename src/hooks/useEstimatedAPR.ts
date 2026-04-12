import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZOLENS_CONTRACTS, EARN_VAULT_ABI } from '../config/contracts';

export interface StrategyAPRs {
  conservative: number;
  balanced: number;
  aggressive: number;
}

export function useEstimatedAPR(): StrategyAPRs {
  const [aprs, setAprs] = useState<StrategyAPRs>({
    conservative: 6,
    balanced: 8.5,
    aggressive: 12.4,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [c, b, a] = await Promise.all([
          readContract(wagmiConfig, {
            address: MEZOLENS_CONTRACTS.earnVault,
            abi: EARN_VAULT_ABI,
            functionName: 'getEstimatedAPR',
            args: [0], // Conservative
            chainId: mezoTestnet.id,
          }),
          readContract(wagmiConfig, {
            address: MEZOLENS_CONTRACTS.earnVault,
            abi: EARN_VAULT_ABI,
            functionName: 'getEstimatedAPR',
            args: [1], // Balanced
            chainId: mezoTestnet.id,
          }),
          readContract(wagmiConfig, {
            address: MEZOLENS_CONTRACTS.earnVault,
            abi: EARN_VAULT_ABI,
            functionName: 'getEstimatedAPR',
            args: [2], // Aggressive
            chainId: mezoTestnet.id,
          }),
        ]);

        // Contract returns bps with extra *100 factor: mockRewardRate * 52 * 100
        // Divide by 10000 to get percentage (e.g. 624000 → 62.4%)
        setAprs({
          conservative: Number(c as bigint) / 10000,
          balanced: Number(b as bigint) / 10000,
          aggressive: Number(a as bigint) / 10000,
        });
      } catch {
        // Keep defaults
      }
    };

    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return aprs;
}
