import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Deposit BTC as collateral',
      text: 'Send any amount of BTC. MezoLens locks it on-chain as veBTC collateral — you keep full ownership.',
      badge: '~30 seconds',
      badgeColor: 'bg-[#E2F0E5] text-[#1A8C52]',
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#1A8C52] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </div>
      ),
      visual: (
        <div className="w-full h-28 flex items-center justify-center relative">
          <motion.div animate={{ y: [-30, 15, -30] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-full bg-[#1A8C52] flex items-center justify-center z-10 text-white font-bold">₿</motion.div>
          <div className="absolute bottom-2 w-20 h-14 border-2 border-[#C8F0A0] rounded-xl bg-white" />
        </div>
      )
    },
    {
      num: '02',
      title: 'Borrow MUSD at 1% fixed',
      text: 'MezoLens opens a CDP on Mezo Borrow and mints MUSD against your BTC at a fixed 1% borrowing rate — no variable rates, no surprises.',
      badge: '1% fixed rate',
      badgeColor: 'bg-[#E5E8FD] text-[#5B6DEC]',
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#5B6DEC] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
      ),
      visual: (
        <div className="w-full h-28 flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-[#1A8C52] flex items-center justify-center text-white font-bold text-sm">₿</div>
            <span className="text-[10px] text-[#888] font-bold">BTC</span>
          </div>
          <motion.div
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[#5B6DEC] text-xl font-bold"
          >→</motion.div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-10 rounded-xl bg-[#5B6DEC]/10 border border-[#5B6DEC]/30 flex items-center justify-center text-[#5B6DEC] font-bold text-xs">MUSD</div>
            <span className="text-[10px] text-[#5B6DEC] font-bold">1% fixed</span>
          </div>
        </div>
      )
    },
    {
      num: '03',
      title: 'MUSD earns LP yield',
      text: 'Minted MUSD is deployed into Mezo Swap liquidity pools. LP fees and rewards flow back — more than covering the 1% borrow cost.',
      badge: 'Net positive yield',
      badgeColor: 'bg-[#FFF4E5] text-[#D4940A]',
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#D4940A] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
      ),
      visual: (
        <div className="w-full h-28 flex items-center justify-center">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-full bg-[#D4940A]/10 border-2 border-[#D4940A]/30 flex items-center justify-center text-[#D4940A] font-bold text-xs text-center leading-tight"
            >LP<br/>Pool</motion.div>
            {['LP fee', '+yield', 'MUSD'].map((label, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                className="absolute text-[10px] font-bold text-[#D4940A]"
                style={{ top: `${['-16px', '50%', 'calc(100% + 4px)'][i]}`, left: `${['50%', '-36px', '50%'][i]}`, transform: 'translateX(-50%)' }}
              >{label}</motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      num: '04',
      title: 'Auto-compound every epoch',
      text: 'Yield is claimed, MUSD repaid, BTC re-locked, and rewards compounded — every 7 days, automatically. No manual steps, no missed epochs.',
      badge: '∞ automatic',
      badgeColor: 'bg-[#E2F0E5] text-[#1A8C52]',
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#1A8C52] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </div>
      ),
      visual: (
        <div className="w-full h-28 flex items-end justify-start pb-4 pl-4">
          <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible">
            <motion.path d="M 0 80 Q 100 70 180 0" fill="none" stroke="#1A8C52" strokeWidth="4" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.6, 0.8, 1] }} />
          </svg>
        </div>
      )
    }
  ];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.querySelector('div')?.offsetWidth || 1;
      setActiveStep(Math.round(scrollLeft / (cardWidth + 24)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement;
    if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  return (
    <section className="bg-[#F5F8F5] pt-14 pb-10">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 mb-6">
        <h2 className="text-[26px] font-[700] text-[#1A1A1A] mb-2">How it works</h2>
        <p className="text-[15px] text-[#888]">BTC → MUSD → yield → compound. Every epoch, on-chain.</p>
      </div>

      {/* Horizontal scroll cards */}
      <div
        ref={scrollRef}
        className="flex gap-6 px-6 md:px-12 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4"
      >
        {steps.map((step, i) => (
          <div
            key={i}
            className="bg-white rounded-[20px] border border-mezo-black p-7 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] snap-start shrink-0 w-[80vw] md:w-[45vw] lg:w-[30vw] max-w-[420px]"
          >
            <div className="absolute top-4 right-4 text-[100px] font-[800] text-[#F0F0F0] leading-none z-0">
              {step.num}
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                {step.icon}
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${step.badgeColor}`}>
                  {step.badge}
                </span>
              </div>

              <h3 className="text-[18px] font-[700] text-[#1A1A1A] mb-2">{step.title}</h3>
              <p className="text-[13px] text-[#777] max-w-[340px] mb-6">{step.text}</p>

              <div className="mt-auto bg-[#FAFBFA] rounded-xl border border-mezo-black p-3">
                {step.visual}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="flex items-center justify-center gap-3 pt-4 pb-2">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`rounded-full border-[1.5px] transition-all duration-200 ${
              activeStep === i
                ? 'w-[10px] h-[10px] bg-[#1A8C52] border-[#1A8C52]'
                : 'w-[8px] h-[8px] bg-transparent border-[#CCC]'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
