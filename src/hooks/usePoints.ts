"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import { useMyProfile } from "./useProfile";
import { qk } from "./queryKeys";
import type { Tables } from "@/types/database";

export type PointTxRow = Tables<"point_transactions">;

// 보유 포인트 — useMyProfile 결과에서 파생
export function usePointBalance() {
  const { data } = useMyProfile();
  return data?.points ?? 0;
}

// 포인트 거래 내역 (최근 50건)
export function usePointTransactions() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: qk.pointTx(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [] as PointTxRow[];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("point_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as PointTxRow[];
    },
  });
}

// 포인트 충전 — charge_points RPC
export function useTopupPoints() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      if (amount <= 0) throw new Error("충전 금액은 1P 이상이어야 합니다.");
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc("charge_points", {
        p_amount: amount,
        p_reason: "topup",
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.profile(userId) });
      queryClient.invalidateQueries({ queryKey: qk.pointTx(userId) });
    },
  });
}
