import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, ShieldAlert, Shield, ExternalLink,
  Wallet, Heart, AlertTriangle, TrendingUp, ArrowRight,
  RefreshCw, Info, Send, ArrowLeftRight, Bitcoin, X,
  Plus, Minus,
} from 'lucide-react';
import { useStore } from '../store';
import { useUIStore } from '../store/uiStore';
import { usePassport } from '../hooks/usePassport';
import { useMusdCdp } from '../hooks/useMusdCdp';
import { useBtcPrice } from '../hooks/useBtcPrice';
import { usePositions } from '../hooks/usePositions';
import { useCompound } from '../hooks/useCompound';
import { useEarnVault } from '../hooks/useEarnVault';
import { TxStatusModal } from './modals/TxStatusModal';

// ── Health bar ──────────────────────────────────────────────────────────────
function HealthBar({ ratio }: { ratio: number }) {
  const pct = Math.min(100, Math.max(0, ((ratio - 150) / 150) * 100));
  const color = ratio < 160 ? '#FF6B6B' : ratio < 180 ? '#FFD93D' : '#1A8C52';
  const label = ratio < 160 ? 'At Risk' : ratio < 180 ? 'Caution' : 'Healthy';
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest">CDP Health</span>
        <span className="text-[13px] font-bold" style={{ color }}>{label} — {ratio.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-mezo-border rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
          className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-mezo-grey font-bold">
        <span>150% liq.</span><span>180% target</span><span>300%</span>
      </div>
    </div>
  );
}

