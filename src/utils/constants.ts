// MezoLens Constants

export const STRATEGIES = {
  CONSERVATIVE: 0,
  BALANCED: 1,
  AGGRESSIVE: 2,
} as const;

export const STRATEGY_NAMES = ['Conservative', 'Balanced', 'Aggressive'] as const;

export const STRATEGY_COLORS = {
  [STRATEGIES.CONSERVATIVE]: '#1A8C52',
  [STRATEGIES.BALANCED]: '#5B6DEC',
  [STRATEGIES.AGGRESSIVE]: '#D4940A',
} as const;

export const STRATEGY_BOOSTS = {
  [STRATEGIES.CONSERVATIVE]: '1x',
  [STRATEGIES.BALANCED]: '2x',
  [STRATEGIES.AGGRESSIVE]: '5x',
} as const;

export const FEES = {
  PERFORMANCE_BPS: 30,      // 0.3%
  MANAGEMENT_BPS: 10,       // 0.1% annual
  MUSD_SPREAD_BPS: 1000,    // 10%
  KEEPER_INCENTIVE_BPS: 10, // 0.1%
} as const;

export const CHAIN = {
  TESTNET_ID: 31611,
  MAINNET_ID: 31612,
  EPOCH_DURATION: 7 * 24 * 60 * 60, // 7 days in seconds
  MIN_BTC_DEPOSIT: 0.000001,
  MIN_MEZO_DEPOSIT: 100,
  DEFAULT_LOCK_DURATION: 30 * 24 * 60 * 60, // 30 days in seconds
} as const;

export const EXPLORER = {
  TESTNET: 'https://explorer.test.mezo.org',
  MAINNET: 'https://explorer.mezo.org',
} as const;

export function getExplorerUrl(txHash: string, testnet = true): string {
  const base = testnet ? EXPLORER.TESTNET : EXPLORER.MAINNET;
  return `${base}/tx/${txHash}`;
}

export function getAddressUrl(address: string, testnet = true): string {
  const base = testnet ? EXPLORER.TESTNET : EXPLORER.MAINNET;
  return `${base}/address/${address}`;
}
