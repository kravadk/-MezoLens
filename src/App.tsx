import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Menu, X, LogOut } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Deposit } from './components/Deposit';
import { Calculator } from './components/Calculator';
import { Transparency } from './components/Transparency';
import { MyPositions } from './components/MyPositions';
import { VaultStats } from './components/VaultStats';
import { Banking } from './components/Banking';
import { Analytics } from './components/Analytics';
import { Watchlist } from './components/Watchlist';
import { OnboardingWizard } from './components/OnboardingWizard';
import { LandingPage } from './components/landing/LandingPage';
import { WalletModal } from './components/modals/WalletModal';
import { Toast } from './components/common/Toast';
import { useStore } from './store';
import { useWalletStore } from './store/walletStore';
import { useUIStore } from './store/uiStore';
import { useTokenBalances } from './hooks/useTokenBalances';

export default function App() {
  const { currentPage } = useStore();
  const { isConnected, address, disconnect } = useWalletStore();
  const balances = useTokenBalances();
  const { isWalletModalOpen, openWalletModal, closeWalletModal, toastMessage, toastType, hideToast, showToast } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Landing page renders full-screen without sidebar/header
  if (currentPage === 'Landing') {
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage />
          </motion.div>
        </AnimatePresence>
        <WalletModal isOpen={isWalletModalOpen} onClose={closeWalletModal} />
        <Toast message={toastMessage || ''} type={toastType} isVisible={!!toastMessage} onClose={hideToast} />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard': return <Dashboard />;
      case 'Deposit': return <Deposit />;
      case 'Calculator': return <Calculator />;
      case 'Banking': return <Banking />;
      case 'Transparency': return <Transparency />;
      case 'My Positions': return <MyPositions />;
      case 'Vault Stats': return <VaultStats />;
      case 'Analytics': return <Analytics />;
      case 'Watchlist': return <Watchlist />;
      default: return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'Dashboard': return { title: 'Dashboard', subtitle: 'Overview of your auto-compound vault' };
      case 'Deposit': return { title: 'New Deposit', subtitle: 'Select a strategy and lock your BTC' };
      case 'Banking': return { title: 'Bitcoin Banking', subtitle: 'Borrow MUSD at 1% · deploy for yield · auto-repay' };
      case 'Calculator': return { title: 'Yield Calculator', subtitle: 'Simulate your compound advantage' };
      case 'Transparency': return { title: 'Transparency', subtitle: 'Real-time protocol revenue and fees' };
      case 'My Positions': return { title: 'My Positions', subtitle: 'Manage your active staking vaults' };
      case 'Vault Stats': return { title: 'Vault Stats', subtitle: 'Public protocol performance metrics' };
      case 'Analytics': return { title: 'Portfolio Analytics', subtitle: 'BTC yield vs hodl · breakeven calculator' };
      case 'Watchlist': return { title: 'Watchlist', subtitle: 'Monitor multiple wallets · ICR alerts' };
      default: return { title: 'Dashboard', subtitle: '' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <div className="min-h-screen bg-white flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -220 }}
              animate={{ x: 0 }}
              exit={{ x: -220 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 z-[70] lg:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-[220px] relative min-h-screen flex flex-col">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 content-glow pointer-events-none" />

        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-mezo-black px-4 sm:px-6 lg:px-10 py-4 lg:py-6 flex items-center justify-between gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-mezo-border/50 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-mezo-black" />
          </button>

          <div className="min-w-0">
            <h1 className="text-[20px] lg:text-[28px] font-extrabold text-mezo-black leading-tight truncate">{title}</h1>
            <p className="text-[12px] lg:text-[14px] text-mezo-grey font-medium hidden sm:block">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Search - desktop only */}
            <div className="relative group hidden xl:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mezo-muted group-focus-within:text-mezo-black transition-colors" />
              <input
                type="text"
                placeholder="Search positions..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const { setCurrentPage } = useUIStore.getState();
                    setCurrentPage('My Positions');
                  }
                }}
                className="bg-mezo-border/50 border border-mezo-black rounded-full pl-11 pr-6 py-2.5 text-[14px] w-64 focus:outline-none focus:ring-2 focus:ring-mezo-lime/20 focus:bg-white transition-all"
              />
            </div>

            {/* Balances */}
            {isConnected && (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-mezo-border/30 border border-mezo-black rounded-full px-4 py-2">
                  <span className="text-[12px] font-bold text-mezo-black">{balances.btc} BTC</span>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-mezo-border/30 border border-mezo-black rounded-full px-4 py-2">
                  <span className="text-[12px] font-bold text-mezo-black">{balances.mezo.toLocaleString()} MEZO</span>
                </div>
              </>
            )}


            {isConnected ? (
              <button
                onClick={disconnect}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-mezo-border/30 border border-mezo-black hover:bg-red-50 hover:border-red-200 transition-all group"
              >
                <div className="w-2 h-2 bg-mezo-lime rounded-full" />
                <span className="text-[12px] font-bold text-mezo-black group-hover:text-red-500 hidden sm:inline">{address}</span>
                <LogOut className="w-3.5 h-3.5 text-mezo-muted group-hover:text-red-500 transition-colors" />
              </button>
            ) : (
              <button
                onClick={openWalletModal}
                className="px-4 py-2.5 bg-mezo-lime text-mezo-sidebar rounded-full text-[13px] font-bold hover:opacity-90 transition-all"
              >
                Connect
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Compact App Footer */}
        <footer className="px-4 sm:px-6 lg:px-10 py-4 border-t border-mezo-border flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-mezo-muted">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-mezo-lime rounded-full animate-pulse" />
            <span>Mezo Testnet (31611)</span>
            <span className="hidden sm:inline">|</span>
            <a href="https://explorer.test.mezo.org/address/0x961E1fc557c6A5Cf70070215190f9B57F719701D" target="_blank" rel="noopener noreferrer" className="hover:text-mezo-black transition-colors hidden sm:inline">
              EarnVault: 0x961E...701D
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://mezo.org/docs/developers/" target="_blank" rel="noopener noreferrer" className="hover:text-mezo-black transition-colors">Docs</a>
            <span>|</span>
            <span>v0.1.0</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <WalletModal isOpen={isWalletModalOpen} onClose={closeWalletModal} />
      <Toast message={toastMessage || ''} type={toastType} isVisible={!!toastMessage} onClose={hideToast} />
      {isConnected && <OnboardingWizard />}
    </div>
  );
}
