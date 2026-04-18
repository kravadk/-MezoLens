import { motion, useMotionValue, useTransform, useScroll } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../../lib/wagmi';
import { MEZOLENS_CONTRACTS, EARN_VAULT_ABI } from '../../config/contracts';
import { useStore } from '../../store';
import { useWalletStore } from '../../store/walletStore';
import { useUIStore, markVisited } from '../../store/uiStore';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const { setCurrentPage } = useStore();
  const { isConnected } = useWalletStore();
  const { openWalletModal } = useUIStore();
  const [heroStats, setHeroStats] = useState({ btcLocked: 0, positions: 0, avgApr: 8.5 });

  useEffect(() => {
    const load = async () => {
      try {
        const result = await readContract(wagmiConfig, {
          address: MEZOLENS_CONTRACTS.earnVault,
          abi: EARN_VAULT_ABI,
          functionName: 'getVaultStats',
          chainId: mezoTestnet.id,
        }) as any;
        const [aprCons, aprBal, aprAgg] = await Promise.all([
          readContract(wagmiConfig, { address: MEZOLENS_CONTRACTS.earnVault, abi: EARN_VAULT_ABI, functionName: 'getEstimatedAPR', args: [0], chainId: mezoTestnet.id }) as Promise<bigint>,
          readContract(wagmiConfig, { address: MEZOLENS_CONTRACTS.earnVault, abi: EARN_VAULT_ABI, functionName: 'getEstimatedAPR', args: [1], chainId: mezoTestnet.id }) as Promise<bigint>,
          readContract(wagmiConfig, { address: MEZOLENS_CONTRACTS.earnVault, abi: EARN_VAULT_ABI, functionName: 'getEstimatedAPR', args: [2], chainId: mezoTestnet.id }) as Promise<bigint>,
        ]).catch(() => [null, null, null]);
        // Contract returns bps*100 (same format as useEstimatedAPR): divide by 10000
        const avgApr = (aprCons && aprBal && aprAgg)
          ? parseFloat(((Number(aprCons) + Number(aprBal) + Number(aprAgg)) / 3 / 10000).toFixed(1))
          : 8.5;
        setHeroStats({
          btcLocked: parseFloat(parseFloat(formatUnits(result.totalBtcLocked, 18)).toFixed(6)),
          positions: Number(result.totalPositions),
          avgApr,
        });
      } catch (e) { if (process.env.NODE_ENV === 'development') console.warn('RPC:', e); }
    };
    load();
  }, []);

  // Mouse parallax
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-300, 300], [10, -10]);
  const rotateY = useTransform(x, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Scroll parallax
  const cardY = useTransform(scrollY, [0, 1000], [0, -150]);
  const particlesY = useTransform(scrollY, [0, 1000], [0, -300]);

  const handleLaunchApp = () => {
    markVisited();
    if (isConnected) {
      setCurrentPage('Dashboard');
    } else {
      openWalletModal();
    }
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      style={{
        background: `
          radial-gradient(ellipse at 25% 40%, rgba(200,240,160,0.2) 0%, transparent 55%),
          radial-gradient(ellipse at 75% 60%, rgba(200,240,160,0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 90%, rgba(26,140,82,0.04) 0%, transparent 40%),
          #F5F9F2
        `,
      }}
    >
      {/* Dot Grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(26,140,82,0.03) 2px, transparent 2px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating Diamonds */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute z-0 border border-[#C8F0A0] opacity-15"
          style={{
            width: 16 + Math.random() * 8,
            height: 16 + Math.random() * 8,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            rotate: 45,
          }}
          animate={{ rotate: 405 }}
          transition={{ duration: 30 + Math.random() * 20, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      <div className="max-w-[1200px] w-full mx-auto px-6 md:px-12 z-10 grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-center">
        {/* LEFT COLUMN */}
        <div className="flex flex-col items-start">
          {/* Badge */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3, ease: 'easeOut' }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-[#C8F0A0] bg-gradient-to-br from-[#1A8C52] to-[#C8F0A0]"
                />
              ))}
            </div>
            <div className="flex text-[#1A8C52] text-xs">★★★★★</div>
            <div className="bg-white border border-mezo-black rounded-full px-3 py-1 text-xs text-[#888] font-medium shadow-sm">
              Built on Mezo
            </div>
          </motion.div>

          {/* Headline */}
          <h1 className="text-[38px] lg:text-[58px] font-[800] text-[#1A1A1A] leading-[1.06] tracking-[-0.025em] mb-6">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
              className="relative inline-block"
            >
              <span className="relative z-10">Self-Service</span>
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 z-20 pointer-events-none"
                initial={{ backgroundPosition: '-100% 0' }}
                animate={{ backgroundPosition: '200% 0' }}
                transition={{ delay: 1.2, duration: 0.8, ease: 'linear' }}
                style={{
                  background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Bitcoin Banking
              </motion.div>
            </motion.div>
            <br />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.62, ease: 'easeOut' }}
            >
              on Mezo.
            </motion.div>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="text-[16px] text-[#777] max-w-[460px] leading-[1.65] mb-8"
          >
            Deposit BTC as collateral. Borrow MUSD at 1% fixed. Earn LP yield that covers the cost. Auto-compound everything — your Bitcoin, fully productive, fully yours.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.0 }}
            className="flex flex-wrap items-center gap-4 mb-10"
          >
            <button
              onClick={handleLaunchApp}
              className="relative overflow-hidden bg-[#1A8C52] text-white h-[50px] w-[180px] rounded-full font-semibold flex items-center justify-center gap-2 group hover:bg-[#157A47] hover:shadow-[0_4px_20px_rgba(26,140,82,0.2)] transition-all duration-200 shimmer-btn"
            >
              Launch App
              <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
            </button>
            <a
              href="#features"
              className="bg-white border-[1.5px] border-[#E0E0E0] text-[#777] h-[50px] px-6 rounded-full font-semibold hover:border-[#1A8C52] hover:text-[#1A8C52] transition-colors duration-150 flex items-center"
            >
              Learn More ↓
            </a>
          </motion.div>

          {/* Stat Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.2 }}
            className="flex flex-wrap items-center gap-3"
          >
            {[
              { label: 'BTC locked', prefix: '₿ ', end: heroStats.btcLocked, decimals: 6 },
              { label: 'positions', prefix: '', end: heroStats.positions, decimals: 0 },
              { label: 'avg APR', prefix: '~', end: heroStats.avgApr, suffix: '%', decimals: 1 },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 1.2 + i * 0.08 }}
                className="h-8 bg-white border border-mezo-black rounded-full px-3 flex items-center gap-1.5 shadow-sm"
              >
                <span className="font-mono text-[#1A8C52] font-semibold text-sm">
                  {stat.prefix}
                  <CountUp end={stat.end} decimals={stat.decimals} duration={2} delay={1.5} />
                  {stat.suffix}
                </span>
                <span className="text-xs text-[#888]">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT COLUMN - 3D BTC Coin */}
        <motion.div
          style={{ y: cardY }}
          className="relative w-full max-w-[400px] mx-auto lg:ml-auto perspective-[800px]"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, rotateY: 15 }}
            animate={{ scale: 1, opacity: 1, rotateY: -6 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.4 }}
            className="relative bg-white rounded-[20px] border border-mezo-black shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 h-[440px] flex flex-col"
          >
            {/* Card Float Animation Wrapper */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 p-6 flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-auto z-20">
                <span className="text-[11px] text-[#AAA] uppercase tracking-wider font-semibold">Compound yield</span>
                <span className="bg-[#E2F0E5] text-[#1A8C52] text-[11px] font-bold px-2 py-0.5 rounded-full">
                  +18.4% vs manual
                </span>
              </div>

              {/* Center Composition */}
              <div className="relative flex-1 flex items-center justify-center -mt-8">
                {/* Orbital Ring */}
                <motion.svg
                  className="absolute w-[280px] h-[130px] z-0"
                  viewBox="0 0 280 130"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                >
                  <motion.ellipse
                    cx="140"
                    cy="65"
                    rx="138"
                    ry="63"
                    fill="none"
                    stroke="#C8F0A0"
                    strokeWidth="1"
                    strokeDasharray="8 4"
                    strokeOpacity="0.5"
                    initial={{ strokeDashoffset: 1000 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1, delay: 0.7 }}
                  />
                  {/* Traveling Dot */}
                  <circle r="3" fill="#C8F0A0" opacity="0.8">
                    <animateMotion
                      dur="8s"
                      repeatCount="indefinite"
                      path="M 140 2 A 138 63 0 1 1 139.9 2"
                    />
                  </circle>
                </motion.svg>

                {/* Data Streams */}
                <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                  {[
                    "M 0 50 Q 100 100 170 170",
                    "M 350 100 Q 250 150 200 180",
                    "M 50 300 Q 150 250 180 200"
                  ].map((d, i) => (
                    <motion.path
                      key={i}
                      d={d}
                      fill="none"
                      stroke="#C8F0A0"
                      strokeWidth="1"
                      strokeOpacity="0.4"
                      strokeDasharray="6 8"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 1.3 + i * 0.2 }}
                    >
                      <animate attributeName="stroke-dashoffset" values="14;0" dur="3s" repeatCount="indefinite" />
                    </motion.path>
                  ))}
                </svg>

                {/* Stacked Coins (Background) */}
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.25 }}
                  transition={{ type: 'spring', delay: 0.6 }}
                  className="absolute w-[165px] h-[165px] rounded-full glass-coin translate-x-6 translate-y-6"
                  style={{ rotateX: 10, rotateY: -15 }}
                />
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.4 }}
                  transition={{ type: 'spring', delay: 0.5 }}
                  className="absolute w-[180px] h-[180px] rounded-full glass-coin translate-x-3 translate-y-3"
                  style={{ rotateX: 6, rotateY: -10 }}
                />

                {/* Main BTC Coin */}
                <motion.div
                  style={{ rotateX, rotateY }}
                  className="relative w-[200px] h-[200px] rounded-full glass-coin flex items-center justify-center z-10"
                >
                  <div className="absolute top-4 left-4 w-[60px] h-[30px] rounded-full glass-highlight" />
                  <span className="text-[80px] font-[800] text-[#1A8C52] drop-shadow-[0_2px_4px_rgba(26,140,82,0.15)]">
                    ₿
                  </span>
                </motion.div>

                {/* Floating Glass Discs */}
                {[
                  { size: 40, top: -20, left: 20, delay: 0.8, dur: 4 },
                  { size: 30, top: 40, left: -40, delay: 0.9, dur: 5 },
                  { size: 50, top: 120, left: 180, delay: 1.0, dur: 6 },
                  { size: 35, top: -10, left: 160, delay: 1.1, dur: 4.5 },
                  { size: 45, top: 160, left: 20, delay: 1.2, dur: 5.5 },
                ].map((disc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    transition={{ type: 'spring', delay: disc.delay, duration: 0.5 }}
                    className="absolute z-20"
                    style={{ top: disc.top, left: disc.left }}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0], x: [0, 12, 0], rotate: 360 }}
                      transition={{ duration: disc.dur, repeat: Infinity, ease: 'easeInOut' }}
                      className="rounded-full glass-disc relative"
                      style={{ width: disc.size, height: disc.size }}
                    >
                      <div className="absolute top-1 left-1 w-2 h-2 bg-white/25 rounded-full" />
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom Data */}
              <div className="mt-auto z-20">
                <div className="flex items-end justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[28px] font-[800] text-[#1A1A1A] leading-none">{heroStats.btcLocked.toFixed(4)} BTC</span>
                    <span className="bg-[#E2F0E5] text-[#1A8C52] text-[11px] font-bold px-1.5 py-0.5 rounded-sm mb-1">
                      Live
                    </span>
                  </div>
                  {/* Sparkline */}
                  <div className="w-[120px] h-[40px] relative overflow-hidden">
                    <svg viewBox="0 0 120 40" className="w-full h-full">
                      <defs>
                        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1A8C52" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#1A8C52" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d="M 0 40 L 0 30 Q 20 35 40 25 T 80 15 T 120 5 L 120 40 Z"
                        fill="url(#sparkline-fill)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 0.6 }}
                      />
                      <motion.path
                        d="M 0 30 Q 20 35 40 25 T 80 15 T 120 5"
                        fill="none"
                        stroke="#1A8C52"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1.5, duration: 0.6, ease: 'easeOut' }}
                      />
                    </svg>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-[5px] rounded-full bg-gradient-to-r from-[#FF6B6B] via-[#FFD93D] to-[#4CAF50]" />
                  <span className="text-[11px] text-[#AAA] font-medium">{heroStats.positions} active positions</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Particles (Scroll Parallax) */}
      <motion.div style={{ y: particlesY }} className="absolute inset-0 pointer-events-none z-20">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#C8F0A0]"
            style={{
              width: 2 + Math.random() * 2,
              height: 2 + Math.random() * 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.15 + Math.random() * 0.35,
            }}
            animate={{
              y: [0, -10 - Math.random() * 20, 0],
              x: [0, Math.random() * 10 - 5, 0],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>
    </section>
  );
}
