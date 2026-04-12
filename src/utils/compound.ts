// Compound math utilities for MezoLens

/**
 * Calculate auto-compound yield over N epochs
 * @param principal Initial BTC amount
 * @param aprBps Annual rate in basis points
 * @param epochs Number of epochs (weekly)
 * @param performanceFeeBps Performance fee in bps (default 30 = 0.3%)
 * @returns Total BTC after compounding
 */
export function calculateCompoundYield(
  principal: number,
  aprBps: number,
  epochs: number,
  performanceFeeBps: number = 30
): number {
  const weeklyRate = aprBps / 10_000 / 52;
  const feeMultiplier = 1 - performanceFeeBps / 10_000;
  let total = principal;

  for (let i = 0; i < epochs; i++) {
    const reward = total * weeklyRate;
    total += reward * feeMultiplier;
  }

  return total;
}

/**
 * Calculate simple (manual claim) yield over N epochs
 * @param principal Initial BTC amount
 * @param aprBps Annual rate in basis points
 * @param epochs Number of epochs (weekly)
 * @returns Total BTC earned (not compounded)
 */
export function calculateSimpleYield(
  principal: number,
  aprBps: number,
  epochs: number
): number {
  const weeklyRate = aprBps / 10_000 / 52;
  return principal * weeklyRate * epochs;
}

/**
 * Calculate compound advantage percentage
 * @returns Percentage advantage of auto-compound over manual claim
 */
export function calculateCompoundAdvantage(
  principal: number,
  aprBps: number,
  epochs: number
): number {
  const compoundTotal = calculateCompoundYield(principal, aprBps, epochs);
  const simpleTotal = principal + calculateSimpleYield(principal, aprBps, epochs);

  if (simpleTotal <= principal) return 0;
  return ((compoundTotal - simpleTotal) / (simpleTotal - principal)) * 100;
}

/**
 * Generate epoch-by-epoch projection data
 */
export function generateProjection(
  principal: number,
  aprBps: number,
  epochs: number,
  performanceFeeBps: number = 30
): { epoch: number; reward: number; total: number }[] {
  const weeklyRate = aprBps / 10_000 / 52;
  const feeMultiplier = 1 - performanceFeeBps / 10_000;
  const data: { epoch: number; reward: number; total: number }[] = [];
  let total = principal;

  for (let i = 1; i <= epochs; i++) {
    const reward = total * weeklyRate * feeMultiplier;
    total += reward;
    data.push({ epoch: i, reward, total });
  }

  return data;
}

/**
 * Calculate management fee pro-rata
 * @param btcLocked BTC amount locked
 * @param daysLocked Number of days locked
 * @param mgmtFeeBps Management fee in bps (default 10 = 0.1%)
 */
export function calculateManagementFee(
  btcLocked: number,
  daysLocked: number,
  mgmtFeeBps: number = 10
): number {
  return (btcLocked * mgmtFeeBps * daysLocked) / (10_000 * 365);
}
