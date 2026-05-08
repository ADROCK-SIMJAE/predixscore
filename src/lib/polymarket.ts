import {
  type EventDetail,
  type HomeSnapshot,
  type MarketSnapshot,
  type MarketSort,
  type OrderBookSummary,
  type PriceHistoryPoint,
} from "@/types/polymarket";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const CLOB_BASE = "https://clob.polymarket.com";

type RawRecord = Record<string, unknown>;

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toNumber(value: unknown) {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : 0;

  return Number.isFinite(numeric) ? numeric : 0;
}

function toText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  revalidate = 120,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    next: { revalidate },
    headers: {
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Polymarket request failed: ${response.status} ${url}`);
  }

  const raw = await response.text();

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Polymarket returned a non-JSON payload for ${url}`);
  }
}

function normalizeMarket(input: RawRecord): MarketSnapshot {
  const outcomes = toArray<string>(input.outcomes);
  const outcomePrices = toArray<string | number>(input.outcomePrices).map(toNumber);
  const tokenIds = toArray<string>(input.clobTokenIds);

  const yesPrice = outcomePrices[0] ?? toNumber(input.lastTradePrice) ?? 0;
  const noPrice = outcomePrices[1] ?? Math.max(0, 1 - yesPrice);
  const probability = yesPrice > 0 ? yesPrice : Math.max(0, Math.min(1, 1 - noPrice));
  const slug =
    toText(input.eventSlug) ||
    toText(input.event_slug) ||
    toText(input.slug) ||
    toText(input.market_slug);
  const marketSlug =
    toText(input.slug) ||
    toText(input.market_slug) ||
    toText(input.conditionId) ||
    slug;

  return {
    id: String(input.id ?? slug),
    slug,
    eventSlug: slug,
    marketSlug,
    question:
      toText(input.question) ||
      toText(input.title) ||
      toText(input.marketQuestion) ||
      "Untitled market",
    subtitle:
      toText(input.subtitle) ||
      toText(input.description).slice(0, 120) ||
      "Live market pricing from Polymarket",
    description:
      toText(input.description) ||
      toText(input.rules) ||
      "This market is synced from Polymarket public data feeds.",
    image: toText(input.image) || null,
    icon: toText(input.icon) || null,
    category:
      toText(input.category) ||
      toText(input.subcategory) ||
      toText(input.groupItemTitle) ||
      "Featured",
    volume: toNumber(input.volume) || toNumber(input.volumeNum),
    volume24h:
      toNumber(input.volume24hr) ||
      toNumber(input.volume24hrClob) ||
      toNumber(input.oneDayVolume),
    liquidity: toNumber(input.liquidity) || toNumber(input.liquidityNum),
    probability,
    yesPrice,
    noPrice,
    active: Boolean(input.active ?? true),
    closed: Boolean(input.closed ?? false),
    featured: Boolean(input.featured ?? false),
    endDate: toText(input.endDate) || toText(input.closedTime) || null,
    openInterest: toNumber(input.openInterest),
    clobTokenIds: tokenIds,
    outcomes: outcomes.length ? outcomes : ["Yes", "No"],
    outcomePrices: outcomePrices.length ? outcomePrices : [probability, 1 - probability],
    minimumTickSize: toText(input.minimum_tick_size) || toText(input.minimumTickSize) || "0.01",
    negRisk: Boolean(input.neg_risk ?? input.negRisk ?? false),
  };
}

function normalizeEvent(input: RawRecord): EventDetail {
  const marketRows = Array.isArray(input.markets) ? (input.markets as RawRecord[]) : [];
  const markets = marketRows.map(normalizeMarket);

  return {
    id: String(input.id ?? input.slug ?? "event"),
    slug: toText(input.slug),
    title: toText(input.title) || toText(input.question) || "Untitled event",
    subtitle: toText(input.subtitle),
    description:
      toText(input.description) ||
      toText(input.rules) ||
      "This event aggregates live market data, liquidity, and order book depth from Polymarket.",
    category:
      toText(input.category) || toText(input.subcategory) || markets[0]?.category || "Featured",
    image: toText(input.image) || null,
    resolutionSource: toText(input.resolutionSource) || null,
    startDate: toText(input.startDate) || null,
    endDate: toText(input.endDate) || null,
    featured: Boolean(input.featured ?? false),
    openInterest: toNumber(input.openInterest),
    liquidity: toNumber(input.liquidity),
    volume: toNumber(input.volume),
    markets,
  };
}

