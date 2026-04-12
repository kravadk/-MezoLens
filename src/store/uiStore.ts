import { create } from 'zustand';

export type Page = 'Landing' | 'Dashboard' | 'Deposit' | 'Banking' | 'Calculator' | 'Transparency' | 'My Positions' | 'Vault Stats';

interface UIState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'warning' | 'info';
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  hideToast: () => void;
}

const HAS_VISITED_KEY = 'mezolens_visited';

function getInitialPage(): Page {
  try {
    return localStorage.getItem(HAS_VISITED_KEY) ? 'Dashboard' : 'Landing';
  } catch {
    return 'Landing';
  }
}

export function markVisited() {
  try { localStorage.setItem(HAS_VISITED_KEY, '1'); } catch {}
}

export function clearVisited() {
  try { localStorage.removeItem(HAS_VISITED_KEY); } catch {}
}

export const useUIStore = create<UIState>((set) => ({
  currentPage: getInitialPage(),
  setCurrentPage: (page) => set({ currentPage: page }),
  isWalletModalOpen: false,
  openWalletModal: () => set({ isWalletModalOpen: true }),
  closeWalletModal: () => set({ isWalletModalOpen: false }),
  toastMessage: null,
  toastType: 'info',
  showToast: (message, type = 'info') => set({ toastMessage: message, toastType: type }),
  hideToast: () => set({ toastMessage: null }),
}));
