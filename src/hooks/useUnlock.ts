"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import { qk } from "./queryKeys";
import type { Tables } from "@/types/database";

export type UnlockContentType = "feed_item" | "prediction" | "event_expert";
export type UnlockMethod = "points" | "subscription" | "ad" | "free";
export type UnlockRow = Tables<"content_unlocks">;

// 특정 콘텐츠 열람 여부
export function useIsUnlocked(
  contentType: UnlockContentType | null | undefined,
  contentId: number | null | undefined,
) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: qk.isUnlocked(userId, contentType ?? "", contentId ?? -1),
    enabled: !!userId && !!contentType && !!contentId,
    queryFn: async () => {
      if (!userId || !contentType || !contentId) return false;
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("content_unlocks")
        .select("id")
        .eq("user_id", userId)
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

// 내 unlock 목록
export function useMyUnlocks() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: qk.unlocks(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [] as UnlockRow[];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("content_unlocks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UnlockRow[];
    },
  });
}

// unlock_content RPC 호출 — 포인트 차감 포함
export function useUnlock() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async (input: {
      contentType: UnlockContentType;
      contentId: number;
      method: UnlockMethod;
      cost?: number;
    }) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc("unlock_content", {
        p_content_type: input.contentType,
        p_content_id: input.contentId,
        p_method: input.method,
        p_cost: input.cost ?? 0,
      });
      if (error) throw error;
      return { id: data as number, ...input };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: qk.isUnlocked(userId, res.contentType, res.contentId),
      });
      queryClient.invalidateQueries({ queryKey: qk.unlocks(userId) });
      queryClient.invalidateQueries({ queryKey: qk.profile(userId) });
      queryClient.invalidateQueries({ queryKey: qk.pointTx(userId) });
    },
  });
}
