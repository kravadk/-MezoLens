import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, Info, Wallet, Bitcoin, Zap, Shield, ArrowRight, Flame, Scale, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { useUIStore } from '../store/uiStore';
import { useEarnVault } from '../hooks/useEarnVault';
import { useTokenBalances } from '../hooks/useTokenBalances';
import { Button } from './common/Button';
import { InfoCallout } from './common/InfoCallout';
import { AmountInput } from './common/AmountInput';
import { TxStatusModal } from './modals/TxStatusModal';
import { STRATEGIES } from '../utils/constants';
import { useEstimatedAPR } from '../hooks/useEstimatedAPR';

const steps = ['Strategy', 'Amounts', 'Preview', 'Confirm'];

const strategies = [
  {
    id: 'conservative',
    name: 'Conservative',
    apr: '5 – 7%',
    risk: 'Low',
    boost: '1x',
    features: ['Lock BTC as veBTC', 'Auto-compound rewards', 'Earn base protocol fees'],
    color: '#1A8C52',
    icon: <Shield className="w-6 h-6" />,
  },
  {
    id: 'balanced',
    name: 'Balanced',
    apr: '7 – 10%',
    risk: 'Medium',
    boost: '2x',
    features: ['veBTC + veMEZO boost', 'Auto-compound rewards', 'MUSD yield option'],
    color: '#5B6DEC',
    icon: <Scale className="w-6 h-6" />,
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    apr: '10 – 15%',
    risk: 'High',
    boost: '5x',
    features: ['Max lock + 5x boost', 'Auto gauge voting', 'MUSD yield + auto-compound'],
    color: '#D4940A',
    icon: <Flame className="w-6 h-6" />,
  },
];

function buildProjection(btc: number, annualAprPct: number, epochs = 8) {
  // weekly compound: rate per epoch = annualApr / 52
  const epochRate = annualAprPct / 100 / 52;
  const rows = [];
  let running = btc;
  for (let i = 1; i <= epochs; i++) {
    const gain = running * epochRate;
    running += gain;
    rows.push({ epoch: i, amount: gain, total: running });
  }
  return rows;
}

