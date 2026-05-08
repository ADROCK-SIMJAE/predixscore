"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Flame, RefreshCcw, Search, Sparkles, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { BetModal } from "@/components/markets/BetModal";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clamp,
  formatCompactNumber,
  formatCurrency,
  formatDateLabel,
  formatPercent,
  formatRelativeAgo,
} from "@/lib/format";
import type {
  EventDetail,
  MarketSnapshot,
  OrderBookSummary,
  PriceHistoryPoint,
} from "@/types/polymarket";

type MarketDetailClientProps = {
  event: EventDetail;
  authConfigured: boolean;
  paperTradingConfigured: boolean;
  initialMarketSlug?: string;
  initialOutcomeIndex?: number;
};

type SortKey = "probability" | "volume" | "liquidity";

const EMPTY_BOOK: OrderBookSummary = {
  market: "",
  assetId: "",
  bids: [],
  asks: [],
  minOrderSize: "1",
  tickSize: "0.01",
  negRisk: false,
  lastTradePrice: 0,
  timestamp: "",
};

function getProbability(market: MarketSnapshot) {
  return clamp(market.outcomePrices[0] ?? market.probability ?? 0, 0, 1);
}

export function MarketDetailClient({
  event,
  authConfigured,
  paperTradingConfigured,
  initialMarketSlug,
  initialOutcomeIndex = 0,
}: MarketDetailClientProps) {
  const t = useTranslations("detail");
  const tCommon = useTranslations("common");
  const tSort = useTranslations("sort");
  const [marketIndex, setMarketIndex] = useState(() => {
    const matchedIndex = event.markets.findIndex(
      (market) => market.marketSlug === initialMarketSlug,
    );
    if (matchedIndex >= 0) return matchedIndex;
    let topIndex = 0;
    let topProb = -1;
    event.markets.forEach((market, index) => {
      const prob = getProbability(market);
      if (prob > topProb) {
        topProb = prob;
        topIndex = index;
      }
    });
    return topIndex;
  });
  const [outcomeIndex, setOutcomeIndex] = useState(initialOutcomeIndex);
  const [book, setBook] = useState<OrderBookSummary>(EMPTY_BOOK);
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [bookError, setBookError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("probability");
  const [showBook, setShowBook] = useState(false);
  const [betOpen, setBetOpen] = useState(false);
  const [betSide, setBetSide] = useState<0 | 1>(0);
  const [betMarketIndex, setBetMarketIndex] = useState(0);

  const isMultiMarket = event.markets.length > 1;
  const activeMarket = event.markets[marketIndex] ?? event.markets[0];
  const tokenId = activeMarket?.clobTokenIds[outcomeIndex] ?? "";
  const outcomeLabel = activeMarket?.outcomes[outcomeIndex] ?? "Yes";
  const livePrice = clamp(activeMarket?.outcomePrices[outcomeIndex] ?? 0, 0, 1);
  const betMarket = event.markets[betMarketIndex] ?? activeMarket;

  const sortLabels: Record<SortKey, string> = {
    probability: tSort("probability"),
    volume: tSort("volume"),
    liquidity: tSort("liquidity"),
  };

  useEffect(() => {
    if (!tokenId) return;
    const controller = new AbortController();

    const sync = () => {
      setIsLoading(true);
      Promise.all([
        fetch(`/api/polymarket/book?tokenId=${tokenId}`, { signal: controller.signal }).then(
          async (response) => {
            const data = (await response.json()) as { error?: string; book?: OrderBookSummary };
            if (!response.ok) throw new Error(data.error ?? "Order book request failed.");
            return data.book ?? EMPTY_BOOK;
          },
        ),
        fetch(`/api/polymarket/history?market=${tokenId}&interval=1d&fidelity=15`, {
          signal: controller.signal,
        }).then(async (response) => {
          const data = (await response.json()) as { error?: string; history?: PriceHistoryPoint[] };
          if (!response.ok) throw new Error(data.error ?? "History request failed.");
          return data.history ?? [];
        }),
      ])
        .then(([nextBook, nextHistory]) => {
          setBook(nextBook);
          setHistory(nextHistory);
          setBookError(null);
          setHistoryError(null);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            const message = error instanceof Error ? error.message : "Live market sync failed.";
            setBook(EMPTY_BOOK);
            setHistory([]);
            setBookError(message);
            setHistoryError(message);
          }
        })
        .finally(() => setIsLoading(false));
    };

    sync();
    const interval = window.setInterval(sync, 8000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [tokenId]);

  const sortedMarkets = useMemo(() => {
    const indexed = event.markets.map((market, originalIndex) => ({ market, originalIndex }));
    const filtered = search.trim()
      ? indexed.filter(({ market }) =>
          market.question.toLowerCase().includes(search.trim().toLowerCase()),
        )
      : indexed;
    return [...filtered].sort((a, b) => {
      if (sort === "volume") return (b.market.volume ?? 0) - (a.market.volume ?? 0);
      if (sort === "liquidity") return (b.market.liquidity ?? 0) - (a.market.liquidity ?? 0);
      return getProbability(b.market) - getProbability(a.market);
    });
  }, [event.markets, search, sort]);

  const chartPath = useMemo(() => {
    if (!history.length) return "";
    const width = 760;
    const height = 220;
    const values = history.map((point) => point.p);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 0.01);
    return history
      .map((point, index) => {
        const x = (index / Math.max(history.length - 1, 1)) * width;
        const y = height - ((point.p - min) / range) * (height - 24) - 12;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [history]);

  const chartAreaPath = useMemo(() => {
    if (!chartPath || !history.length) return "";
    return `${chartPath} L 760 220 L 0 220 Z`;
  }, [chartPath, history.length]);

  function openBet(targetMarketIndex: number, side: 0 | 1) {
    setBetMarketIndex(targetMarketIndex);
    setBetSide(side);
    setBetOpen(true);
    setMarketIndex(targetMarketIndex);
    setOutcomeIndex(side);
  }

  return (
    <>
      <AppHeader />
      <main className="w-[min(1480px,calc(100vw-48px))] mx-auto pt-[88px] pb-[60px] flex flex-col gap-[18px]">
        <PageHeader
          eyebrow={event.category}
          title={<span className="text-[clamp(24px,2.4vw,36px)] tracking-[-0.03em] leading-[1.1]">{event.title}</span>}
          right={
            isLoading ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/70 text-xs font-semibold text-muted-strong border border-ink/[0.06]">
                <RefreshCcw size={12} />
                {tCommon("syncing")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/70 text-xs font-semibold text-muted-strong border border-ink/[0.06]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
                {tCommon("live")}
              </span>
            )
          }
        />

        <section className="grid gap-4">
          {/* Event image / badges banner */}
          {(event.image || event.featured || event.isNew) ? (
            <div className="glass-panel flex items-center gap-4 p-4 rounded-2xl">
              {event.image ? (
                <span className="shrink-0 block w-24 h-24 rounded-xl overflow-hidden bg-ink/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.image} alt="" loading="lazy" className="w-full h-full object-cover block" />
                </span>
              ) : null}
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {event.featured ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-brand/10 text-amber-text">
                      <Star size={12} fill="currentColor" /> Featured
                    </span>
                  ) : null}
                  {event.isNew ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-accent/10 text-accent-deep">
                      <Sparkles size={12} /> NEW
                    </span>
                  ) : null}
                  {event.volume24h >= 100_000 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-negative/10 text-negative-text">
                      <Flame size={12} /> Hot
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-3 flex-wrap text-xs text-muted tabular-nums">
                  {event.startDate ? <span>Starts {formatDateLabel(event.startDate)}</span> : null}
                  {event.endDate ? <span>Resolves {formatDateLabel(event.endDate)}</span> : null}
                  {formatRelativeAgo((event as { creationDate?: string | null }).creationDate ?? null) ? (
                    <span>Created {formatRelativeAgo((event as { creationDate?: string | null }).creationDate ?? null)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* Event meta stats */}
          <div className="glass-panel p-[20px_22px] grid gap-3.5">
            <div className="grid grid-cols-4 gap-4 max-[720px]:grid-cols-2">
              <div className="grid gap-1">
                <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("statVolume")}</span>
                <strong className="text-[18px] tracking-[-0.02em] tabular-nums">{formatCurrency(event.volume)}</strong>
              </div>
              <div className="grid gap-1">
                <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("statLiquidity")}</span>
                <strong className="text-[18px] tracking-[-0.02em] tabular-nums">{formatCurrency(event.liquidity)}</strong>
              </div>
              <div className="grid gap-1">
                <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("statOpenInterest")}</span>
                <strong className="text-[18px] tracking-[-0.02em] tabular-nums">{formatCurrency(event.openInterest)}</strong>
              </div>
              <div className="grid gap-1">
                <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("statResolves")}</span>
                <strong className="text-[18px] tracking-[-0.02em] tabular-nums">{formatDateLabel(event.endDate)}</strong>
              </div>
              {event.volume1wk > 0 ? (
                <div className="grid gap-1">
                  <span className="text-[12px] text-muted uppercase tracking-[0.06em]">7d vol</span>
                  <strong className="text-[18px] tracking-[-0.02em] tabular-nums">{formatCurrency(event.volume1wk)}</strong>
                </div>
              ) : null}
              {event.volume1mo > 0 ? (
                <div className="grid gap-1">
                  <span className="text-[12px] text-muted uppercase tracking-[0.06em]">30d vol</span>
                  <strong className="text-[18px] tracking-[-0.02em] tabular-nums">{formatCurrency(event.volume1mo)}</strong>
                </div>
              ) : null}
              {event.competitive > 0 ? (
                <div className="grid gap-1">
                  <span className="text-[12px] text-muted uppercase tracking-[0.06em]">Competitive</span>
                  <strong className="text-[18px] tracking-[-0.02em] tabular-nums">{Math.round(event.competitive * 100)}%</strong>
                </div>
              ) : null}
            </div>
            {event.description ? (
              <p className="m-0 text-muted-strong text-[14px] leading-[1.6]">{event.description}</p>
            ) : null}
          </div>

          {/* Chart card */}
          <div className="glass-panel p-[20px_22px] grid gap-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-muted text-[12px] tracking-[0.14em] uppercase">{t("selectedOutcome")}</span>
                <h2 className="text-[22px] tracking-[-0.02em] mt-1 mb-0">{activeMarket?.question}</h2>
              </div>
              <div className="text-right">
                <strong className="block text-[32px] tracking-[-0.03em] tabular-nums">{Math.round(livePrice * 100)}%</strong>
                <span className="block text-muted text-[12px]">{formatPercent(livePrice)}</span>
              </div>
            </div>
            <div className="w-full h-[220px]">
              <svg viewBox="0 0 760 220" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <linearGradient id="priceArea" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(15,109,255,0.24)" />
                    <stop offset="100%" stopColor="rgba(15,109,255,0.02)" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((row) => (
                  <line key={row} stroke="rgba(84,116,149,0.12)" strokeWidth="1" x1="0" y1={row * 55} x2="760" y2={row * 55} />
                ))}
                {chartAreaPath ? <path fill="url(#priceArea)" d={chartAreaPath} /> : null}
                {chartPath ? (
                  <path fill="none" stroke="#0f6dff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d={chartPath} />
                ) : null}
              </svg>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-between gap-2 px-5 py-4 rounded-[16px] border border-[rgba(15,169,104,0.18)] bg-gradient-to-b from-[rgba(15,169,104,0.16)] to-[rgba(15,169,104,0.06)] text-[#0e6d44] font-semibold text-[16px] cursor-pointer transition-[transform,background] duration-[120ms] hover:-translate-y-px active:scale-[0.98] will-change-transform"
                onClick={() => openBet(marketIndex, 0)}
              >
                <span>{t("predictYes")}</span>
                <strong className="text-[22px] tabular-nums tracking-[-0.02em]">{Math.round((activeMarket?.outcomePrices[0] ?? 0) * 100)}%</strong>
              </button>
              {activeMarket?.outcomes[1] ? (
                <button
                  type="button"
                  className="flex items-center justify-between gap-2 px-5 py-4 rounded-[16px] border border-[rgba(239,91,97,0.18)] bg-gradient-to-b from-[rgba(239,91,97,0.16)] to-[rgba(239,91,97,0.06)] text-[#b13036] font-semibold text-[16px] cursor-pointer transition-[transform,background] duration-[120ms] hover:-translate-y-px active:scale-[0.98] will-change-transform"
                  onClick={() => openBet(marketIndex, 1)}
                >
                  <span>{t("predictNo")}</span>
                  <strong className="text-[22px] tabular-nums tracking-[-0.02em]">{Math.round((activeMarket?.outcomePrices[1] ?? 0) * 100)}%</strong>
                </button>
              ) : null}
            </div>
            {historyError ? (
              <div className="px-4 py-3.5 rounded-[14px] text-[14px] leading-[1.5] bg-[rgba(244,173,66,0.16)] text-[#91590b] mt-3">
                {t("priceUnavailable")} {historyError}
              </div>
            ) : null}
          </div>

          {/* Outcomes multi-market list */}
          {isMultiMarket ? (
            <div className="glass-panel p-[20px_22px] grid gap-3.5 rounded-[14px]">
              <div className="flex items-end justify-between gap-4 flex-wrap max-[640px]:flex-col max-[640px]:items-stretch">
                <div>
                  <span className="text-muted text-[12px] tracking-[0.14em] uppercase">{t("outcomesEyebrow")}</span>
                  <h3 className="m-0 mt-1 text-[20px] tracking-[-0.02em]">{t("marketsCount", { count: event.markets.length })}</h3>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-[14px] bg-white/70 border border-ink/[0.08] text-muted">
                    <Search size={14} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t("searchOutcome")}
                      className="border-none outline-none bg-transparent text-[13px] text-ink w-40"
                    />
                  </label>
                  <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                    <SelectTrigger className="min-w-[160px]" aria-label="Sort outcomes">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {sortLabels[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* header */}
              <div className="grid items-center px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] text-muted border-b border-ink/[0.06] [grid-template-columns:36px_minmax(0,1.4fr)_minmax(140px,1fr)_80px_200px] gap-3.5 max-[720px]:[grid-template-columns:24px_1fr_80px] max-[720px]:gap-2">
                <span>{t("headerRank")}</span>
                <span>{t("headerOutcome")}</span>
                <span>{t("headerProbability")}</span>
                <span className="max-[720px]:hidden">{t("headerVolume")}</span>
                <span className="text-right max-[720px]:hidden">{t("headerPredict")}</span>
              </div>

              {/* rows */}
              <div className="grid gap-1.5 max-h-[520px] overflow-y-auto pr-1">
                {sortedMarkets.map(({ market, originalIndex }, displayIndex) => {
                  const prob = getProbability(market);
                  const isActive = marketIndex === originalIndex;
                  return (
                    <div
                      key={market.id}
                      className={`grid items-center px-3.5 py-2.5 rounded-[14px] border transition-all duration-[160ms] will-change-transform [grid-template-columns:36px_minmax(0,1.4fr)_minmax(140px,1fr)_80px_200px] gap-3.5 max-[720px]:[grid-template-columns:24px_1fr_80px] max-[720px]:gap-2 ${
                        isActive
                          ? "bg-gradient-to-b from-accent/[0.08] to-white/[0.92] border-accent/[0.32]"
                          : "bg-white/60 border-ink/[0.06] hover:bg-white/[0.86] hover:border-ink/[0.12]"
                      }`}
                    >
                      <span className="text-[12px] text-muted font-semibold tabular-nums">{displayIndex + 1}</span>
                      <button
                        type="button"
                        className="text-left bg-transparent border-none p-0 cursor-pointer text-[15px] font-semibold text-ink tracking-[-0.01em] leading-[1.3] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden hover:text-accent"
                        onClick={() => { setMarketIndex(originalIndex); setOutcomeIndex(0); }}
                      >
                        {(market.image || market.icon) ? (
                          <span className="shrink-0 inline-block w-9 h-9 rounded-md overflow-hidden bg-ink/5 align-middle mr-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={market.image || market.icon || ""} alt="" loading="lazy" className="w-full h-full object-cover block" />
                          </span>
                        ) : null}
                        {market.question}
                      </button>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex-1 h-1.5 bg-ink/[0.08] rounded-[3px] relative overflow-hidden"
                          style={{ ["--prob" as string]: `${(prob * 100).toFixed(1)}%` }}
                        >
                          <span className="absolute inset-0 w-[var(--prob,0%)] bg-gradient-to-r from-accent to-[#42a0ff] rounded-[3px]" />
                        </div>
                        <strong className="text-[14px] tabular-nums min-w-[44px] text-right">{formatPercent(prob)}</strong>
                      </div>
                      <span className="text-[13px] text-muted-strong tabular-nums max-[720px]:hidden">
                        {formatCompactNumber(market.volume ?? 0)}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 max-[720px]:col-span-3">
                        <button
                          type="button"
                          className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-[10px] border border-[rgba(15,169,104,0.18)] bg-gradient-to-b from-[rgba(15,169,104,0.16)] to-[rgba(15,169,104,0.06)] text-[#0e6d44] font-semibold text-[12px] cursor-pointer min-w-[64px] hover:-translate-y-px active:scale-[0.98] transition-[transform,background] duration-[120ms]"
                          onClick={() => openBet(originalIndex, 0)}
                        >
                          <span className="text-[11px] uppercase tracking-[0.04em] opacity-80">Yes</span>
                          <strong className="text-[14px] tabular-nums">{Math.round((market.outcomePrices[0] ?? 0) * 100)}%</strong>
                        </button>
                        {market.outcomes[1] ? (
                          <button
                            type="button"
                            className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-[10px] border border-[rgba(239,91,97,0.18)] bg-gradient-to-b from-[rgba(239,91,97,0.16)] to-[rgba(239,91,97,0.06)] text-[#b13036] font-semibold text-[12px] cursor-pointer min-w-[64px] hover:-translate-y-px active:scale-[0.98] transition-[transform,background] duration-[120ms]"
                            onClick={() => openBet(originalIndex, 1)}
                          >
                            <span className="text-[11px] uppercase tracking-[0.04em] opacity-80">No</span>
                            <strong className="text-[14px] tabular-nums">{Math.round((market.outcomePrices[1] ?? 0) * 100)}%</strong>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {!sortedMarkets.length ? (
                  <div className="py-8 text-center text-muted text-[14px]">{t("noMatch", { query: search })}</div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Order book */}
          <div className="glass-panel overflow-hidden p-0">
            <button
              type="button"
              className="w-full flex justify-between items-center px-[22px] py-[18px] bg-transparent border-none cursor-pointer text-left text-ink transition-colors duration-[160ms] hover:bg-accent/[0.04]"
              onClick={() => setShowBook((v) => !v)}
              aria-expanded={showBook}
            >
              <span>
                <span className="text-muted text-[12px] tracking-[0.14em] uppercase block">{t("orderBookEyebrow")}</span>
                <strong className="block text-[15px] tracking-[-0.01em] mt-1">
                  {outcomeLabel} · {activeMarket?.question}
                </strong>
              </span>
              <ChevronDown size={18} className={`transition-transform duration-150 ${showBook ? "rotate-180" : "rotate-0"}`} />
            </button>

            {showBook ? (
              <>
                <div className="grid grid-cols-2 gap-4 max-[1200px]:grid-cols-1 px-[22px] pb-[22px]">
                  <div className="overflow-hidden border border-white/[0.78] bg-white/[0.88] rounded-[16px]">
                    <header className="grid grid-cols-3 px-4 py-3.5 text-[12px] text-muted bg-[rgba(245,249,255,0.78)]">
                      <span>{t("bid")}</span><span>{t("size")}</span><span>{t("total")}</span>
                    </header>
                    {(book.bids.length ? book.bids.slice(0, 6) : new Array(3).fill(null)).map((row, index) => (
                      <div className="grid grid-cols-3 gap-3 px-4 py-3.5 border-t border-ink/[0.06] text-[14px]" key={`bid-${index}`}>
                        <strong className="text-[#0fa968]">{row ? Number(row.price).toFixed(2) : "--"}</strong>
                        <span>{row ? formatCompactNumber(row.size) : "--"}</span>
                        <span>{row ? formatCurrency(row.total) : "--"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-hidden border border-white/[0.78] bg-white/[0.88] rounded-[16px]">
                    <header className="grid grid-cols-3 px-4 py-3.5 text-[12px] text-muted bg-[rgba(245,249,255,0.78)]">
                      <span>{t("ask")}</span><span>{t("size")}</span><span>{t("total")}</span>
                    </header>
                    {(book.asks.length ? book.asks.slice(0, 6) : new Array(3).fill(null)).map((row, index) => (
                      <div className="grid grid-cols-3 gap-3 px-4 py-3.5 border-t border-ink/[0.06] text-[14px]" key={`ask-${index}`}>
                        <strong className="text-[#ef5b61]">{row ? Number(row.price).toFixed(2) : "--"}</strong>
                        <span>{row ? formatCompactNumber(row.size) : "--"}</span>
                        <span>{row ? formatCurrency(row.total) : "--"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {bookError ? (
                  <div className="px-4 py-3.5 mx-[22px] mb-[22px] rounded-[14px] text-[14px] leading-[1.5] bg-[rgba(244,173,66,0.16)] text-[#91590b]">
                    {t("bookUnavailable")} {bookError}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="text-center text-[12px] text-muted py-2">
            {t("resolutionSource", { source: event.resolutionSource ?? t("noResolutionSource") })}
            {!authConfigured ? ` · ${t("authNotConfigured")}` : ""}
          </div>
        </section>
      </main>

      {betMarket ? (
        <BetModal
          open={betOpen}
          onClose={() => setBetOpen(false)}
          market={betMarket}
          eventSlug={event.slug}
          eventTitle={event.title}
          initialOutcomeIndex={betSide}
          paperTradingConfigured={paperTradingConfigured}
        />
      ) : null}
    </>
  );
}
