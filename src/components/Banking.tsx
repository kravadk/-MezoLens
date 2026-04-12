import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck, ShieldAlert, Shield, ExternalLink,
  Wallet, Heart, AlertTriangle, TrendingUp, ArrowRight,
  RefreshCw, ChevronDown, Info
} from 'lucide-react';
import { useStore } from '../store';
import { useUIStore } from '../store/uiStore';
import { useWalletStore } from '../store/walletStore';
import { usePassport } from '../hooks/usePassport';
import { useMusdCdp } from '../hooks/useMusdCdp';
import { useBtcPrice } from '../hooks/useBtcPrice';
import { usePositions } from '../hooks/usePositions';

function HealthBar({ ratio }: { ratio: number }) {
  // 150% = liquidation, 180% = safe target, 250%+ = very safe
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
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-mezo-grey font-bold">
        <span>150% (liquidation)</span>
        <span>180% (target)</span>
        <span>300%</span>
      </div>
    </div>
  );
}

function PassportCard({ status }: { status: ReturnType<typeof usePassport> }) {
  if (status === 'verified') {
    return (
      <div className="flex items-center gap-3 p-4 bg-strategy-conservative/10 rounded-2xl border border-strategy-conservative/20">
        <ShieldCheck className="w-8 h-8 text-strategy-conservative shrink-0" />
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
        <ShieldAlert className="w-8 h-8 text-[#D4940A] shrink-0" />
        <div>
          <div className="text-[14px] font-bold text-mezo-black">Mezo Passport Required</div>
          <div className="text-[12px] text-[#D4940A]">
            {status === 'unavailable' ? 'Passport contract deploying — check back soon' : 'Get your Passport to unlock full banking features'}
          </div>
        </div>
      </div>
      <a
        href="https://mezo.org/passport"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-4 py-2 bg-[#D4940A] text-white rounded-xl text-[12px] font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
      >
        Get Passport <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

export function Banking() {
  const { isWalletConnected, setCurrentPage } = useStore();
  const { openWalletModal } = useUIStore();
  const btcPrice = useBtcPrice();
  const passportStatus = usePassport();
  const { positions } = usePositions();
  const activePositions = positions.filter(p => p.active);
  const firstPositionId = activePositions[0]?.id ?? 0;
  const cdp = useMusdCdp(firstPositionId);

  const [selectedPosId, setSelectedPosId] = useState(firstPositionId);

  if (!isWalletConnected) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-mezo-lime/10 rounded-[32px] flex items-center justify-center border-2 border-dashed border-mezo-lime/30">
          <Wallet className="w-12 h-12 text-mezo-lime/60" />
        </div>
        <div className="max-w-md">
          <h2 className="text-[28px] font-extrabold text-mezo-black">Connect to access Bitcoin Banking</h2>
          <p className="text-[15px] text-mezo-grey mt-3">Borrow MUSD against your BTC at 1% fixed rate.</p>
        </div>
        <button onClick={openWalletModal} className="px-8 py-4 bg-mezo-lime text-mezo-sidebar rounded-2xl font-extrabold flex items-center gap-2 hover:opacity-90 transition-all">
          <Wallet className="w-5 h-5" /> Connect Wallet
        </button>
      </div>
    );
  }

  const musdBorrowed = cdp?.debt ?? 0;
  const musdInLp = cdp?.lpDeployed ?? 0;
  const yieldEarned = cdp?.totalYield ?? 0;
  const netYield = yieldEarned - musdBorrowed * 0.01; // yield - 1% borrow cost
  const collateralUsd = (cdp?.collateral ?? 0) * btcPrice;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Passport Status */}
      <PassportCard status={passportStatus} />

      {/* Pipeline Banner */}
      <div className="glass-card p-6">
        <h3 className="text-[13px] font-bold text-mezo-grey uppercase tracking-widest mb-4">MUSD Pipeline</h3>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0">
          {[
            { label: 'BTC Collateral', value: `${(cdp?.collateral ?? 0).toFixed(4)} BTC`, sub: `$${collateralUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: '#1A8C52' },
            { label: 'MUSD Borrowed', value: `${musdBorrowed.toLocaleString(undefined, { maximumFractionDigits: 0 })} MUSD`, sub: '1% fixed rate', color: '#5B6DEC' },
            { label: 'In LP Pool', value: `${musdInLp.toLocaleString(undefined, { maximumFractionDigits: 0 })} MUSD`, sub: 'earning fees', color: '#D4940A' },
            { label: 'Net Yield', value: `+${netYield.toFixed(2)} MUSD`, sub: 'after borrow cost', color: netYield >= 0 ? '#1A8C52' : '#FF6B6B' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <div className="flex-1 text-center min-w-0">
                <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-1">{item.label}</div>
                <div className="text-[18px] sm:text-[20px] font-extrabold" style={{ color: item.color }}>{item.value}</div>
                <div className="text-[11px] text-mezo-grey">{item.sub}</div>
              </div>
              {i < 3 && (
                <div className="hidden sm:flex items-center px-2 text-mezo-grey">
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
            <div className="p-2 bg-mezo-lime/10 rounded-xl">
              <Heart className="w-5 h-5 text-mezo-sidebar" />
            </div>
            <div>
              <h2 className="text-[18px] font-extrabold text-mezo-black">CDP Health</h2>
              <p className="text-[12px] text-mezo-grey">Position #{selectedPosId} · via MusdPipe</p>
            </div>
          </div>

          {cdp?.active ? (
            <div className="space-y-5">
              <HealthBar ratio={cdp.ratio} />

              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Collateral</div>
                  <div className="text-[20px] font-extrabold text-mezo-black">{cdp.collateral.toFixed(4)} BTC</div>
                  <div className="text-[12px] text-mezo-grey">${collateralUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-1">MUSD Debt</div>
                  <div className="text-[20px] font-extrabold text-strategy-balanced">{cdp.debt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div className="text-[12px] text-mezo-grey">1% annual cost</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-1">Liq. Price</div>
                  <div className="text-[20px] font-extrabold text-mezo-black">${cdp.liqPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div className="text-[12px] text-mezo-grey">BTC/USD</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-1">LP Yield</div>
                  <div className="text-[20px] font-extrabold text-strategy-conservative">+{cdp.totalYield.toFixed(2)}</div>
                  <div className="text-[12px] text-mezo-grey">MUSD harvested</div>
                </div>
              </div>

              {cdp.ratio < 165 && (
                <div className="flex items-center gap-3 p-4 bg-[#FF6B6B]/10 rounded-xl border border-[#FF6B6B]/20">
                  <AlertTriangle className="w-5 h-5 text-[#FF6B6B] shrink-0" />
                  <div>
                    <p className="text-[13px] font-bold text-[#FF6B6B]">Collateral ratio low — add BTC to avoid liquidation</p>
                    <p className="text-[11px] text-mezo-grey mt-0.5">Minimum safe ratio: 165% · Current: {cdp.ratio.toFixed(0)}%</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-4 py-3 bg-mezo-lime text-mezo-sidebar rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Harvest Yield
                </button>
                <button className="flex-1 px-4 py-3 bg-mezo-border/30 text-mezo-black rounded-xl text-[13px] font-bold hover:bg-mezo-border/50 transition-colors">
                  Close CDP
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-4">
              <Shield className="w-12 h-12 text-mezo-grey/30 mx-auto" />
              <p className="text-[15px] font-bold text-mezo-black">No active CDP</p>
              <p className="text-[13px] text-mezo-grey">Deposit BTC first, then enable MUSD yield to open a CDP</p>
              <button
                onClick={() => setCurrentPage('Deposit')}
                className="px-6 py-3 bg-mezo-lime text-mezo-sidebar rounded-xl text-[13px] font-bold hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
              >
                Deposit BTC <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* MUSD Yield Calculator */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-strategy-balanced/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-strategy-balanced" />
            </div>
            <div>
              <h2 className="text-[18px] font-extrabold text-mezo-black">Yield vs Borrow Cost</h2>
              <p className="text-[12px] text-mezo-grey">Why borrowing at 1% is a positive trade</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'MUSD deployed to LP', value: `${musdInLp.toLocaleString(undefined, { maximumFractionDigits: 0 })} MUSD`, color: '#5B6DEC' },
              { label: 'LP APR (Mezo Swap fees)', value: '~5–15%', color: '#1A8C52' },
              { label: 'Annual yield (estimated)', value: `+${(musdInLp * 0.08).toFixed(0)} MUSD`, color: '#1A8C52' },
              { label: 'Borrow cost (1% fixed)', value: `-${(musdBorrowed * 0.01).toFixed(0)} MUSD`, color: '#FF6B6B' },
              { label: 'Net annual gain', value: `+${(musdInLp * 0.08 - musdBorrowed * 0.01).toFixed(0)} MUSD`, color: '#1A8C52', bold: true },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between items-center ${i === 4 ? 'pt-4 border-t border-mezo-border' : ''}`}>
                <span className={`text-[13px] ${row.bold ? 'font-extrabold text-mezo-black' : 'text-mezo-grey'}`}>{row.label}</span>
                <span className={`text-[14px] font-extrabold`} style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-mezo-lime/10 rounded-xl border border-mezo-lime/20">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-mezo-sidebar shrink-0 mt-0.5" />
              <p className="text-[12px] text-mezo-sidebar font-medium">
                Borrow cost is fixed at 1% APR regardless of market conditions. LP yield fluctuates with Mezo Swap activity — historically 5–15%.
              </p>
            </div>
          </div>

          <a
            href="https://explorer.test.mezo.org/address/0x82251096716EcE27260F2D4f67b2131B95D9bA33"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[12px] text-mezo-grey hover:text-mezo-black transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            MusdPipe contract on Explorer
          </a>
        </div>
      </div>

      {/* Protocol info */}
      <div className="glass-card p-6">
        <h3 className="text-[13px] font-bold text-mezo-grey uppercase tracking-widest mb-4">How MUSD Banking works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { step: '01', title: 'BTC as collateral', text: 'Your BTC is locked at 180% collateral ratio — safe margin above 150% liquidation threshold.' },
            { step: '02', title: 'Mint MUSD at 1%', text: 'MezoLens opens a Mezo Borrow CDP and mints MUSD. Fixed 1% annual rate, no oracles, no variable risk.' },
            { step: '03', title: 'LP yield covers cost', text: 'MUSD enters Mezo Swap LP pools. Fees earned flow back and exceed the 1% borrow cost — net positive.' },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="text-[32px] font-[800] text-mezo-border">{item.step}</div>
              <div className="text-[14px] font-bold text-mezo-black">{item.title}</div>
              <div className="text-[13px] text-mezo-grey">{item.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
