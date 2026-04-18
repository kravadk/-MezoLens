import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye, Plus, Trash2, RefreshCw, AlertTriangle, ExternalLink,
  ShieldCheck, CheckCircle, XCircle, Edit2, X,
} from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useUIStore } from '../store/uiStore';
import { cn } from '../lib/utils';

const RISK_CONFIG = {
  safe:    { label: 'Safe',    color: '#1A8C52', bg: 'bg-strategy-conservative/10', border: 'border-strategy-conservative/20' },
  caution: { label: 'Caution', color: '#D4940A', bg: 'bg-[#FFF4E5]',                border: 'border-[#D4940A]/20' },
  danger:  { label: 'Danger',  color: '#FF6B6B', bg: 'bg-[#FF6B6B]/10',             border: 'border-[#FF6B6B]/20' },
  none:    { label: 'No Trove', color: '#AAA',   bg: 'bg-mezo-border/20',           border: 'border-mezo-border' },
};

export function Watchlist() {
  const { setCurrentPage } = useUIStore();
  const { addresses, troves, loading, addAddress, removeAddress, updateLabel, refresh } = useWatchlist();
  const [input, setInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editLabelVal, setEditLabelVal] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(150);

  const handleAdd = () => {
    const addr = input.trim();
    if (!addr || addr.length < 10) return;
    addAddress(addr, labelInput.trim() || addr.slice(0, 8) + '…');
    setInput('');
    setLabelInput('');
  };

  const dangerCount = troves.filter(t => t.riskLevel === 'danger').length;
  const cautionCount = troves.filter(t => t.riskLevel === 'caution').length;
  const activeCount = troves.filter(t => t.status === 'active').length;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-mezo-border/20 rounded-xl text-[12px] font-bold text-mezo-black">
          <Eye className="w-4 h-4" /> {addresses.length} watched · {activeCount} active troves
        </div>
        {dangerCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FF6B6B]/10 rounded-xl text-[12px] font-bold text-[#FF6B6B] border border-[#FF6B6B]/20 animate-pulse">
            <AlertTriangle className="w-4 h-4" /> {dangerCount} trove{dangerCount > 1 ? 's' : ''} at risk (ICR &lt; 120%)
          </div>
        )}
        {cautionCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FFF4E5] rounded-xl text-[12px] font-bold text-[#D4940A] border border-[#D4940A]/20">
            <AlertTriangle className="w-4 h-4" /> {cautionCount} in caution zone (ICR 120–150%)
          </div>
        )}
      </div>

      {/* Add address input */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-[16px] font-extrabold text-mezo-black">Add Wallet to Watch</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="0x… wallet address"
            className="flex-1 px-4 py-3 bg-mezo-border/30 border-2 border-transparent rounded-xl text-[14px] font-mono focus:border-mezo-sidebar focus:bg-white outline-none"
          />
          <input
            type="text" value={labelInput} onChange={e => setLabelInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Label (optional)"
            className="w-40 px-4 py-3 bg-mezo-border/30 border-2 border-transparent rounded-xl text-[14px] focus:border-mezo-sidebar focus:bg-white outline-none"
          />
          <button onClick={handleAdd}
            className="px-6 py-3 bg-mezo-lime text-mezo-sidebar rounded-xl font-bold text-[13px] hover:opacity-90 flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[12px] text-mezo-grey">ICR alert threshold:</span>
          <div className="flex gap-2">
            {[120, 130, 150, 175].map(t => (
              <button key={t} onClick={() => setAlertThreshold(t)}
                className={cn('px-3 py-1 rounded-full text-[11px] font-bold transition-all',
                  alertThreshold === t ? 'bg-mezo-sidebar text-white' : 'bg-mezo-border/30 text-mezo-grey hover:bg-mezo-border/50'
                )}>
                {t}%
              </button>
            ))}
          </div>
          <span className="text-[11px] text-mezo-grey">· Alert when ICR drops below {alertThreshold}%</span>
        </div>
      </div>

      {/* Trove table */}
      {addresses.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center gap-4">
          <Eye className="w-12 h-12 text-mezo-grey/30" />
          <h3 className="text-[18px] font-bold text-mezo-black">No wallets watched yet</h3>
          <p className="text-[13px] text-mezo-grey max-w-sm">
            Add any Mezo wallet address above to monitor its trove health, ICR, and MUSD balance in real time.
          </p>
          <p className="text-[12px] text-mezo-grey">
            Use this for your own multiple wallets, family/DAO treasuries, or any position you want to keep an eye on.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-mezo-border">
            <h2 className="text-[16px] font-bold text-mezo-black">Watched Troves</h2>
            <button onClick={refresh}
              className={cn('flex items-center gap-2 px-4 py-2 bg-mezo-border/30 rounded-xl text-[12px] font-bold text-mezo-grey hover:bg-mezo-border/50 transition-all', loading && 'opacity-50 pointer-events-none')}>
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-mezo-border">
                  {['Address', 'Status', 'Collateral', 'Debt', 'Interest', 'ICR', 'Liq. Price', 'MUSD Wallet', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-mezo-grey uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-mezo-border/50">
                <AnimatePresence>
                  {troves.map((trove) => {
                    const risk = RISK_CONFIG[trove.riskLevel];
                    const isEditing = editingLabel === trove.address;
                    const belowThreshold = trove.status === 'active' && trove.icr < alertThreshold;
                    return (
                      <motion.tr key={trove.address}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={cn('group transition-colors hover:bg-mezo-border/10', belowThreshold && 'bg-[#FF6B6B]/5')}>
                        {/* Address + label */}
                        <td className="px-4 py-4 min-w-[180px]">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus value={editLabelVal} onChange={e => setEditLabelVal(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { updateLabel(trove.address, editLabelVal); setEditingLabel(null); } if (e.key === 'Escape') setEditingLabel(null); }}
                                className="w-24 px-2 py-1 border border-mezo-sidebar rounded-lg text-[12px] font-bold outline-none"
                              />
                              <button onClick={() => { updateLabel(trove.address, editLabelVal); setEditingLabel(null); }}>
                                <CheckCircle className="w-4 h-4 text-strategy-conservative" />
                              </button>
                              <button onClick={() => setEditingLabel(null)}>
                                <X className="w-4 h-4 text-mezo-grey" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[13px] font-bold text-mezo-black">{trove.label}</span>
                                  <button onClick={() => { setEditingLabel(trove.address); setEditLabelVal(trove.label); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit2 className="w-3 h-3 text-mezo-grey" />
                                  </button>
                                </div>
                                <a href={`https://explorer.test.mezo.org/address/${trove.address}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-[11px] font-mono text-mezo-grey hover:text-strategy-balanced flex items-center gap-1">
                                  {trove.address.slice(0, 8)}…{trove.address.slice(-4)}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {trove.status === 'loading' ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-mezo-grey" />
                          ) : trove.status === 'active' ? (
                            <span className={cn('flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full w-fit', risk.bg, risk.border, 'border')}>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: risk.color }} />
                              <span style={{ color: risk.color }}>{risk.label}</span>
                            </span>
                          ) : trove.status === 'error' ? (
                            <span className="text-[11px] font-bold text-[#FF6B6B] flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Error
                            </span>
                          ) : (
                            <span className="text-[11px] text-mezo-grey">No trove</span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-[13px] font-bold text-mezo-black whitespace-nowrap">
                          {trove.status === 'active' ? `${trove.coll.toFixed(5)} BTC` : '—'}
                        </td>
                        <td className="px-4 py-4 text-[13px] font-bold text-strategy-balanced whitespace-nowrap">
                          {trove.status === 'active' ? `${trove.principal.toLocaleString(undefined, { maximumFractionDigits: 0 })} MUSD` : '—'}
                        </td>
                        <td className="px-4 py-4 text-[12px] text-mezo-grey whitespace-nowrap">
                          {trove.status === 'active' ? `${trove.interest.toFixed(4)} MUSD` : '—'}
                        </td>

                        {/* ICR */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {trove.status === 'active' ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-extrabold" style={{ color: risk.color }}>
                                {trove.icr.toFixed(0)}%
                              </span>
                              {belowThreshold && <AlertTriangle className="w-3.5 h-3.5 text-[#FF6B6B]" />}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-4 text-[12px] text-mezo-grey whitespace-nowrap">
                          {trove.status === 'active' ? `$${trove.liqPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                        </td>
                        <td className="px-4 py-4 text-[12px] text-mezo-grey whitespace-nowrap">
                          {trove.status === 'active' ? `${trove.musdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} MUSD` : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <button onClick={() => removeAddress(trove.address)}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#FF6B6B]/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5 text-[#FF6B6B]" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Aggregate row */}
          {activeCount > 1 && (
            <div className="p-4 border-t border-mezo-border bg-mezo-border/5 grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Total Collateral', val: `${troves.filter(t => t.status === 'active').reduce((s, t) => s + t.coll, 0).toFixed(5)} BTC` },
                { label: 'Total MUSD Debt', val: `${troves.filter(t => t.status === 'active').reduce((s, t) => s + t.principal, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} MUSD` },
                { label: 'Avg ICR', val: `${(troves.filter(t => t.status === 'active').reduce((s, t) => s + t.icr, 0) / activeCount).toFixed(0)}%` },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-[10px] font-bold text-mezo-grey uppercase tracking-widest mb-1">{s.label}</div>
                  <div className="text-[16px] font-extrabold text-mezo-black">{s.val}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alerting instructions */}
      <div className="glass-card p-6 space-y-3">
        <h3 className="text-[14px] font-bold text-mezo-black flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#D4940A]" /> Automated Alerts
        </h3>
        <p className="text-[13px] text-mezo-grey">
          For automated webhook/email alerts when ICR drops below a threshold, run the keeper-alerts CLI:
        </p>
        <div className="bg-mezo-sidebar rounded-xl p-4 font-mono text-[12px] text-mezo-lime space-y-1">
          <div># Add addresses to watch</div>
          <div>WATCH=0xAddr1,0xAddr2 THRESHOLD=150 node keeper-alerts.mjs</div>
          <div className="mt-2"># With Discord webhook</div>
          <div>DISCORD_WEBHOOK=https://discord.com/api/webhooks/... node keeper-alerts.mjs</div>
        </div>
        <p className="text-[11px] text-mezo-grey">keeper-alerts.mjs polls every 5 minutes and sends alerts when ICR drops below threshold.</p>
      </div>
    </div>
  );
}
