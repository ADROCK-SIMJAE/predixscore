"use client";

import { create } from "zustand";
import type { Expert, Pred, Conversation } from "@/types";

export interface StackEntry {
  screen: string;
  expert?: Expert;
  conv?: Conversation;
  pred?: Pred;
  [key: string]: any;
}

interface UiState {
  stack: StackEntry[];
  showAuth: boolean;
  showChallenge: boolean;
  slideIdx: number;

  push: (screen: string, data?: Partial<StackEntry>) => void;
  pop: () => void;
  nav: (screen: string) => void;
  setShowAuth: (v: boolean) => void;
  setShowChallenge: (v: boolean) => void;
  setSlideIdx: (v: number | ((p: number) => number)) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  stack: [{ screen: "home" }],
  showAuth: false,
  showChallenge: false,
  slideIdx: 0,

  push: (screen, data) =>
    set((s) => ({ stack: [...s.stack, { screen, ...(data || {}) }] })),
  pop: () =>
    set((s) => ({ stack: s.stack.length > 1 ? s.stack.slice(0, -1) : s.stack })),
  nav: (screen) => {
    if (screen === "challenge") {
      set({ slideIdx: 0, showChallenge: true });
      return;
    }
    set({ stack: [{ screen }] });
  },
  setShowAuth: (v) => set({ showAuth: v }),
  setShowChallenge: (v) => set({ showChallenge: v }),
  setSlideIdx: (v) =>
    set((s) => ({
      slideIdx: typeof v === "function" ? (v as (p: number) => number)(s.slideIdx) : v,
    })),
}));
