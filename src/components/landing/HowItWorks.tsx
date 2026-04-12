import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Deposit BTC into the vault',
      text: 'Send any amount. Choose Conservative, Balanced, or Aggressive.',
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
      title: 'Rewards compound every epoch',
      text: 'veBTC rewards are claimed and re-locked automatically. Your BTC earns BTC.',
      badge: 'Every 7 days, forever',
      badgeColor: 'bg-[#E2F0E5] text-[#1A8C52]',
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#1A8C52] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </div>
      ),
      visual: (
        <div className="w-full h-28 flex items-center justify-center">
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 64 64" className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#F0F0F0" strokeWidth="6" />
              <motion.circle cx="32" cy="32" r="28" fill="none" stroke="#1A8C52" strokeWidth="6" strokeDasharray="176"
                initial={{ strokeDashoffset: 176 }} animate={{ strokeDashoffset: [176, 0, 176] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[#1A8C52] font-bold text-xs">+₿</div>
          </div>
        </div>
      )
    },
    {
      num: '03',
      title: 'MEZO boost optimized',
      text: 'veMEZO lock managed for optimal duration and maximum multiplier.',
      badge: 'Up to 5x',
      badgeColor: 'bg-[#FFF4E5] text-[#D4940A]',
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#1A8C52] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        </div>
      ),
      visual: (
        <div className="w-full h-28 flex items-center justify-center">
          <motion.div animate={{ scale: [1, 1.2, 1.4, 1.6, 1], opacity: [0.5, 0.7, 0.9, 1, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, times: [0, 0.25, 0.5, 0.75, 1] }}
            className="text-[42px] font-[800] text-[#1A8C52]">5x</motion.div>
        </div>
      )
    },
    {
      num: '04',
      title: 'Compound yield grows exponentially',
      text: 'Month 12 earns more than month 2 — because compounded rewards earn their own rewards.',
      badge: '∞ automatic',
      badgeColor: 'bg-[#E2F0E5] text-[#1A8C52]',
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#1A8C52] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-5.096 0-5.096 8 0 8 5.096 0 7.253-8 12.739-8z"/></svg>
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
        <p className="text-[15px] text-[#888]">60 seconds from deposit to auto-compound.</p>
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
