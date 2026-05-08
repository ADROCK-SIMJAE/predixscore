import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 50)));
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("list_leaderboard", { p_limit: limit });
    if (error) throw error;

    const entries = (data ?? []).map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      totalPredictions: Number(row.total_predictions ?? 0),
      wonCount: Number(row.won_count ?? 0),
      lostCount: Number(row.lost_count ?? 0),
      winRate: Number(row.win_rate ?? 0),
      realizedPnl: Number(row.realized_pnl ?? 0),
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Leaderboard query failed." },
      { status: 502 },
    );
  }
}
