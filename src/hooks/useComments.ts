"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useRealtimeChannel } from "@/lib/supabase/realtime";
import { useAuthStore } from "@/store/auth";
import { qk } from "./queryKeys";
import type { Tables } from "@/types/database";

type ProfileLite = Pick<
  Tables<"profiles">,
  "id" | "handle" | "avatar_url" | "grade" | "name"
>;

export interface CommentRow extends Tables<"comments"> {
  profile: ProfileLite | null;
}

// 댓글 목록 + 작성자 프로필 + 실시간 invalidate
export function useComments(predId: number | null | undefined) {
  const queryClient = useQueryClient();

  const onChange = useCallback(() => {
    if (!predId) return;
    queryClient.invalidateQueries({ queryKey: qk.comments(predId) });
  }, [queryClient, predId]);

  useRealtimeChannel({
    channel: `comments:${predId ?? 0}`,
    table: "comments",
    event: "*",
    filter: predId ? `prediction_id=eq.${predId}` : undefined,
    enabled: !!predId,
    onChange,
  });

  return useQuery({
    queryKey: qk.comments(predId ?? -1),
    enabled: !!predId,
    queryFn: async () => {
      if (!predId) return [] as CommentRow[];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("comments")
        .select("*, profile:profiles!comments_user_id_fkey(id,handle,avatar_url,grade,name)")
        .eq("prediction_id", predId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CommentRow[];
    },
  });
}

// 댓글 작성
export function useAddComment() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async ({ predId, content }: { predId: number; content: string }) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("comments")
        .insert({ prediction_id: predId, user_id: userId, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: qk.comments(vars.predId) });
    },
  });
}

// 댓글 삭제 (본인만)
export function useDeleteComment() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async ({ commentId, predId }: { commentId: number; predId: number }) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", userId);
      if (error) throw error;
      return { commentId, predId };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: qk.comments(res.predId) });
    },
  });
}

// 내가 좋아요 누른 댓글 ID Set
export function useMyCommentLikes(predId: number | null | undefined) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: qk.myCommentLikes(userId, predId ?? -1),
    enabled: !!userId && !!predId,
    queryFn: async () => {
      if (!userId || !predId) return new Set<number>();
      const supabase = getSupabase();
      // comment_likes 에 prediction_id 가 없으므로 comments 조인으로 필터
      const { data, error } = await supabase
        .from("comment_likes")
        .select("comment_id, comments!inner(prediction_id)")
        .eq("user_id", userId)
        .eq("comments.prediction_id", predId);
      if (error) throw error;
      return new Set<number>((data ?? []).map((r: { comment_id: number }) => r.comment_id));
    },
  });
}

// 좋아요 토글 + comments.likes 카운트 동기화
export function useToggleCommentLike() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async ({ commentId, predId }: { commentId: number; predId: number }) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from("comment_likes")
        .select("id")
        .eq("user_id", userId)
        .eq("comment_id", commentId)
        .maybeSingle();
      if (existing) {
        const { error: delErr } = await supabase
          .from("comment_likes")
          .delete()
          .eq("id", existing.id);
        if (delErr) throw delErr;
        // likes 카운트 감소
        const { data: cur } = await supabase
          .from("comments")
          .select("likes")
          .eq("id", commentId)
          .maybeSingle();
        const cnt = Math.max(0, (cur?.likes ?? 1) - 1);
        await supabase.from("comments").update({ likes: cnt }).eq("id", commentId);
        return { liked: false, predId };
      }
      const { error: insErr } = await supabase
        .from("comment_likes")
        .insert({ user_id: userId, comment_id: commentId });
      if (insErr) throw insErr;
      const { data: cur } = await supabase
        .from("comments")
        .select("likes")
        .eq("id", commentId)
        .maybeSingle();
      const cnt = (cur?.likes ?? 0) + 1;
      await supabase.from("comments").update({ likes: cnt }).eq("id", commentId);
      return { liked: true, predId };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: qk.myCommentLikes(userId, res.predId) });
      queryClient.invalidateQueries({ queryKey: qk.comments(res.predId) });
    },
  });
}
