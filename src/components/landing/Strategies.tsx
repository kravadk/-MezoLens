import { motion } from 'framer-motion';
import { Shield, Scale, Rocket, Check, X } from 'lucide-react';

export default function Strategies() {
  const strategies = [
    {
      name: 'Conservative',
      color: '#1A8C52',
      bg: 'bg-[#E2F0E5]',
      icon: <Shield size={20} className="text-[#1A8C52]" />,
      apr: '~5-7%',
      risk: 'Low',
      features: [
        { name: 'BTC lock', active: true },
        { name: 'Auto-compound', active: true },
        { name: 'MUSD yield at 1%', active: true },
        { name: 'MEZO boost', active: false },
        { name: 'Auto-vote', active: false },
      ],
      offset: 0,
    },
    {
      name: 'Balanced',
      color: '#5B6DEC',
      bg: 'bg-[#E5E8FD]',
      icon: <Scale size={20} className="text-[#5B6DEC]" />,
      apr: '~7-10%',
      risk: 'Medium',
      recommended: true,
      features: [
        { name: 'BTC lock', active: true },
        { name: 'Auto-compound', active: true },
        { name: 'MUSD yield at 1%', active: true },
        { name: '2x MEZO boost', active: true },
        { name: 'Auto-vote', active: false },
      ],
      offset: -2,
    },
    {
      name: 'Aggressive',
      color: '#D4940A',
      bg: 'bg-[#FFF4E5]',
      icon: <Rocket size={20} className="text-[#D4940A]" />,
      apr: '~10-15%',
      risk: 'Higher',
      features: [
        { name: 'BTC lock', active: true },
        { name: 'Auto-compound', active: true },
        { name: 'MUSD yield at 1%', active: true },
        { name: '5x MEZO boost', active: true },
        { name: 'Auto-vote', active: true },
      ],
      offset: 0,
    },
  ];

  return (
    <section className="py-14 bg-white">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-[26px] font-[700] text-[#1A1A1A] mb-2">Three strategies. One vault.</h2>
          <p className="text-[15px] text-[#888]">All include auto-compound. Choose your risk.</p>
          <p className="text-[12px] text-[#AAA] mt-1">APR ranges are mainnet projections. Testnet uses mock reward parameters.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {strategies.map((strategy, i) => (
            <motion.div
              key={i}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: strategy.offset, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              whileHover={{ y: strategy.offset - 4, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
              className="relative bg-white rounded-[16px] border border-mezo-black overflow-hidden p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-200 group"
            >
              {/* Top color strip */}
              <div
                className="absolute top-0 left-0 right-0 h-[5px]"
                style={{ backgroundColor: strategy.color }}
              />

              {strategy.recommended && (
                <div className="absolute top-[5px] left-1/2 -translate-x-1/2 bg-[#1A8C52] text-white text-[10px] font-bold px-3 py-1 rounded-b-full uppercase tracking-wider z-10">
                  Recommended
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <div className={`w-10 h-10 rounded-full ${strategy.bg} flex items-center justify-center`}>
                  {strategy.icon}
                </div>
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${strategy.bg}`} style={{ color: strategy.color }}>
                  {strategy.name}
                </span>
              </div>

              <div className="mb-8">
                <div className="text-[34px] font-[800] text-[#1A1A1A] leading-none mb-2">
                  {strategy.apr}
                </div>
                <div className="text-[13px] text-[#888]">
                  Risk: <span className="font-semibold text-[#555]">{strategy.risk}</span>
                </div>
              </div>

              <div className="space-y-3">
                {strategy.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3 h-[28px]">
                    {feature.active ? (
                      <Check size={16} className="text-[#1A8C52] shrink-0" />
                    ) : (
                      <X size={16} className="text-[#CCC] shrink-0" />
                    )}
                    <span className={`text-[13px] ${feature.active ? 'text-[#555]' : 'text-[#AAA]'}`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
