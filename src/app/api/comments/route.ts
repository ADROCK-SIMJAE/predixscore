import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// 단일 댓글 응답 형태 (UI 친화적인 카멜케이스)
type CommentDTO = {
  id: string;
  body: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  likeCount: number;
  likedByMe: boolean;
};

type CreateCommentPayload = {
  eventSlug: string;
  body: string;
};

const SORT_KEYS = new Set(["newest", "popular"]);
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

// GET /api/comments?eventSlug=xxx&sort=newest|popular&limit=50
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const eventSlug = url.searchParams.get("eventSlug");
    const sortParam = url.searchParams.get("sort") ?? "newest";
    const sort = SORT_KEYS.has(sortParam) ? sortParam : "newest";
    const limitRaw = Number(url.searchParams.get("limit"));
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.floor(limitRaw), MAX_LIMIT)
        : DEFAULT_LIMIT;

    if (!eventSlug) {
      return NextResponse.json(
        { error: "eventSlug query param is required." },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc("list_event_comments", {
      p_event_slug: eventSlug,
      p_sort: sort,
      p_user_id: user?.id ?? null,
      p_limit: limit,
    });

    if (error) throw error;

    const comments: CommentDTO[] = (data ?? []).map((row) => ({
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        displayName: row.display_name ?? null,
        avatarUrl: row.avatar_url ?? null,
      },
      likeCount: Number(row.like_count ?? 0),
      likedByMe: Boolean(row.liked_by_me),
    }));

    return NextResponse.json({ comments });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load comments.",
      },
      { status: 502 },
    );
  }
}

// POST /api/comments  body: { eventSlug, body }
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<CreateCommentPayload>;
    const eventSlug = typeof payload.eventSlug === "string" ? payload.eventSlug.trim() : "";
    const rawBody = typeof payload.body === "string" ? payload.body : "";
    const body = rawBody.trim();

    if (!eventSlug) {
      return NextResponse.json({ error: "eventSlug is required." }, { status: 400 });
    }
    if (body.length < 1 || body.length > 1000) {
      return NextResponse.json(
        { error: "Comment must be between 1 and 1000 characters." },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in required to comment." },
        { status: 401 },
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("event_comments")
      .insert({ user_id: user.id, event_slug: eventSlug, body })
      .select("id, body, created_at, user_id, event_slug")
      .single();

    if (insertError) throw insertError;

    // 작성자 프로필 같이 로드 (UI 즉시 표시용)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    const comment: CommentDTO = {
      id: inserted.id,
      body: inserted.body,
      createdAt: inserted.created_at,
      user: {
        id: user.id,
        displayName: profile?.display_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      },
      likeCount: 0,
      likedByMe: false,
    };

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save comment.",
      },
      { status: 502 },
    );
  }
}
