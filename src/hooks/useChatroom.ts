"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useRealtimeChannel } from "@/lib/supabase/realtime";
import { useAuthStore } from "@/store/auth";
import { qk } from "./queryKeys";
import type { Tables } from "@/types/database";

type ChatroomMessage = Tables<"chatroom_messages">;
type ProfileLite = Pick<
  Tables<"profiles">,
  "id" | "handle" | "avatar_url" | "grade" | "name"
>;

export interface ChatroomMessageRow extends ChatroomMessage {
  profile: ProfileLite | null;
}

// 채팅방 메시지 목록 + 실시간 INSERT 구독 (낙관적 append)
export function useChatroomMessages(expertId: number | null | undefined) {
  const queryClient = useQueryClient();

  const onInsert = useCallback(
    async (payload: { new?: ChatroomMessage }) => {
      if (!expertId) return;
      const newMsg = payload?.new;
      if (!newMsg) return;
      // 작성자 프로필 보강
      const supabase = getSupabase();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id,handle,avatar_url,grade,name")
        .eq("id", newMsg.user_id)
        .maybeSingle();
      const enriched: ChatroomMessageRow = {
        ...newMsg,
        profile: profile as ProfileLite | null,
      };
      queryClient.setQueryData<ChatroomMessageRow[]>(qk.chatroom(expertId), (prev) => {
        const list = prev ?? [];
        if (list.some((m) => m.id === enriched.id)) return list;
        return [...list, enriched];
      });
    },
    [expertId, queryClient],
  );

  useRealtimeChannel({
    channel: `chatroom:${expertId ?? 0}`,
    table: "chatroom_messages",
    event: "INSERT",
    filter: expertId ? `expert_id=eq.${expertId}` : undefined,
    enabled: !!expertId,
    onChange: onInsert,
  });

  return useQuery({
    queryKey: qk.chatroom(expertId ?? -1),
    enabled: !!expertId,
    queryFn: async () => {
      if (!expertId) return [] as ChatroomMessageRow[];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("chatroom_messages")
        .select(
          "*, profile:profiles!chatroom_messages_user_id_fkey(id,handle,avatar_url,grade,name)",
        )
        .eq("expert_id", expertId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as ChatroomMessageRow[];
    },
  });
}

// 채팅방 메시지 전송
export function useSendChatroomMessage() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async ({ expertId, content }: { expertId: number; content: string }) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("chatroom_messages")
        .insert({ expert_id: expertId, user_id: userId, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: qk.chatroom(vars.expertId) });
    },
  });
}
