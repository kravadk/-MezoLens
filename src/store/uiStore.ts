import { create } from 'zustand';

export type Page = 'Landing' | 'Dashboard' | 'Deposit' | 'Calculator' | 'Transparency' | 'My Positions' | 'Vault Stats';

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

export const useUIStore = create<UIState>((set) => ({
  currentPage: 'Landing',
  setCurrentPage: (page) => set({ currentPage: page }),
  isWalletModalOpen: false,
  openWalletModal: () => set({ isWalletModalOpen: true }),
  closeWalletModal: () => set({ isWalletModalOpen: false }),
  toastMessage: null,
  toastType: 'info',
  showToast: (message, type = 'info') => set({ toastMessage: message, toastType: type }),
  hideToast: () => set({ toastMessage: null }),
}));
