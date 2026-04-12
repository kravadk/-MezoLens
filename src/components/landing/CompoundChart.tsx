import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useState } from 'react';

// Illustrative example: 0.5 BTC deposit, 8% simple manual vs 18.4% compound APR
const EXAMPLE_DEPOSIT = 0.5;
const MANUAL_APR = 0.08;      // 8% annual, simple interest (manual claimer)
const COMPOUND_APR = 0.184;   // 18.4% annual, weekly compounding (MezoLens)

const chartData = Array.from({ length: 53 }, (_, i) => ({
  week: i,
  manual: EXAMPLE_DEPOSIT + EXAMPLE_DEPOSIT * MANUAL_APR * (i / 52),
  compound: EXAMPLE_DEPOSIT * Math.pow(1 + COMPOUND_APR / 52, i),
}));

const manualFinal = chartData[52].manual;
const compoundFinal = chartData[52].compound;
const advantagePct = ((compoundFinal - manualFinal) / manualFinal * 100).toFixed(1);
const advantageBtc = (compoundFinal - manualFinal).toFixed(3);

export default function CompoundChart() {
  const [hasViewed, setHasViewed] = useState(false);
  const data = chartData;

  return (
    <section className="py-14 bg-[#1A1A1A]">
      <div className="max-w-[1100px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          onViewportEnter={() => setHasViewed(true)}
          className="text-center mb-12"
        >
          <h2 className="text-[26px] font-[700] text-white mb-2">The compound difference</h2>
          <p className="text-[15px] text-white/50">
            Same deposit. One year. The gap is your advantage.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[16px] border border-mezo-black shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-8 relative"
        >
          <div className="h-[320px] w-full relative">
            {hasViewed && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A8C52" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#1A8C52" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8F0A0" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#C8F0A0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={(val) => (val % 8 === 0 ? `W${val}` : '')}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#777', fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    domain={[EXAMPLE_DEPOSIT * 0.98, compoundFinal * 1.02]}
                    tickFormatter={(val) => `₿ ${val.toFixed(2)}`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#777', fontWeight: 500 }}
                  />
                  {/* Gap Area - rendered first so it's behind */}
                  <Area
                    type="monotone"
                    dataKey="compound"
                    stroke="none"
                    fill="url(#colorGap)"
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationBegin={500}
                  />
                  {/* Manual Line */}
                  <Area
                    type="linear"
                    dataKey="manual"
                    stroke="#CCCCCC"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    fill="none"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  {/* Compound Line */}
                  <Area
                    type="monotone"
                    dataKey="compound"
                    stroke="#1A8C52"
                    strokeWidth={3}
                    fill="url(#colorCompound)"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationBegin={150}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* +18.4% Annotation */}
            {hasViewed && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 1.8 }}
                className="absolute right-4 top-12 flex items-center gap-2"
              >
                <div className="w-8 border-t border-dashed border-[#1A8C52]" />
                <span className="text-[#1A8C52] text-[16px] font-[700] bg-[#E2F0E5] px-2 py-0.5 rounded-md">
                  +{advantagePct}% more
                </span>
              </motion.div>
            )}
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-mezo-black">
            <div>
              <p className="text-[#999] text-[13px] font-medium mb-1">Initial deposit</p>
              <p className="text-[#1A1A1A] text-[16px] font-bold">₿ {EXAMPLE_DEPOSIT.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[#999] text-[13px] font-medium mb-1">Manual claiming</p>
              <p className="text-[#555] text-[14px] font-semibold">₿ {manualFinal.toFixed(3)} after 1 year</p>
            </div>
            <div>
              <p className="text-[#999] text-[13px] font-medium mb-1">Auto-compound</p>
              <p className="text-[#1A8C52] text-[14px] font-bold">₿ {compoundFinal.toFixed(3)} after 1 year</p>
              <p className="text-[#1A8C52] text-[22px] font-[700] mt-1">
                Advantage: +₿ {advantageBtc} (+{advantagePct}%)
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