function normalizeEventCard(input: RawRecord): MarketSnapshot {
  const marketRows = Array.isArray(input.markets) ? (input.markets as RawRecord[]) : [];
  const normalizedMarkets = marketRows.map(normalizeMarket);
  const primaryMarket =
    normalizedMarkets.sort((left, right) => right.liquidity - left.liquidity)[0];
  const eventSlug = toText(input.slug);
  const eventTitle = toText(input.title) || primaryMarket?.question || "Untitled event";
  const eventDescription =
    toText(input.description) ||
    toText(input.subtitle) ||
    primaryMarket?.description ||
    "Live market pricing from Polymarket";

  return {
    id: String(input.id ?? eventSlug),
    slug: eventSlug,
    eventSlug,
    marketSlug: primaryMarket?.marketSlug ?? eventSlug,
    question: eventTitle,
    subtitle:
      primaryMarket?.question ||
      toText(input.subtitle) ||
      primaryMarket?.subtitle ||
      eventDescription.slice(0, 120) ||
      "Live event pricing from Polymarket",
    description: eventDescription,
    image: toText(input.image) || primaryMarket?.image || null,
    icon: toText(input.icon) || primaryMarket?.icon || null,
    category:
      toText(input.category) ||
      toText(input.subcategory) ||
      primaryMarket?.category ||
      "Featured",
    volume: toNumber(input.volume) || primaryMarket?.volume || 0,
    volume24h: toNumber(input.volume24hr) || primaryMarket?.volume24h || 0,
    liquidity: toNumber(input.liquidity) || primaryMarket?.liquidity || 0,
    probability: primaryMarket?.probability ?? 0,
    yesPrice: primaryMarket?.yesPrice ?? 0,
    noPrice: primaryMarket?.noPrice ?? 0,
    active: Boolean(input.active ?? primaryMarket?.active ?? true),
    closed: Boolean(input.closed ?? primaryMarket?.closed ?? false),
    featured: Boolean(input.featured ?? primaryMarket?.featured ?? false),
    endDate: toText(input.endDate) || primaryMarket?.endDate || null,
    openInterest: toNumber(input.openInterest) || primaryMarket?.openInterest || 0,
    clobTokenIds: primaryMarket?.clobTokenIds ?? [],
    outcomes: primaryMarket?.outcomes ?? ["Yes", "No"],
    outcomePrices: primaryMarket?.outcomePrices ?? [0, 0],
    minimumTickSize: primaryMarket?.minimumTickSize ?? "0.01",
    negRisk: Boolean(input.negRisk ?? input.enableNegRisk ?? primaryMarket?.negRisk ?? false),
  };
}

function sortMarkets(markets: MarketSnapshot[], sort: MarketSort) {
  return [...markets].sort((left, right) => {
    if (sort === "liquidity") return right.liquidity - left.liquidity;
    if (sort === "ending") {
      return (
        new Date(left.endDate ?? "2999-12-31").getTime() -
        new Date(right.endDate ?? "2999-12-31").getTime()
      );
    }
    if (sort === "new") {
      return Number(right.featured) - Number(left.featured) || right.openInterest - left.openInterest;
    }

    return right.volume24h - left.volume24h || right.volume - left.volume;
  });
}

