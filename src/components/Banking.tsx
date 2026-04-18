import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, ShieldAlert, ExternalLink,
  Wallet, Heart, AlertTriangle, TrendingUp, ArrowRight,
  RefreshCw, Info, Send, ArrowLeftRight, Bitcoin, X,
  Plus, Minus, CheckCircle, Layers, Droplets,
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useWalletStore } from '../store/walletStore';
import { usePassport } from '../hooks/usePassport';
import { useTroveData } from '../hooks/useTroveData';
import { useBorrowerOps } from '../hooks/useBorrowerOps';
import { useMusdBalance } from '../hooks/useMusdBalance';
import { useBtcPrice } from '../hooks/useBtcPrice';
import { useEstimatedAPR } from '../hooks/useEstimatedAPR';
import { TxStatusModal } from './modals/TxStatusModal';

function HealthBar({ icr }: { icr: number }) {
  // Map 110% → 0%, 300% → 100%
  const pct = Math.min(100, Math.max(0, ((icr - 110) / 190) * 100));
  const color = icr < 120 ? '#FF6B6B' : icr < 150 ? '#FFD93D' : '#1A8C52';
  const label = icr < 120 ? 'Danger' : icr < 150 ? 'Caution' : 'Healthy';
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Trove Health</span>
        <span className="text-[13px] font-bold" style={{ color }}>{label} — {icr.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-mezo-border rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
          className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-mezo-grey font-bold">
        <span>110% liq.</span><span>150% safe</span><span>300%</span>
      </div>
    </div>
  );
}

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
              <p className="text-[12px] text-mezo-grey">Sends BTC to BorrowerOperations — increases your collateral ratio.</p>
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

