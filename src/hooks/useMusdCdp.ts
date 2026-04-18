import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZOLENS_CONTRACTS, MUSD_PIPE_ABI } from '../config/contracts';

export interface CdpData {
  collateral: number;   // BTC
  debt: number;         // MUSD
  lpTokens: number;
  lpDeployed: number;   // MUSD in LP
  totalYield: number;   // MUSD harvested
  active: boolean;
  ratio: number;        // collateral ratio %
  liqPrice: number;     // liquidation price USD
  safe: boolean;
}

export function useMusdCdp(positionId = 0) {
  const [cdp, setCdp] = useState<CdpData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [cdpRaw, healthRaw] = await Promise.all([
          readContract(wagmiConfig, {
            address: MEZOLENS_CONTRACTS.musdPipe,
            abi: MUSD_PIPE_ABI,
            functionName: 'getCDPFor',
            args: [BigInt(positionId)],
            chainId: mezoTestnet.id,
          }) as any,
          readContract(wagmiConfig, {
            address: MEZOLENS_CONTRACTS.musdPipe,
            abi: MUSD_PIPE_ABI,
            functionName: 'getHealthFor',
            args: [BigInt(positionId)],
            chainId: mezoTestnet.id,
          }) as any,
        ]);

        setCdp({
          collateral: parseFloat(formatUnits(cdpRaw.collateral, 18)),
          debt: parseFloat(formatUnits(cdpRaw.debt, 18)),
          lpTokens: parseFloat(formatUnits(cdpRaw.lpTokens, 18)),
          lpDeployed: parseFloat(formatUnits(cdpRaw.lpDeployed, 18)),
          totalYield: parseFloat(formatUnits(cdpRaw.totalYield, 18)),
          active: cdpRaw.active,
          ratio: Number(healthRaw.ratio) / 100,
          liqPrice: parseFloat(formatUnits(healthRaw.liqPrice, 18)),
          safe: healthRaw.safe,
        });
      } catch {
        setCdp(null);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [positionId]);

  return cdp;
}
