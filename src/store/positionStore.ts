import { create } from 'zustand';

export interface PositionData {
  id: number;
  strategy: 'Conservative' | 'Balanced' | 'Aggressive';
  btcDeposited: number;
  btcCompounded: number;
  mezoLocked: number;
  boostMultiplier: number;
  lockStart: number;
  lastCompoundEpoch: number;
  totalFeesPaid: number;
  musdPercent: number;
  active: boolean;
  compoundCount: number;
}

interface PositionState {
  positions: PositionData[];
  selectedPositionId: number | null;
  selectPosition: (id: number | null) => void;
  filter: 'all' | 'active' | 'completed';
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
}

export const usePositionStore = create<PositionState>((set) => ({
  positions: [],
  selectedPositionId: null,
  selectPosition: (id) => set({ selectedPositionId: id }),
  filter: 'all',
  setFilter: (filter) => set({ filter }),
}));
