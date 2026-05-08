import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { resolveByEventSlug } from "@/lib/polymarket-resolution";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PAPER_SESSION_COOKIE } from "@/lib/paper";
import { cookies } from "next/headers";

/**
 * 종료된 시장을 자동 정산.
 * - 본인의 pending 포지션이 속한 이벤트들을 가져와 Polymarket resolution 확인
 * - settle_market RPC 를 service role 로 호출하여 정산 트리거
 */
export async function POST() {
  try {
    const store = await cookies();
    const sessionId = store.get(PAPER_SESSION_COOKIE)?.value;
    const userSupabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await userSupabase.auth.getUser();

    if (!sessionId && !user) {
      return NextResponse.json({ settled: 0, checked: 0 });
    }

    // 1. pending 포지션 이벤트 슬러그 수집
    const { data: pending, error: pendingError } = await userSupabase.rpc("list_paper_positions", {
      p_guest_session_id: sessionId ?? "00000000-0000-0000-0000-000000000000",
      p_user_id: user?.id ?? null,
      p_status_filter: "pending",
    });
    if (pendingError) throw pendingError;

    const slugs = Array.from(new Set((pending ?? []).map((row) => row.event_slug)));
    if (slugs.length === 0) {
      return NextResponse.json({ settled: 0, checked: 0 });
    }

    // 2. Polymarket 에서 resolution 추출
    const allResolutions = (
      await Promise.all(slugs.map((slug) => resolveByEventSlug(slug)))
    ).flat();

    if (allResolutions.length === 0) {
      return NextResponse.json({ settled: 0, checked: slugs.length });
    }

    // 3. service role 로 settle_market 호출 (없으면 중단)
    let service;
    try {
      service = createServiceSupabaseClient();
    } catch {
      return NextResponse.json(
        {
          settled: 0,
          checked: slugs.length,
          warning: "SUPABASE_SERVICE_ROLE_KEY not configured. Resolutions detected but cannot be applied.",
          detected: allResolutions,
        },
        { status: 200 },
      );
    }

    let totalSettled = 0;
    for (const r of allResolutions) {
      const { data, error } = await service.rpc("settle_market", {
        p_market_slug: r.marketSlug,
        p_event_slug: r.eventSlug,
        p_winning_outcome_index: r.winningOutcomeIndex,
      });
      if (error) continue;
      totalSettled += Number(data ?? 0);
    }

    return NextResponse.json({
      settled: totalSettled,
      checked: slugs.length,
      resolutions: allResolutions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Settlement failed." },
      { status: 502 },
    );
  }
}
