"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useRealtimeChannel } from "@/lib/supabase/realtime";
import { useAuthStore } from "@/store/auth";
import { qk } from "./queryKeys";

export interface ReactionCount {
  emoji: string;
  count: number;
}

// 예측별 반응 집계 (이모지 → 카운트)
export function useReactions(predId: number | null | undefined) {
  const queryClient = useQueryClient();

  const onChange = useCallback(() => {
    if (!predId) return;
    queryClient.invalidateQueries({ queryKey: qk.reactions(predId) });
    queryClient.invalidateQueries({ queryKey: ["me", "reactions"] });
  }, [queryClient, predId]);

  useRealtimeChannel({
    channel: `reactions:${predId ?? 0}`,
    table: "reactions",
    event: "*",
    filter: predId ? `prediction_id=eq.${predId}` : undefined,
    enabled: !!predId,
    onChange,
  });

  return useQuery({
    queryKey: qk.reactions(predId ?? -1),
    enabled: !!predId,
    queryFn: async (): Promise<ReactionCount[]> => {
      if (!predId) return [];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("reactions")
        .select("emoji")
        .eq("prediction_id", predId);
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) {
        map.set(row.emoji, (map.get(row.emoji) ?? 0) + 1);
      }
      return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
    },
  });
}

// 내가 누른 이모지 set
export function useMyReactions(predId: number | null | undefined) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: qk.myReactions(userId, predId ?? -1),
    enabled: !!userId && !!predId,
    queryFn: async () => {
      if (!userId || !predId) return new Set<string>();
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("reactions")
        .select("emoji")
        .eq("user_id", userId)
        .eq("prediction_id", predId);
      if (error) throw error;
      return new Set<string>((data ?? []).map((r) => r.emoji));
    },
  });
}

// 반응 토글 — 동일 (user, pred, emoji) 가 있으면 delete, 없으면 insert
export function useToggleReaction() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async ({ predId, emoji }: { predId: number; emoji: string }) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from("reactions")
        .select("id")
        .eq("user_id", userId)
        .eq("prediction_id", predId)
        .eq("emoji", emoji)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
        if (error) throw error;
        return { reacted: false, predId, emoji };
      }
      const { error } = await supabase.from("reactions").insert({
        user_id: userId,
        prediction_id: predId,
        emoji,
      });
      if (error) throw error;
      return { reacted: true, predId, emoji };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: qk.reactions(res.predId) });
      queryClient.invalidateQueries({ queryKey: qk.myReactions(userId, res.predId) });
    },
  });
}
