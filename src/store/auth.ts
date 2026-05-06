"use client";

import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { Tables } from "@/types/database";

type Profile = Tables<"profiles">;

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  loggedIn: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  loggedIn: false,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      loggedIn: !!session?.user,
    }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ user: null, session: null, profile: null, loggedIn: false }),
}));
