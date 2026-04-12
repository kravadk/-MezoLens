import React from 'react';
import {
  LayoutDashboard,
  ArrowDownToLine,
  Calculator,
  BarChart3,
  ClipboardList,
  Building2,
  Eye,
  Wallet,
  LogOut
} from 'lucide-react';
import { useStore } from '../store';
import { useUIStore, type Page } from '../store/uiStore';
import { cn } from '../lib/utils';
import { useEpochCountdown } from '../hooks/useCountdown';

const navItems: { label: string; icon: React.ElementType; page: Page }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { label: 'Deposit', icon: ArrowDownToLine, page: 'Deposit' },
  { label: 'Calculator', icon: Calculator, page: 'Calculator' },
  { label: 'Transparency', icon: BarChart3, page: 'Transparency' },
  { label: 'My Positions', icon: ClipboardList, page: 'My Positions' },
  { label: 'Vault Stats', icon: Building2, page: 'Vault Stats' },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, isWalletConnected, walletAddress, connectWallet, disconnectWallet } = useStore();
  const { openWalletModal } = useUIStore();
  const epochTimer = useEpochCountdown(Math.floor(Date.now() / 1000));

  return (
    <div className="w-[220px] bg-mezo-sidebar h-screen flex flex-col text-white fixed left-0 top-0 bottom-0 z-50 border-r border-mezo-black">
      <button onClick={() => setCurrentPage('Landing')} className="flex items-center gap-3 p-8 mb-4 hover:opacity-80 transition-opacity">
        <img src="/logo.png" alt="MezoLens" className="w-9 h-9 rounded-lg" />
        <span className="text-xl font-extrabold tracking-tight">MezoLens</span>
      </button>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 group",
                isActive
                  ? "sidebar-item-active"
                  : "text-mezo-grey hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-mezo-sidebar" : "text-mezo-grey group-hover:text-white"
              )} />
              <span className="text-[14px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 space-y-4">
        <div className="bg-white/5 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 bg-mezo-lime rounded-full animate-pulse" />
            <span className="text-[12px] text-mezo-lime font-bold">Mezo Testnet</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">Epoch 42</span>
            <span className="text-[11px] text-white font-mono">
              {String(epochTimer.hours).padStart(2, '0')}:{String(epochTimer.minutes).padStart(2, '0')}:{String(epochTimer.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {isWalletConnected ? (
          <div className="space-y-2">
            <div className="bg-white/10 rounded-full px-4 py-2.5 flex items-center justify-between">
              <span className="text-[12px] font-mono text-white/80">
                {walletAddress}
              </span>
              <div className="w-2 h-2 bg-mezo-lime rounded-full" />
            </div>
            <button
              onClick={disconnectWallet}
              className="w-full bg-white/5 hover:bg-red-500/20 text-mezo-grey hover:text-red-400 rounded-full py-2.5 flex items-center justify-center gap-2 transition-colors text-[13px] font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={openWalletModal}
            className="w-full bg-mezo-lime text-mezo-sidebar hover:opacity-90 rounded-full py-3 flex items-center justify-center gap-2 transition-colors font-bold"
          >
            <Wallet className="w-4 h-4" />
            <span className="text-[14px]">Connect Wallet</span>
          </button>
        )}
      </div>
    </div>
  );
}
