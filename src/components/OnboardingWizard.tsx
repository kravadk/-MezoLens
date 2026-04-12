import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ArrowDownToLine, Landmark, Check, X, ExternalLink, ChevronRight } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const ONBOARDING_KEY = 'mezolens_onboarded';

const steps = [
  {
    icon: <ShieldCheck className="w-10 h-10 text-[#D4940A]" />,
    bg: 'bg-[#FFF4E5]',
    title: 'Step 1: Get Mezo Passport',
    text: 'Mezo Passport is your on-chain identity. It\'s required to access full banking features and is free to mint.',
    cta: { label: 'Get Passport →', href: 'https://mezo.org/passport', external: true },
    skip: 'I already have one',
  },
  {
    icon: <ArrowDownToLine className="w-10 h-10 text-[#1A8C52]" />,
    bg: 'bg-[#E2F0E5]',
    title: 'Step 2: Deposit BTC',
    text: 'Choose a strategy (Conservative, Balanced, or Aggressive) and deposit any amount of BTC. Your BTC stays locked as collateral.',
    cta: { label: 'Go to Deposit', page: 'Deposit' as const },
    skip: 'Skip for now',
  },
  {
    icon: <Landmark className="w-10 h-10 text-[#5B6DEC]" />,
    bg: 'bg-[#E5E8FD]',
    title: 'Step 3: Enable MUSD Yield',
    text: 'After depositing, enable MUSD Yield in your position settings. MezoLens borrows MUSD at 1% and deploys it to earn LP yield — automatically.',
    cta: { label: 'Go to Banking', page: 'Banking' as const },
    skip: 'Got it',
  },
];

export function OnboardingWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const { setCurrentPage } = useUIStore();

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) setOpen(true);
    } catch {}
  }, []);

  const close = () => {
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch {}
    setOpen(false);
  };

  const handleCta = () => {
    const s = steps[step];
    if ('page' in s.cta) {
      setCurrentPage(s.cta.page!);
      close();
    } else if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      close();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Progress */}
        <div className="flex gap-1 p-4 pb-0">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-mezo-sidebar' : 'bg-mezo-border'}`} />
          ))}
        </div>

        <button onClick={close} className="absolute top-4 right-4 p-1.5 hover:bg-mezo-border/50 rounded-lg transition-colors">
          <X className="w-4 h-4 text-mezo-grey" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-8 space-y-6"
          >
            <div className={`w-20 h-20 ${steps[step].bg} rounded-3xl flex items-center justify-center`}>
              {steps[step].icon}
            </div>

            <div>
              <p className="text-[11px] font-bold text-mezo-grey uppercase tracking-widest mb-2">
                {step + 1} of {steps.length}
              </p>
              <h2 className="text-[22px] font-extrabold text-mezo-black mb-3">{steps[step].title}</h2>
              <p className="text-[14px] text-mezo-grey leading-relaxed">{steps[step].text}</p>
            </div>

            <div className="space-y-3 pt-2">
              {'href' in steps[step].cta ? (
                <a
                  href={(steps[step].cta as any).href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => step < steps.length - 1 && setStep(step + 1)}
                  className="w-full px-6 py-3.5 bg-mezo-sidebar text-white rounded-2xl text-[14px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {steps[step].cta.label} <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button
                  onClick={handleCta}
                  className="w-full px-6 py-3.5 bg-mezo-lime text-mezo-sidebar rounded-2xl text-[14px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {steps[step].cta.label} <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => step < steps.length - 1 ? setStep(step + 1) : close()}
                className="w-full py-2 text-[13px] text-mezo-grey hover:text-mezo-black transition-colors"
              >
                {steps[step].skip}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