// ── Passport banner ─────────────────────────────────────────────────────────
function PassportBanner({ status }: { status: ReturnType<typeof usePassport> }) {
  if (status === 'verified') {
    return (
      <div className="flex items-center gap-3 p-4 bg-strategy-conservative/10 rounded-2xl border border-strategy-conservative/20">
        <ShieldCheck className="w-7 h-7 text-strategy-conservative shrink-0" />
        <div>
          <div className="text-[14px] font-bold text-mezo-black">Mezo Passport Verified</div>
          <div className="text-[12px] text-mezo-grey">Your identity is confirmed on-chain</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-[#FFF4E5] rounded-2xl border border-[#D4940A]/20">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-7 h-7 text-[#D4940A] shrink-0" />
        <div>
          <div className="text-[14px] font-bold text-mezo-black">Mezo Passport Required</div>
          <div className="text-[12px] text-[#D4940A]">
            {status === 'unavailable'
              ? 'Passport contract deploying on testnet — check back soon'
              : 'Get your Passport to unlock full banking features'}
          </div>
        </div>
      </div>
      <a href="https://mezo.org/passport" target="_blank" rel="noopener noreferrer"
        className="shrink-0 px-4 py-2 bg-[#D4940A] text-white rounded-xl text-[12px] font-bold hover:opacity-90 flex items-center gap-1.5">
        Get Passport <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

// ── Add Collateral modal ─────────────────────────────────────────────────────
function AddCollateralModal({ open, onClose, onConfirm, loading }: {
  open: boolean; onClose: () => void; onConfirm: (btc: number) => void; loading: boolean;
}) {
  const [amount, setAmount] = useState('');
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[20px] p-8 w-full max-w-sm shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-extrabold text-mezo-black">Add Collateral</h3>
              <button onClick={onClose}><X className="w-5 h-5 text-mezo-grey" /></button>
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest">BTC Amount</label>
              <div className="relative">
                <Bitcoin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mezo-grey" />
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.001"
                  className="w-full pl-12 pr-4 py-4 bg-mezo-border/30 border-2 border-transparent rounded-2xl text-[18px] font-bold focus:border-mezo-sidebar focus:bg-white outline-none"
                />
              </div>
              <p className="text-[12px] text-mezo-grey">Increases collateral ratio and reduces liquidation risk.</p>
            </div>
            <button
              onClick={() => onConfirm(parseFloat(amount) || 0)}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full py-4 bg-mezo-lime text-mezo-sidebar rounded-2xl text-[14px] font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add {amount || '0'} BTC
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function Banking() {
  const { isWalletConnected, setCurrentPage } = useStore();
  const { openWalletModal, showToast } = useUIStore();
  const btcPrice = useBtcPrice();
  const passportStatus = usePassport();
  const { positions } = usePositions();
  const { compound } = useCompound();
  const { withdraw, deposit } = useEarnVault();

  const activePositions = positions.filter(p => p.active);
  const firstPos = activePositions[0];
  const positionId = firstPos?.id ?? 0;
  const cdp = useMusdCdp(positionId);

  const [addCollateralOpen, setAddCollateralOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [txModal, setTxModal] = useState<{ open: boolean; status: 'pending' | 'success' | 'error'; hash?: string; title: string }>
    ({ open: false, status: 'pending', title: '' });

  // ── Interactive calculator state ──
  const [calcBtc, setCalcBtc] = useState('0.1');
  const calcBtcNum = parseFloat(calcBtc) || 0;
  const calcMusd = Math.floor(calcBtcNum * btcPrice / 1.8);
  const calcYield = calcMusd * 0.08;
  const calcCost = calcMusd * 0.01;
  const calcNet = calcYield - calcCost;
  const calcHoldReturn = calcBtcNum * btcPrice * 0.0; // just holding = 0 yield
  const calcAdvantage = calcNet;

  // ── Low ratio toast ──
  useEffect(() => {
    if (cdp?.active && cdp.ratio < 160) {
      showToast(`⚠️ CDP ratio at ${cdp.ratio.toFixed(0)}% — below safe threshold. Add collateral now.`, 'error');
    }
  }, [cdp?.ratio]);

  const handleHarvest = async () => {
    setTxModal({ open: true, status: 'pending', title: 'Harvesting LP yield...' });
    try {
      const hash = await compound(positionId);
      setTxModal({ open: true, status: 'success', hash, title: 'Yield Harvested!' });
      showToast('LP yield harvested and compounded', 'success');
    } catch {
      setTxModal({ open: true, status: 'error', title: 'Harvest Failed' });
    }
  };

  const handleClose = async () => {
    setTxModal({ open: true, status: 'pending', title: 'Closing CDP...' });
    try {
      const hash = await withdraw(positionId);
      setTxModal({ open: true, status: 'success', hash, title: 'CDP Closed — BTC Returned!' });
    } catch {
      setTxModal({ open: true, status: 'error', title: 'Close Failed' });
    }
  };

  const handleAddCollateral = async (btc: number) => {
    if (!btc || btc <= 0) return;
    setAddCollateralOpen(false);
    setActionLoading(true);
    setTxModal({ open: true, status: 'pending', title: 'Adding collateral...' });
    try {
      const strategy = firstPos?.strategy === 'Aggressive' ? 2 : firstPos?.strategy === 'Balanced' ? 1 : 0;
      const hash = await deposit(strategy, btc, 0);
      setTxModal({ open: true, status: 'success', hash, title: 'Collateral Added!' });
      showToast(`+${btc} BTC added to collateral`, 'success');
    } catch {
      setTxModal({ open: true, status: 'error', title: 'Add Collateral Failed' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isWalletConnected) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-mezo-lime/10 rounded-[32px] flex items-center justify-center border-2 border-dashed border-mezo-lime/30">
          <Wallet className="w-12 h-12 text-mezo-lime/60" />
        </div>
        <div className="max-w-md">
          <h2 className="text-[28px] font-extrabold text-mezo-black">Bitcoin Banking on Mezo</h2>
          <p className="text-[15px] text-mezo-grey mt-3">Borrow MUSD at 1% fixed rate against your BTC.</p>
        </div>
        <button onClick={openWalletModal} className="px-8 py-4 bg-mezo-lime text-mezo-sidebar rounded-2xl font-extrabold flex items-center gap-2 hover:opacity-90">
          <Wallet className="w-5 h-5" /> Connect Wallet
        </button>
      </div>
    );
  }

  const musdBorrowed = cdp?.debt ?? 0;
  const musdInLp = cdp?.lpDeployed ?? 0;
  const collateralUsd = (cdp?.collateral ?? 0) * btcPrice;

  return (
    <div className="space-y-8 max-w-5xl">
      <PassportBanner status={passportStatus} />

      {/* Pipeline */}
      <div className="glass-card p-6">
        <h3 className="text-[13px] font-bold text-mezo-grey uppercase tracking-widest mb-4">Active MUSD Pipeline</h3>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0">
          {[
            { label: 'BTC Collateral', value: `${(cdp?.collateral ?? 0).toFixed(4)} BTC`, sub: `$${collateralUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: '#1A8C52' },
            { label: 'MUSD Borrowed', value: `${musdBorrowed.toLocaleString(undefined, { maximumFractionDigits: 0 })} MUSD`, sub: '1% fixed rate', color: '#5B6DEC' },
            { label: 'In LP Pool', value: `${musdInLp.toLocaleString(undefined, { maximumFractionDigits: 0 })} MUSD`, sub: 'earning fees', color: '#D4940A' },
            { label: 'Yield Earned', value: `+${(cdp?.totalYield ?? 0).toFixed(2)} MUSD`, sub: 'total harvested', color: '#1A8C52' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <div className="flex-1 text-center min-w-0">
                <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-1">{item.label}</div>
                <div className="text-[18px] sm:text-[20px] font-extrabold" style={{ color: item.color }}>{item.value}</div>
                <div className="text-[11px] text-mezo-grey">{item.sub}</div>
              </div>
              {i < 3 && (
                <div className="hidden sm:flex px-2 text-mezo-grey">
                  <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CDP Health */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-mezo-lime/10 rounded-xl"><Heart className="w-5 h-5 text-mezo-sidebar" /></div>
            <div>
              <h2 className="text-[18px] font-extrabold text-mezo-black">CDP Health</h2>
              <p className="text-[12px] text-mezo-grey">Position #{positionId} · MusdPipe on-chain</p>
            </div>
          </div>

          {cdp?.active ? (
            <div className="space-y-5">
              <HealthBar ratio={cdp.ratio} />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Collateral', val: `${cdp.collateral.toFixed(4)} BTC`, sub: `$${collateralUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                  { label: 'MUSD Debt', val: `${cdp.debt.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: '1% annual cost', accent: true },
                  { label: 'Liq. Price', val: `$${cdp.liqPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: 'BTC/USD' },
                  { label: 'LP Yield', val: `+${cdp.totalYield.toFixed(2)} MUSD`, sub: 'harvested total', green: true },
                ].map((s, i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-1">{s.label}</div>
                    <div className={`text-[18px] font-extrabold ${s.accent ? 'text-strategy-balanced' : s.green ? 'text-strategy-conservative' : 'text-mezo-black'}`}>{s.val}</div>
                    <div className="text-[11px] text-mezo-grey">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Low ratio alert with Top Up button */}
              {cdp.ratio < 165 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center justify-between gap-3 p-4 bg-[#FF6B6B]/10 rounded-xl border border-[#FF6B6B]/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#FF6B6B] shrink-0" />
                    <div>
                      <p className="text-[13px] font-bold text-[#FF6B6B]">Collateral ratio low!</p>
                      <p className="text-[11px] text-mezo-grey">{cdp.ratio.toFixed(0)}% · liquidation at 150%</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAddCollateralOpen(true)}
                    className="shrink-0 px-3 py-2 bg-[#FF6B6B] text-white rounded-xl text-[12px] font-bold hover:opacity-90 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Top Up
                  </button>
                </motion.div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button onClick={handleHarvest}
                  className="px-3 py-3 bg-mezo-lime text-mezo-sidebar rounded-xl text-[12px] font-bold hover:opacity-90 flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Harvest
                </button>
                <button onClick={() => setAddCollateralOpen(true)}
                  className="px-3 py-3 bg-mezo-border/30 text-mezo-black rounded-xl text-[12px] font-bold hover:bg-mezo-border/50 flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add BTC
                </button>
                <button onClick={handleClose}
                  className="px-3 py-3 bg-mezo-border/30 text-mezo-black rounded-xl text-[12px] font-bold hover:bg-red-50 hover:text-red-500 flex items-center justify-center gap-1.5">
                  <Minus className="w-3.5 h-3.5" /> Close
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-4">
              <Shield className="w-12 h-12 text-mezo-grey/30 mx-auto" />
              <p className="text-[15px] font-bold text-mezo-black">No active CDP</p>
              <p className="text-[13px] text-mezo-grey max-w-xs mx-auto">Deposit BTC and enable MUSD Yield in the Amounts step to open a CDP automatically.</p>
              <button onClick={() => setCurrentPage('Deposit')}
                className="px-6 py-3 bg-mezo-lime text-mezo-sidebar rounded-xl text-[13px] font-bold hover:opacity-90 flex items-center gap-2 mx-auto">
                Deposit BTC <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Interactive MUSD Calculator */}
        <div className="glass-card p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-strategy-balanced/10 rounded-xl"><TrendingUp className="w-5 h-5 text-strategy-balanced" /></div>
            <div>
              <h2 className="text-[18px] font-extrabold text-mezo-black">MUSD Yield Calculator</h2>
              <p className="text-[12px] text-mezo-grey">Enter BTC → see your banking returns</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest">BTC Deposit</label>
            <div className="relative">
              <Bitcoin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mezo-grey" />
              <input type="number" value={calcBtc} onChange={e => setCalcBtc(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-mezo-border/30 border-2 border-transparent rounded-2xl text-[20px] font-extrabold focus:border-mezo-sidebar focus:bg-white outline-none"
                placeholder="0.1" step="0.01" min="0" />
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'BTC value', val: `$${(calcBtcNum * btcPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: '#1A1A1A' },
              { label: 'MUSD capacity (at 180% CR)', val: `${calcMusd.toLocaleString()} MUSD`, color: '#5B6DEC' },
              { label: 'LP yield @ 8% APR', val: `+$${calcYield.toFixed(0)}/yr`, color: '#1A8C52' },
              { label: 'Borrow cost (1% fixed)', val: `-$${calcCost.toFixed(0)}/yr`, color: '#FF6B6B' },
            ].map((r, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-[13px] text-mezo-grey">{r.label}</span>
                <span className="text-[14px] font-extrabold" style={{ color: r.color }}>{r.val}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-mezo-border">
              <span className="text-[14px] font-extrabold text-mezo-black">Net annual gain</span>
              <span className="text-[20px] font-extrabold text-strategy-conservative">+${calcNet.toFixed(0)}</span>
            </div>
          </div>

          <div className="p-3 bg-mezo-lime/10 rounded-xl border border-mezo-lime/20 flex items-start gap-2">
            <Info className="w-4 h-4 text-mezo-sidebar shrink-0 mt-0.5" />
            <p className="text-[11px] text-mezo-sidebar">1% borrow rate is fixed. Mezo LP pools yield 5–15% — historically net positive for all strategies.</p>
          </div>

          <a href="https://explorer.test.mezo.org/address/0x82251096716EcE27260F2D4f67b2131B95D9bA33"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-mezo-grey hover:text-mezo-black transition-colors">
            <ExternalLink className="w-3 h-3" /> MusdPipe on Explorer
          </a>
        </div>
      </div>

      {/* Use your MUSD */}
      <div className="glass-card p-8">
        <h3 className="text-[16px] font-extrabold text-mezo-black mb-2">Use your MUSD</h3>
        <p className="text-[13px] text-mezo-grey mb-6">MUSD is a real stablecoin — spend it, swap it, send it.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="https://app.mezo.org/swap" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-mezo-border/20 rounded-2xl border border-mezo-border hover:bg-[#E5E8FD] hover:border-[#5B6DEC]/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#5B6DEC]/10 flex items-center justify-center shrink-0 group-hover:bg-[#5B6DEC]/20">
              <ArrowLeftRight className="w-5 h-5 text-[#5B6DEC]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-mezo-black">Swap on Mezo Swap</div>
              <div className="text-[12px] text-mezo-grey">MUSD → BTC or other tokens</div>
            </div>
          </a>
          <a href="https://app.mezo.org/send" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-mezo-border/20 rounded-2xl border border-mezo-border hover:bg-[#E2F0E5] hover:border-strategy-conservative/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-strategy-conservative/10 flex items-center justify-center shrink-0 group-hover:bg-strategy-conservative/20">
              <Send className="w-5 h-5 text-strategy-conservative" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-mezo-black">Send MUSD</div>
              <div className="text-[12px] text-mezo-grey">Transfer to any address</div>
            </div>
          </a>
          <a href="https://mezo.org/ecosystem" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-mezo-border/20 rounded-2xl border border-mezo-border hover:bg-[#FFF4E5] hover:border-[#D4940A]/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#D4940A]/10 flex items-center justify-center shrink-0 group-hover:bg-[#D4940A]/20">
              <ExternalLink className="w-5 h-5 text-[#D4940A]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-mezo-black">Mezo Ecosystem</div>
              <div className="text-[12px] text-mezo-grey">Spend MUSD in dApps</div>
            </div>
          </a>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-card p-6">
        <h3 className="text-[13px] font-bold text-mezo-grey uppercase tracking-widest mb-5">How MUSD Banking works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { step: '01', title: 'BTC as collateral', text: 'Locked at 180% CR — safe margin above the 150% liquidation floor.' },
            { step: '02', title: 'Mint MUSD at 1%', text: 'MezoLens opens a Mezo Borrow CDP. Fixed 1% APR, no variable rates.' },
            { step: '03', title: 'LP yield covers cost', text: 'MUSD goes to Mezo Swap LP. Fees earned exceed the 1% — net positive.' },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="text-[32px] font-[800] text-mezo-border">{item.step}</div>
              <div className="text-[14px] font-bold text-mezo-black">{item.title}</div>
              <div className="text-[13px] text-mezo-grey">{item.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AddCollateralModal
        open={addCollateralOpen}
        onClose={() => setAddCollateralOpen(false)}
        onConfirm={handleAddCollateral}
        loading={actionLoading}
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
