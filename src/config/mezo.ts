// Mezo Network Configuration
export const mezoTestnet = {
  id: 31611,
  name: 'Mezo Testnet',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.test.mezo.org'], webSocket: ['wss://rpc-ws.test.mezo.org'] },
  },
  blockExplorers: {
    default: { name: 'Mezo Explorer', url: 'https://explorer.test.mezo.org' },
  },
  testnet: true,
} as const;

export const mezoMainnet = {
  id: 31612,
  name: 'Mezo',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-http.mezo.boar.network'], webSocket: ['wss://rpc-ws.mezo.boar.network'] },
  },
  blockExplorers: {
    default: { name: 'Mezo Explorer', url: 'https://explorer.mezo.org' },
  },
  testnet: false,
} as const;

// Mezo Testnet Protocol Addresses
export const MEZO_ADDRESSES = {
  // Core MUSD System
  borrowerOperations: '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5' as `0x${string}`,
  troveManager: '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0' as `0x${string}`,
  musdToken: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503' as `0x${string}`,
  stabilityPool: '0x1CCA7E410eE41739792eA0A24e00349Dd247680e' as `0x${string}`,
  hintHelpers: '0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6' as `0x${string}`,
  sortedTroves: '0x722E4D24FD6Ff8b0AC679450F3D91294607268fA' as `0x${string}`,
  priceFeed: '0x86bCF0841622a5dAC14A313a15f96A95421b9366' as `0x${string}`,
  activePool: '0x143A063F62340DA3A8bEA1C5642d18C6D0F7FF51' as `0x${string}`,

  // Oracles
  skipOracle: '0x7b7c000000000000000000000000000000000015' as `0x${string}`,
  pythOracle: '0x2880aB155794e7179c9eE2e38200202908C17B43' as `0x${string}`,

  // Pyth Price Feed IDs
  pythBtcUsd: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  pythMusdUsd: '0x0617a9b725011a126a2b9fd53563f4236501f32cf76d877644b943394606c6de',
} as const;
