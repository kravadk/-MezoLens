import { useState, useCallback } from 'react';
import { writeContract, waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { parseEther, parseUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import {
  MEZO_BORROW_CONTRACTS,
  BORROWER_OPERATIONS_ABI,
  HINT_HELPERS_ABI,
  SORTED_TROVES_ABI,
} from '../config/contracts';

const ZERO = '0x0000000000000000000000000000000000000000' as `0x${string}`;
// Gas compensation added by the protocol on top of user debt
const GAS_COMP = 200n * 10n ** 18n;

async function computeHints(
  collWei: bigint,
  userDebtWei: bigint,
): Promise<{ upper: `0x${string}`; lower: `0x${string}` }> {
  try {
    const totalDebt = userDebtWei + GAS_COMP;
    if (totalDebt === 0n) return { upper: ZERO, lower: ZERO };

    // NICR = coll * 1e20 / totalDebt
    const nicr = (collWei * 10n ** 20n) / totalDebt;
    const seed = BigInt(Math.floor(Math.random() * 1e15));

    const hint = await readContract(wagmiConfig, {
      address: MEZO_BORROW_CONTRACTS.hintHelpers,
      abi: HINT_HELPERS_ABI,
      functionName: 'getApproxHint',
      args: [nicr, 15n, seed],
      chainId: mezoTestnet.id,
    }) as any;

    // viem returns array [address, diff, seed], not named object
    const hintAddr = (hint[0] ?? hint.hintAddress) as `0x${string}`;

    const pos = await readContract(wagmiConfig, {
      address: MEZO_BORROW_CONTRACTS.sortedTroves,
      abi: SORTED_TROVES_ABI,
      functionName: 'findInsertPosition',
      args: [nicr, hintAddr, hintAddr],
      chainId: mezoTestnet.id,
    }) as any;

    return {
      upper: (pos.prevId ?? pos[0]) as `0x${string}`,
      lower: (pos.nextId ?? pos[1]) as `0x${string}`,
    };
  } catch {
    return { upper: ZERO, lower: ZERO };
  }
}

async function sendTx(
  functionName: string,
  args: readonly unknown[],
  value?: bigint,
): Promise<string> {
  const params: any = {
    address: MEZO_BORROW_CONTRACTS.borrowerOperations,
    abi: BORROWER_OPERATIONS_ABI,
    functionName,
    args,
    chainId: mezoTestnet.id,
  };
  if (value !== undefined) params.value = value;
  const hash = await writeContract(wagmiConfig, params);
  await waitForTransactionReceipt(wagmiConfig, { hash, chainId: mezoTestnet.id });
  return hash;
}

export function useBorrowerOps() {
  const [isLoading, setIsLoading] = useState(false);

  const openTrove = useCallback(async (collBtc: number, debtMusd: number): Promise<string> => {
    setIsLoading(true);
    try {
      const collWei  = parseEther(collBtc.toString());
      const debtWei  = parseUnits(debtMusd.toString(), 18);
      const { upper, lower } = await computeHints(collWei, debtWei);
      return await sendTx('openTrove', [debtWei, upper, lower], collWei);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeTrove = useCallback(async (): Promise<string> => {
    setIsLoading(true);
    try {
      return await sendTx('closeTrove', []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addColl = useCallback(async (collBtc: number): Promise<string> => {
    setIsLoading(true);
    try {
      const collWei = parseEther(collBtc.toString());
      return await sendTx('addColl', [ZERO, ZERO], collWei);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const repayMUSD = useCallback(async (amount: number): Promise<string> => {
    setIsLoading(true);
    try {
      const amountWei = parseUnits(amount.toString(), 18);
      return await sendTx('repayMUSD', [amountWei, ZERO, ZERO]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, openTrove, closeTrove, addColl, repayMUSD };
}
