// Zustand store for global state management

import { create } from 'zustand';

interface UIState {
  // UI Settings
  theme: 'light' | 'dark';
  selectedDatabase: string;
  language: 'en' | 'es' | 'fr';
  voiceEnabled: boolean;
  showUnsafeWarnings: boolean;

  // Current Query State
  nlQuery: string;
  selectedSQL: string;
  selectedCandidateIndex: number;

  // Modal States
  isVoiceModalOpen: boolean;
  isExplainModalOpen: boolean;
  isUnsafeWarningOpen: boolean;
  unsafeSQL: string;

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setSelectedDatabase: (db: string) => void;
  setLanguage: (lang: 'en' | 'es' | 'fr') => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setShowUnsafeWarnings: (show: boolean) => void;
  setNLQuery: (query: string) => void;
  setSelectedSQL: (sql: string) => void;
  setSelectedCandidateIndex: (index: number) => void;
  setVoiceModalOpen: (open: boolean) => void;
  setExplainModalOpen: (open: boolean) => void;
  setUnsafeWarningOpen: (open: boolean, sql: string) => void;
  resetQuery: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  selectedDatabase: 'sakila',
  language: 'en',
  voiceEnabled: false,
  showUnsafeWarnings: true,
  nlQuery: '',
  selectedSQL: '',
  selectedCandidateIndex: 0,
  isVoiceModalOpen: false,
  isExplainModalOpen: false,
  isUnsafeWarningOpen: false,
  unsafeSQL: '',

  setTheme: (theme) => set({ theme }),
  setSelectedDatabase: (db) => set({ selectedDatabase: db }),
  setLanguage: (lang) => set({ language: lang }),
  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
  setShowUnsafeWarnings: (show) => set({ showUnsafeWarnings: show }),
  setNLQuery: (query) => set({ nlQuery: query }),
  setSelectedSQL: (sql) => set({ selectedSQL: sql }),
  setSelectedCandidateIndex: (index) => set({ selectedCandidateIndex: index }),
  setVoiceModalOpen: (open) => set({ isVoiceModalOpen: open }),
  setExplainModalOpen: (open) => set({ isExplainModalOpen: open }),
  setUnsafeWarningOpen: (open, sql) => set({ isUnsafeWarningOpen: open, unsafeSQL: sql }),
  resetQuery: () =>
    set({
      nlQuery: '',
      selectedSQL: '',
      selectedCandidateIndex: 0,
    }),
}));
