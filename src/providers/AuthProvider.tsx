"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { useAuthStore } from "@/store/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getSupabase();
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        const profile = await getCurrentProfile(session.user.id);
        if (mounted) setProfile(profile);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const profile = await getCurrentProfile(session.user.id);
        setProfile(profile);
      } else {
        setProfile(null);
      }
      queryClient.invalidateQueries({ queryKey: ["me"] });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setSession, setProfile, setLoading, queryClient]);

  return <>{children}</>;
}
