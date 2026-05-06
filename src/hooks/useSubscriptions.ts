"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import { mapExpert } from "@/lib/supabase/mappers";
import { qk } from "./queryKeys";
import type { Tables } from "@/types/database";

type SubscriptionRow = Tables<"expert_subscriptions"> & {
  expert: Tables<"experts"> | null;
};

// 내 구독 목록 + experts join
export function useMySubscriptions() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: qk.subscriptions(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("expert_subscriptions")
        .select("*, expert:experts(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as SubscriptionRow[]).map((row) => ({
        ...row,
        expert: row.expert ? mapExpert(row.expert) : null,
      }));
    },
  });
}

// 특정 전문가 구독 여부
export function useIsSubscribed(expertId: number | null | undefined) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: qk.isSubscribed(userId, expertId ?? -1),
    enabled: !!userId && !!expertId,
    queryFn: async () => {
      if (!userId || !expertId) return false;
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("expert_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("expert_id", expertId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

// 구독 토글 — 있으면 delete, 없으면 insert
export function useToggleSubscription() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async (expertId: number) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from("expert_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("expert_id", expertId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("expert_subscriptions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { subscribed: false, expertId };
      }
      const { error } = await supabase
        .from("expert_subscriptions")
        .insert({ user_id: userId, expert_id: expertId });
      if (error) throw error;
      return { subscribed: true, expertId };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: qk.isSubscribed(userId, res.expertId) });
      queryClient.invalidateQueries({ queryKey: qk.subscriptions(userId) });
      queryClient.invalidateQueries({ queryKey: qk.experts });
      queryClient.invalidateQueries({ queryKey: qk.expert(res.expertId) });
    },
  });
}
