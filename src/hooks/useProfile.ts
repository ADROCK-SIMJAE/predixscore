"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import { qk } from "./queryKeys";
import type { Tables } from "@/types/database";

export type ProfileRow = Tables<"profiles">;

// 내 프로필 + Zustand store sync
export function useMyProfile() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const setProfile = useAuthStore((s) => s.setProfile);

  const query = useQuery({
    queryKey: qk.profile(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProfileRow | null;
    },
  });

  useEffect(() => {
    if (query.data) setProfile(query.data);
  }, [query.data, setProfile]);

  return query;
}

// 프로필 업데이트
export interface ProfileUpdate {
  handle?: string;
  name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  category?: string | null;
  wallet?: string | null;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async (patch: ProfileUpdate) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", userId)
        .select()
        .single();
      if (error) {
        const msg = error.message ?? "";
        if (msg.includes("duplicate key") && msg.includes("handle")) {
          throw new Error("이미 사용 중인 닉네임입니다.");
        }
        throw new Error(msg || "프로필 업데이트에 실패했습니다.");
      }
      return data as ProfileRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.profile(userId) });
    },
  });
}
