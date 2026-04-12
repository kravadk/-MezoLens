import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Clock,
  Plus,
  RefreshCw,
  Bitcoin,
  Percent,
  History,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { StatCard } from './StatCard';
import { CompoundTriggerModal } from './modals/CompoundTriggerModal';
import { Badge } from './common/Badge';
import { Button } from './common/Button';
import { CountUp } from './common/CountUp';
import { ProgressBar } from './common/ProgressBar';
import { useStore } from '../store';
import { useEarnVault } from '../hooks/useEarnVault';
import { useCompound } from '../hooks/useCompound';
import { useEpochData } from '../hooks/useEpochData';
import { useUIStore } from '../store/uiStore';
import { useDashboardData } from '../hooks/useDashboardData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TxStatusModal } from './modals/TxStatusModal';

export function Dashboard() {
  const { setCurrentPage, isWalletConnected } = useStore();
  const { openWalletModal } = useUIStore();
  const { stats } = useEarnVault();
  const { getPendingCompound } = useCompound();
  const epoch = useEpochData();
  const dashData = useDashboardData();
  const [compoundModalOpen, setCompoundModalOpen] = useState(false);
  const [compoundTarget, setCompoundTarget] = useState(0);
  const [txModal, setTxModal] = useState<{ open: boolean; status: 'pending' | 'success' | 'error'; hash?: string; title: string }>({ open: false, status: 'pending', title: '' });

  const { compound: doCompound } = useCompound();

  const handleCompoundConfirm = async () => {
    setCompoundModalOpen(false);
    setTxModal({ open: true, status: 'pending', title: 'Compounding...' });
    try {
      const txHash = await doCompound(compoundTarget);
      setTxModal({ open: true, status: 'success', hash: txHash, title: 'Compound Successful!' });
    } catch (err: any) {
      setTxModal({ open: true, status: 'error', title: 'Compound Failed' });
    }
  };

  // Not connected state
  if (!isWalletConnected) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-mezo-lime/10 rounded-[32px] flex items-center justify-center border-2 border-dashed border-mezo-lime/30">
          <Wallet className="w-12 h-12 text-mezo-lime/60" />
        </div>
        <div className="max-w-md">
          <h2 className="text-[28px] font-extrabold text-mezo-black leading-tight">Connect to view your Dashboard</h2>
          <p className="text-[15px] text-mezo-grey mt-3">Connect your wallet to see your positions, compound gains, and pending rewards.</p>
        </div>
        <button
          onClick={openWalletModal}
          className="px-8 py-4 bg-mezo-lime text-mezo-sidebar rounded-2xl font-extrabold flex items-center gap-2 hover:opacity-90 transition-all"
        >
          <Wallet className="w-5 h-5" /> Connect Wallet
        </button>
        <button onClick={() => setCurrentPage('Vault Stats')} className="text-[14px] text-mezo-grey font-medium hover:text-mezo-black transition-colors">
          or view public Vault Stats
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          label="Your Total BTC"
          value={`${dashData.totalBtc.toFixed(3)} BTC`}
          trend={2.4}
          subtitle="Deposited + compounded"
          progress={65}
          icon={<Bitcoin className="w-4 h-4 text-mezo-grey" />}
        />
        <StatCard
          label="Compound Gains"
          value={`+${dashData.compoundGains.toFixed(3)} BTC`}
          trend={18.7}
          subtitle="Extra BTC from auto-compound"
          progress={85}
          isAccent
          icon={<Zap className="w-4 h-4 text-mezo-sidebar" />}
        />
        <StatCard
          label="Pending Compound"
          value={`${getPendingCompound(0).toFixed(4)} BTC`}
          subtitle={`Next in ${epoch.timeRemaining.days}d ${epoch.timeRemaining.hours}h`}
          progress={30}
          icon={<Clock className="w-4 h-4 text-mezo-grey" />}
        />
        <StatCard
          label="Your APR (Compounded)"
          value={`${dashData.apr}%`}
          trend={1.2}
          subtitle={`Base APR: ${dashData.baseApr}%`}
          progress={92}
          icon={<Percent className="w-4 h-4 text-mezo-grey" />}
        />
      </div>

      {/* Compound Advantage Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 lg:p-8 bg-mezo-sidebar text-white border border-mezo-sidebar rounded-[16px]"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-mezo-lime/10 flex items-center justify-center shrink-0">
              <Zap className="w-7 h-7 text-mezo-lime" />
            </div>
            <div>
              <h3 className="text-[18px] lg:text-[20px] font-extrabold text-white">Compound Advantage</h3>
              <p className="text-[13px] text-white/90">Why MezoLens is worth it</p>
            </div>
          </div>
          <div className="flex items-center gap-6 lg:gap-12 flex-wrap">
            <div className="text-right">
              <div className="text-[12px] uppercase tracking-wider text-white/80 font-bold">Without MezoLens</div>
              <div className="text-[20px] lg:text-[24px] font-extrabold text-white/80">{dashData.manualGains?.toFixed(6) || '0'} BTC</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] uppercase tracking-wider text-mezo-lime/60 font-bold">With MezoLens</div>
              <div className="text-[20px] lg:text-[24px] font-extrabold text-mezo-lime">{dashData.compoundGains?.toFixed(6) || '0'} BTC</div>
            </div>
            <div className="text-right pl-6 border-l border-white/10">
              <div className="text-[12px] uppercase tracking-wider text-white/80 font-bold">Advantage</div>
              <div className="text-[24px] lg:text-[28px] font-extrabold text-mezo-lime">+<CountUp end={dashData.advantagePercent || 0} decimals={1} />%</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6 lg:space-y-8">
          <div className="glass-card p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div>
                <h2 className="text-[16px] lg:text-[18px] font-bold text-mezo-black">Compound Performance</h2>
                <p className="text-[12px] lg:text-[13px] text-mezo-grey">BTC gains per epoch</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 lg:px-4 py-1.5 rounded-full bg-mezo-black text-white text-[12px] font-semibold">Epochs</button>
                <button className="px-3 lg:px-4 py-1.5 rounded-full bg-mezo-border/30 text-mezo-grey text-[12px] font-semibold">Months</button>
              </div>
            </div>
            <div className="h-[240px] lg:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashData.performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#BBB' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#BBB' }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: '1px solid #1A1A1A', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="gains" radius={[4, 4, 0, 0]}>
                    {dashData.performanceData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={`rgba(26, 140, 82, ${0.3 + (i * 0.14)})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Epoch Info */}
          <div className="glass-card p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-mezo-lime/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-mezo-sidebar" />
                </div>
                <div>
                  <span className="text-[14px] font-bold text-mezo-black">Epoch #{epoch.number}</span>
                  <p className="text-[12px] text-mezo-grey">Next compound available in:</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { val: epoch.timeRemaining.days, label: 'days' },
                  { val: epoch.timeRemaining.hours, label: 'hrs' },
                  { val: epoch.timeRemaining.minutes, label: 'min' },
                ].map((t) => (
                  <div key={t.label} className="bg-mezo-sidebar text-white px-3 py-2 rounded-xl text-center min-w-[48px]">
                    <div className="text-[16px] lg:text-[18px] font-extrabold leading-none">{t.val}</div>
                    <div className="text-[9px] text-white/90 font-bold uppercase">{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-2 bg-mezo-border/30 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${epoch.progress}%` }} className="h-full bg-gradient-to-r from-mezo-lime/60 to-mezo-lime rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[12px] lg:text-[13px] mt-3">
              <span className="text-mezo-grey">{Math.round(epoch.progress)}% Complete</span>
              <div className="flex gap-3 lg:gap-4">
                <span className="text-mezo-grey">Swap: <span className="text-mezo-black font-bold">{epoch.feeBreakdown.swap}%</span></span>
                <span className="text-mezo-grey">Borrow: <span className="text-mezo-black font-bold">{epoch.feeBreakdown.borrow}%</span></span>
                <span className="text-mezo-grey hidden sm:inline">Bridge: <span className="text-mezo-black font-bold">{epoch.feeBreakdown.bridge}%</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div className="glass-card p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <h2 className="text-[16px] lg:text-[18px] font-bold text-mezo-black">Your Positions</h2>
              <button onClick={() => setCurrentPage('My Positions')} className="text-[12px] font-bold text-mezo-sidebar hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-5 lg:space-y-6">
              {dashData.positions.map((pos) => (
                <div key={pos.id} className="flex items-center justify-between group cursor-pointer" onClick={() => setCurrentPage('My Positions')}>
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pos.color }} />
                    <div>
                      <div className="text-[13px] lg:text-[14px] font-bold text-mezo-black">{pos.strategy}</div>
                      <div className="text-[12px] lg:text-[12px] text-mezo-grey">{pos.amount}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] lg:text-[14px] font-extrabold text-mezo-black">{pos.apr}</div>
                    <div className="text-[12px] font-bold text-strategy-conservative">{pos.compoundGain}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage('Deposit')}
              className="w-full mt-8 lg:mt-10 py-3 lg:py-4 border border-dashed border-mezo-black rounded-2xl text-[13px] lg:text-[14px] font-bold text-mezo-grey hover:border-mezo-sidebar hover:text-mezo-sidebar transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add New Position
            </button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <button
              onClick={() => setCurrentPage('Deposit')}
              className="w-full bg-mezo-lime text-mezo-sidebar py-3 lg:py-4 rounded-2xl font-extrabold flex items-center justify-center gap-2 hover:opacity-90 transition-all text-[14px]"
            >
              <Plus className="w-5 h-5" /> New Deposit
            </button>
            <button
              onClick={() => { setCompoundTarget(0); setCompoundModalOpen(true); }}
              className="w-full bg-mezo-sidebar text-white py-3 lg:py-4 rounded-2xl font-extrabold flex items-center justify-center gap-2 hover:bg-black transition-all text-[14px]"
            >
              <RefreshCw className="w-5 h-5" /> Trigger Compound
            </button>
            <button
              onClick={() => setCurrentPage('My Positions')}
              className="w-full bg-transparent text-mezo-grey py-3 lg:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:text-mezo-black transition-all text-[14px]"
            >
              <History className="w-5 h-5" /> Claim All Rewards
            </button>
          </div>
        </div>
      </div>

      {/* Compound Trigger Modal */}
      <CompoundTriggerModal
        isOpen={compoundModalOpen}
        onClose={() => setCompoundModalOpen(false)}
        positionId={compoundTarget}
        estimatedGain={`${getPendingCompound(compoundTarget).toFixed(4)} BTC`}
        gasCost="~$0.02"
        keeperIncentive={`${(getPendingCompound(compoundTarget) * 0.001).toFixed(6)} BTC`}
        onConfirm={handleCompoundConfirm}
      />
      <TxStatusModal
        isOpen={txModal.open}
        onClose={() => setTxModal({ ...txModal, open: false })}
        status={txModal.status}
        txHash={txModal.hash}
        title={txModal.title}
      />
    </div>
  );
}
