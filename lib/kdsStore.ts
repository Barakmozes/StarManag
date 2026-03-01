// lib/kdsStore.ts — Zustand store for Kitchen/Bar Display System settings
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface KdsState {
  soundEnabled: boolean;
  completedVisible: boolean;
  lastPollTimestamp: string | null; // ISO string for serialization
  consecutiveErrors: number;
}

interface KdsActions {
  toggleSound: () => void;
  toggleCompleted: () => void;
  setLastPollTimestamp: (ts: Date) => void;
  incrementErrors: () => void;
  resetErrors: () => void;
}

export const useKdsStore = create<KdsState & KdsActions>()(
  persist(
    (set) => ({
      soundEnabled: false,
      completedVisible: false,
      lastPollTimestamp: null,
      consecutiveErrors: 0,

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleCompleted: () =>
        set((s) => ({ completedVisible: !s.completedVisible })),
      setLastPollTimestamp: (ts: Date) =>
        set({ lastPollTimestamp: ts.toISOString() }),
      incrementErrors: () =>
        set((s) => ({ consecutiveErrors: s.consecutiveErrors + 1 })),
      resetErrors: () => set({ consecutiveErrors: 0 }),
    }),
    {
      name: "kds_settings",
      // Only persist user preferences, not transient state
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        completedVisible: state.completedVisible,
      }),
      skipHydration: true,
    }
  )
);