function RepayModal({ open, onClose, onConfirm, loading, maxRepay, musdBalance }: {
  open: boolean; onClose: () => void; onConfirm: (amount: number) => void;
  loading: boolean; maxRepay: number; musdBalance: number;
}) {
  const [amount, setAmount] = useState('');
  const max = Math.min(maxRepay, musdBalance);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[20px] p-8 w-full max-w-sm shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-extrabold text-mezo-black">Repay MUSD</h3>
              <button onClick={onClose}><X className="w-5 h-5 text-mezo-grey" /></button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest">MUSD Amount</label>
                <button onClick={() => setAmount(max.toFixed(0))} className="text-[11px] text-strategy-balanced font-bold">Max {max.toFixed(0)}</button>
              </div>
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full px-4 py-4 bg-mezo-border/30 border-2 border-transparent rounded-2xl text-[18px] font-bold focus:border-mezo-sidebar focus:bg-white outline-none"
              />
              <p className="text-[12px] text-mezo-grey">
                Wallet: {musdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} MUSD · min debt 1,800 MUSD must remain (use Close to fully repay)
              </p>
            </div>
            <button
              onClick={() => onConfirm(parseFloat(amount) || 0)}
              disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > max}
              className="w-full py-4 bg-strategy-balanced text-white rounded-2xl text-[14px] font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
              Repay {amount || '0'} MUSD
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function OpenTroveForm({ btcPrice, onOpen, loading }: {
  btcPrice: number;
  onOpen: (collBtc: number, debtMusd: number) => void;
  loading: boolean;
}) {
  const [collateral, setCollateral] = useState('0.05');
  const [debtMusd, setDebtMusd] = useState('2000');

  const coll = parseFloat(collateral) || 0;
  const debt = parseFloat(debtMusd) || 0;
  const collValueUsd = coll * btcPrice;
  const totalDebt = debt + 200; // + gas compensation
  const icr = totalDebt > 0 ? (collValueUsd / totalDebt) * 100 : 0;
  const liqPrice = coll > 0 ? (totalDebt * 1.1) / coll : 0;

  const icrColor = icr < 120 ? '#FF6B6B' : icr < 150 ? '#FFD93D' : '#1A8C52';
  const debtError = debt > 0 && debt < 1800;
  const icrError = icr > 0 && icr < 110;
  const canOpen = coll > 0 && debt >= 1800 && icr >= 110 && !loading;

  return (
    <div className="glass-card p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-mezo-lime/10 rounded-xl"><Bitcoin className="w-5 h-5 text-mezo-sidebar" /></div>
        <div>
          <h2 className="text-[18px] font-extrabold text-mezo-black">Open Bitcoin Trove</h2>
          <p className="text-[12px] text-mezo-grey">Mezo BorrowerOperations · 1% fixed rate · MCR 110%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest">BTC Collateral</label>
          <div className="relative">
            <Bitcoin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mezo-grey" />
            <input type="number" value={collateral} onChange={e => setCollateral(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-mezo-border/30 border-2 border-transparent rounded-2xl text-[18px] font-bold focus:border-mezo-sidebar outline-none"
              placeholder="0.05" step="0.001" min="0" />
          </div>
          <p className="text-[11px] text-mezo-grey">≈ ${collValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</p>
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest">MUSD to Borrow</label>
          <input type="number" value={debtMusd} onChange={e => setDebtMusd(e.target.value)}
            className={`w-full px-4 py-3.5 bg-mezo-border/30 border-2 rounded-2xl text-[18px] font-bold focus:bg-white outline-none ${debtError ? 'border-[#FF6B6B]' : 'border-transparent focus:border-mezo-sidebar'}`}
            placeholder="2000" step="100" min="1800" />
          {debtError && <p className="text-[11px] text-[#FF6B6B] font-bold">Min 1,800 MUSD (+ 200 gas comp)</p>}
          {!debtError && <p className="text-[11px] text-mezo-grey">Min 1,800 MUSD · +200 MUSD gas comp auto-added</p>}
        </div>
      </div>

      {/* ICR preview */}
      <div className="p-4 bg-mezo-border/10 rounded-2xl space-y-3">
        <div className="flex justify-between">
          <span className="text-[13px] text-mezo-grey">Collateral Ratio</span>
          <span className="text-[14px] font-extrabold" style={{ color: icrColor }}>{icr > 0 ? `${icr.toFixed(0)}%` : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[13px] text-mezo-grey">Liquidation Price</span>
          <span className="text-[13px] font-bold text-mezo-black">{liqPrice > 0 ? `$${liqPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[13px] text-mezo-grey">Total debt (incl. gas comp)</span>
          <span className="text-[13px] font-bold text-mezo-black">{totalDebt > 200 ? `${totalDebt.toLocaleString()} MUSD` : '—'}</span>
        </div>
        {icrError && (
          <div className="flex items-center gap-2 text-[#FF6B6B]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-[12px] font-bold">ICR below 110% — add more collateral or reduce debt</span>
          </div>
        )}
      </div>

      <div className="p-3 bg-mezo-lime/10 rounded-xl border border-mezo-lime/20 flex items-start gap-2">
        <Info className="w-4 h-4 text-mezo-sidebar shrink-0 mt-0.5" />
        <p className="text-[11px] text-mezo-sidebar">
          Calls <code className="font-mono">BorrowerOperations.openTrove()</code> on Mezo testnet.
          MUSD is minted to your wallet. Close anytime to get BTC back.
        </p>
      </div>

      <button
        onClick={() => onOpen(coll, debt)}
        disabled={!canOpen}
        className="w-full py-4 bg-mezo-lime text-mezo-sidebar rounded-2xl text-[15px] font-extrabold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
      >
        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
        Open Bitcoin Bank Position
      </button>
    </div>
  );
}

export function Banking() {
  const { openWalletModal, showToast } = useUIStore();
  const { isConnected, fullAddress } = useWalletStore();

  const btcPrice = useBtcPrice();
  const aprs = useEstimatedAPR();
  const passportStatus = usePassport();
  const trove = useTroveData(fullAddress);
  const musdBalance = useMusdBalance(fullAddress);
  const borrowerOps = useBorrowerOps();

  const [addCollateralOpen, setAddCollateralOpen] = useState(false);
  const [repayOpen, setRepayOpen] = useState(false);
  const [txModal, setTxModal] = useState<{
    open: boolean; status: 'pending' | 'success' | 'error'; hash?: string; title: string;
  }>({ open: false, status: 'pending', title: '' });

  // ── Interactive MUSD calculator ──
  const [calcBtc, setCalcBtc] = useState('0.1');
  const [musdMode, setMusdMode] = useState<'lp' | 'stability'>('lp');
  const calcBtcNum = parseFloat(calcBtc) || 0;
  const calcMusd = Math.floor(calcBtcNum * btcPrice / 1.8);
  // LP mode: balanced APR; Stability Pool mode: liquidation rewards ~3-8% est.
  const lpApr = musdMode === 'lp' ? aprs.balanced / 100 : 0.05;
  const calcYield = calcMusd * lpApr;
  const calcCost = calcMusd * 0.01;
  const calcNet = calcYield - calcCost;

  const handleOpenTrove = async (collBtc: number, debtMusd: number) => {
    setTxModal({ open: true, status: 'pending', title: 'Opening Trove on Mezo Protocol...' });
    try {
      const hash = await borrowerOps.openTrove(collBtc, debtMusd);
      setTxModal({ open: true, status: 'success', hash, title: 'Bitcoin Bank Position Open!' });
      showToast(`Trove opened: ${debtMusd.toLocaleString()} MUSD minted`, 'success');
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || 'Transaction failed';
      setTxModal({ open: true, status: 'error', title: `Open Failed: ${msg}` });
    }
  };

  // Amount user needs in wallet to close: net debt = principal + accrued interest
  const closeRequiredMusd = (trove?.principal ?? 0) + (trove?.interest ?? 0);

  const handleClose = async () => {
    if (closeRequiredMusd > musdBalance) {
      showToast(`Not enough MUSD — need ${closeRequiredMusd.toFixed(0)} but have ${musdBalance.toFixed(0)}`, 'error');
      return;
    }
    setTxModal({ open: true, status: 'pending', title: 'Closing Trove...' });
    try {
      const hash = await borrowerOps.closeTrove();
      setTxModal({ open: true, status: 'success', hash, title: 'Trove Closed — BTC Returned!' });
      showToast('Trove closed, BTC returned to wallet', 'success');
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || 'Transaction failed';
      setTxModal({ open: true, status: 'error', title: `Close Failed: ${msg}` });
    }
  };

  const handleAddCollateral = async (btc: number) => {
    if (!btc || btc <= 0) return;
    setAddCollateralOpen(false);
    setTxModal({ open: true, status: 'pending', title: 'Adding collateral...' });
    try {
      const hash = await borrowerOps.addColl(btc);
      setTxModal({ open: true, status: 'success', hash, title: 'Collateral Added!' });
      showToast(`+${btc} BTC added to trove`, 'success');
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || 'Transaction failed';
      setTxModal({ open: true, status: 'error', title: `Add Collateral Failed: ${msg}` });
    }
  };

  const handleRepay = async (amount: number) => {
    if (!amount || amount <= 0) return;
    setRepayOpen(false);
    setTxModal({ open: true, status: 'pending', title: 'Repaying MUSD...' });
    try {
      const hash = await borrowerOps.repayMUSD(amount);
      setTxModal({ open: true, status: 'success', hash, title: 'MUSD Repaid!' });
      showToast(`${amount.toLocaleString()} MUSD repaid`, 'success');
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || 'Transaction failed';
      setTxModal({ open: true, status: 'error', title: `Repay Failed: ${msg}` });
    }
  };

  if (!isConnected) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-mezo-lime/10 rounded-[32px] flex items-center justify-center border-2 border-dashed border-mezo-lime/30">
          <Wallet className="w-12 h-12 text-mezo-lime/60" />
        </div>
        <div className="max-w-md">
          <h2 className="text-[28px] font-extrabold text-mezo-black">Bitcoin Banking on Mezo</h2>
          <p className="text-[15px] text-mezo-grey mt-3">
            Lock BTC as collateral. Borrow MUSD at 1% fixed rate via Mezo Protocol. Close anytime.
          </p>
        </div>
        <button onClick={openWalletModal}
          className="px-8 py-4 bg-mezo-lime text-mezo-sidebar rounded-2xl font-extrabold flex items-center gap-2 hover:opacity-90">
          <Wallet className="w-5 h-5" /> Connect Wallet
        </button>
      </div>
    );
  }

  const collValueUsd = (trove?.coll ?? 0) * btcPrice;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div>
          <h1 className="text-[24px] font-extrabold text-mezo-black">Bitcoin Banking</h1>
          <p className="text-[13px] text-mezo-grey">Self-service · 1% fixed borrow rate · close anytime · Mezo Protocol</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Bank on Bitcoin', 'MUSD', 'Mezo Passport'].map((tag) => (
            <span key={tag} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E2F0E5] text-[#1A8C52] uppercase tracking-wider">
              ✓ {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Real protocol badge */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-strategy-conservative/10 border border-strategy-conservative/20 rounded-xl text-[12px] font-bold text-strategy-conservative">
        <div className="w-2 h-2 rounded-full bg-strategy-conservative animate-pulse shrink-0" />
        Live on Mezo Protocol · BorrowerOperations · TroveManager · real MUSD minted on Mezo Testnet
        <a href="https://explorer.test.mezo.org/address/0xCdF7028ceAB81fA0C6971208e83fa7872994beE5"
          target="_blank" rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 hover:underline shrink-0">
          Explorer <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <PassportBanner status={passportStatus} />

      {/* MUSD wallet balance pill */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#E5E8FD] rounded-xl border border-strategy-balanced/20">
          <span className="text-[12px] font-bold text-mezo-grey uppercase tracking-widest">Wallet MUSD</span>
          <span className="text-[15px] font-extrabold text-strategy-balanced">
            {musdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} MUSD
          </span>
        </div>
        <a href={`https://explorer.test.mezo.org/address/0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`}
          target="_blank" rel="noopener noreferrer"
          className="text-[11px] text-mezo-grey hover:text-mezo-black flex items-center gap-1 transition-colors">
          MUSD Token <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Pipeline overview (when active) */}
      {trove?.active && (
        <div className="glass-card p-6">
          <h3 className="text-[13px] font-bold text-mezo-grey uppercase tracking-widest mb-4">Active Trove Pipeline</h3>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0">
            {[
              { label: 'BTC Collateral', value: `${trove.coll.toFixed(5)} BTC`, sub: `$${collValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: '#1A8C52' },
              { label: 'Total Debt', value: `${trove.debt.toLocaleString(undefined, { maximumFractionDigits: 0 })} MUSD`, sub: `${(trove.interestRateBps / 100).toFixed(1)}% annual rate`, color: '#5B6DEC' },
              { label: 'Accrued Interest', value: `${trove.interest.toFixed(2)} MUSD`, sub: 'live on-chain', color: '#D4940A' },
              { label: 'Collateral Ratio', value: `${trove.icr.toFixed(0)}%`, sub: 'MCR = 110%', color: trove.icr < 150 ? '#FFD93D' : '#1A8C52' },
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Trove management or Open Trove form */}
        {trove?.active ? (
          <div className="glass-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-mezo-lime/10 rounded-xl"><Heart className="w-5 h-5 text-mezo-sidebar" /></div>
              <div>
                <h2 className="text-[18px] font-extrabold text-mezo-black">Trove Health</h2>
                <p className="text-[12px] text-mezo-grey">
                  BorrowerOperations ·{' '}
                  <a href={`https://explorer.test.mezo.org/address/${fullAddress}`}
                    target="_blank" rel="noopener noreferrer"
                    className="hover:underline text-strategy-balanced">{fullAddress?.slice(0, 8)}…</a>
                </p>
              </div>
            </div>

            <HealthBar icr={trove.icr} />

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Collateral', val: `${trove.coll.toFixed(5)} BTC`, sub: `$${collValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                { label: 'MUSD Debt', val: `${trove.debt.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `${(trove.interestRateBps / 100).toFixed(1)}% fixed rate`, accent: true },
                { label: 'Liq. Price', val: `$${trove.liqPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: 'BTC/USD' },
                { label: 'Interest Owed', val: `${trove.interest.toFixed(4)} MUSD`, sub: 'accrued on-chain', green: true },
              ].map((s, i) => (
                <div key={i} className="glass-card p-4">
                  <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-1">{s.label}</div>
                  <div className={`text-[18px] font-extrabold ${s.accent ? 'text-strategy-balanced' : s.green ? 'text-strategy-conservative' : 'text-mezo-black'}`}>{s.val}</div>
                  <div className="text-[11px] text-mezo-grey">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Low ratio alert */}
            {trove.icr < 130 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-between gap-3 p-4 bg-[#FF6B6B]/10 rounded-xl border border-[#FF6B6B]/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#FF6B6B] shrink-0" />
                  <div>
                    <p className="text-[13px] font-bold text-[#FF6B6B]">Collateral ratio low!</p>
                    <p className="text-[11px] text-mezo-grey">{trove.icr.toFixed(0)}% · liquidation at 110%</p>
                  </div>
                </div>
                <button onClick={() => setAddCollateralOpen(true)}
                  className="shrink-0 px-3 py-2 bg-[#FF6B6B] text-white rounded-xl text-[12px] font-bold hover:opacity-90 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Top Up
                </button>
              </motion.div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button onClick={() => setRepayOpen(true)}
                className="px-3 py-3 bg-mezo-lime text-mezo-sidebar rounded-xl text-[12px] font-bold hover:opacity-90 flex items-center justify-center gap-1.5">
                <Minus className="w-3.5 h-3.5" /> Repay
              </button>
              <button onClick={() => setAddCollateralOpen(true)}
                className="px-3 py-3 bg-mezo-border/30 text-mezo-black rounded-xl text-[12px] font-bold hover:bg-mezo-border/50 flex items-center justify-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add BTC
              </button>
              <button onClick={handleClose} disabled={borrowerOps.isLoading || closeRequiredMusd > musdBalance}
                className="px-3 py-3 bg-mezo-border/30 text-mezo-black rounded-xl text-[12px] font-bold hover:bg-red-50 hover:text-red-500 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {borrowerOps.isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Close
              </button>
            </div>

            <div className="text-[11px] text-mezo-grey flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Close requires ≈{closeRequiredMusd.toFixed(0)} MUSD in wallet — current: {musdBalance.toFixed(0)} MUSD
              {closeRequiredMusd > musdBalance && <span className="text-[#FF6B6B] font-bold ml-1">⚠ insufficient</span>}
            </div>
          </div>
        ) : (
          <OpenTroveForm
            btcPrice={btcPrice}
            onOpen={handleOpenTrove}
            loading={borrowerOps.isLoading}
          />
        )}

        {/* Right: MUSD Yield Calculator */}
        <div className="glass-card p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-strategy-balanced/10 rounded-xl"><TrendingUp className="w-5 h-5 text-strategy-balanced" /></div>
            <div>
              <h2 className="text-[18px] font-extrabold text-mezo-black">MUSD Yield Calculator</h2>
              <p className="text-[12px] text-mezo-grey">Enter BTC → see your banking returns</p>
            </div>
          </div>

          {/* MUSD earn mode toggle */}
          <div className="flex gap-2 p-1 bg-mezo-border/30 rounded-2xl">
            <button
              onClick={() => setMusdMode('lp')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all ${musdMode === 'lp' ? 'bg-white shadow-sm text-mezo-black' : 'text-mezo-grey hover:text-mezo-black'}`}>
              <Layers className="w-3.5 h-3.5" /> LP Pool
            </button>
            <button
              onClick={() => setMusdMode('stability')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all ${musdMode === 'stability' ? 'bg-white shadow-sm text-mezo-black' : 'text-mezo-grey hover:text-mezo-black'}`}>
              <Droplets className="w-3.5 h-3.5" /> Stability Pool
            </button>
          </div>
          {musdMode === 'stability' && (
            <div className="flex items-start gap-2 p-3 bg-[#FFF4E5] rounded-xl border border-[#D4940A]/20">
              <Info className="w-4 h-4 text-[#D4940A] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#D4940A]">
                Stability Pool earns liquidation bonuses (~3–8% est.) when troves are liquidated. Mainnet deployment planned. Testnet shows projected yield — no live SP contract yet.
              </p>
            </div>
          )}

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
              { label: musdMode === 'lp' ? `LP yield @ ${aprs.balanced.toFixed(1)}% APR` : 'Stability Pool est. 5% APR', val: `+$${calcYield.toFixed(0)}/yr`, color: '#1A8C52' },
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
            <p className="text-[11px] text-mezo-sidebar">
              1% borrow rate is fixed via Mezo Protocol. LP yield (5–15%) is projected — Mezo Swap deploys to mainnet post-hackathon.
            </p>
          </div>

          <a href="https://explorer.test.mezo.org/address/0xCdF7028ceAB81fA0C6971208e83fa7872994beE5"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-mezo-grey hover:text-mezo-black transition-colors">
            <ExternalLink className="w-3 h-3" /> BorrowerOperations on Explorer
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
            { step: '01', title: 'Lock BTC as collateral', text: 'Calls BorrowerOperations.openTrove() on Mezo testnet. Your BTC stays on-chain — close anytime to get it back.' },
            { step: '02', title: 'Receive MUSD at 1% fixed', text: 'The Mezo Protocol mints MUSD directly to your wallet. Fixed 1% annual rate — no variable surprises, ever.' },
            { step: '03', title: 'LP yield covers the cost', text: 'Deploy MUSD to Mezo Swap LP pools (5–15% APR). Net positive after the 1% borrow cost — auto-compounded via EarnVault.' },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="text-[32px] font-[800] text-mezo-border">{item.step}</div>
              <div className="text-[14px] font-bold text-mezo-black">{item.title}</div>
              <div className="text-[13px] text-mezo-grey">{item.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contract addresses */}
      <div className="glass-card p-6">
        <h3 className="text-[13px] font-bold text-mezo-grey uppercase tracking-widest mb-4">Mezo Protocol Contracts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: 'BorrowerOperations', addr: '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5' },
            { name: 'TroveManager', addr: '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0' },
            { name: 'MUSD Token', addr: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503' },
            { name: 'PriceFeed', addr: '0x86bCF0841622a5dAC14A313a15f96A95421b9366' },
          ].map((c) => (
            <a key={c.name}
              href={`https://explorer.test.mezo.org/address/${c.addr}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-mezo-border/20 rounded-xl hover:bg-mezo-border/40 transition-colors group">
              <div className="w-2 h-2 rounded-full bg-strategy-conservative shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-mezo-black">{c.name}</div>
                <div className="text-[10px] font-mono text-mezo-grey truncate">{c.addr}</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-mezo-grey group-hover:text-mezo-black shrink-0 transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AddCollateralModal
        open={addCollateralOpen}
        onClose={() => setAddCollateralOpen(false)}
        onConfirm={handleAddCollateral}
        loading={borrowerOps.isLoading}
      />
      <RepayModal
        open={repayOpen}
        onClose={() => setRepayOpen(false)}
        onConfirm={handleRepay}
        loading={borrowerOps.isLoading}
        maxRepay={Math.max(0, (trove?.principal ?? 0) - 1800)}
        musdBalance={musdBalance}
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
