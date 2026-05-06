"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useRealtimeChannel } from "@/lib/supabase/realtime";
import { useAuthStore } from "@/store/auth";
import { qk } from "./queryKeys";
import type { Tables } from "@/types/database";

type Message = Tables<"messages">;
type ProfileLite = Pick<
  Tables<"profiles">,
  "id" | "handle" | "avatar_url" | "grade" | "name"
>;

export interface DMConversationRow {
  id: number;
  user_a: string;
  user_b: string;
  last_message_at: string | null;
  created_at: string;
  a: ProfileLite | null;
  b: ProfileLite | null;
  messages: Pick<Message, "content" | "created_at" | "sender_id">[];
}

// DM 목록 + 상대방 프로필 + 마지막 메시지 미리보기
export function useDMList() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const queryClient = useQueryClient();

  // 메시지 INSERT 시 목록 invalidate (필터 없이 전체 — RLS 가 본인 대화만 통과시킴)
  const onMessage = useCallback(() => {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: qk.dmList(userId) });
  }, [queryClient, userId]);

  useRealtimeChannel({
    channel: `dm_list:${userId ?? "anon"}`,
    table: "messages",
    event: "INSERT",
    enabled: !!userId,
    onChange: onMessage,
  });

  return useQuery({
    queryKey: qk.dmList(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          *,
          a:profiles!conversations_user_a_fkey(id,handle,avatar_url,grade,name),
          b:profiles!conversations_user_b_fkey(id,handle,avatar_url,grade,name),
          messages(content, created_at, sender_id)
          `,
        )
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as DMConversationRow[];
    },
  });
}

// DM 메시지 목록 + 실시간 INSERT 구독
export function useDMMessages(conversationId: number | null | undefined) {
  const queryClient = useQueryClient();

  const onInsert = useCallback(
    (payload: { new?: Message }) => {
      if (!conversationId) return;
      const newMsg = payload?.new;
      if (!newMsg) return;
      queryClient.setQueryData<Message[]>(qk.dmMessages(conversationId), (prev) => {
        const list = prev ?? [];
        // 중복 가드
        if (list.some((m) => m.id === newMsg.id)) return list;
        return [...list, newMsg];
      });
    },
    [conversationId, queryClient],
  );

  useRealtimeChannel({
    channel: `dm_messages:${conversationId ?? 0}`,
    table: "messages",
    event: "INSERT",
    filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
    enabled: !!conversationId,
    onChange: onInsert,
  });

  return useQuery({
    queryKey: qk.dmMessages(conversationId ?? -1),
    enabled: !!conversationId,
    queryFn: async () => {
      if (!conversationId) return [] as Message[];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });
}

// 메시지 전송
export function useSendMessage() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: userId, content })
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: qk.dmMessages(vars.conversationId) });
      queryClient.invalidateQueries({ queryKey: qk.dmList(userId) });
    },
  });
}

// 1:1 대화 시작 (idempotent RPC)
export function useStartConversation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc("start_conversation", {
        p_other_user: otherUserId,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.dmList(userId) });
    },
  });
}
