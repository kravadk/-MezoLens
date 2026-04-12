import { create } from 'zustand';

type Strategy = 'conservative' | 'balanced' | 'aggressive';

interface DepositFormState {
  currentStep: number;
  selectedStrategy: Strategy | null;
  btcAmount: string;
  mezoAmount: string;
  musdEnabled: boolean;
  musdPercent: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStrategy: (strategy: Strategy) => void;
  setBtcAmount: (amount: string) => void;
  setMezoAmount: (amount: string) => void;
  setMusdEnabled: (enabled: boolean) => void;
  setMusdPercent: (percent: number) => void;
  reset: () => void;
}

export const useDepositFormStore = create<DepositFormState>((set) => ({
  currentStep: 0,
  selectedStrategy: null,
  btcAmount: '',
  mezoAmount: '',
  musdEnabled: false,
  musdPercent: 20,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
  setStrategy: (strategy) => set({ selectedStrategy: strategy }),
  setBtcAmount: (amount) => set({ btcAmount: amount }),
  setMezoAmount: (amount) => set({ mezoAmount: amount }),
  setMusdEnabled: (enabled) => set({ musdEnabled: enabled }),
  setMusdPercent: (percent) => set({ musdPercent: percent }),
  reset: () => set({
    currentStep: 0,
    selectedStrategy: null,
    btcAmount: '',
    mezoAmount: '',
    musdEnabled: false,
    musdPercent: 20,
  }),
}));
