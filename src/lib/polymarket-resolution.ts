import { fetchEventBySlug } from "@/lib/polymarket";

/**
 * Polymarket event 데이터에서 정산 가능한 마켓을 추출.
 * - market.closed === true 이고 outcomePrices 가 [1,0] 또는 [0,1] 형태로 확정됐을 때 winning index 결정
 * - 모호한 경우 (둘 다 0.5 등) 는 null 반환
 */
export type ResolvableMarket = {
  marketSlug: string;
  eventSlug: string;
  winningOutcomeIndex: number;
};

export function detectResolutions(
  event: Awaited<ReturnType<typeof fetchEventBySlug>>,
): ResolvableMarket[] {
  if (!event) return [];

  const resolutions: ResolvableMarket[] = [];
  for (const market of event.markets) {
    if (!market.closed) continue;
    const prices = market.outcomePrices ?? [];
    if (prices.length < 2) continue;
    const winning = prices.findIndex((p) => p >= 0.99);
    const losing = prices.findIndex((p) => p <= 0.01);
    if (winning < 0 || losing < 0 || winning === losing) continue;
    resolutions.push({
      marketSlug: market.marketSlug,
      eventSlug: event.slug,
      winningOutcomeIndex: winning,
    });
  }
  return resolutions;
}

export async function resolveByEventSlug(eventSlug: string): Promise<ResolvableMarket[]> {
  const event = await fetchEventBySlug(eventSlug);
  return detectResolutions(event);
}
