import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getChainConfig } from "@/lib/blockchain/config";
import { isSponsorConfigured, sponsorCommit } from "@/lib/blockchain/sponsor";

type SponsoredCommitPayload = {
  paperPositionId: string;
  walletAddress: `0x${string}`;
  commitHash: `0x${string}`;
  marketRef: `0x${string}`;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("list_blockchain_commits", {
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
    const payload = (await request.json()) as SponsoredCommitPayload;
    if (
      !payload.paperPositionId ||
      !payload.walletAddress ||
      !payload.commitHash ||
      !payload.marketRef ||
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

    if (!isSponsorConfigured()) {
      return NextResponse.json(
        { error: "Onchain sponsorship is not configured on the server." },
        { status: 501 },
      );
    }

    // Server pays gas + submits commit using the user's wallet address.
    const chainCfg = getChainConfig();
    const tx = await sponsorCommit({
      user: payload.walletAddress,
      commitHash: payload.commitHash,
      marketRef: payload.marketRef,
      revealAfterUnix: payload.revealAfterUnix,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("record_blockchain_commit", {
      p_paper_position_id: payload.paperPositionId,
      p_wallet_address: payload.walletAddress,
      p_chain_id: chainCfg.chainId,
      p_contract_address: chainCfg.registryAddress,
      p_commit_id: tx.commitId,
      p_commit_hash: payload.commitHash,
      p_market_ref: payload.marketRef,
      p_tx_hash: tx.txHash,
      p_block_number: tx.blockNumber,
      p_reveal_after: new Date(payload.revealAfterUnix * 1000).toISOString(),
      p_encrypted_payload: payload.encryptedPayload ?? null,
    });

    if (error) throw error;
    return NextResponse.json(
      {
        commit: data,
        tx: {
          hash: tx.txHash,
          blockNumber: tx.blockNumber,
          commitId: tx.commitId,
          sponsor: tx.sponsorAddress,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record commit." },
      { status: 502 },
    );
  }
}
