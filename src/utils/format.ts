/**
 * Format a number with locale-aware separators
 */
export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format as USD currency
 */
export function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

/**
 * Format BTC amount (up to 6 decimals)
 */
export function formatBTC(num: number): string {
  if (num >= 1) return formatNumber(num, 4) + ' BTC';
  if (num >= 0.001) return formatNumber(num, 6) + ' BTC';
  return num.toFixed(8) + ' BTC';
}

/**
 * Format MEZO amount
 */
export function formatMEZO(num: number): string {
  return formatNumber(num, 0) + ' MEZO';
}

/**
 * Format percentage with + sign for positive
 */
export function formatPercent(num: number, decimals = 1): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}

/**
 * Shorten address: 0x1234...5678
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format wei (18 decimals) to BTC
 */
export function weiToBTC(wei: bigint): number {
  return Number(wei) / 1e18;
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Format epoch number
 */
export function formatEpoch(num: number): string {
  return `#${num}`;
}

/**
 * Format basis points to percentage string
 */
export function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(1) + '%';
}
