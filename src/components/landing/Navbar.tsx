import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useStore } from '../../store';
import { useWalletStore } from '../../store/walletStore';
import { useUIStore } from '../../store/uiStore';

export default function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setCurrentPage } = useStore();
  const { isConnected } = useWalletStore();
  const { openWalletModal } = useUIStore();

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  const scaleX = useTransform(scrollY, [0, document.body.scrollHeight - window.innerHeight], [0, 1]);

  const links = ['Features', 'How It Works', 'Strategies', 'Transparency'];

  const handleLaunchApp = () => {
    if (isConnected) {
      setCurrentPage('Dashboard');
    } else {
      openWalletModal();
    }
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-[#C8F0A0] z-50 origin-left"
        style={{ scaleX }}
      />

      <motion.nav
        className={`fixed top-0 left-0 right-0 h-16 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/85 backdrop-blur-[12px] border-b border-mezo-black shadow-[0_1px_8px_rgba(0,0,0,0.04)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="MezoLens" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-[17px] text-[#1A1A1A]">MezoLens</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-[14px] font-medium text-[#888] hover:text-[#1A8C52] transition-colors duration-150"
              >
                {link}
              </a>
            ))}
          </div>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLaunchApp}
              className="hidden md:block bg-[#1A1A1A] text-white rounded-full h-[38px] px-6 text-sm font-medium hover:scale-105 hover:shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-all duration-200"
            >
              Launch App
            </button>
            <button
              className="md:hidden text-[#1A1A1A]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 bg-white flex flex-col items-center justify-center gap-8"
        >
          {links.map((link, i) => (
            <motion.a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="text-2xl font-semibold text-[#1A1A1A]"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link}
            </motion.a>
          ))}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: links.length * 0.06 }}
            onClick={() => { setMobileMenuOpen(false); handleLaunchApp(); }}
            className="bg-[#1A8C52] text-white rounded-full h-12 px-8 text-lg font-medium mt-4"
          >
            Launch App
          </motion.button>
        </motion.div>
      )}
    </>
  );
}
