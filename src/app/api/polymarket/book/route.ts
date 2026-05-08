import { NextResponse } from "next/server";
import { fetchOrderBook } from "@/lib/polymarket";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("tokenId");

  if (!tokenId) {
    return NextResponse.json({ error: "tokenId is required" }, { status: 400 });
  }

  try {
    const book = await fetchOrderBook(tokenId);
    return NextResponse.json({ book });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Order book request failed.",
      },
      { status: 502 },
    );
  }
}
