import { create } from 'zustand';
import { getAccount, connect, disconnect, switchChain, getBalance, readContract } from 'wagmi/actions';
import { injected } from 'wagmi/connectors';
import { wagmiConfig, mezoTestnet } from '../lib/wagmi';
import { formatUnits } from 'viem';

const MEZO_TOKEN = '0x7b7c000000000000000000000000000000000001' as `0x${string}`;
const ERC20_BALANCE_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

interface WalletState {
  isConnected: boolean;
  address: string | null;
  fullAddress: string | null;
  btcBalance: number;
  mezoBalance: number;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  address: null,
  fullAddress: null,
  btcBalance: 0,
  mezoBalance: 0,
  connecting: false,
  error: null,

  connect: async () => {
    set({ connecting: true, error: null });
    try {
      const result = await connect(wagmiConfig, {
        connector: injected(),
        chainId: mezoTestnet.id,
      });

      const addr = result.accounts[0];
      if (!addr) {
        set({ connecting: false, error: 'No accounts returned' });
        return;
      }

      // Switch to Mezo Testnet
      try {
        await switchChain(wagmiConfig, { chainId: mezoTestnet.id });
      } catch {
        // Chain switch may fail if already on it, that's fine
      }

      // Read native BTC balance
      const bal = await getBalance(wagmiConfig, { address: addr, chainId: mezoTestnet.id });

      set({
        isConnected: true,
        address: shortenAddress(addr),
        fullAddress: addr,
        btcBalance: parseFloat(parseFloat(formatUnits(bal.value, 18)).toFixed(6)),
        mezoBalance: 0,
        connecting: false,
        error: null,
      });

      // Read MEZO token balance
      get().refreshBalance();

    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || 'Failed to connect wallet';
      set({ connecting: false, error: msg });
    }
  },

  disconnect: () => {
    disconnect(wagmiConfig);
    set({
      isConnected: false,
      address: null,
      fullAddress: null,
      btcBalance: 0,
      mezoBalance: 0,
      connecting: false,
      error: null,
    });
  },

  refreshBalance: async () => {
    const { fullAddress } = get();
    if (!fullAddress) return;

    try {
      // Native BTC
      const bal = await getBalance(wagmiConfig, { address: fullAddress as `0x${string}`, chainId: mezoTestnet.id });
      const btc = parseFloat(parseFloat(formatUnits(bal.value, 18)).toFixed(6));

      // MEZO ERC-20 token via direct balanceOf call
      let mezo = 0;
      try {
        const rawBalance = await readContract(wagmiConfig, {
          address: MEZO_TOKEN,
          abi: ERC20_BALANCE_ABI,
          functionName: 'balanceOf',
          args: [fullAddress as `0x${string}`],
          chainId: mezoTestnet.id,
        });
        mezo = parseFloat(parseFloat(formatUnits(rawBalance as bigint, 18)).toFixed(2));
      } catch (e) { if (process.env.NODE_ENV === 'development') console.warn('RPC call failed:', e); }

      set({ btcBalance: btc, mezoBalance: mezo });
    } catch (e) { if (process.env.NODE_ENV === 'development') console.warn('RPC call failed:', e); }
  },
}));
