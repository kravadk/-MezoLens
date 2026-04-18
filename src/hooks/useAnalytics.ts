import { useState, useEffect } from 'react';
import { usePositions } from './usePositions';
import { useCompound } from './useCompound';
import { useEstimatedAPR } from './useEstimatedAPR';
import { useBtcPrice } from './useBtcPrice';
import { useEpochData } from './useEpochData';

export interface EpochSnapshot {
  epoch: string;
  compounded: number;    // BTC gained this epoch
  totalBtc: number;      // cumulative BTC
  hodlBtc: number;       // what hodl would have had
  apr: number;           // effective APR this epoch (annualised)
}

export interface BreakevenData {
  musd: number;          // MUSD borrowed
  borrowCostPerYear: number;  // $ cost
  lpYieldPerYear: number;     // $ yield
  netPerYear: number;         // $ net
  breakevenMonths: number;    // months until LP yield > borrow cost (always >0)
  netAprPct: number;          // (lpApr - borrowRate) / borrowRate * 100
}

export interface AnalyticsData {
  epochSnapshots: EpochSnapshot[];
  totalDeposited: number;     // BTC
  totalCompounded: number;    // BTC extra
  compoundAdvantage: number;  // % vs simple interest
  projectionMonths: EpochSnapshot[];  // 12-month forward projection
  breakeven: BreakevenData;
}

export function useAnalytics(): AnalyticsData {
  const { positions, totalValue, totalCompoundGains } = usePositions();
  const { history } = useCompound();
  const aprs = useEstimatedAPR();
  const btcPrice = useBtcPrice();
  const epoch = useEpochData();

  const [data, setData] = useState<AnalyticsData>(() => buildAnalytics({
    positions, history, aprs, btcPrice, epoch, totalValue, totalCompoundGains
  }));

  useEffect(() => {
    setData(buildAnalytics({ positions, history, aprs, btcPrice, epoch, totalValue, totalCompoundGains }));
  }, [positions.length, history.length, aprs.balanced, btcPrice, totalValue, totalCompoundGains]);

  return data;
}

function buildAnalytics({ positions, history, aprs, btcPrice, epoch, totalValue, totalCompoundGains }: any): AnalyticsData {
  const avgApr = aprs.balanced;                 // use balanced as default
  const epochRate = avgApr / 100 / 52;          // weekly
  const borrowRate = 0.01;                       // 1% fixed

  const epochSnapshots: EpochSnapshot[] = [];

  if (history.length > 0) {
    let cumulative = 0;
    let simpleTotal = totalValue - totalCompoundGains;  // original deposits
    history.slice().reverse().forEach((ev: any, i: number) => {
      cumulative += ev.amount;
      simpleTotal += simpleTotal * epochRate; // simple growth without compound
      epochSnapshots.push({
        epoch: `E${ev.epoch}`,
        compounded: ev.amount,
        totalBtc: totalValue - totalCompoundGains + cumulative,
        hodlBtc: totalValue - totalCompoundGains,
        apr: ((ev.amount / (totalValue - totalCompoundGains)) * 52) * 100,
      });
    });
  } else if (totalValue > 0) {
    // No history yet — show current epoch as first data point
    epochSnapshots.push({
      epoch: `E${epoch.number || 1}`,
      compounded: totalCompoundGains,
      totalBtc: totalValue,
      hodlBtc: totalValue - totalCompoundGains,
      apr: avgApr,
    });
  }

  const startBtc = totalValue > 0 ? totalValue : 0.1; // use 0.1 BTC as demo if no positions
  const projectionMonths: EpochSnapshot[] = [];
  let runningBtc = startBtc;
  let hodlBtc = startBtc;
  for (let m = 1; m <= 12; m++) {
    // 4 epochs per month ≈ weekly compound
    for (let w = 0; w < 4; w++) {
      runningBtc += runningBtc * epochRate;
    }
    projectionMonths.push({
      epoch: `M${m}`,
      compounded: runningBtc - startBtc,
      totalBtc: runningBtc,
      hodlBtc: hodlBtc,
      apr: avgApr,
    });
  }

  // Compound advantage %
  const simpleReturn = startBtc * (avgApr / 100);
  const compoundReturn = runningBtc - startBtc;
  const compoundAdvantage = simpleReturn > 0 ? ((compoundReturn - simpleReturn) / simpleReturn) * 100 : 0;

  const demoMusd = btcPrice > 0 ? Math.floor(startBtc * btcPrice / 1.8) : 5000;
  const borrowCostPerYear = demoMusd * borrowRate;
  const lpAprPct = avgApr / 100;                 // e.g. 0.07
  const lpYieldPerYear = demoMusd * lpAprPct;
  const netPerYear = lpYieldPerYear - borrowCostPerYear;
  // months until cumulative LP yield exceeds cumulative borrow cost
  const monthlyYield = lpYieldPerYear / 12;
  const monthlyCost = borrowCostPerYear / 12;
  const breakevenMonths = monthlyCost > 0 && monthlyYield > monthlyCost
    ? 1  // profitable immediately
    : 999; // LP doesn't cover borrow (shouldn't happen at realistic APRs)

  return {
    epochSnapshots,
    totalDeposited: totalValue - totalCompoundGains,
    totalCompounded: totalCompoundGains,
    compoundAdvantage,
    projectionMonths,
    breakeven: {
      musd: demoMusd,
      borrowCostPerYear,
      lpYieldPerYear,
      netPerYear,
      breakevenMonths,
      netAprPct: lpAprPct > borrowRate ? ((lpAprPct - borrowRate) / borrowRate) * 100 : 0,
    },
  };
}
