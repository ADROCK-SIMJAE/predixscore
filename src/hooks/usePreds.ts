"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { mapPred } from "@/lib/supabase/mappers";
import { useAuthStore } from "@/store/auth";
import { qk } from "./queryKeys";

export function usePreds(cat?: string) {
  return useQuery({
    queryKey: qk.preds(cat),
    queryFn: async () => {
      const supabase = getSupabase();
      let q = supabase.from("predictions").select("*").order("created_at", { ascending: false });
      if (cat && cat !== "all") q = q.eq("cat", cat);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapPred);
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
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
      queryClient.invalidateQueries({ queryKey: qk.myPredictions(userId) });
    },
  });
}
