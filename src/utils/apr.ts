/**
 * APR calculation utilities for MezoLens
 */

/** Base APR per strategy in basis points */
export const BASE_APR: Record<string, number> = {
  conservative: 600,   // 6%
  balanced: 850,       // 8.5%
  aggressive: 1240,    // 12.4%
};

/** Boost multipliers */
export const BOOST: Record<string, number> = {
  conservative: 100,  // 1x
  balanced: 200,      // 2x
  aggressive: 500,    // 5x
};

/**
 * Calculate estimated APR for a strategy
 * @param strategy Strategy name
 * @param withCompound Whether to include compound effect
 * @returns APR in basis points
 */
export function getEstimatedAPR(strategy: string, withCompound = true): number {
  const base = BASE_APR[strategy] || 600;
  if (!withCompound) return base;
  // Compound effect adds ~15-20% on top of base
  const compoundBonus = Math.floor(base * 0.18);
  return base + compoundBonus;
}

/**
 * Calculate APR with boost
 * @param baseApr Base APR in bps
 * @param boostMultiplier Boost (100 = 1x, 500 = 5x)
 * @returns Boosted APR in bps
 */
export function applyBoost(baseApr: number, boostMultiplier: number): number {
  return (baseApr * boostMultiplier) / 100;
}

/**
 * Calculate compound APR (APR including compound effect)
 * @param baseApr Annual rate in basis points
 * @param epochsPerYear Number of epochs per year (52 for weekly)
 * @returns Compound APR in basis points
 */
export function getCompoundAPR(baseApr: number, epochsPerYear = 52): number {
  const rate = baseApr / 10_000;
  const perEpoch = rate / epochsPerYear;
  const compoundRate = Math.pow(1 + perEpoch, epochsPerYear) - 1;
  return Math.floor(compoundRate * 10_000);
}

/**
 * Compare manual vs compound APR
 */
export function getCompoundAdvantage(strategy: string): {
  manualApr: number;
  compoundApr: number;
  advantagePercent: number;
} {
  const base = BASE_APR[strategy] || 600;
  const compoundApr = getCompoundAPR(base);
  const advantage = compoundApr - base;
  const advantagePercent = (advantage / base) * 100;

  return {
    manualApr: base,
    compoundApr,
    advantagePercent,
  };
}

/**
 * Format APR from basis points to display string
 */
export function formatAPR(bps: number): string {
  return (bps / 100).toFixed(1) + '%';
}
