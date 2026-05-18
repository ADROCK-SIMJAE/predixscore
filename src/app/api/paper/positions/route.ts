import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  PAPER_SESSION_COOKIE,
  summarizePaperPosition,
  type BlockchainCommitRow,
  type PaperPositionRow,
} from "@/lib/paper";
import { fetchEventBySlug } from "@/lib/polymarket";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreatePaperPositionPayload = {
  eventSlug: string;
  eventTitle: string;
  marketSlug: string;
  marketQuestion: string;
  tokenId: string;
  outcomeIndex: number;
  outcomeLabel: string;
  entryPrice: number;
  stakeAmount: number;
};

async function validatePaperMarketPayload(payload: CreatePaperPositionPayload) {
  const event = await fetchEventBySlug(payload.eventSlug);
  if (!event) {
    return { ok: false, error: "Market event could not be verified." };
  }

  const market = event.markets.find((entry) => entry.marketSlug === payload.marketSlug);
  if (!market) {
    return { ok: false, error: "Market could not be verified." };
  }

  if (!market.active || market.closed) {
    return { ok: false, error: "This market is closed or inactive." };
  }

  const tokenId = market.clobTokenIds[payload.outcomeIndex];
  const outcomeLabel = market.outcomes[payload.outcomeIndex];
  const currentPrice = market.outcomePrices[payload.outcomeIndex];

  if (!tokenId || tokenId !== payload.tokenId) {
    return { ok: false, error: "Outcome token could not be verified." };
  }

  if (!outcomeLabel || outcomeLabel !== payload.outcomeLabel) {
    return { ok: false, error: "Outcome label could not be verified." };
  }

  if (!Number.isFinite(currentPrice) || currentPrice <= 0 || currentPrice > 1) {
    return { ok: false, error: "Outcome price is not available." };
  }

  return {
    ok: true,
    event,
    market,
    price: currentPrice,
  };
}

async function getPaperSessionId() {
  const store = await cookies();
  const existing = store.get(PAPER_SESSION_COOKIE)?.value;
  if (existing) return { sessionId: existing, shouldSetCookie: false };
  return { sessionId: crypto.randomUUID(), shouldSetCookie: true };
}

function withPaperCookie(response: NextResponse, sessionId: string, shouldSetCookie: boolean) {
  if (shouldSetCookie) {
    response.cookies.set(PAPER_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const { sessionId, shouldSetCookie } = await getPaperSessionId();
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc("list_paper_positions", {
      p_guest_session_id: sessionId,
      p_user_id: user?.id ?? null,
      p_status_filter: status || null,
    });

    if (error) throw error;

    const rows = (data ?? []) as PaperPositionRow[];
    const uniqueEventSlugs = Array.from(new Set(rows.map((row) => row.event_slug)));
    const eventEntries = await Promise.all(
      uniqueEventSlugs.map(async (slug) => [slug, await fetchEventBySlug(slug)] as const),
    );
    const eventMap = new Map(eventEntries);

    // Fetch any onchain commits the user already made; map by paper_position_id.
    let commitsByPosition = new Map<string, BlockchainCommitRow>();
    if (user) {
      const { data: commitRows } = await supabase
        .from("blockchain_commits")
        .select("*")
        .eq("user_id", user.id);
      if (commitRows) {
        for (const row of commitRows as BlockchainCommitRow[]) {
          commitsByPosition.set(row.paper_position_id, row);
        }
      }
    }

    const positions = rows.map((row) =>
      summarizePaperPosition(
        row,
        eventMap.get(row.event_slug) ?? null,
        commitsByPosition.get(row.id) ?? null,
      ),
    );
    const totals = positions.reduce(
      (acc, position) => {
        acc.staked += position.stakeAmount;
        acc.currentValue += position.currentValue ?? 0;
        acc.pnl += position.pnlAmount ?? 0;
        return acc;
      },
      { staked: 0, currentValue: 0, pnl: 0 },
    );

    return withPaperCookie(
      NextResponse.json({
        positions,
        totals: {
          ...totals,
          pnlPercent: totals.staked > 0 ? totals.pnl / totals.staked : 0,
        },
        identity: {
          userId: user?.id ?? null,
          guestSessionId: sessionId,
        },
      }),
      sessionId,
      shouldSetCookie,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Paper portfolio could not be loaded.",
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreatePaperPositionPayload;
    const { sessionId, shouldSetCookie } = await getPaperSessionId();

    if (
      !payload.eventSlug ||
      !payload.eventTitle ||
      !payload.marketSlug ||
      !payload.marketQuestion ||
      !payload.tokenId ||
      !payload.outcomeLabel ||
      !Number.isFinite(payload.entryPrice) ||
      payload.entryPrice <= 0 ||
      !Number.isFinite(payload.stakeAmount) ||
      payload.stakeAmount <= 0 ||
      !Number.isInteger(payload.outcomeIndex) ||
      payload.outcomeIndex < 0
    ) {
      return NextResponse.json(
        { error: "A complete paper prediction payload is required." },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in required to make a prediction." },
        { status: 401 },
      );
    }

    const verified = await validatePaperMarketPayload(payload);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }

    const shares = Number((payload.stakeAmount / verified.price).toFixed(6));

    const { data, error } = await supabase.rpc("create_paper_position", {
      p_guest_session_id: sessionId,
      p_user_id: user.id,
      p_event_slug: payload.eventSlug,
      p_event_title: payload.eventTitle,
      p_market_slug: payload.marketSlug,
      p_market_question: payload.marketQuestion,
      p_token_id: payload.tokenId,
      p_outcome_index: payload.outcomeIndex,
      p_outcome_label: payload.outcomeLabel,
      p_entry_price: verified.price,
      p_stake_amount: payload.stakeAmount,
      p_shares: shares,
    });

    if (error) throw error;

    const row = data as PaperPositionRow;
    const position = summarizePaperPosition(row, verified.event);

    return withPaperCookie(
      NextResponse.json({ position }, { status: 201 }),
      sessionId,
      shouldSetCookie,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Paper prediction could not be saved.",
      },
      { status: 502 },
    );
  }
}
