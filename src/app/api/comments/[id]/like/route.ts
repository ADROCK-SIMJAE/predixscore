import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// POST /api/comments/:id/like — 좋아요 토글
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in required to like." },
        { status: 401 },
      );
    }

    // 댓글 존재 확인
    const { data: comment, error: commentError } = await supabase
      .from("event_comments")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (commentError) throw commentError;
    if (!comment) {
      return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    }

    // 기존 좋아요 확인 → 토글
    const { data: existing, error: existingError } = await supabase
      .from("event_comment_likes")
      .select("comment_id")
      .eq("comment_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      const { error: deleteError } = await supabase
        .from("event_comment_likes")
        .delete()
        .eq("comment_id", id)
        .eq("user_id", user.id);
      if (deleteError) throw deleteError;
    } else {
      const { error: insertError } = await supabase
        .from("event_comment_likes")
        .insert({ comment_id: id, user_id: user.id });
      if (insertError) throw insertError;
    }

    // 최신 카운트 조회
    const { count, error: countError } = await supabase
      .from("event_comment_likes")
      .select("comment_id", { count: "exact", head: true })
      .eq("comment_id", id);
    if (countError) throw countError;

    return NextResponse.json({
      liked: !existing,
      likeCount: count ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not toggle like.",
      },
      { status: 502 },
    );
  }
}
