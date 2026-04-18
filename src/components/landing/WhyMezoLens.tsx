import { motion } from 'framer-motion';
import { Bitcoin, TrendingUp, Shield, Zap, ExternalLink } from 'lucide-react';
import { useStore } from '../../store';
import { markVisited } from '../../store/uiStore';

const MARKET_STATS = [
  { value: '$1.6T', label: 'Bitcoin market cap', sub: 'largest crypto asset' },
  { value: '<2%', label: 'BTC that earns yield', sub: 'of all circulating supply' },
  { value: '1%', label: 'fixed borrow rate', sub: 'no variable rate risk' },
  { value: '100%', label: 'user control', sub: 'close position anytime' },
];

const PILLARS = [
  {
    icon: Bitcoin,
    color: '#1A8C52',
    bg: '#E2F0E5',
    title: 'Bitcoin stays yours',
    desc: 'BTC locked as collateral — never sold, never custodied. You close the position anytime and get it back.',
  },
  {
    icon: TrendingUp,
    color: '#5B6DEC',
    bg: '#E5E8FD',
    title: 'MUSD covers its own cost',
    desc: 'Borrowed MUSD is deployed to Mezo LP pools. Swap fees and rewards exceed the 1% annual borrow cost.',
  },
  {
    icon: Zap,
    color: '#D4940A',
    bg: '#FFF4E5',
    title: 'Compounding is automatic',
    desc: 'Every epoch, yield is claimed, MUSD repaid, BTC re-locked. No missed claims, no manual steps.',
  },
  {
    icon: Shield,
    color: '#1A8C52',
    bg: '#E2F0E5',
    title: 'Full user control',
    desc: 'Close your position anytime. Add collateral anytime. Every action is your own — no custodians, no lock-ins.',
  },
];

const TRACK_BADGES = [
  { label: 'Bank on Bitcoin', color: '#1A8C52', bg: '#E2F0E5' },
  { label: 'MUSD Integration', color: '#5B6DEC', bg: '#E5E8FD' },
  { label: 'Mezo Passport', color: '#D4940A', bg: '#FFF4E5' },
];

export default function WhyMezoLens() {
  const { setCurrentPage } = useStore();

  const handleLaunch = () => {
    markVisited();
    setCurrentPage('Dashboard');
  };

  return (
    <section className="py-16 bg-white border-t border-b border-mezo-black">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">

        {/* Track alignment */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {TRACK_BADGES.map((b) => (
            <span
              key={b.label}
              className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
              style={{ color: b.color, background: b.bg }}
            >
              ✓ {b.label}
            </span>
          ))}
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mb-12"
        >
          <h2 className="text-[32px] md:text-[40px] font-[800] text-[#1A1A1A] leading-[1.1] mb-4">
            $1.6T Bitcoin.<br />
            <span className="text-[#1A8C52]">Less than 2% earns yield.</span>
          </h2>
          <p className="text-[16px] text-[#666] max-w-[600px]">
            MezoLens is self-service Bitcoin banking on Mezo. Deposit BTC → borrow MUSD at 1% fixed →
            earn LP yield that covers the cost → auto-compound back into BTC.
            You keep full control: close anytime, add collateral anytime, audit everything on-chain.
          </p>
        </motion.div>

        {/* Market stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {MARKET_STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="bg-[#FAFBFA] border border-mezo-black rounded-[16px] p-5"
            >
              <div className="text-[28px] md:text-[32px] font-[800] text-[#1A1A1A] leading-none mb-1">
                {stat.value}
              </div>
              <div className="text-[13px] font-semibold text-[#1A1A1A] mb-0.5">{stat.label}</div>
              <div className="text-[11px] text-[#AAA]">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Value pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {PILLARS.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#FAFBFA] border border-mezo-black rounded-[20px] p-6"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: p.bg }}
              >
                <p.icon className="w-5 h-5" style={{ color: p.color }} />
              </div>
              <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-2">{p.title}</h3>
              <p className="text-[13px] text-[#777] leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Deployed contracts proof */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#1A1A1A] rounded-[20px] p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#C8F0A0] animate-pulse" />
                <span className="text-[12px] font-bold text-[#C8F0A0] uppercase tracking-wider">Live on Mezo Testnet · chainId 31611</span>
              </div>
              <h3 className="text-[20px] font-extrabold text-white mb-1">Deployed contracts</h3>
              <p className="text-[13px] text-white/50">All positions and yields are verifiable on-chain</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {[
                { name: 'EarnVault', addr: '0x961E1...9701D', href: 'https://explorer.test.mezo.org/address/0x961E1fc557c6A5Cf70070215190f9B57F719701D' },
                { name: 'MusdPipe', addr: '0x8225...B33', href: 'https://explorer.test.mezo.org/address/0x82251096716EcE27260F2D4f67b2131B95D9bA33' },
              ].map((c) => (
                <a
                  key={c.name}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
                >
                  <div className="w-2 h-2 rounded-full bg-[#C8F0A0]" />
                  <div>
                    <div className="text-[12px] font-bold text-white">{c.name}</div>
                    <div className="text-[10px] font-mono text-white/40">{c.addr}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 ml-1 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
