"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import { qk } from "./queryKeys";
import type { Tables } from "@/types/database";
import type { GradeKey } from "@/types";

export type ChallengeApp = Tables<"challenge_applications">;

// 내 챌린지 신청 이력
export function useMyChallengeApps() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: qk.challengeApps(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [] as ChallengeApp[];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("challenge_applications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChallengeApp[];
    },
  });
}

// 챌린지 신청
export function useApplyChallenge() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async ({
      targetGrade,
      motivation,
    }: {
      targetGrade: GradeKey;
      motivation?: string;
    }) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("challenge_applications")
        .insert({
          user_id: userId,
          target_grade: targetGrade,
          motivation: motivation ?? null,
        })
        .select()
        .single();
      if (error) {
        // unique_violation 등 한국어 메시지로 변환
        const msg = error.message ?? "";
        if (msg.includes("duplicate key") || msg.includes("unique")) {
          throw new Error("이미 진행 중인 도전 신청이 있습니다.");
        }
        if (msg.includes("violates row-level security")) {
          throw new Error("권한이 없습니다. 로그인 상태를 확인해 주세요.");
        }
        throw new Error(msg || "도전 신청에 실패했습니다.");
      }
      return data as ChallengeApp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.challengeApps(userId) });
    },
  });
}
