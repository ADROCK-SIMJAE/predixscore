"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import { qk } from "./queryKeys";

export function useDMList() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: qk.dmList(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("conversations")
        .select("*, messages(content, created_at, sender_id)")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDMMessages(conversationId: number | null) {
  return useQuery({
    queryKey: qk.dmMessages(conversationId ?? -1),
    enabled: !!conversationId,
    queryFn: async () => {
      if (!conversationId) return [];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

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
