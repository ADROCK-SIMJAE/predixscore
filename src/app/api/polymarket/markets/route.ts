import { NextResponse } from "next/server";
import { fetchMarketsDirectory } from "@/lib/polymarket";
import type { MarketSort } from "@/types/polymarket";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "All";
  const sort = (searchParams.get("sort") as MarketSort | null) ?? "trending";
  const limit = Math.max(1, Math.min(120, Number(searchParams.get("limit") ?? 60)));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  try {
    const result = await fetchMarketsDirectory({ q, tag, sort, limit, offset });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Market directory request failed.",
      },
      { status: 502 },
    );
  }
}