export function Deposit() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [btcAmount, setBtcAmount] = useState('');
  const [mezoAmount, setMezoAmount] = useState('');
  const [musdEnabled, setMusdEnabled] = useState(false);
  const [musdPercent, setMusdPercent] = useState(20);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [txHash, setTxHash] = useState<string | undefined>();
  const { isWalletConnected, setCurrentPage } = useStore();
  const { openWalletModal, showToast } = useUIStore();
  const { deposit } = useEarnVault();
  const balances = useTokenBalances();
  const aprs = useEstimatedAPR();

  const nextStep = () => {
    // Validate before advancing
    if (currentStep === 1) {
      const btc = parseFloat(btcAmount);
      if (!btcAmount || isNaN(btc) || btc < 0.000001) {
        showToast('Minimum deposit is 0.000001 BTC', 'warning');
        return;
      }
      if (btc > balances.btc) {
        showToast(`Insufficient BTC balance (${balances.btc} BTC)`, 'error');
        return;
      }
    }
    if (currentStep === 2) {
      // Send real deposit transaction
      setTxModalOpen(true);
      setTxStatus('pending');
      setTxHash(undefined);

      const strategyMap: Record<string, number> = {
        conservative: STRATEGIES.CONSERVATIVE,
        balanced: STRATEGIES.BALANCED,
        aggressive: STRATEGIES.AGGRESSIVE,
      };
      const strategyId = strategyMap[selectedStrategy || 'conservative'];
      const btc = parseFloat(btcAmount);
      const mezo = parseFloat(mezoAmount) || 0;

      if (isNaN(btc) || btc <= 0) {
        setTxModalOpen(false);
        showToast('Invalid BTC amount', 'error');
        return;
      }
      if (mezo < 0 || isNaN(mezo)) {
        setTxModalOpen(false);
        showToast('Invalid MEZO amount', 'error');
        return;
      }

      deposit(strategyId, btc, mezo)
        .then((hash) => {
          setTxHash(hash);
          setTxStatus('success');
        })
        .catch((err: any) => {
          if (process.env.NODE_ENV === 'development') console.error('Deposit failed:', err);
          setTxStatus('error');
        });
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));
  const canEnableMusd = selectedStrategy === 'balanced' || selectedStrategy === 'aggressive';
  const strategyObj = strategies.find(s => s.id === selectedStrategy);

  if (!isWalletConnected) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-mezo-lime/10 rounded-[32px] flex items-center justify-center border-2 border-dashed border-mezo-lime/30">
          <Wallet className="w-12 h-12 text-mezo-lime/60" />
        </div>
        <div className="max-w-md">
          <h2 className="text-[28px] font-extrabold text-mezo-black leading-tight">Connect to Deposit</h2>
          <p className="text-[15px] text-mezo-grey mt-3">Connect your wallet to start staking BTC and earning auto-compound yield.</p>
        </div>
        <button
          onClick={openWalletModal}
          className="px-8 py-4 bg-mezo-lime text-mezo-sidebar rounded-2xl font-extrabold hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Wallet className="w-5 h-5" /> Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Stepper */}
      <div className="flex items-start max-w-[700px] mx-auto px-4">
        {steps.map((step, idx) => (
          <div key={step} className="flex-1 flex flex-col items-center relative">
            {/* Connecting line */}
            {idx < steps.length - 1 && (
              <div className={cn(
                "absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-[2px]",
                idx < currentStep ? "bg-strategy-conservative" : "bg-mezo-black/10"
              )} />
            )}
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-[16px] transition-all duration-500 relative z-10",
              idx < currentStep ? "bg-strategy-conservative text-white" :
              idx === currentStep ? "bg-mezo-sidebar text-white scale-110 shadow-xl" :
              "bg-white border-2 border-mezo-black text-mezo-black"
            )}>
              {idx < currentStep ? <Check className="w-6 h-6" /> : idx + 1}
            </div>
            <span className={cn(
              "text-[11px] font-bold uppercase tracking-widest mt-3",
              idx === currentStep ? "text-mezo-black" : "text-mezo-grey"
            )}>{step}</span>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {/* Step 1: Strategy */}
          {currentStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {strategies.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStrategy(s.id)}
                  className={cn(
                    "glass-card p-0 text-left transition-all duration-500 border-2 relative group overflow-hidden flex flex-col h-full",
                    selectedStrategy === s.id
                      ? "shadow-[0_0_20px_rgba(91,109,236,0.15)] bg-white"
                      : "border-mezo-black bg-white hover:border-mezo-black"
                  )}
                  style={{ borderColor: selectedStrategy === s.id ? s.color + '80' : undefined }}
                >
                  <div className="p-8 pb-0 flex-grow">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: s.color }}>
                        {s.icon}
                      </div>
                      <div>
                        <div className="text-[16px] font-extrabold text-mezo-black">{s.name}</div>
                        <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: s.color }}>{s.risk} Risk</div>
                      </div>
                    </div>

                    <div className="space-y-1 mb-6">
                      <div className="text-[32px] font-extrabold text-mezo-black tracking-tight leading-none">{s.apr}</div>
                      <div className="text-[10px] font-bold text-mezo-grey uppercase tracking-widest">Est. APR with {s.boost} boost</div>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {s.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-[13px] text-mezo-black font-medium">
                          <div className="w-5 h-5 rounded-full bg-mezo-lime/20 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-mezo-sidebar" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto border-t border-mezo-black/5 p-4 flex items-center justify-between bg-mezo-border/5">
                    <span className="text-[10px] font-bold text-mezo-grey uppercase tracking-widest">Boost: {s.boost}</span>
                    <Info className="w-3.5 h-3.5 text-mezo-grey/50" />
                  </div>

                  {selectedStrategy === s.id && (
                    <motion.div layoutId="active-strategy" className="absolute top-4 right-4">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: s.color }}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </motion.div>
                  )}
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Amounts + MUSD toggle */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-[800px] mx-auto space-y-8"
            >
              <div className="glass-card p-10 space-y-10">
                {/* BTC input */}
                <AmountInput
                  label="Deposit BTC"
                  sublabel="BTC Amount"
                  balance={`${balances.btc} BTC`}
                  icon={<Bitcoin className="w-6 h-6" />}
                  value={btcAmount}
                  onChange={setBtcAmount}
                  onMax={() => setBtcAmount(balances.btc.toString())}
                />

                {/* MEZO input (balanced/aggressive) */}
                {(selectedStrategy === 'balanced' || selectedStrategy === 'aggressive') && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-mezo-grey">MEZO Stake</span>
                        <h4 className="text-[18px] font-extrabold text-mezo-black">Boost with MEZO</h4>
                      </div>
                      <span className="text-[12px] font-bold text-mezo-grey">Balance: <span className="text-mezo-black">{balances.mezo.toLocaleString()} MEZO</span></span>
                    </div>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-mezo-grey" />
                        <div className="w-px h-6 bg-mezo-black mx-2" />
                      </div>
                      <input
                        type="number"
                        value={mezoAmount}
                        onChange={(e) => setMezoAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-mezo-border/30 border-2 border-transparent rounded-[24px] pl-20 pr-24 py-6 text-[32px] font-extrabold focus:border-mezo-sidebar focus:bg-white outline-none transition-all placeholder:text-mezo-border"
                      />
                      <button className="absolute right-6 top-1/2 -translate-y-1/2 px-4 py-2 bg-mezo-sidebar text-white rounded-xl text-[12px] font-extrabold hover:bg-black transition-colors">MAX</button>
                    </div>
                  </div>
                )}

                {/* MUSD Yield Toggle */}
                {canEnableMusd && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl border border-mezo-black bg-mezo-border/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-strategy-balanced/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-strategy-balanced" />
                          </div>
                          <div>
                            <h4 className="text-[15px] font-bold text-mezo-black">Enable MUSD Yield</h4>
                            <p className="text-[12px] text-mezo-grey">Route part of rewards through MUSD LP</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setMusdEnabled(!musdEnabled)}
                          className="text-mezo-sidebar"
                        >
                          {musdEnabled
                            ? <ToggleRight className="w-10 h-10 text-strategy-conservative" />
                            : <ToggleLeft className="w-10 h-10 text-mezo-grey" />
                          }
                        </button>
                      </div>

                      {musdEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4 pt-4 border-t border-mezo-border"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[13px] font-bold text-mezo-black">MUSD Allocation</span>
                            <span className="text-[16px] font-extrabold text-mezo-black">{musdPercent}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="50"
                            step="5"
                            value={musdPercent}
                            onChange={(e) => setMusdPercent(Number(e.target.value))}
                            className="w-full h-1.5 bg-mezo-border rounded-full appearance-none cursor-pointer accent-mezo-sidebar"
                          />
                          <div className="flex justify-between text-[11px] text-mezo-grey font-bold">
                            <span>10%</span>
                            <span>50%</span>
                          </div>
                          <p className="text-[12px] text-mezo-grey">
                            {musdPercent}% of your compound rewards will be routed through MUSD LP for additional yield.
                          </p>
                          <div className="flex items-center gap-2 p-3 bg-strategy-aggressive/5 rounded-xl border border-strategy-aggressive/20">
                            <Info className="w-4 h-4 text-strategy-aggressive shrink-0" />
                            <p className="text-[11px] text-strategy-aggressive font-medium">
                              This adds a 1% borrow cost. Net positive only if LP APR &gt; 1%.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                <InfoCallout>
                  {selectedStrategy === 'conservative'
                    ? 'Your BTC will be locked as veBTC to earn base protocol fees.'
                    : 'Staking MEZO boosts your BTC yield by up to ' + (selectedStrategy === 'aggressive' ? '5x' : '2x') + '.'
                  }
                </InfoCallout>
              </div>
            </motion.div>
          )}

          {/* Step 3: Preview with compound projection */}
          {currentStep === 2 && (() => {
            const btcNum = parseFloat(btcAmount) || 0;
            const selectedApr = selectedStrategy === 'aggressive'
              ? aprs.aggressive
              : selectedStrategy === 'balanced'
              ? aprs.balanced
              : aprs.conservative;
            const baseApr = selectedApr * 0.91; // compound ~9% better than base
            const projectionData = buildProjection(btcNum, selectedApr);
            const withoutCompound = btcNum * (1 + selectedApr / 100 * (8 / 52));
            const withCompound = projectionData[projectionData.length - 1]?.total || btcNum;
            const gainPct = btcNum > 0 ? ((withCompound - withoutCompound) / withoutCompound * 100) : 0;
            return (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-[800px] mx-auto space-y-6"
            >
              <div className="glass-card p-10 space-y-10">
                <div className="flex items-center justify-between border-b border-mezo-black pb-6">
                  <h3 className="text-[24px] font-extrabold text-mezo-black">Review Position</h3>
                  <div className="px-4 py-1.5 rounded-full text-[12px] font-extrabold uppercase tracking-widest"
                    style={{ backgroundColor: strategyObj?.color + '15', color: strategyObj?.color }}>
                    {strategyObj?.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] text-mezo-grey">BTC Deposit</span>
                      <span className="text-[14px] font-extrabold text-mezo-black">{btcAmount || '0.250'} BTC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] text-mezo-grey">MEZO Stake</span>
                      <span className="text-[14px] font-extrabold text-mezo-black">{mezoAmount || '0'} MEZO</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] text-mezo-grey">Boost</span>
                      <span className="text-[14px] font-extrabold text-mezo-black">{strategyObj?.boost}</span>
                    </div>
                    {musdEnabled && (
                      <div className="flex justify-between items-center">
                        <span className="text-[14px] text-mezo-grey">MUSD Yield</span>
                        <span className="text-[14px] font-extrabold text-strategy-balanced">{musdPercent}% allocation</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] text-mezo-grey">Base APR</span>
                      <span className="text-[14px] font-extrabold text-mezo-black">{baseApr.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] text-mezo-grey">Compound APR</span>
                      <span className="text-[14px] font-extrabold text-strategy-conservative">{selectedApr.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center pt-5 border-t border-mezo-black">
                      <span className="text-[16px] font-extrabold text-mezo-black">Total APR</span>
                      <span className="text-[28px] font-extrabold text-strategy-conservative">{selectedApr.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compound Projection */}
              <div className="glass-card p-8">
                <h4 className="text-[16px] font-bold text-mezo-black mb-6">Projected Compound Schedule</h4>
                <div className="space-y-3">
                  {projectionData.map((row) => (
                    <div key={row.epoch} className="flex items-center gap-4 text-[13px]">
                      <span className="text-mezo-grey font-bold w-16">Epoch {row.epoch}</span>
                      <span className="text-strategy-conservative font-bold">+{row.amount.toFixed(8)} BTC</span>
                      <ArrowRight className="w-3 h-3 text-mezo-grey" />
                      <span className="text-mezo-grey">re-locked</span>
                      <ArrowRight className="w-3 h-3 text-mezo-grey" />
                      <span className="text-mezo-black font-extrabold">total: {row.total.toFixed(8)} BTC</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-mezo-lime/10 rounded-xl border border-mezo-lime/20">
                  <p className="text-[13px] text-mezo-sidebar font-bold">
                    After 8 epochs: {withCompound.toFixed(8)} BTC (vs {withoutCompound.toFixed(8)} without compound = <span className="text-strategy-conservative">+{gainPct.toFixed(2)}%</span>)
                  </p>
                </div>
              </div>

              {/* Fee disclosure */}
              <div className="glass-card p-6">
                <h4 className="text-[14px] font-bold text-mezo-black mb-4">Fee Disclosure</h4>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-[11px] text-mezo-grey font-bold uppercase tracking-wider">Performance Fee</div>
                    <div className="text-[16px] font-extrabold text-mezo-black">0.3%</div>
                    <div className="text-[11px] text-mezo-grey">per compound</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-mezo-grey font-bold uppercase tracking-wider">Management Fee</div>
                    <div className="text-[16px] font-extrabold text-mezo-black">0.1%</div>
                    <div className="text-[11px] text-mezo-grey">annual</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-mezo-grey font-bold uppercase tracking-wider">Keeper Incentive</div>
                    <div className="text-[16px] font-extrabold text-mezo-black">0.1%</div>
                    <div className="text-[11px] text-mezo-grey">per compound</div>
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })()}

          {/* Step 4: Confirm */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[500px] flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="w-24 h-24 bg-strategy-conservative rounded-[32px] flex items-center justify-center shadow-2xl shadow-strategy-conservative/20">
                <Check className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-[36px] font-extrabold text-mezo-black leading-tight">Position Created!</h2>
                <p className="text-[16px] text-mezo-grey mt-4 font-medium max-w-md mx-auto">
                  Your BTC is now auto-compounding. Track your rewards in real-time on the dashboard.
                </p>
              </div>
              <a
                href={txHash ? `https://explorer.test.mezo.org/tx/${txHash}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-mezo-border/30 px-8 py-4 rounded-2xl font-mono text-[13px] text-mezo-grey border border-mezo-black hover:border-mezo-sidebar transition-colors flex items-center gap-2"
              >
                View on Explorer
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
              </a>
              <button
                onClick={() => { setCurrentStep(0); setCurrentPage('Dashboard'); }}
                className="px-10 py-5 bg-mezo-sidebar text-white rounded-2xl font-extrabold hover:bg-black transition-all"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      {currentStep < 3 && (
        <div className="flex justify-between items-center pt-12 border-t border-mezo-black max-w-[1000px] mx-auto w-full">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-8 py-4 rounded-2xl font-extrabold text-mezo-grey hover:text-mezo-black disabled:opacity-0 transition-all flex items-center gap-2"
          >
            Back
          </button>
          <button
            onClick={nextStep}
            disabled={currentStep === 0 && !selectedStrategy}
            className="px-12 py-5 bg-mezo-lime text-mezo-sidebar rounded-2xl font-extrabold flex items-center gap-3 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-mezo-lime/20"
          >
            <span>{currentStep === 2 ? 'Confirm & Stake BTC' : 'Next Step'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tx Status Modal */}
      <TxStatusModal
        isOpen={txModalOpen}
        onClose={() => { setTxModalOpen(false); if (txStatus === 'success') setCurrentStep(3); }}
        status={txStatus}
        txHash={txHash}
        title={txStatus === 'pending' ? 'Creating Position...' : txStatus === 'success' ? 'Position Created!' : 'Transaction Failed'}
      />
    </div>
  );
}
