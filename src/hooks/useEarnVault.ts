import { useState, useEffect, useCallback } from 'react';
import { writeContract, waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { parseEther, formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZOLENS_CONTRACTS, EARN_VAULT_ABI } from '../config/contracts';

interface VaultStats {
  totalBtcLocked: number;
  totalMezoLocked: number;
  totalPositions: number;
  totalCompounded: number;
  totalFeesCollected: number;
  currentEpoch: number;
}

async function writeTx(functionName: string, args: any[], value?: bigint): Promise<string> {
  const hash = await writeContract(wagmiConfig, {
    address: MEZOLENS_CONTRACTS.earnVault,
    abi: EARN_VAULT_ABI,
    functionName,
    args,
    value,
    chainId: mezoTestnet.id,
  });
  await waitForTransactionReceipt(wagmiConfig, { hash, chainId: mezoTestnet.id });
  return hash;
}

export function useEarnVault() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<VaultStats>({
    totalBtcLocked: 0,
    totalMezoLocked: 0,
    totalPositions: 0,
    totalCompounded: 0,
    totalFeesCollected: 0,
    currentEpoch: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await readContract(wagmiConfig, {
          address: MEZOLENS_CONTRACTS.earnVault,
          abi: EARN_VAULT_ABI,
          functionName: 'getVaultStats',
          chainId: mezoTestnet.id,
        }) as any;

        setStats({
          totalBtcLocked: parseFloat(formatUnits(result.totalBtcLocked, 18)),
          totalMezoLocked: parseFloat(formatUnits(result.totalMezoLocked, 18)),
          totalPositions: Number(result.totalPositions),
          totalCompounded: parseFloat(formatUnits(result.totalCompounded, 18)),
          totalFeesCollected: parseFloat(formatUnits(result.totalFeesCollected, 18)),
          currentEpoch: Number(result.currentEpoch),
        });
      } catch {
        // Keep defaults on error
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const deposit = useCallback(async (strategy: number, btcAmount: number, mezoAmount: number) => {
    setIsLoading(true);
    try {
      return await writeTx(
        'deposit',
        [strategy, parseEther(mezoAmount.toString())],
        parseEther(btcAmount.toString())
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const withdraw = useCallback(async (positionId: number) => {
    setIsLoading(true);
    try {
      return await writeTx('withdraw', [BigInt(positionId)]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const claimWithoutCompound = useCallback(async (positionId: number) => {
    setIsLoading(true);
    try {
      return await writeTx('claimWithoutCompound', [BigInt(positionId)]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changeStrategy = useCallback(async (positionId: number, newStrategy: number) => {
    setIsLoading(true);
    try {
      return await writeTx('changeStrategy', [BigInt(positionId), newStrategy]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enableMusdYield = useCallback(async (positionId: number, percentage: number) => {
    setIsLoading(true);
    try {
      return await writeTx('enableMusdYield', [BigInt(positionId), BigInt(percentage)]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disableMusdYield = useCallback(async (positionId: number) => {
    setIsLoading(true);
    try {
      return await writeTx('disableMusdYield', [BigInt(positionId)]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    vaultAddress: MEZOLENS_CONTRACTS.earnVault,
    stats,
    isLoading,
    deposit,
    withdraw,
    claimWithoutCompound,
    changeStrategy,
    enableMusdYield,
    disableMusdYield,
  };
}
