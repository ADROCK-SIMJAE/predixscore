import { NextResponse } from "next/server";
import { fetchPriceHistory } from "@/lib/polymarket";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get("market");
  const interval = searchParams.get("interval") ?? "1d";
  const fidelity = Number(searchParams.get("fidelity") ?? "15");

  if (!market) {
    return NextResponse.json({ error: "market is required" }, { status: 400 });
  }

  try {
    const history = await fetchPriceHistory(market, interval, fidelity);
    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Price history request failed.",
      },
      { status: 502 },
    );
  }
}
