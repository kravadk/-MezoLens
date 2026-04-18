import React from 'react';
import {
  Calculator as CalcIcon,
  Info,
  ArrowRight,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { useCalculator } from '../hooks/useCalculator';
import { useEstimatedAPR } from '../hooks/useEstimatedAPR';
import { InfoCallout } from './common/InfoCallout';
import { Tooltip } from './common/Tooltip';

export function Calculator() {
  const { btcAmount, setBtcAmount, months, setMonths, strategy, setStrategy } = useCalculator();
  const { setCurrentPage } = useStore();
  const aprData = useEstimatedAPR();

  const aprs: Record<string, number> = {
    conservative: aprData.conservative / 100,
    balanced: aprData.balanced / 100,
    aggressive: aprData.aggressive / 100,
  };

  const currentApr = aprs[strategy];
  // Manual claimers miss compounding — model as simple interest at same rate
  const manualApr = currentApr;

  const generateData = () => {
    const data = [];
    // Protocol compounds weekly (52 epochs/year). Convert months to weeks for accuracy.
    const weeksPerMonth = 52 / 12;
    const weeklyRate = currentApr / 52; // rate per weekly epoch
    for (let i = 0; i <= months; i++) {
      const weeks = i * weeksPerMonth;
      const manualVal = btcAmount * manualApr * (i / 12);             // simple interest: no compounding
      const compoundGains = btcAmount * Math.pow(1 + weeklyRate, weeks) - btcAmount; // weekly compounding
      data.push({
        month: `M${i}`,
        manual: Number(manualVal.toFixed(6)),
        autoCompound: Number(compoundGains.toFixed(6)),
      });
    }
    return data;
  };

  const data = generateData();
  const totalAutoCompound = data[data.length - 1].autoCompound;
  const totalManual = data[data.length - 1].manual;
  const advantage = totalAutoCompound - totalManual;
  const advantagePercent = totalManual > 0 ? ((advantage / totalManual) * 100).toFixed(1) : '0';

  const strategyColors: Record<string, string> = {
    conservative: '#1A8C52',
    balanced: '#5B6DEC',
    aggressive: '#D4940A'
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-8 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-mezo-lime rounded-xl">
                <CalcIcon className="w-5 h-5 text-mezo-sidebar" />
              </div>
              <h2 className="text-[18px] font-bold text-mezo-black">Parameters</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[13px] font-bold text-mezo-grey uppercase tracking-widest">BTC Amount</span>
                  <span className="text-[14px] font-extrabold text-mezo-black">{btcAmount} BTC</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={btcAmount}
                  onChange={(e) => setBtcAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-mezo-border rounded-full appearance-none cursor-pointer accent-mezo-sidebar"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[13px] font-bold text-mezo-grey uppercase tracking-widest">Time Horizon</span>
                  <span className="text-[14px] font-extrabold text-mezo-black">{months} Months</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="48"
                  step="1"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="w-full h-1.5 bg-mezo-border rounded-full appearance-none cursor-pointer accent-mezo-sidebar"
                />
              </div>

              <div className="space-y-4">
                <span className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest">Strategy</span>
                <div className="grid grid-cols-1 gap-3">
                  {Object.keys(aprs).map((s) => {
                    const isSelected = strategy === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setStrategy(s)}
                        className={cn(
                          "w-full px-5 py-4 rounded-2xl text-[14px] font-extrabold text-left transition-all border-2 flex items-center justify-between",
                          isSelected
                            ? "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                            : "bg-white text-mezo-black border-mezo-black/5 hover:border-mezo-black/20"
                        )}
                        style={{ borderColor: isSelected ? strategyColors[s] + '80' : undefined }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: strategyColors[s] }} />
                          <span className="capitalize">{s}</span>
                        </div>
                        <span className="text-mezo-black">{(aprs[s] * 100).toFixed(1)}% APR</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-mezo-black">
              <InfoCallout>
                Shows auto-compound vs manual claim. The gap between lines = value of MezoLens.
              </InfoCallout>
            </div>
          </div>
        </div>

        {/* Chart + Results */}
        <div className="lg:col-span-2 space-y-8">
          {/* Compound Advantage highlight */}
          <div className="p-6 bg-mezo-sidebar text-white border border-mezo-sidebar rounded-[16px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-mezo-lime/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-mezo-lime" />
                </div>
                <div>
                  <h3 className="text-[18px] font-extrabold text-white">Compound Advantage</h3>
                  <p className="text-[13px] text-white/80">The gap = why you use MezoLens</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-white font-bold">Manual claim</div>
                  <div className="text-[20px] font-extrabold text-white">{totalManual.toFixed(4)} BTC</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-mezo-lime/80 font-bold">Auto-compound</div>
                  <div className="text-[20px] font-extrabold text-mezo-lime">{totalAutoCompound.toFixed(4)} BTC</div>
                </div>
                <div className="text-right pl-6 border-l border-white/10">
                  <div className="text-[11px] uppercase tracking-wider text-white font-bold">Extra</div>
                  <div className="text-[24px] font-extrabold text-mezo-lime">+{advantagePercent}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[20px] font-extrabold text-mezo-black">Manual vs Auto-Compound</h2>
                <p className="text-[14px] text-mezo-grey">The visual gap = your extra BTC earnings</p>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorCompound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8F0A0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C8F0A0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.15)" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#777', fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#777', fontWeight: 500 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #1A1A1A',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="manual"
                    name="Manual Claim"
                    stroke="#999"
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Area
                    type="monotone"
                    dataKey="autoCompound"
                    name="MezoLens Auto-Compound"
                    stroke="#1A8C52"
                    fillOpacity={1}
                    fill="url(#colorCompound)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 border-l-4 border-mezo-sidebar">
              <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Auto-Compound Gains</div>
              <div className="text-[24px] font-extrabold text-mezo-black">{totalAutoCompound.toFixed(4)} BTC</div>
              <div className="text-[12px] text-strategy-conservative font-bold mt-1">~{((totalAutoCompound / btcAmount) * 100).toFixed(1)}% ROI</div>
            </div>
            <div className="glass-card p-6 border-l-4 border-mezo-lime">
              <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Compound Advantage</div>
              <div className="text-[24px] font-extrabold text-mezo-black">+{advantage.toFixed(4)} BTC</div>
              <div className="text-[12px] text-mezo-grey font-bold mt-1">Extra vs manual claim</div>
            </div>
            <div className="p-6 bg-mezo-sidebar text-white border border-mezo-sidebar rounded-[16px]">
              <div className="text-[11px] font-bold text-white/80 uppercase tracking-widest mb-1">Ready to start?</div>
              <button
                onClick={() => setCurrentPage('Deposit')}
                className="flex items-center gap-2 text-[16px] font-extrabold text-mezo-lime mt-2 hover:translate-x-1 transition-transform"
              >
                Open Position
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
