import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSponsorConfigured, sponsorReveal } from "@/lib/blockchain/sponsor";

type SponsoredRevealPayload = {
  commitRowId: string;
  commitId: string;
  outcomeIndex: number;
  stakeAmount: number;
  entryPrice: number;
  salt: `0x${string}`;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SponsoredRevealPayload;
    if (
      !payload.commitRowId ||
      !payload.commitId ||
      !payload.salt ||
      !Number.isFinite(payload.stakeAmount) ||
      !Number.isFinite(payload.entryPrice) ||
      typeof payload.outcomeIndex !== "number"
    ) {
      return NextResponse.json({ error: "Invalid reveal payload." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    if (!isSponsorConfigured()) {
      return NextResponse.json(
        { error: "Onchain sponsorship is not configured on the server." },
        { status: 501 },
      );
    }

    const tx = await sponsorReveal({
      commitId: BigInt(payload.commitId),
      outcomeIndex: payload.outcomeIndex,
      stakeAmount: payload.stakeAmount,
      entryPrice: payload.entryPrice,
      salt: payload.salt,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("record_blockchain_reveal", {
      p_commit_row_id: payload.commitRowId,
      p_reveal_tx_hash: tx.txHash,
    });

    if (error) throw error;
    return NextResponse.json({ commit: data, tx });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record reveal." },
      { status: 502 },
    );
  }
}
