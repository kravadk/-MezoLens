import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useState } from 'react';

export default function Fees() {
  const [hasViewed, setHasViewed] = useState(false);

  const fees = [
    { value: 0.3, label: 'Performance fee', sub: 'Per compound event' },
    { value: 0.1, label: 'Management fee', sub: 'Annual on BTC' },
    { value: 0.1, label: 'Keeper incentive', sub: 'Per trigger' },
  ];

  return (
    <section className="py-14 bg-[#1A1A1A]">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          onViewportEnter={() => setHasViewed(true)}
          className="text-center mb-10"
        >
          <h2 className="text-[26px] font-[700] text-white mb-2">Transparent fees</h2>
          <p className="text-[15px] text-white/50">
            Every fee visible on-chain. Nothing hidden.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {fees.map((fee, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white/5 rounded-[16px] border border-white/10 p-6 text-center hover:-translate-y-1 transition-transform duration-200"
            >
              <div className="text-[38px] font-[800] text-[#C8F0A0] leading-none mb-3">
                {hasViewed ? <CountUp end={fee.value} decimals={1} duration={1.5} /> : '0.0'}%
              </div>
              <div className="text-[14px] font-semibold text-white/70 mb-1">{fee.label}</div>
              <div className="text-[12px] text-white/40 mb-6">{fee.sub}</div>
              <div className="w-[60px] h-[2px] bg-[#C8F0A0]/30 mx-auto rounded-full" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white/5 border border-white/10 border-l-[4px] border-l-[#C8F0A0] rounded-[16px] p-6"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4 text-[15px] text-white/60">
            <span>₿ 1.0 deposited at 8% APR</span>
            <span className="text-white/20">→</span>
            <span>Annual yield: <strong className="text-white">₿ 0.080</strong></span>
            <span className="text-white/20">→</span>
            <span>Fees: <strong className="text-white">₿ 0.0013</strong></span>
            <span className="text-white/20">→</span>
            <span>You keep: <strong className="text-white">₿ 0.0787</strong></span>
            <span className="text-white/20">→</span>
            <span className="text-[#C8F0A0] text-[18px] font-[700]">Net cost: 1.6% of yield</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
