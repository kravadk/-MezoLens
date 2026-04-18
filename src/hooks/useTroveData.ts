import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import {
  MEZO_BORROW_CONTRACTS,
  TROVE_MANAGER_ABI,
  MEZO_PRICE_FEED_ABI,
} from '../config/contracts';

export interface TroveData {
  active: boolean;
  coll: number;           // BTC (18 decimals)
  debt: number;           // Total MUSD = principal + interest + pending
  principal: number;      // Original borrowed MUSD
  interest: number;       // Accrued interest
  icr: number;            // Collateral ratio % (e.g. 200 = 200%)
  liqPrice: number;       // BTC/USD price at liquidation (MCR 110%)
  interestRateBps: number;// e.g. 100 = 1% annual
  btcPrice: number;       // Current price used for ICR calc
}

const FALLBACK_PRICE_WEI = BigInt(96500) * 10n ** 18n;

export function useTroveData(address: string | null) {
  const [trove, setTrove] = useState<TroveData | null>(null);

  useEffect(() => {
    if (!address) {
      setTrove(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const addr = address as `0x${string}`;

      // 1. Fetch BTC/USD price from Mezo PriceFeed
      let priceWei = FALLBACK_PRICE_WEI;
      try {
        priceWei = await readContract(wagmiConfig, {
          address: MEZO_BORROW_CONTRACTS.priceFeed,
          abi: MEZO_PRICE_FEED_ABI,
          functionName: 'fetchPrice',
          chainId: mezoTestnet.id,
        }) as bigint;
      } catch {
        // keep fallback
      }

      if (cancelled) return;
      const btcPrice = parseFloat(formatUnits(priceWei, 18));

      // 2. Get trove status
      let status: number;
      try {
        status = Number(await readContract(wagmiConfig, {
          address: MEZO_BORROW_CONTRACTS.troveManager,
          abi: TROVE_MANAGER_ABI,
          functionName: 'getTroveStatus',
          args: [addr],
          chainId: mezoTestnet.id,
        }));
      } catch {
        if (!cancelled) setTrove(null);
        return;
      }

      if (cancelled) return;

      if (status !== 1) {
        // No active trove — return inactive placeholder
        setTrove({
          active: false,
          coll: 0,
          debt: 0,
          principal: 0,
          interest: 0,
          icr: 0,
          liqPrice: 0,
          interestRateBps: 100,
          btcPrice,
        });
        return;
      }

      // 3. Load full trove data (status === 1 = active)
      try {
        const [debtColl, icrRaw, rateRaw] = (await Promise.all([
          readContract(wagmiConfig, {
            address: MEZO_BORROW_CONTRACTS.troveManager,
            abi: TROVE_MANAGER_ABI,
            functionName: 'getEntireDebtAndColl',
            args: [addr],
            chainId: mezoTestnet.id,
          }),
          readContract(wagmiConfig, {
            address: MEZO_BORROW_CONTRACTS.troveManager,
            abi: TROVE_MANAGER_ABI,
            functionName: 'getCurrentICR',
            args: [addr, priceWei],
            chainId: mezoTestnet.id,
          }),
          readContract(wagmiConfig, {
            address: MEZO_BORROW_CONTRACTS.troveManager,
            abi: TROVE_MANAGER_ABI,
            functionName: 'getTroveInterestRate',
            args: [addr],
            chainId: mezoTestnet.id,
          }),
        ])) as [any, bigint, any];

        const coll      = parseFloat(formatUnits(debtColl.coll as bigint, 18));
        const principal = parseFloat(formatUnits(debtColl.principal as bigint, 18));
        const interest  = parseFloat(formatUnits(debtColl.interest as bigint, 18));
        // include pending
        const pendingPrincipal = parseFloat(formatUnits(debtColl.pendingPrincipal as bigint, 18));
        const pendingInterest  = parseFloat(formatUnits(debtColl.pendingInterest as bigint, 18));
        const debt = principal + interest + pendingPrincipal + pendingInterest;

        // ICR from contract is 1e18-scaled; multiply by 100 to get %
        const icr = parseFloat(formatUnits(icrRaw, 18)) * 100;

        // Liquidation price = debt * 1.1 / coll  (MCR = 110%)
        const liqPrice = coll > 0 ? (debt * 1.1) / coll : 0;

        if (!cancelled) {
          setTrove({
            active: true,
            coll,
            debt,
            principal,
            interest,
            icr,
            liqPrice,
            interestRateBps: Number(rateRaw),
            btcPrice,
          });
        }
      } catch {
        if (!cancelled) setTrove(null);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [address]);

  return trove;
}
