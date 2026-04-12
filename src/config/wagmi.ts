/**
 * Wagmi v2 configuration for MezoLens
 *
 * In production, install and configure:
 *   npm install wagmi viem @tanstack/react-query @mezo-org/passport
 *
 * Then wrap your app with:
 *   <WagmiProvider config={wagmiConfig}>
 *     <QueryClientProvider client={queryClient}>
 *       <App />
 *     </QueryClientProvider>
 *   </WagmiProvider>
 */

import { mezoTestnet, mezoMainnet } from './mezo';

// Wagmi chain definition (compatible with viem Chain type)
export const mezoTestnetChain = {
  id: mezoTestnet.id,
  name: mezoTestnet.name,
  nativeCurrency: mezoTestnet.nativeCurrency,
  rpcUrls: mezoTestnet.rpcUrls,
  blockExplorers: mezoTestnet.blockExplorers,
  testnet: true,
} as const;

export const mezoMainnetChain = {
  id: mezoMainnet.id,
  name: mezoMainnet.name,
  nativeCurrency: mezoMainnet.nativeCurrency,
  rpcUrls: mezoMainnet.rpcUrls,
  blockExplorers: mezoMainnet.blockExplorers,
  testnet: false,
} as const;

/**
 * Example wagmi config (uncomment when wagmi is installed):
 *
 * import { createConfig, http } from 'wagmi';
 * import { injected } from 'wagmi/connectors';
 *
 * export const wagmiConfig = createConfig({
 *   chains: [mezoTestnetChain],
 *   connectors: [injected()],
 *   transports: {
 *     [mezoTestnet.id]: http(mezoTestnet.rpcUrls.default.http[0]),
 *   },
 * });
 */

// Active network config
export const ACTIVE_CHAIN = mezoTestnetChain;
export const ACTIVE_RPC = mezoTestnet.rpcUrls.default.http[0];
