import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// DELETE /api/comments/:id — 자기 댓글만 삭제
export async function DELETE(
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
        { error: "Sign in required." },
        { status: 401 },
      );
    }

    // RLS 정책으로 자기 댓글만 삭제됨 — id 매치 + user_id 매치 동시 강제
    const { error } = await supabase
      .from("event_comments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not delete comment.",
      },
      { status: 502 },
    );
  }
}
