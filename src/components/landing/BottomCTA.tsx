import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { useWalletStore } from '../../store/walletStore';
import { useUIStore, markVisited } from '../../store/uiStore';

export default function BottomCTA() {
  const { setCurrentPage } = useStore();
  const { isConnected } = useWalletStore();
  const { openWalletModal } = useUIStore();

  const handleLaunchApp = () => {
    markVisited();
    if (isConnected) {
      setCurrentPage('Dashboard');
    } else {
      openWalletModal();
    }
  };

  return (
    <section className="py-14 bg-[#1A1A1A]">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-[20px] p-10 md:p-14 text-center flex flex-col items-center"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative mb-8"
          >
            <img src="/logo.png" alt="MezoLens" className="w-[72px] h-[72px] rounded-2xl" />
          </motion.div>

          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[34px] font-[700] text-white mb-3"
          >
            Ready to compound?
          </motion.h2>

          <motion.p
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="text-[16px] text-white/50 mb-8"
          >
            Deposit BTC. Choose strategy. Earn forever.
          </motion.p>

          <motion.button
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.26 }}
            onClick={handleLaunchApp}
            className="relative overflow-hidden bg-[#C8F0A0] text-[#1A1A1A] h-[52px] w-[200px] rounded-full font-bold flex items-center justify-center gap-2 group hover:scale-105 hover:shadow-[0_4px_20px_rgba(200,240,160,0.3)] transition-all duration-200 shimmer-btn mb-6"
          >
            Launch App
            <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.34 }}
            className="flex items-center gap-3 text-[13px]"
          >
            <span className="font-mono text-white/30">0x961E...701D</span>
            <a href="https://explorer.test.mezo.org/address/0x961E1fc557c6A5Cf70070215190f9B57F719701D" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#C8F0A0] transition-colors duration-150">
              View on Explorer ↗
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
