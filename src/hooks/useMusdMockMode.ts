import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZOLENS_CONTRACTS, MUSD_PIPE_ABI } from '../config/contracts';

/** Reads useMockData() from MusdPipe — true when contract runs demo data. */
export function useMusdMockMode(): boolean | null {
  const [isMock, setIsMock] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const result = await readContract(wagmiConfig, {
          address: MEZOLENS_CONTRACTS.musdPipe,
          abi: MUSD_PIPE_ABI,
          functionName: 'useMockData',
          chainId: mezoTestnet.id,
        });
        setIsMock(result as boolean);
      } catch {
        setIsMock(null);
      }
    };
    check();
  }, []);

  return isMock;
}
