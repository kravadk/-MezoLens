import { motion } from 'framer-motion';

export default function TrustStrip() {
  const items = [
    'Mezo Passport integrated',
    'Borrow MUSD at 1% fixed',
    'Auto-compound every epoch',
    'veBTC lock',
    'veMEZO boost',
    'Gauge voting',
    'LP yield on MUSD',
    '0.3% transparent fee',
    'Permissionless keepers',
    '12 Mezo integrations',
    'Non-custodial',
    'Open source',
  ];

  const content = items.map((item, i) => (
    <span key={i} className="flex items-center gap-2 mx-4 whitespace-nowrap">
      <span className="text-[#C8F0A0] font-bold">✓</span>
      <span className="text-[13px] font-medium text-white/60">{item}</span>
      {i < items.length - 1 && <span className="text-white/20 ml-4">·</span>}
    </span>
  ));

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="w-full h-[52px] bg-[#1A1A1A] border-y border-white/10 overflow-hidden flex items-center relative"
    >
      <div className="flex animate-marquee hover:[animation-play-state:paused] cursor-default">
        <div className="flex items-center shrink-0">{content}</div>
        <div className="flex items-center shrink-0">{content}</div>
        <div className="flex items-center shrink-0">{content}</div>
      </div>
    </motion.div>
  );
}
