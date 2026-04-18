import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, Bitcoin, Zap, Info, Calculator, ArrowRight
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAnalytics } from '../hooks/useAnalytics';
import { useEstimatedAPR } from '../hooks/useEstimatedAPR';
import { useBtcPrice } from '../hooks/useBtcPrice';
import { useWalletStore } from '../store/walletStore';
import { useUIStore } from '../store/uiStore';
import { Wallet } from 'lucide-react';

export function Analytics() {
  const { isConnected } = useWalletStore();
  const { openWalletModal, setCurrentPage } = useUIStore();
  const analytics = useAnalytics();
  const aprs = useEstimatedAPR();
  const btcPrice = useBtcPrice();

  // Breakeven calculator state
  const [calcBtc, setCalcBtc] = useState('0.1');
  const [calcAprMode, setCalcAprMode] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  const calcBtcNum = parseFloat(calcBtc) || 0.1;
  const calcMusd = btcPrice > 0 ? Math.floor(calcBtcNum * btcPrice / 1.8) : 5000;
  const lpApr = calcAprMode === 'aggressive' ? aprs.aggressive : calcAprMode === 'balanced' ? aprs.balanced : aprs.conservative;
  const lpYield = calcMusd * (lpApr / 100);
  const borrowCost = calcMusd * 0.01;
  const netPerYear = lpYield - borrowCost;
  const netApr = (netPerYear / (calcBtcNum * (btcPrice || 70000))) * 100;

  // Projection: 12 months compound vs hodl vs simple
  const projData = analytics.projectionMonths;

  // BTC yield labels
  const stratColors = {
    conservative: '#1A8C52',
    balanced: '#5B6DEC',
    aggressive: '#D4940A',
  };

  if (!isConnected) {
    return (
      <div className="space-y-8">
        {/* Show projection and calculator even when not connected */}
        <div className="flex flex-col items-center gap-3 p-6 bg-mezo-lime/5 border border-mezo-lime/20 rounded-2xl text-center">
          <Wallet className="w-10 h-10 text-mezo-lime/60" />
          <p className="text-[15px] font-bold text-mezo-black">Connect wallet to see your personal compound analytics</p>
          <p className="text-[13px] text-mezo-grey">Below shows projections for 0.1 BTC deposit · all data from live Mezo Testnet</p>
          <button onClick={openWalletModal}
            className="px-6 py-3 bg-mezo-lime text-mezo-sidebar rounded-2xl font-extrabold text-[13px] hover:opacity-90">
            Connect Wallet
          </button>
        </div>
        <BreakevenSection
          calcBtc={calcBtc} setCalcBtc={setCalcBtc}
          calcAprMode={calcAprMode} setCalcAprMode={setCalcAprMode}
          calcMusd={calcMusd} lpApr={lpApr} lpYield={lpYield}
          borrowCost={borrowCost} netPerYear={netPerYear} netApr={netApr}
          btcPrice={btcPrice} stratColors={stratColors} aprs={aprs}
        />
        <ProjectionSection projData={projData} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'BTC Deposited', value: `${analytics.totalDeposited.toFixed(5)} BTC`, sub: 'across all positions', color: '#1A1A1A' },
          { label: 'BTC Compounded', value: `+${analytics.totalCompounded.toFixed(6)} BTC`, sub: 'auto-earned via vault', color: '#1A8C52' },
          { label: 'Compound Advantage', value: `+${analytics.compoundAdvantage.toFixed(2)}%`, sub: 'vs simple interest', color: '#5B6DEC' },
          { label: 'BTC Value (live)', value: `$${((analytics.totalDeposited + analytics.totalCompounded) * btcPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: 'at current BTC price', color: '#D4940A' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card p-5">
            <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-2">{s.label}</div>
            <div className="text-[20px] font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-mezo-grey mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Epoch performance chart */}
      {analytics.epochSnapshots.length > 0 && (
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-bold text-mezo-black">Your Compound History</h2>
              <p className="text-[13px] text-mezo-grey">BTC gained per epoch vs hodl baseline</p>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-mezo-grey">
              <div className="w-3 h-3 rounded-full bg-strategy-conservative" /> Compounded
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.epochSnapshots}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#BBB' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#BBB' }} tickFormatter={v => v.toFixed(4)} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E0E0E0', fontSize: '12px' }}
                  formatter={(v: any) => [`${parseFloat(v).toFixed(6)} BTC`, '']} />
                <Area type="monotone" dataKey="totalBtc" name="With compound" stroke="#1A8C52" fill="#1A8C52" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="hodlBtc" name="Without compound" stroke="#CCC" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 12-month projection + breakeven side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProjectionSection projData={projData} />
        <BreakevenSection
          calcBtc={calcBtc} setCalcBtc={setCalcBtc}
          calcAprMode={calcAprMode} setCalcAprMode={setCalcAprMode}
          calcMusd={calcMusd} lpApr={lpApr} lpYield={lpYield}
          borrowCost={borrowCost} netPerYear={netPerYear} netApr={netApr}
          btcPrice={btcPrice} stratColors={stratColors} aprs={aprs}
        />
      </div>

      {/* Action row */}
      <div className="flex flex-wrap gap-4">
        <button onClick={() => setCurrentPage('Deposit')}
          className="flex items-center gap-2 px-6 py-3 bg-mezo-lime text-mezo-sidebar rounded-2xl font-bold text-[13px] hover:opacity-90">
          <Zap className="w-4 h-4" /> Add Position
        </button>
        <button onClick={() => setCurrentPage('Banking')}
          className="flex items-center gap-2 px-6 py-3 bg-mezo-sidebar text-white rounded-2xl font-bold text-[13px] hover:bg-black">
          <Bitcoin className="w-4 h-4" /> Open MUSD Trove
        </button>
        <button onClick={() => setCurrentPage('Watchlist')}
          className="flex items-center gap-2 px-6 py-3 bg-mezo-border/30 text-mezo-black rounded-2xl font-bold text-[13px] hover:bg-mezo-border/50">
          Monitor Wallets <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ProjectionSection({ projData }: { projData: any[] }) {
  return (
    <div className="glass-card p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-strategy-conservative/10 rounded-xl">
          <TrendingUp className="w-5 h-5 text-strategy-conservative" />
        </div>
        <div>
          <h2 className="text-[16px] font-bold text-mezo-black">12-Month Projection</h2>
          <p className="text-[12px] text-mezo-grey">Weekly compound vs hodl · live APR from EarnVault</p>
        </div>
      </div>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#BBB' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#BBB' }}
              tickFormatter={v => v.toFixed(3)} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E0E0E0', fontSize: '12px' }}
              formatter={(v: any) => [`${parseFloat(v).toFixed(5)} BTC`, '']} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="totalBtc" name="With compound" stroke="#1A8C52" strokeWidth={2.5}
              dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="hodlBtc" name="Hodl (no yield)" stroke="#CCC" strokeWidth={1.5}
              strokeDasharray="4 2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-mezo-grey mt-4 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0" />
        APR is read live from Mezo Testnet EarnVault. Testnet uses mock reward rates.
      </p>
    </div>
  );
}

function BreakevenSection({ calcBtc, setCalcBtc, calcAprMode, setCalcAprMode, calcMusd, lpApr, lpYield, borrowCost, netPerYear, netApr, btcPrice, stratColors, aprs }: any) {
  const profitable = netPerYear > 0;
  const breakevenDays = profitable
    ? Math.ceil((borrowCost / (lpYield - borrowCost)) * 365)
    : 999;

  return (
    <div className="glass-card p-8 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-strategy-balanced/10 rounded-xl">
          <Calculator className="w-5 h-5 text-strategy-balanced" />
        </div>
        <div>
          <h2 className="text-[16px] font-bold text-mezo-black">Breakeven Calculator</h2>
          <p className="text-[12px] text-mezo-grey">When LP yield covers 1% borrow cost</p>
        </div>
      </div>

      {/* BTC input */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest">BTC Collateral</label>
        <div className="relative">
          <Bitcoin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mezo-grey" />
          <input type="number" value={calcBtc} onChange={e => setCalcBtc(e.target.value)}
            placeholder="0.1" step="0.01" min="0"
            className="w-full pl-10 pr-4 py-3 bg-mezo-border/30 border-2 border-transparent rounded-xl text-[18px] font-bold focus:border-mezo-sidebar focus:bg-white outline-none" />
        </div>
      </div>

      {/* Strategy selector */}
      <div className="flex gap-2">
        {(['conservative', 'balanced', 'aggressive'] as const).map(s => (
          <button key={s} onClick={() => setCalcAprMode(s)}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold capitalize transition-all ${calcAprMode === s ? 'text-white' : 'bg-mezo-border/30 text-mezo-grey hover:bg-mezo-border/50'}`}
            style={{ backgroundColor: calcAprMode === s ? stratColors[s] : undefined }}>
            {s}
            <span className="block text-[10px] opacity-80">{(s === 'aggressive' ? aprs.aggressive : s === 'balanced' ? aprs.balanced : aprs.conservative).toFixed(1)}%</span>
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-3 pt-2 border-t border-mezo-border">
        {[
          { label: 'MUSD borrowed (180% CR)', val: `${calcMusd.toLocaleString()} MUSD`, color: '#5B6DEC' },
          { label: `LP yield @ ${lpApr.toFixed(1)}% APR/yr`, val: `+$${lpYield.toFixed(0)}/yr`, color: '#1A8C52' },
          { label: 'Borrow cost (1% fixed)', val: `-$${borrowCost.toFixed(0)}/yr`, color: '#FF6B6B' },
          { label: 'Net yield (USD)', val: `${profitable ? '+' : ''}$${netPerYear.toFixed(0)}/yr`, color: profitable ? '#1A8C52' : '#FF6B6B' },
          { label: 'Net APR on BTC collateral', val: `${netApr.toFixed(2)}%`, color: profitable ? '#1A8C52' : '#FF6B6B' },
        ].map((r, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-[12px] text-mezo-grey">{r.label}</span>
            <span className="text-[13px] font-extrabold" style={{ color: r.color }}>{r.val}</span>
          </div>
        ))}
      </div>

      {/* Breakeven callout */}
      <div className={`p-4 rounded-xl border text-center ${profitable ? 'bg-strategy-conservative/10 border-strategy-conservative/20' : 'bg-[#FF6B6B]/10 border-[#FF6B6B]/20'}`}>
        {profitable ? (
          <>
            <div className="text-[22px] font-extrabold text-strategy-conservative">
              Profitable from day 1
            </div>
            <div className="text-[12px] text-mezo-grey mt-1">
              LP yield exceeds borrow cost immediately · net gain accumulates every epoch
            </div>
          </>
        ) : (
          <>
            <div className="text-[22px] font-extrabold text-[#FF6B6B]">Not profitable</div>
            <div className="text-[12px] text-mezo-grey mt-1">LP APR below borrow rate — consider a higher-yield strategy</div>
          </>
        )}
      </div>
    </div>
  );
}
