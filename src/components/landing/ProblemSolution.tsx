import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { Check, X, AlertTriangle, Zap } from 'lucide-react';

export default function ProblemSolution() {
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      while (true) {
        await controls.start('hidden');
        for (let i = 0; i < 6; i++) {
          await controls.start(`step${i}`);
          await new Promise(r => setTimeout(r, 400));
        }
        await controls.start('final');
        await new Promise(r => setTimeout(r, 1500));
      }
    };
    sequence();
  }, [controls]);

  const steps = [
    'Wait for epoch to end',
    'Open Mezo Earn interface',
    'Claim accumulated rewards',
    'Re-lock BTC into veBTC',
    'Re-evaluate gauge allocation',
    'Vote. Repeat in 7 days.',
  ];

  return (
    <section className="py-16 bg-[#1A1A1A]">
      <div className="max-w-[1100px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-[32px] font-[800] text-white mb-3">Bitcoin as productive capital.</h2>
          <p className="text-[16px] text-white/70">
            Most BTC sits idle. MezoLens turns it into a self-service bank — borrow MUSD at <span className="text-[#C8F0A0] font-bold">1% fixed rate</span>, earn LP yield that covers the cost, compound everything back into BTC. No intermediaries.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-stretch justify-center gap-8">
          {/* LEFT CARD — Manual */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="w-full md:w-1/2 bg-[#252525] rounded-[20px] border border-white/10 p-8 relative overflow-hidden"
          >
            {/* Red top accent */}
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#FF6B6B]" />

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#FF6B6B]" />
              </div>
              <span className="text-[#FF6B6B] text-[14px] font-bold uppercase tracking-wider">Manual</span>
            </div>

            <div className="space-y-4 mb-8 min-h-[230px]">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    [`step${i}`]: { opacity: 1, y: 0 },
                    final: { opacity: 1, y: 0 },
                  }}
                  initial="hidden"
                  animate={controls}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/40 text-[11px] font-bold shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-[15px] text-white/80 font-medium">{step}</span>
                </motion.div>
              ))}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  final: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                animate={controls}
                className="text-[#FF6B6B] text-[14px] font-bold text-center mt-6"
              >
                Miss one epoch = lost yield.
              </motion.div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex justify-between mb-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i < 4 ? 'bg-[#1A8C52]/20' : 'bg-[#FF6B6B]/20'}`}>
                    {i < 4 ? <Check size={16} className="text-[#1A8C52]" /> : <X size={16} className="text-[#FF6B6B]" />}
                  </div>
                ))}
              </div>
              <p className="text-[#FF6B6B] text-[14px] font-bold text-center">
                6 steps · 52 times/year · 18.4% yield loss
              </p>
            </div>
          </motion.div>

          {/* ARROW */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="hidden md:flex items-center text-[32px] text-[#C8F0A0] font-bold"
          >
            <motion.span
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              →
            </motion.span>
          </motion.div>

          {/* RIGHT CARD — Automatic */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="w-full md:w-1/2 bg-[#252525] rounded-[20px] border border-white/10 p-8 relative overflow-hidden"
          >
            {/* Green top accent */}
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#C8F0A0]" />

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#C8F0A0]/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#C8F0A0]" />
              </div>
              <span className="text-[#C8F0A0] text-[14px] font-bold uppercase tracking-wider">Automatic</span>
            </div>

            <div className="space-y-3 mb-8 min-h-[230px] flex flex-col justify-center items-center">
              <motion.div
                variants={{
                  hidden: { opacity: 1 },
                  final: { opacity: 0, display: 'none' },
                }}
                initial="hidden"
                animate={controls}
                className="text-[20px] text-white font-bold text-center"
              >
                Deposit once. That's it.
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, display: 'none' },
                  final: { opacity: 1, display: 'flex' },
                }}
                initial="hidden"
                animate={controls}
                className="flex-col items-center gap-5"
              >
                <div className="flex gap-3 mb-4">
                  {['Claimed', 'Re-locked', 'Voted'].map((action, i) => (
                    <motion.div
                      key={i}
                      variants={{ hidden: { scale: 0 }, final: { scale: 1 } }}
                      transition={{ type: 'spring', delay: i * 0.1 }}
                      className="flex items-center gap-1.5 text-[#1A1A1A] text-[13px] font-bold bg-[#C8F0A0] px-3 py-1.5 rounded-lg"
                    >
                      <Check size={14} /> {action}
                    </motion.div>
                  ))}
                </div>
                <p className="text-[#C8F0A0] text-[16px] font-semibold">Every epoch. Automatically.</p>
                <motion.div
                  variants={{
                    hidden: { scale: 1 },
                    final: { scale: [1, 1.1, 1] },
                  }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="text-[30px] font-[800] text-[#C8F0A0] mt-3"
                >
                  +18.4% more yield
                </motion.div>
              </motion.div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex justify-between mb-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg bg-[#C8F0A0]/10 flex items-center justify-center">
                    <Check size={16} className="text-[#C8F0A0]" />
                  </div>
                ))}
              </div>
              <p className="text-[#C8F0A0] text-[14px] font-bold text-center">
                1 deposit · 0 steps · Compound forever
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
