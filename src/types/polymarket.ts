export type MarketSort = "trending" | "liquidity" | "ending" | "new";

export type MarketSnapshot = {
  id: string;
  slug: string;
  eventSlug: string;
  marketSlug: string;
  question: string;
  subtitle: string;
  description: string;
  image: string | null;
  icon: string | null;
  category: string;
  volume: number;
  volume24h: number;
  liquidity: number;
  probability: number;
  yesPrice: number;
  noPrice: number;
  active: boolean;
  closed: boolean;
  featured: boolean;
  endDate: string | null;
  openInterest: number;
  clobTokenIds: string[];
  outcomes: string[];
  outcomePrices: number[];
  minimumTickSize: string;
  negRisk: boolean;
};

export type EventDetail = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  image: string | null;
  resolutionSource: string | null;
  startDate: string | null;
  endDate: string | null;
  featured: boolean;
  openInterest: number;
  liquidity: number;
  volume: number;
  markets: MarketSnapshot[];
};

export type HomeSnapshot = {
  featured: MarketSnapshot[];
  markets: MarketSnapshot[];
  watchSeed: MarketSnapshot[];
  tags: string[];
  stats: {
    totalMarkets: number;
    totalVolume: number;
    totalLiquidity: number;
    avgProbability: number;
  };
};

export type OrderBookLevel = {
  price: number;
  size: number;
  total: number;
};

export type OrderBookSummary = {
  market: string;
  assetId: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  minOrderSize: string;
  tickSize: string;
  negRisk: boolean;
  lastTradePrice: number;
  timestamp: string;
};

export type PriceHistoryPoint = {
  t: number;
  p: number;
};

export type PaperPosition = {
  id: string;
  eventSlug: string;
  eventTitle: string;
  marketSlug: string;
  marketQuestion: string;
  outcomeLabel: string;
  entryPrice: number;
  currentPrice: number | null;
  stakeAmount: number;
  shares: number;
  currentValue: number | null;
  pnlAmount: number | null;
  pnlPercent: number | null;
  createdAt: string;
};
