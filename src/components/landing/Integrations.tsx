import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import CountUp from 'react-countup';

export default function Integrations() {
  const [hasSettled, setHasSettled] = useState(false);

  const pills = [
    { icon: '₿', text: 'veBTC lock' },
    { icon: '🔶', text: 'veMEZO boost' },
    { icon: '🗳️', text: 'Gauge voting' },
    { icon: '📅', text: 'Epoch rewards' },
    { icon: '💵', text: 'Mezo Borrow' },
    { icon: '🪙', text: 'MUSD token' },
    { icon: '🔄', text: 'Mezo Swap' },
    { icon: '💧', text: 'LP pools' },
    { icon: '🔑', text: 'Mezo Passport' },
    { icon: '📊', text: 'Pyth oracle' },
    { icon: '🧪', text: 'Testnet deploy' },
    { icon: '🔍', text: 'Explorer verify' },
  ];

  // Generate random initial positions once
  const randomOffsets = useMemo(() => {
    return pills.map(() => ({
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
      rotate: (Math.random() - 0.5) * 24,
      stiffness: 100 + Math.random() * 40,
    }));
  }, []);

  return (
    <section className="py-14 bg-[#F5F8F5] overflow-hidden">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-[26px] font-[700] text-[#1A1A1A] mb-2">12 Mezo-native integrations</h2>
          <p className="text-[15px] text-[#888]">
            Deep protocol-level access to the Mezo ecosystem.
          </p>
        </motion.div>

        <div className="relative mb-10">
          {/* SVG Connecting Line */}
          {hasSettled && (
            <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none hidden md:block" style={{ minHeight: '200px' }}>
              <motion.path
                d="M 120 40 L 350 40 L 600 40 L 850 40 L 850 100 L 600 100 L 350 100 L 120 100 L 120 160 L 350 160 L 600 160 L 850 160"
                fill="none"
                stroke="#C8F0A0"
                strokeWidth="2"
                strokeOpacity="0.4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            </svg>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
            {pills.map((pill, i) => (
              <motion.div
                key={i}
                initial={{
                  x: randomOffsets[i].x,
                  y: randomOffsets[i].y,
                  rotate: randomOffsets[i].rotate,
                  opacity: 0.2,
                }}
                whileInView={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                onAnimationComplete={() => {
                  if (i === pills.length - 1) setHasSettled(true);
                }}
                transition={{
                  type: 'spring',
                  stiffness: randomOffsets[i].stiffness,
                  damping: 14,
                  delay: 0.1,
                }}
                className="bg-[#F3F3F3] rounded-full px-5 py-3 flex items-center gap-2.5 hover:bg-[#E2F0E5] transition-colors duration-200 cursor-default"
              >
                <span className="text-[16px]">{pill.icon}</span>
                <span className="text-[14px] text-[#444] font-semibold whitespace-nowrap">
                  {pill.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          {hasSettled && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-center mb-8"
            >
              <div className="text-[64px] font-[800] text-[#1A8C52] leading-none mb-2">
                <CountUp end={12} duration={1} />
              </div>
              <div className="text-[14px] text-[#888] font-medium uppercase tracking-wider">
                Mezo-native integrations
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </section>
  );
}
