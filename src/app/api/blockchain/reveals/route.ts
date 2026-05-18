import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RecordRevealPayload = {
  commitRowId: string;
  revealTxHash: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RecordRevealPayload;
    if (!payload.commitRowId || !payload.revealTxHash) {
      return NextResponse.json({ error: "Invalid reveal payload." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("record_blockchain_reveal", {
      p_commit_row_id: payload.commitRowId,
      p_reveal_tx_hash: payload.revealTxHash,
    });

    if (error) throw error;
    return NextResponse.json({ commit: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record reveal." },
      { status: 502 },
    );
  }
}
