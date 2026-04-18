import React from 'react';
import {
  Globe,
  Shield,
  Activity,
  Trophy,
  ExternalLink,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from './StatCard';
import { cn } from '../lib/utils';
import { useVaultStats } from '../hooks/useVaultStats';
import { useBtcPrice } from '../hooks/useBtcPrice';
import { Badge } from './common/Badge';
import { SkeletonCard } from './common/Skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const VaultStats = () => {
  const vaultData = useVaultStats();
  const btcPrice = useBtcPrice();

  const distributionData = [
    { name: 'Aggressive', value: vaultData.strategyDistribution.aggressive, color: '#D4940A' },
    { name: 'Balanced', value: vaultData.strategyDistribution.balanced, color: '#5B6DEC' },
    { name: 'Conservative', value: vaultData.strategyDistribution.conservative, color: '#1A8C52' },
  ];
  const epochPerformance: { epoch: string; apr: number }[] = [];
  const keepers = vaultData.keepers;
  return (
    <div className="space-y-8">
      {/* Protocol Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total BTC in Vault"
          value={`${vaultData.totalBtcInVault} BTC`}
          subtitle="Across all users"
          icon={<Globe className="w-4 h-4 text-mezo-grey" />}
        />
        <StatCard
          label="Total Auto-Compounded"
          value={`${vaultData.totalAutoCompounded} BTC`}
          subtitle="All BTC ever re-locked"
          isAccent
          icon={<Zap className="w-4 h-4 text-mezo-sidebar" />}
        />
        <StatCard
          label="Active Positions"
          value={String(vaultData.totalPositions)}
          subtitle="Across all strategies"
          icon={<Activity className="w-4 h-4 text-mezo-grey" />}
        />
        <StatCard
          label="Protocol Revenue"
          value={`${vaultData.protocolRevenue} BTC`}
          subtitle="All fees collected"
          icon={<Shield className="w-4 h-4 text-mezo-grey" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Epoch-by-Epoch Performance */}
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[18px] font-bold text-mezo-black">Epoch-by-Epoch Performance</h2>
              <p className="text-[13px] text-mezo-grey">Vault APR over last 10 epochs</p>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-bold text-mezo-grey">
              <div className="w-3 h-3 rounded-full bg-strategy-conservative" />
              Vault APR %
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={epochPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                <XAxis
                  dataKey="epoch"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#BBB' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#BBB' }}
                  domain={[6, 12]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #1A1A1A',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="apr"
                  name="APR %"
                  stroke="#1A8C52"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#1A8C52', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategy Distribution */}
        <div className="glass-card p-8">
          <h2 className="text-[18px] font-bold text-mezo-black mb-2">Strategy Distribution</h2>
          <p className="text-[13px] text-mezo-grey mb-8">% of TVL per strategy</p>

          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[24px] font-extrabold text-mezo-black">{vaultData.totalBtcInVault}</span>
              <span className="text-[10px] font-bold text-mezo-grey uppercase tracking-widest">BTC TVL</span>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {distributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[14px] font-bold text-mezo-black">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-extrabold text-mezo-black">{item.value}%</span>
                  <span className="text-[12px] text-mezo-grey">{(vaultData.totalBtcInVault * item.value / 100).toFixed(1)} BTC</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MUSD Banking Stats */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#E5E8FD] rounded-xl">
            <Zap className="w-5 h-5 text-[#5B6DEC]" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-mezo-black">MUSD Banking — Protocol Stats</h2>
            <p className="text-[13px] text-mezo-grey">MusdPipe on-chain · 1% fixed borrow rate</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'MUSD Capacity', value: btcPrice > 0 ? `${Math.floor(vaultData.totalBtcInVault * btcPrice / 1.8).toLocaleString()} MUSD` : '— MUSD', sub: 'at current BTC price', color: '#5B6DEC' },
            { label: 'Borrow Rate', value: '1% fixed', sub: 'no variable risk', color: '#1A8C52' },
            { label: 'Min Collateral', value: '110% MCR', sub: '150% recommended', color: '#D4940A' },
            { label: 'LP APR Target', value: '5–15%', sub: 'Mezo Swap pools', color: '#1A8C52' },
          ].map((s, i) => (
            <div key={i} className="glass-card p-5">
              <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-2">{s.label}</div>
              <div className="text-[22px] font-extrabold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[12px] text-mezo-grey mt-1">{s.sub}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="https://explorer.test.mezo.org/address/0xCdF7028ceAB81fA0C6971208e83fa7872994beE5"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[12px] text-mezo-grey hover:text-mezo-black transition-colors border border-mezo-border rounded-lg px-3 py-2">
            <ExternalLink className="w-3.5 h-3.5" /> BorrowerOperations Contract
          </a>
          <a href="https://explorer.test.mezo.org/address/0x961E1fc557c6A5Cf70070215190f9B57F719701D"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[12px] text-mezo-grey hover:text-mezo-black transition-colors border border-mezo-border rounded-lg px-3 py-2">
            <ExternalLink className="w-3.5 h-3.5" /> EarnVault Contract
          </a>
        </div>
      </div>

      {/* Keeper Leaderboard */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-mezo-lime" />
            <div>
              <h2 className="text-[18px] font-bold text-mezo-black">Most Active Keepers</h2>
              <p className="text-[13px] text-mezo-grey">Addresses that triggered the most compounds</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-mezo-grey">
            <RefreshCw className="w-4 h-4" />
            Permissionless compound
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-mezo-black">
                <th className="text-left py-4 text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Rank</th>
                <th className="text-left py-4 text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Keeper Address</th>
                <th className="text-right py-4 text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Compounds</th>
                <th className="text-right py-4 text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Total Compounded</th>
                <th className="text-right py-4 text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mezo-border">
              {keepers.map((keeper, index) => (
                <tr key={keeper.address} className="group hover:bg-mezo-border/10 transition-colors">
                  <td className="py-5">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold",
                      index === 0 ? "bg-mezo-lime text-mezo-sidebar" :
                      index === 1 ? "bg-mezo-border/40 text-mezo-black" :
                      "bg-mezo-border/20 text-mezo-grey"
                    )}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-5">
                    <code className="text-[14px] font-mono text-mezo-black">{keeper.address}</code>
                  </td>
                  <td className="py-5 text-right text-[14px] font-bold text-mezo-black">{keeper.compounds}</td>
                  <td className="py-5 text-right text-[14px] font-bold text-mezo-black">{typeof keeper.totalCompounded === 'number' ? keeper.totalCompounded.toFixed(3) : keeper.totalCompounded} BTC</td>
                  <td className="py-5 text-right text-[14px] font-extrabold text-strategy-conservative">{typeof keeper.earned === 'number' ? keeper.earned.toFixed(5) : keeper.earned} BTC</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Keeper info */}
        <div className="mt-6 p-4 bg-mezo-lime/10 rounded-xl border border-mezo-lime/20 text-center">
          <p className="text-[13px] text-mezo-sidebar font-medium">
            Compound is <span className="font-bold">permissionless</span> — anyone can trigger it and earn a 0.1% keeper incentive.
            Run a keeper bot and earn BTC for helping the protocol.
          </p>
        </div>
      </div>
    </div>
  );
};
