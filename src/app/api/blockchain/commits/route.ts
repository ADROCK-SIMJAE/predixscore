import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RecordCommitPayload = {
  paperPositionId: string;
  walletAddress: string;
  chainId: number;
  contractAddress: string;
  commitId: string | null;
  commitHash: string;
  marketRef: string;
  txHash: string;
  blockNumber: number | null;
  revealAfterUnix: number;
  encryptedPayload?: string | null;
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const { data, error } = await supabase.rpc("list_blockchain_commits", {
      p_user_id: user.id,
    });
    if (error) throw error;
    return NextResponse.json({ commits: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load commits." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RecordCommitPayload;
    if (
      !payload.paperPositionId ||
      !payload.walletAddress ||
      !payload.commitHash ||
      !payload.marketRef ||
      !payload.txHash ||
      !payload.contractAddress ||
      typeof payload.chainId !== "number" ||
      typeof payload.revealAfterUnix !== "number"
    ) {
      return NextResponse.json({ error: "Invalid commit payload." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("record_blockchain_commit", {
      p_paper_position_id: payload.paperPositionId,
      p_wallet_address: payload.walletAddress,
      p_chain_id: payload.chainId,
      p_contract_address: payload.contractAddress,
      p_commit_id: payload.commitId,
      p_commit_hash: payload.commitHash,
      p_market_ref: payload.marketRef,
      p_tx_hash: payload.txHash,
      p_block_number: payload.blockNumber,
      p_reveal_after: new Date(payload.revealAfterUnix * 1000).toISOString(),
      p_encrypted_payload: payload.encryptedPayload ?? null,
    });

    if (error) throw error;
    return NextResponse.json({ commit: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record commit." },
      { status: 502 },
    );
  }
}
