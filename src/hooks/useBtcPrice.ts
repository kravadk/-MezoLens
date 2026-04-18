import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZO_ADDRESSES } from '../config/mezo';
import { MEZO_BORROW_CONTRACTS, MEZO_PRICE_FEED_ABI } from '../config/contracts';

const PYTH_ABI = [
  {
    name: 'getPriceUnsafe',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'bytes32' }],
    outputs: [{
      name: 'price', type: 'tuple', components: [
        { name: 'price', type: 'int64' },
        { name: 'conf', type: 'uint64' },
        { name: 'expo', type: 'int32' },
        { name: 'publishTime', type: 'uint256' },
      ]
    }],
  },
] as const;

const BTC_USD_FEED_ID = MEZO_ADDRESSES.pythBtcUsd as `0x${string}`;
const FALLBACK_PRICE = 96500;

export function useBtcPrice(): number {
  const [price, setPrice] = useState(FALLBACK_PRICE);

  useEffect(() => {
    const load = async () => {
      // Primary: Mezo PriceFeed (same oracle the protocol uses for ICR)
      try {
        const raw = await readContract(wagmiConfig, {
          address: MEZO_BORROW_CONTRACTS.priceFeed,
          abi: MEZO_PRICE_FEED_ABI,
          functionName: 'fetchPrice',
          chainId: mezoTestnet.id,
        }) as bigint;
        const usdPrice = parseFloat(formatUnits(raw, 18));
        if (usdPrice > 1000 && usdPrice < 1_000_000) {
          setPrice(Math.round(usdPrice));
          return;
        }
      } catch {
        // fall through to Pyth
      }

      // Fallback: Pyth oracle
      try {
        const result = await readContract(wagmiConfig, {
          address: MEZO_ADDRESSES.pythOracle,
          abi: PYTH_ABI,
          functionName: 'getPriceUnsafe',
          args: [BTC_USD_FEED_ID],
          chainId: mezoTestnet.id,
        }) as any;

        const rawPrice = Number(result.price);
        const expo = Number(result.expo);
        const usdPrice = rawPrice * Math.pow(10, expo);

        if (usdPrice > 1000 && usdPrice < 1_000_000) {
          setPrice(Math.round(usdPrice));
        }
      } catch {
        // Keep current price
      }
    };

    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return price;
}
