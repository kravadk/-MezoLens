import React from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Eye,
  Activity,
  ExternalLink,
  TrendingUp,
  Zap,
  Heart,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { StatCard } from './StatCard';
import { useFeeData } from '../hooks/useFeeData';
import { useMusdHealth } from '../hooks/useMusdHealth';
import { useCompound } from '../hooks/useCompound';

const feeSourceData = [
  { name: 'Swap Fees', value: 58, color: '#1A8C52' },
  { name: 'Borrow Fees', value: 31, color: '#5B6DEC' },
  { name: 'Bridge Fees', value: 11, color: '#D4940A' },
];

export function Transparency() {
  const fees = useFeeData();
  const { history: compoundHistory } = useCompound();

  const epochRevenueData = fees.totalRevenue > 0
    ? [{ epoch: 'Current', revenue: parseFloat((fees.totalRevenue * 1000).toFixed(1)) }]
    : [];
  const musdHealth = useMusdHealth(0);

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Total Revenue (All Time)"
          value={`${fees.totalRevenue} BTC`}
          trend={12.4}
          subtitle="Protocol lifetime revenue"
          icon={<TrendingUp className="w-4 h-4 text-mezo-grey" />}
        />
        <StatCard
          label="Performance Fees"
          value={`${fees.totalPerformance} BTC`}
          subtitle="0.3% per compound"
          icon={<Activity className="w-4 h-4 text-mezo-grey" />}
        />
        <StatCard
          label="Management Fees"
          value={`${fees.totalManagement} BTC`}
          subtitle="0.1% annual pro-rata"
          icon={<Shield className="w-4 h-4 text-mezo-grey" />}
        />
        <StatCard
          label="MUSD Spread"
          value={`${fees.totalMusdSpread} BTC`}
          subtitle="10% of net MUSD yield"
          isAccent
          icon={<Zap className="w-4 h-4 text-mezo-sidebar" />}
        />
      </div>

      {/* Protocol Revenue Transparency */}
      <div className="p-8 bg-mezo-sidebar text-white border border-mezo-sidebar rounded-[16px]">
        <div className="flex items-center gap-3 mb-2">
          <Eye className="w-5 h-5 text-mezo-lime" />
          <h3 className="text-[18px] font-extrabold text-white">Protocol Revenue Transparency</h3>
        </div>
        <p className="text-[14px] text-white/90 mb-6">This is how MezoLens sustains itself. No hidden fees.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-[12px] uppercase tracking-wider text-white/80 font-bold">Performance</div>
            <div className="text-[20px] lg:text-[24px] font-extrabold text-white">{fees.totalPerformance} BTC</div>
            <div className="text-[12px] text-white/90">all time</div>
          </div>
          <div>
            <div className="text-[12px] uppercase tracking-wider text-white/80 font-bold">Management</div>
            <div className="text-[20px] lg:text-[24px] font-extrabold text-white">{fees.totalManagement} BTC</div>
            <div className="text-[12px] text-white/90">all time</div>
          </div>
          <div>
            <div className="text-[12px] uppercase tracking-wider text-white/80 font-bold">MUSD Spread</div>
            <div className="text-[20px] lg:text-[24px] font-extrabold text-white">{fees.totalMusdSpread} BTC</div>
            <div className="text-[12px] text-white/90">all time</div>
          </div>
          <div className="border-l border-white/10 pl-6">
            <div className="text-[12px] uppercase tracking-wider text-mezo-lime/60 font-bold">Total Revenue</div>
            <div className="text-[24px] lg:text-[28px] font-extrabold text-mezo-lime">{fees.totalRevenue} BTC</div>
            <div className="text-[12px] text-white/90">lifetime</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fee Sources Chart */}
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[20px] font-extrabold text-mezo-black">Epoch Revenue</h2>
              <p className="text-[14px] text-mezo-grey">Protocol fees collected per epoch</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {epochRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={epochRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#555', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#555', fontWeight: 500 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #1A1A1A', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="revenue" fill="#1A8C52" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-mezo-border/30 rounded-2xl flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-mezo-grey/50" />
                </div>
                <p className="text-[16px] font-bold text-mezo-black">No epoch data yet</p>
                <p className="text-[13px] text-mezo-grey mt-1">Revenue will appear after the first compound event</p>
              </div>
            )}
          </div>
        </div>

        {/* Fee Source Pie */}
        <div className="lg:col-span-1 glass-card p-8">
          <h2 className="text-[20px] font-extrabold text-mezo-black mb-2">Fee Sources</h2>
          <p className="text-[14px] text-mezo-grey mb-8">Where protocol fees come from</p>
          <div className="h-[200px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={feeSourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {feeSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {feeSourceData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[13px] font-bold text-mezo-black">{item.name}</span>
                </div>
                <span className="text-[13px] font-extrabold text-mezo-black">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MUSD Health Monitor */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-mezo-lime/10 rounded-xl">
            <Heart className="w-5 h-5 text-mezo-sidebar" />
          </div>
          <div>
            <h2 className="text-[20px] font-extrabold text-mezo-black">MUSD Health Monitor</h2>
            <p className="text-[13px] text-mezo-grey">CDP health for positions with MUSD yield enabled</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="glass-card p-4 lg:p-5 border-l-4 border-strategy-conservative">
            <div className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Collateral Ratio</div>
            <div className="text-[24px] lg:text-[28px] font-extrabold text-strategy-conservative">{musdHealth?.collateralRatio || 0}%</div>
            <div className="text-[12px] text-strategy-conservative font-bold">{musdHealth?.safe ? 'Healthy' : 'At Risk'}</div>
          </div>
          <div className="glass-card p-4 lg:p-5">
            <div className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Liquidation Price</div>
            <div className="text-[24px] lg:text-[28px] font-extrabold text-mezo-black">${(musdHealth?.liquidationPrice || 0).toLocaleString()}</div>
            <div className="text-[12px] text-mezo-grey">BTC/USD</div>
          </div>
          <div className="glass-card p-4 lg:p-5">
            <div className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Current BTC Price</div>
            <div className="text-[24px] lg:text-[28px] font-extrabold text-mezo-black">${(musdHealth?.currentBtcPrice || 0).toLocaleString()}</div>
            <div className="text-[12px] text-mezo-grey">via Pyth Oracle</div>
          </div>
          <div className="glass-card p-4 lg:p-5 border-l-4 border-mezo-lime">
            <div className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Safe Margin</div>
            <div className="text-[24px] lg:text-[28px] font-extrabold text-strategy-conservative">{musdHealth?.safeMargin || 0}%</div>
            <div className="text-[12px] text-mezo-grey">above liquidation</div>
          </div>
        </div>
      </div>

      {/* Compound History Table */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-mezo-border/40 rounded-xl">
              <Activity className="w-5 h-5 text-mezo-sidebar" />
            </div>
            <div>
              <h2 className="text-[20px] font-extrabold text-mezo-black">Your Compound History</h2>
              <p className="text-[13px] text-mezo-grey">Every auto-compound event for your positions</p>
            </div>
          </div>
          <a
            href="https://explorer.test.mezo.org/address/0x961E1fc557c6A5Cf70070215190f9B57F719701D"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-bold text-mezo-sidebar flex items-center gap-1 hover:underline"
          >
            View on Explorer <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {compoundHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-mezo-black">
                  <th className="text-left py-4 text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Epoch</th>
                  <th className="text-left py-4 text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Position</th>
                  <th className="text-right py-4 text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Amount</th>
                  <th className="text-right py-4 text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Fee</th>
                  <th className="text-right py-4 text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Incentive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mezo-border">
                {compoundHistory.map((row, i) => (
                  <tr key={i} className="hover:bg-mezo-border/10 transition-colors">
                    <td className="py-4 text-[13px] font-bold text-mezo-black">#{row.epoch}</td>
                    <td className="py-4 text-[13px] text-mezo-grey">#{row.positionId}</td>
                    <td className="py-4 text-right text-[13px] font-bold text-strategy-conservative">{row.amount.toFixed(6)} BTC</td>
                    <td className="py-4 text-right text-[13px] text-mezo-grey">{row.fee.toFixed(6)} BTC</td>
                    <td className="py-4 text-right text-[13px] text-mezo-grey">{row.callerIncentive.toFixed(6)} BTC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-mezo-border/30 rounded-2xl flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-mezo-grey/50" />
            </div>
            <p className="text-[16px] font-bold text-mezo-black">No compound events yet</p>
            <p className="text-[13px] text-mezo-grey mt-1">History will appear after the first epoch compound</p>
          </div>
        )}
      </div>
    </div>
  );
}
