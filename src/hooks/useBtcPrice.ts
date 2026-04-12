import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { MEZO_ADDRESSES } from '../config/mezo';

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

        if (usdPrice > 1000 && usdPrice < 1000000) {
          setPrice(Math.round(usdPrice));
        }
      } catch {
        // Keep fallback
      }
    };

    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return price;
}
