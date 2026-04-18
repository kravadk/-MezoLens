import { useState, useEffect, useCallback } from 'react';
import { readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import {
  MEZO_BORROW_CONTRACTS,
  TROVE_MANAGER_ABI,
  MEZO_PRICE_FEED_ABI,
  MUSD_TOKEN_ABI,
} from '../config/contracts';

const STORAGE_KEY = 'mezolens_watchlist';

export interface WatchedAddress {
  address: string;
  label: string;
  added: number; // timestamp
}

export interface WatchedTrove {
  address: string;
  label: string;
  status: 'loading' | 'active' | 'none' | 'error';
  coll: number;
  principal: number;
  interest: number;
  icr: number;
  liqPrice: number;
  musdBalance: number;
  riskLevel: 'safe' | 'caution' | 'danger' | 'none';
}

function loadAddresses(): WatchedAddress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAddresses(list: WatchedAddress[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function useWatchlist() {
  const [addresses, setAddresses] = useState<WatchedAddress[]>(loadAddresses);
  const [troves, setTroves] = useState<WatchedTrove[]>([]);
  const [btcPrice, setBtcPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveAddresses(addresses);
  }, [addresses]);

  const addAddress = useCallback((address: string, label: string) => {
    const normalized = address.toLowerCase().startsWith('0x') ? address : `0x${address}`;
    if (addresses.some(a => a.address.toLowerCase() === normalized.toLowerCase())) return;
    setAddresses(prev => [...prev, { address: normalized, label: label || normalized.slice(0, 8), added: Date.now() }]);
  }, [addresses]);

  const removeAddress = useCallback((address: string) => {
    setAddresses(prev => prev.filter(a => a.address.toLowerCase() !== address.toLowerCase()));
  }, []);

  const updateLabel = useCallback((address: string, label: string) => {
    setAddresses(prev => prev.map(a => a.address.toLowerCase() === address.toLowerCase() ? { ...a, label } : a));
  }, []);

  const refresh = useCallback(async () => {
    if (addresses.length === 0) { setTroves([]); return; }
    setLoading(true);

    // Set loading placeholders
    setTroves(addresses.map(a => ({
      address: a.address,
      label: a.label,
      status: 'loading',
      coll: 0, principal: 0, interest: 0, icr: 0, liqPrice: 0, musdBalance: 0,
      riskLevel: 'none',
    })));

    // Fetch BTC price once
    let price = btcPrice;
    try {
      const p = await readContract(wagmiConfig, {
        address: MEZO_BORROW_CONTRACTS.priceFeed,
        abi: MEZO_PRICE_FEED_ABI,
        functionName: 'fetchPrice',
        chainId: mezoTestnet.id,
      } as any) as bigint;
      price = parseFloat(formatUnits(p, 18));
      setBtcPrice(price);
    } catch {}

    // Fetch each address in parallel
    const results = await Promise.all(addresses.map(async (watched) => {
      const addr = watched.address as `0x${string}`;
      const base: WatchedTrove = {
        address: watched.address,
        label: watched.label,
        status: 'none',
        coll: 0, principal: 0, interest: 0, icr: 0, liqPrice: 0, musdBalance: 0,
        riskLevel: 'none',
      };

      try {
        const status = Number(await readContract(wagmiConfig, {
          address: MEZO_BORROW_CONTRACTS.troveManager,
          abi: TROVE_MANAGER_ABI,
          functionName: 'getTroveStatus',
          args: [addr],
          chainId: mezoTestnet.id,
        } as any));

        if (status !== 1) return { ...base, status: 'none' as const };

        const [dcRaw, icrRaw, musdRaw] = (await Promise.all([
          readContract(wagmiConfig, {
            address: MEZO_BORROW_CONTRACTS.troveManager,
            abi: TROVE_MANAGER_ABI,
            functionName: 'getEntireDebtAndColl',
            args: [addr],
            chainId: mezoTestnet.id,
          } as any),
          readContract(wagmiConfig, {
            address: MEZO_BORROW_CONTRACTS.troveManager,
            abi: TROVE_MANAGER_ABI,
            functionName: 'getCurrentICR',
            args: [addr, BigInt(Math.floor(price * 1e18))],
            chainId: mezoTestnet.id,
          } as any),
          readContract(wagmiConfig, {
            address: MEZO_BORROW_CONTRACTS.musdToken,
            abi: MUSD_TOKEN_ABI,
            functionName: 'balanceOf',
            args: [addr],
            chainId: mezoTestnet.id,
          } as any),
        ])) as [any, bigint, bigint];

        const coll      = parseFloat(formatUnits(dcRaw[0], 18));
        const principal = parseFloat(formatUnits(dcRaw[1], 18));
        const interest  = parseFloat(formatUnits(dcRaw[2], 18));
        const icr       = parseFloat(formatUnits(icrRaw, 18)) * 100;
        const liqPrice  = coll > 0 ? ((principal + interest) * 1.1) / coll : 0;
        const musdBal   = parseFloat(formatUnits(musdRaw, 18));

        const riskLevel = icr < 120 ? 'danger' : icr < 150 ? 'caution' : 'safe';

        return { ...base, status: 'active' as const, coll, principal, interest, icr, liqPrice, musdBalance: musdBal, riskLevel };
      } catch {
        return { ...base, status: 'error' as const };
      }
    }));

    setTroves(results);
    setLoading(false);
  }, [addresses, btcPrice]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [addresses.length]);

  return { addresses, troves, btcPrice, loading, addAddress, removeAddress, updateLabel, refresh };
}
