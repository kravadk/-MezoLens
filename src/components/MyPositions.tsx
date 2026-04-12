import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  Zap,
  Bitcoin,
  RefreshCw,
  ArrowRight,
  Shield,
  Flame,
  Scale,
  Heart,
  Settings2,
  Download,
  X as XIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { useUIStore } from '../store/uiStore';
import { useCompound } from '../hooks/useCompound';
import { useEarnVault } from '../hooks/useEarnVault';
import { usePositions } from '../hooks/usePositions';
import { STRATEGIES } from '../utils/constants';
import { TxStatusModal } from './modals/TxStatusModal';
import { PillTabs } from './common/Pill';
import { Badge } from './common/Badge';
import { CompoundTriggerModal } from './modals/CompoundTriggerModal';
import { StrategyChangeModal } from './modals/StrategyChangeModal';
import { MusdYieldModal } from './modals/MusdYieldModal';
import { ClaimConfirmModal } from './modals/ClaimConfirmModal';

const strategyIcons: Record<string, React.ReactNode> = {
  Aggressive: <Flame className="w-5 h-5" />,
  Balanced: <Scale className="w-5 h-5" />,
  Conservative: <Shield className="w-5 h-5" />,
};

const strategyColors: Record<string, string> = {
  Aggressive: '#D4940A',
  Balanced: '#5B6DEC',
  Conservative: '#1A8C52',
};

const completedPositions: any[] = [];

