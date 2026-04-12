import { useState, useEffect, useCallback } from 'react';
import { writeContract, waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZOLENS_CONTRACTS, EARN_VAULT_ABI } from '../config/contracts';
import { useWalletStore } from '../store/walletStore';
import { usePositions } from './usePositions';

export interface CompoundEvent {
  positionId: number;
  amount: number;
  fee: number;
  callerIncentive: number;
  epoch: number;
  timestamp: number;
  keeper: string;
}

export function useCompound() {
  const [isCompounding, setIsCompounding] = useState(false);
  const [history, setHistory] = useState<CompoundEvent[]>([]);
  const [pendingMap, setPendingMap] = useState<Record<number, number>>({});
  const { isConnected } = useWalletStore();
  const { positions } = usePositions();

  // Load pending compound amounts and history for all positions
  useEffect(() => {
    if (!isConnected || positions.length === 0) return;

    const load = async () => {
      const newPending: Record<number, number> = {};
      const allHistory: CompoundEvent[] = [];

      for (const pos of positions) {
        // Pending compound
        try {
          const result = await readContract(wagmiConfig, {
            address: MEZOLENS_CONTRACTS.earnVault,
            abi: EARN_VAULT_ABI,
            functionName: 'getPendingCompound',
            args: [BigInt(pos.id)],
            chainId: mezoTestnet.id,
          });
          newPending[pos.id] = parseFloat(formatUnits(result as bigint, 18));
        } catch {
          newPending[pos.id] = 0;
        }

        // Compound history
        try {
          const events = await readContract(wagmiConfig, {
            address: MEZOLENS_CONTRACTS.earnVault,
            abi: EARN_VAULT_ABI,
            functionName: 'getCompoundHistory',
            args: [BigInt(pos.id)],
            chainId: mezoTestnet.id,
          }) as any[];

          if (events && events.length > 0) {
            for (const ev of events) {
              allHistory.push({
                positionId: Number(ev.positionId),
                amount: parseFloat(formatUnits(ev.amount, 18)),
                fee: parseFloat(formatUnits(ev.fee, 18)),
                callerIncentive: parseFloat(formatUnits(ev.callerIncentive, 18)),
                epoch: Number(ev.epoch),
                timestamp: Number(ev.timestamp),
                keeper: '0x...',
              });
            }
          }
        } catch (e) { if (process.env.NODE_ENV === 'development') console.warn('RPC call failed:', e); }
      }

      setPendingMap(newPending);
      setHistory(allHistory.sort((a, b) => b.timestamp - a.timestamp));
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [isConnected, positions]);

  const compound = useCallback(async (positionId: number) => {
    setIsCompounding(true);
    try {
      const hash = await writeContract(wagmiConfig, {
        address: MEZOLENS_CONTRACTS.earnVault,
        abi: EARN_VAULT_ABI,
        functionName: 'compound',
        args: [BigInt(positionId)],
        chainId: mezoTestnet.id,
      });
      await waitForTransactionReceipt(wagmiConfig, { hash, chainId: mezoTestnet.id });
      return hash;
    } finally {
      setIsCompounding(false);
    }
  }, []);

  const compoundBatch = useCallback(async (positionIds: number[]) => {
    setIsCompounding(true);
    try {
      const hash = await writeContract(wagmiConfig, {
        address: MEZOLENS_CONTRACTS.earnVault,
        abi: EARN_VAULT_ABI,
        functionName: 'compoundBatch',
        args: [positionIds.map(id => BigInt(id))],
        chainId: mezoTestnet.id,
      });
      await waitForTransactionReceipt(wagmiConfig, { hash, chainId: mezoTestnet.id });
      return hash;
    } finally {
      setIsCompounding(false);
    }
  }, []);

  const getPendingCompound = useCallback((positionId: number): number => {
    return pendingMap[positionId] || 0;
  }, [pendingMap]);

  return {
    history,
    isCompounding,
    compound,
    compoundBatch,
    getPendingCompound,
  };
}
