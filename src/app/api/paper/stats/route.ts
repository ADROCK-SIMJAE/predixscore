import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PAPER_SESSION_COOKIE } from "@/lib/paper";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const store = await cookies();
    const sessionId = store.get(PAPER_SESSION_COOKIE)?.value ?? null;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc("get_user_stats", {
      p_user_id: user?.id ?? null,
      p_guest_session_id: sessionId,
    });

    if (error) throw error;

    const stats = data?.[0] ?? {
      total_predictions: 0,
      pending_count: 0,
      won_count: 0,
      lost_count: 0,
      win_rate: 0,
      total_staked: 0,
      pending_staked: 0,
      realized_pnl: 0,
      available_balance: 10000,
      starting_balance: 10000,
    };

    return NextResponse.json({
      stats: {
        totalPredictions: Number(stats.total_predictions ?? 0),
        pendingCount: Number(stats.pending_count ?? 0),
        wonCount: Number(stats.won_count ?? 0),
        lostCount: Number(stats.lost_count ?? 0),
        winRate: Number(stats.win_rate ?? 0),
        totalStaked: Number(stats.total_staked ?? 0),
        pendingStaked: Number(stats.pending_staked ?? 0),
        realizedPnl: Number(stats.realized_pnl ?? 0),
        availableBalance: Number(stats.available_balance ?? 10000),
        startingBalance: Number(stats.starting_balance ?? 10000),
      },
      identity: { userId: user?.id ?? null, guestSessionId: sessionId },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stats query failed." },
      { status: 502 },
    );
  }
}
