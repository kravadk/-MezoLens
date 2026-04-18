import { useWalletStore } from '../store/walletStore';
import { usePositions } from './usePositions';
import { useCompound } from './useCompound';
import { useEstimatedAPR } from './useEstimatedAPR';

export function useDashboardData() {
  const { isConnected } = useWalletStore();
  const { positions: rawPositions, totalValue, totalCompoundGains } = usePositions();
  const { history } = useCompound();
  const aprs = useEstimatedAPR();

  if (!isConnected || rawPositions.length === 0) {
    return { positions: [], totalBtc: 0, compoundGains: 0, performanceData: [], apr: 0 };
  }

  const aprMap: Record<string, string> = {
    Aggressive: `${aprs.aggressive.toFixed(1)}%`,
    Balanced: `${aprs.balanced.toFixed(1)}%`,
    Conservative: `${aprs.conservative.toFixed(1)}%`,
  };

  // Group positions by strategy for the dashboard summary
  const grouped = rawPositions.reduce((acc, p) => {
    const key = p.strategy;
    if (!acc[key]) {
      acc[key] = { strategy: key, totalBtc: 0, totalGains: 0, count: 0 };
    }
    acc[key].totalBtc += p.btcDeposited + p.btcCompounded;
    acc[key].totalGains += p.btcCompounded;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { strategy: string; totalBtc: number; totalGains: number; count: number }>);

  type GroupEntry = { strategy: string; totalBtc: number; totalGains: number; count: number };
  const positions = (Object.values(grouped) as GroupEntry[]).map(g => ({
    id: g.strategy, // unique key for rendering
    strategy: g.strategy,
    amount: `${g.totalBtc.toFixed(6)} BTC${g.count > 1 ? ` (${g.count})` : ''}`,
    apr: aprMap[g.strategy] || `${aprs.conservative.toFixed(1)}%`,
    compoundGain: `+${g.totalGains.toFixed(6)} BTC`,
    color: g.strategy === 'Aggressive' ? '#D4940A' : g.strategy === 'Balanced' ? '#5B6DEC' : '#1A8C52',
  }));

  // Build performance data from compound history
  const performanceData = history.length > 0
    ? history.slice(0, 6).map(ev => ({
        epoch: `E${ev.epoch}`,
        gains: ev.amount,
      })).reverse()
    : rawPositions.length > 0
      ? [{ epoch: 'E1', gains: totalCompoundGains }]
      : [];

  const avgApr = rawPositions.reduce((sum, p) => {
    const a = p.strategy === 'Aggressive' ? aprs.aggressive : p.strategy === 'Balanced' ? aprs.balanced : aprs.conservative;
    return sum + a;
  }, 0) / rawPositions.length;

  return {
    positions,
    totalBtc: totalValue,
    compoundGains: totalCompoundGains,
    performanceData,
    apr: parseFloat(avgApr.toFixed(2)),
  };
}