function buildDirectoryTags(markets: MarketSnapshot[], limit = 10) {
  const counts = new Map<string, number>();

  for (const market of markets) {
    const tag = market.category.trim();

    if (!tag) continue;
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}

export async function fetchActiveMarkets(limit = 600) {
  const pageSize = 100;
  const collected = new Map<string, MarketSnapshot>();
  let offset = 0;

  while (collected.size < limit) {
    const rows = await fetchJson<RawRecord[]>(
      `${GAMMA_BASE}/events?active=true&closed=false&limit=${pageSize}&offset=${offset}`,
    );

    const normalized = rows.map(normalizeEventCard).filter((market) => market.slug);
    let inserted = 0;

    for (const market of normalized) {
      if (!collected.has(market.slug)) {
        collected.set(market.slug, market);
        inserted += 1;
      }
    }

    if (rows.length < pageSize || inserted === 0) {
      break;
    }

    offset += pageSize;
  }

  return [...collected.values()].slice(0, limit);
}

export async function fetchMarketsDirectory(options?: {
  q?: string;
  tag?: string;
  sort?: MarketSort;
  limit?: number;
  offset?: number;
}) {
  const { q = "", tag = "All", sort = "trending", limit = 60, offset = 0 } = options ?? {};
  const markets = await fetchActiveMarkets(800);
  const query = q.trim().toLowerCase();

  const filtered = markets.filter((market) => {
    const matchesQuery =
      !query ||
      market.question.toLowerCase().includes(query) ||
      market.description.toLowerCase().includes(query) ||
      market.category.toLowerCase().includes(query);

    const matchesTag =
      tag === "All" ||
      market.category.toLowerCase() === tag.toLowerCase() ||
      market.question.toLowerCase().includes(tag.toLowerCase());

    return matchesQuery && matchesTag;
  });

  const sorted = sortMarkets(filtered, sort);
  return {
    markets: sorted.slice(offset, offset + limit),
    total: sorted.length,
    hasMore: sorted.length > offset + limit,
  };
}

export async function getHomeSnapshot(): Promise<HomeSnapshot> {
  const markets = await fetchActiveMarkets(600);
  const sorted = sortMarkets(markets, "trending");

  return {
    featured: sorted.slice(0, 3),
    markets: sorted.slice(0, 60),
    watchSeed: sortMarkets(markets, "liquidity").slice(0, 5),
    tags: ["All", ...buildDirectoryTags(markets, 12)],
    stats: {
      totalMarkets: markets.length,
      totalVolume: markets.reduce((sum, market) => sum + market.volume, 0),
      totalLiquidity: markets.reduce((sum, market) => sum + market.liquidity, 0),
      avgProbability:
        markets.reduce((sum, market) => sum + market.probability, 0) / Math.max(markets.length, 1),
    },
  };
}

export async function fetchEventBySlug(slug: string) {
  try {
    const row = await fetchJson<RawRecord>(`${GAMMA_BASE}/events/slug/${slug}`);
    return normalizeEvent(row);
  } catch {
    try {
      const marketRow = await fetchJson<RawRecord>(`${GAMMA_BASE}/markets/slug/${slug}`);
      const eventSlug =
        toText(marketRow.eventSlug) ||
        toText(marketRow.event_slug) ||
        toText(marketRow.slug);

      if (!eventSlug) {
        return null;
      }

      const row = await fetchJson<RawRecord>(`${GAMMA_BASE}/events/slug/${eventSlug}`);
      return normalizeEvent(row);
    } catch {
      return null;
    }
  }
}

export async function fetchOrderBook(tokenId: string): Promise<OrderBookSummary> {
  const row = await fetchJson<RawRecord>(`${CLOB_BASE}/book?token_id=${tokenId}`, undefined, 20);
  const parseSide = (value: unknown) =>
    (Array.isArray(value) ? value : []).map((entry) => {
      const level = entry as RawRecord;

      return {
        price: toNumber(level.price),
        size: toNumber(level.size),
        total: toNumber(level.price) * toNumber(level.size),
      };
    });

  return {
    market: toText(row.market),
    assetId: toText(row.asset_id),
    bids: parseSide(row.bids),
    asks: parseSide(row.asks),
    minOrderSize: toText(row.min_order_size) || "1",
    tickSize: toText(row.tick_size) || "0.01",
    negRisk: Boolean(row.neg_risk ?? false),
    lastTradePrice: toNumber(row.last_trade_price),
    timestamp: toText(row.timestamp),
  };
}

export async function fetchPriceHistory(
  tokenId: string,
  interval = "1d",
  fidelity = 15,
) {
  const history = await fetchJson<{ history: Array<{ t: number; p: number }> }>(
    `${CLOB_BASE}/prices-history?market=${tokenId}&interval=${interval}&fidelity=${fidelity}`,
    undefined,
    60,
  );

  return (history.history ?? []).map(
    (point): PriceHistoryPoint => ({
      t: point.t,
      p: point.p,
    }),
  );
}