export function MyPositions() {
  const [filter, setFilter] = useState('all');
  const { setCurrentPage, isWalletConnected } = useStore();
  const { openWalletModal } = useUIStore();
  const { compound, getPendingCompound } = useCompound();
  const { claimWithoutCompound, changeStrategy, enableMusdYield, disableMusdYield } = useEarnVault();
  const posData = usePositions();
  const { showToast } = useUIStore();

  // Modal states
  const [compoundModal, setCompoundModal] = useState<{ open: boolean; positionId: number }>({ open: false, positionId: 0 });
  const [strategyModal, setStrategyModal] = useState<{ open: boolean; current: string; positionId: number }>({ open: false, current: '', positionId: 0 });
  const [musdModal, setMusdModal] = useState<{ open: boolean; positionId: number; current: number }>({ open: false, positionId: 0, current: 0 });
  const [claimModal, setClaimModal] = useState<{ open: boolean; positionId: number }>({ open: false, positionId: 0 });
  const [txModal, setTxModal] = useState<{ open: boolean; status: 'pending' | 'success' | 'error'; hash?: string; title: string }>({ open: false, status: 'pending', title: '' });

  const handleCompoundConfirm = async () => {
    setCompoundModal({ ...compoundModal, open: false });
    setTxModal({ open: true, status: 'pending', title: 'Compounding...' });
    try {
      const hash = await compound(compoundModal.positionId);
      setTxModal({ open: true, status: 'success', hash, title: 'Compound Successful!' });
    } catch (err: any) {
      setTxModal({ open: true, status: 'error', title: 'Compound Failed' });
    }
  };

  const handleClaimConfirm = async () => {
    setClaimModal({ ...claimModal, open: false });
    setTxModal({ open: true, status: 'pending', title: 'Claiming Rewards...' });
    try {
      const hash = await claimWithoutCompound(claimModal.positionId);
      setTxModal({ open: true, status: 'success', hash, title: 'Rewards Claimed!' });
    } catch (err: any) {
      setTxModal({ open: true, status: 'error', title: 'Claim Failed' });
    }
  };

  const handleStrategyConfirm = async (newStrategy: string) => {
    setStrategyModal({ ...strategyModal, open: false });
    setTxModal({ open: true, status: 'pending', title: 'Changing Strategy...' });
    const strategyMap: Record<string, number> = {
      conservative: STRATEGIES.CONSERVATIVE,
      balanced: STRATEGIES.BALANCED,
      aggressive: STRATEGIES.AGGRESSIVE,
    };
    try {
      const hash = await changeStrategy(strategyModal.positionId, strategyMap[newStrategy]);
      setTxModal({ open: true, status: 'success', hash, title: 'Strategy Changed!' });
    } catch (err: any) {
      setTxModal({ open: true, status: 'error', title: 'Strategy Change Failed' });
    }
  };

  const handleMusdConfirm = async (percent: number) => {
    setMusdModal({ ...musdModal, open: false });
    setTxModal({ open: true, status: 'pending', title: 'Updating MUSD Yield...' });
    try {
      const hash = await enableMusdYield(musdModal.positionId, percent);
      setTxModal({ open: true, status: 'success', hash, title: 'MUSD Yield Updated!' });
    } catch (err: any) {
      setTxModal({ open: true, status: 'error', title: 'MUSD Update Failed' });
    }
  };

  const handleMusdDisable = async () => {
    setMusdModal({ ...musdModal, open: false });
    setTxModal({ open: true, status: 'pending', title: 'Disabling MUSD Yield...' });
    try {
      const hash = await disableMusdYield(musdModal.positionId);
      setTxModal({ open: true, status: 'success', hash, title: 'MUSD Yield Disabled!' });
    } catch (err: any) {
      setTxModal({ open: true, status: 'error', title: 'Disable Failed' });
    }
  };

  const boostMap: Record<string, string> = { Conservative: '1.0x', Balanced: '2.0x', Aggressive: '5.0x' };
  const aprMap: Record<string, string> = { Conservative: '5.1%', Balanced: '8.2%', Aggressive: '12.4%' };

  const activePositions = posData.positions.filter(p => p.active).map(p => ({
    id: p.id,
    strategy: p.strategy,
    balance: `${(p.btcDeposited + p.btcCompounded).toFixed(6)} BTC`,
    deposited: `${p.btcDeposited.toFixed(6)} BTC`,
    value: `$${((p.btcDeposited + p.btcCompounded) * 96500).toFixed(0)}`,
    yield: `+${p.btcCompounded.toFixed(6)} BTC`,
    apr: aprMap[p.strategy] || '5.1%',
    boost: boostMap[p.strategy] || '1.0x',
    compoundGains: `+${p.btcCompounded.toFixed(6)} BTC`,
    compoundCount: p.compoundCount,
    lastCompound: `Epoch #${p.lastCompoundEpoch}`,
    nextCompound: `Epoch #${p.lastCompoundEpoch + 1}`,
    musdYield: p.musdPercent > 0 ? { active: true, allocation: p.musdPercent / 100, health: 182 } : null,
  }));

  if (!isWalletConnected) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-mezo-lime/10 rounded-[32px] flex items-center justify-center border-2 border-dashed border-mezo-lime/30">
          <Wallet className="w-12 h-12 text-mezo-lime/60" />
        </div>
        <div className="max-w-md">
          <h2 className="text-[28px] font-extrabold text-mezo-black">Connect to view Positions</h2>
          <p className="text-[15px] text-mezo-grey mt-3">Connect your wallet to manage your active staking vaults.</p>
        </div>
        <button onClick={openWalletModal} className="px-8 py-4 bg-mezo-lime text-mezo-sidebar rounded-2xl font-extrabold flex items-center gap-2 hover:opacity-90 transition-all">
          <Wallet className="w-5 h-5" /> Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <div className="glass-card p-5 lg:p-6 border-l-4 border-mezo-sidebar">
          <div className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Total Position Value</div>
          <div className="text-[28px] lg:text-[32px] font-extrabold text-mezo-black">0.813 BTC</div>
          <div className="text-[13px] text-mezo-grey font-bold mt-1">= $78,460</div>
        </div>
        <div className="glass-card p-5 lg:p-6 border-l-4 border-strategy-conservative">
          <div className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Total Compound Gains</div>
          <div className="text-[28px] lg:text-[32px] font-extrabold text-strategy-conservative">+0.058 BTC</div>
          <div className="text-[13px] text-strategy-conservative font-bold mt-1">from 24 auto-compounds</div>
        </div>
        <div className="p-5 lg:p-6 bg-mezo-sidebar text-white border border-mezo-sidebar rounded-[16px]">
          <div className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-1">Weighted APR</div>
          <div className="text-[28px] lg:text-[32px] font-extrabold text-mezo-lime">9.42%</div>
          <div className="text-[13px] text-white/60 font-bold mt-1">with compound effect</div>
        </div>
      </div>

      {/* Filter */}
      <PillTabs tabs={['all', 'active', 'completed']} activeTab={filter} onChange={setFilter} />

      {/* Active */}
      {(filter === 'all' || filter === 'active') && (
        <div className="space-y-4">
          <h2 className="text-[16px] lg:text-[18px] font-bold text-mezo-black px-1">Active Positions</h2>
          {activePositions.map((pos) => (
            <motion.div key={pos.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 lg:p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 lg:mb-5">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: strategyColors[pos.strategy] }}>
                    {strategyIcons[pos.strategy]}
                  </div>
                  <div>
                    <h3 className="text-[15px] lg:text-[16px] font-bold text-mezo-black">{pos.strategy} Vault</h3>
                    <div className="flex items-center gap-2 lg:gap-3 mt-0.5 flex-wrap">
                      <span className="text-[12px] lg:text-[12px] text-mezo-grey">APR: <span className="text-mezo-black font-bold">{pos.apr}</span></span>
                      <span className="w-1 h-1 rounded-full bg-mezo-border" />
                      <span className="text-[12px] lg:text-[12px] text-mezo-grey">Boost: <span className="font-bold" style={{ color: strategyColors[pos.strategy] }}>{pos.boost}</span></span>
                      {pos.musdYield && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-mezo-border" />
                          <Badge variant="info"><Heart className="w-3 h-3" /> MUSD {pos.musdYield.allocation}%</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setCompoundModal({ open: true, positionId: pos.id })} className="px-3 lg:px-4 py-2 bg-mezo-lime text-mezo-sidebar text-[12px] font-bold rounded-xl hover:opacity-90 transition-colors flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Compound
                  </button>
                  <button onClick={() => setClaimModal({ open: true, positionId: pos.id })} className="px-3 lg:px-4 py-2 bg-mezo-border/30 text-mezo-black text-[12px] font-bold rounded-xl hover:bg-mezo-border/50 transition-colors flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Claim
                  </button>
                  <button onClick={() => setStrategyModal({ open: true, current: pos.strategy.toLowerCase() })} className="px-3 py-2 bg-mezo-border/30 text-mezo-black text-[12px] font-bold rounded-xl hover:bg-mezo-border/50 transition-colors">
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 pt-4 lg:pt-5 border-t border-mezo-border">
                <div>
                  <div className="text-[10px] lg:text-[12px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Balance</div>
                  <div className="text-[14px] lg:text-[16px] font-extrabold text-mezo-black">{pos.balance}</div>
                  <div className="text-[12px] lg:text-[12px] text-mezo-grey">{pos.value}</div>
                </div>
                <div>
                  <div className="text-[10px] lg:text-[12px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Compound Gains</div>
                  <div className="text-[14px] lg:text-[16px] font-extrabold text-strategy-conservative">{pos.compoundGains}</div>
                  <div className="text-[12px] lg:text-[12px] text-mezo-grey">{pos.compoundCount} compounds</div>
                </div>
                <div>
                  <div className="text-[10px] lg:text-[12px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Last Compound</div>
                  <div className="text-[12px] lg:text-[13px] font-bold text-mezo-black">{pos.lastCompound}</div>
                </div>
                <div>
                  <div className="text-[10px] lg:text-[12px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Next Compound</div>
                  <div className="text-[12px] lg:text-[13px] font-bold text-mezo-black">{pos.nextCompound}</div>
                </div>
                {pos.musdYield && (
                  <div className="cursor-pointer" onClick={() => setMusdModal({ open: true, positionId: pos.id, current: pos.musdYield!.allocation })}>
                    <div className="text-[10px] lg:text-[12px] font-bold text-mezo-grey uppercase tracking-widest mb-1">CDP Health</div>
                    <div className="text-[14px] lg:text-[16px] font-extrabold text-strategy-conservative">{pos.musdYield.health}%</div>
                    <div className="text-[12px] lg:text-[12px] text-strategy-conservative font-bold">Healthy</div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Completed */}
      {(filter === 'all' || filter === 'completed') && (
        <div className="space-y-4">
          <h2 className="text-[16px] lg:text-[18px] font-bold text-mezo-black px-1">Completed Positions</h2>
          {completedPositions.map((pos) => (
            <div key={pos.id} className="glass-card p-4 lg:p-6 opacity-70">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: strategyColors[pos.strategy] + '15' }}>
                    {strategyIcons[pos.strategy]}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-mezo-black">{pos.strategy} <span className="text-mezo-grey">(Closed)</span></h3>
                    <div className="text-[12px] text-mezo-grey">Closed at {pos.closedAt}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8 text-right">
                  <div><div className="text-[10px] font-bold text-mezo-grey uppercase mb-0.5">Deposited</div><div className="text-[13px] font-bold">{pos.deposited}</div></div>
                  <div><div className="text-[10px] font-bold text-mezo-grey uppercase mb-0.5">Compound Gain</div><div className="text-[13px] font-extrabold text-strategy-conservative">{pos.compoundGain}</div></div>
                  <div><div className="text-[10px] font-bold text-mezo-grey uppercase mb-0.5">Fees Paid</div><div className="text-[13px] font-bold">{pos.feesPaid}</div></div>
                  <div><div className="text-[10px] font-bold text-mezo-grey uppercase mb-0.5">Effective APR</div><div className="text-[13px] font-extrabold">{pos.effectiveApr}%</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="glass-card p-8 lg:p-12 border-dashed border-2 border-mezo-black flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-mezo-border/40 rounded-full flex items-center justify-center">
          <Wallet className="w-8 h-8 text-mezo-grey" />
        </div>
        <h3 className="text-[18px] font-bold text-mezo-black">Open a new position</h3>
        <p className="text-[14px] text-mezo-grey max-w-xs">Deposit BTC, choose a strategy, and let MezoLens auto-compound for you.</p>
        <button onClick={() => setCurrentPage('Deposit')} className="px-8 py-3 bg-mezo-lime text-mezo-sidebar text-[14px] font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
          New Deposit <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* All Modals */}
      <CompoundTriggerModal
        isOpen={compoundModal.open}
        onClose={() => setCompoundModal({ ...compoundModal, open: false })}
        positionId={compoundModal.positionId}
        estimatedGain={`${getPendingCompound(compoundModal.positionId).toFixed(4)} BTC`}
        gasCost="~$0.02"
        keeperIncentive={`${(getPendingCompound(compoundModal.positionId) * 0.001).toFixed(6)} BTC`}
        onConfirm={handleCompoundConfirm}
      />
      <StrategyChangeModal
        isOpen={strategyModal.open}
        onClose={() => setStrategyModal({ ...strategyModal, open: false })}
        currentStrategy={strategyModal.current}
        onConfirm={handleStrategyConfirm}
      />
      <MusdYieldModal
        isOpen={musdModal.open}
        onClose={() => setMusdModal({ ...musdModal, open: false })}
        positionId={musdModal.positionId}
        currentPercent={musdModal.current}
        onConfirm={handleMusdConfirm}
        onDisable={handleMusdDisable}
      />
      <ClaimConfirmModal
        isOpen={claimModal.open}
        onClose={() => setClaimModal({ ...claimModal, open: false })}
        positionId={claimModal.positionId}
        claimAmount={`${getPendingCompound(claimModal.positionId).toFixed(4)} BTC`}
        fee={`${(getPendingCompound(claimModal.positionId) * 0.003).toFixed(6)} BTC`}
        netAmount={`${(getPendingCompound(claimModal.positionId) * 0.997).toFixed(4)} BTC`}
        onConfirm={handleClaimConfirm}
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
