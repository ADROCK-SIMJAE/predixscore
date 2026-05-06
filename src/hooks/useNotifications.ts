"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useRealtimeChannel } from "@/lib/supabase/realtime";
import { useAuthStore } from "@/store/auth";
import { qk } from "./queryKeys";
import type { Tables } from "@/types/database";

export type NotificationRow = Tables<"notifications">;

// 내 알림 목록 (최신 50개) + 실시간 INSERT 구독
export function useNotifications() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const queryClient = useQueryClient();

  const onChange = useCallback(() => {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: qk.notifications(userId) });
  }, [queryClient, userId]);

  useRealtimeChannel({
    channel: `notifications:${userId ?? "anon"}`,
    table: "notifications",
    event: "INSERT",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onChange,
  });

  return useQuery({
    queryKey: qk.notifications(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [] as NotificationRow[];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });
}

// 안읽은 알림 수 — useNotifications 결과에서 파생
export function useUnreadCount() {
  const { data } = useNotifications();
  return (data ?? []).filter((n) => !n.is_read).length;
}

// 단일 알림 읽음 처리
export function useMarkRead() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useMutation({
    mutationFn: async (id: number) => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications(userId) });
    },
  });
}

// 전체 읽음 처리
export function useMarkAllRead() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const supabase = getSupabase();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications(userId) });
    },
  });
}
