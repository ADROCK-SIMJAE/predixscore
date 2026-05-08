import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ name: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { name } = await params;
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("get_profile_by_name", { p_name: name });
    if (error) throw error;
    const row = data?.[0];
    if (!row || !row.user_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({
      profile: {
        userId: row.user_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        totalPredictions: Number(row.total_predictions ?? 0),
        wonCount: Number(row.won_count ?? 0),
        lostCount: Number(row.lost_count ?? 0),
        winRate: Number(row.win_rate ?? 0),
        realizedPnl: Number(row.realized_pnl ?? 0),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Profile query failed." },
      { status: 502 },
    );
  }
}
