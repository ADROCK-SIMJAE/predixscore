"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { mapPred } from "@/lib/supabase/mappers";
import { useRealtimeChannel } from "@/lib/supabase/realtime";
import { useAuthStore } from "@/store/auth";
import { qk } from "./queryKeys";

// 예측 목록 + 본인 봉인 정보(myPred) + 실시간 구독
export function usePreds(cat?: string) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const queryClient = useQueryClient();

  const onChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["predictions"] });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: qk.myPredictions(userId) });
    }
  }, [queryClient, userId]);

  // predictions INSERT/UPDATE/DELETE 구독 — 새 예측·결과 공개·참여 카운트 변동 실시간 반영
  useRealtimeChannel({
    channel: `preds:list:${cat ?? "all"}`,
    table: "predictions",
    event: "*",
    enabled: true,
    onChange,
  });

  // 본인 user_predictions 변경 구독 — myPred 갱신용
  useRealtimeChannel({
    channel: `preds:my:${userId ?? "anon"}`,
    table: "user_predictions",
    event: "*",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onChange,
  });

  return useQuery({
    queryKey: qk.preds(cat),
    queryFn: async () => {
      const supabase = getSupabase();
      let q = supabase.from("predictions").select("*").order("created_at", { ascending: false });
      if (cat && cat !== "all") q = q.eq("cat", cat);
      const { data, error } = await q;
      if (error) throw error;
      const preds = (data ?? []).map(mapPred);

      // 로그인된 경우 본인 봉인 정보 채우기
      if (userId && preds.length > 0) {
        const ids = preds.map((p) => p.id);
        const { data: myUps } = await supabase
          .from("user_predictions")
          .select("prediction_id, choice")
          .eq("user_id", userId)
          .in("prediction_id", ids);
        const byId = new Map<number, "A" | "B">();
        for (const r of myUps ?? []) {
          byId.set(r.prediction_id, r.choice as "A" | "B");
        }
        return preds.map((p) => ({ ...p, myPred: byId.get(p.id) ?? null }));
      }
      return preds;
    },
  });
}

export function useMyPredictions() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: qk.myPredictions(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("user_predictions")
        .select("*, prediction:predictions(*)")
        .eq("user_id", userId)
        .order("sealed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface SubmitPredictInput {
  predictionId: number;
  choice: "A" | "B";
}

// 예측 봉인 — RLS 가 본인 user_id 만 허용, unique 제약이 중복 봉인 차단
export function useSubmitPrediction() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async ({ predictionId, choice }: SubmitPredictInput) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("user_predictions")
        .insert({ user_id: userId, prediction_id: predictionId, choice })
        .select()
        .single();
      if (error) {
        const msg = error.message ?? "";
        if (msg.includes("duplicate key") || msg.includes("unique"))
          throw new Error("이미 예측을 봉인한 항목입니다.");
        if (msg.includes("violates row-level security"))
          throw new Error("권한이 없습니다. 다시 로그인해 주세요.");
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
      queryClient.invalidateQueries({ queryKey: qk.myPredictions(userId) });
    },
  });
}
