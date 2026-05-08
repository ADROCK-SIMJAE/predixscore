"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, RefreshCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { SignInModal } from "@/components/auth/SignInModal";
import { BetModal } from "@/components/markets/BetModal";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
import {
  clamp,
  formatCompactNumber,
  formatCurrency,
  formatDateLabel,
  formatPercent,
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
  const tHeader = useTranslations("header");
  const tCommon = useTranslations("common");
  const tSort = useTranslations("sort");

  const [authOpen, setAuthOpen] = useState(false);
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
      <main className="page-shell">
        <header className="shell-header glass-panel">
          <div className="brand-row">
            <Link
              href="/"
              className="ghost-button"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <ArrowLeft size={16} />
              {t("back")}
            </Link>
            <div className="brand-copy">
              <span className="eyebrow">{event.category}</span>
              <h1 className="brand-title detail-event-title">{event.title}</h1>
            </div>
          </div>

          <div className="header-actions">
            {isLoading ? (
              <span className="loading-pill">
                <RefreshCcw size={14} />
                {tCommon("syncing")}
              </span>
            ) : (
              <span className="loading-pill">
                <span className="pulse-dot" />
                {tCommon("live")}
              </span>
            )}
            <LocaleToggle />
            <button className="ghost-button" type="button" onClick={() => setAuthOpen(true)}>
              {tHeader("signIn")}
            </button>
          </div>
        </header>

        <section className="event-detail-stack">
          <div className="event-meta-card glass-panel">
            <div className="event-meta-stats">
              <div>
                <span>{t("statVolume")}</span>
                <strong>{formatCurrency(event.volume)}</strong>
              </div>
              <div>
                <span>{t("statLiquidity")}</span>
                <strong>{formatCurrency(event.liquidity)}</strong>
              </div>
              <div>
                <span>{t("statOpenInterest")}</span>
                <strong>{formatCurrency(event.openInterest)}</strong>
              </div>
              <div>
                <span>{t("statResolves")}</span>
                <strong>{formatDateLabel(event.endDate)}</strong>
              </div>
            </div>
            {event.description ? (
              <p className="event-meta-description">{event.description}</p>
            ) : null}
          </div>

          <div className="event-chart-card glass-panel">
            <div className="event-chart-head">
              <div>
                <span className="eyebrow">{t("selectedOutcome")}</span>
                <h2 className="event-chart-title">{activeMarket?.question}</h2>
              </div>
              <div className="event-chart-price">
                <strong>{Math.round(livePrice * 100)}%</strong>
                <span>{formatPercent(livePrice)}</span>
              </div>
            </div>
            <div className="event-chart-wrap">
              <svg viewBox="0 0 760 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="priceArea" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(15,109,255,0.24)" />
                    <stop offset="100%" stopColor="rgba(15,109,255,0.02)" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((row) => (
                  <line
                    key={row}
                    className="chart-grid-line"
                    x1="0"
                    y1={row * 55}
                    x2="760"
                    y2={row * 55}
                  />
                ))}
                {chartAreaPath ? <path className="chart-area" d={chartAreaPath} /> : null}
                {chartPath ? <path className="chart-path" d={chartPath} /> : null}
              </svg>
            </div>
            <div className="event-chart-actions">
              <button
                type="button"
                className="bet-btn yes large"
                onClick={() => openBet(marketIndex, 0)}
              >
                <span>{t("predictYes")}</span>
                <strong>{Math.round((activeMarket?.outcomePrices[0] ?? 0) * 100)}%</strong>
              </button>
              {activeMarket?.outcomes[1] ? (
                <button
                  type="button"
                  className="bet-btn no large"
                  onClick={() => openBet(marketIndex, 1)}
                >
                  <span>{t("predictNo")}</span>
                  <strong>{Math.round((activeMarket?.outcomePrices[1] ?? 0) * 100)}%</strong>
                </button>
              ) : null}
            </div>
            {historyError ? (
              <div className="feedback-box warning" style={{ marginTop: 12 }}>
                {t("priceUnavailable")} {historyError}
              </div>
            ) : null}
          </div>

          {isMultiMarket ? (
            <div className="outcomes-card glass-panel">
              <div className="outcomes-toolbar">
                <div className="outcomes-toolbar-title">
                  <span className="eyebrow">{t("outcomesEyebrow")}</span>
                  <h3>{t("marketsCount", { count: event.markets.length })}</h3>
                </div>
                <div className="outcomes-toolbar-controls">
                  <label className="outcomes-search">
                    <Search size={14} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t("searchOutcome")}
                    />
                  </label>
                  <select
                    className="outcomes-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                  >
                    {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                      <option key={key} value={key}>
                        {tSort("label", { value: sortLabels[key] })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="outcomes-header-row">
                <span>{t("headerRank")}</span>
                <span>{t("headerOutcome")}</span>
                <span>{t("headerProbability")}</span>
                <span>{t("headerVolume")}</span>
                <span style={{ textAlign: "right" }}>{t("headerPredict")}</span>
              </div>

              <div className="outcomes-list-compact">
                {sortedMarkets.map(({ market, originalIndex }, displayIndex) => {
                  const prob = getProbability(market);
                  const isActive = marketIndex === originalIndex;
                  return (
                    <div
                      key={market.id}
                      className={`outcome-row-compact ${isActive ? "active" : ""}`}
                    >
                      <span className="outcome-rank">{displayIndex + 1}</span>
                      <button
                        type="button"
                        className="outcome-label-btn"
                        onClick={() => {
                          setMarketIndex(originalIndex);
                          setOutcomeIndex(0);
                        }}
                      >
                        {market.question}
                      </button>
                      <div className="outcome-prob-cell">
                        <div
                          className="outcome-prob-bar"
                          style={{ ["--prob" as string]: `${(prob * 100).toFixed(1)}%` }}
                        />
                        <strong>{formatPercent(prob)}</strong>
                      </div>
                      <span className="outcome-volume">
                        {formatCompactNumber(market.volume ?? 0)}
                      </span>
                      <div className="outcome-actions">
                        <button
                          type="button"
                          className="bet-btn yes compact"
                          onClick={() => openBet(originalIndex, 0)}
                        >
                          <span>Yes</span>
                          <strong>{Math.round((market.outcomePrices[0] ?? 0) * 100)}%</strong>
                        </button>
                        {market.outcomes[1] ? (
                          <button
                            type="button"
                            className="bet-btn no compact"
                            onClick={() => openBet(originalIndex, 1)}
                          >
                            <span>No</span>
                            <strong>{Math.round((market.outcomePrices[1] ?? 0) * 100)}%</strong>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {!sortedMarkets.length ? (
                  <div className="outcomes-empty">{t("noMatch", { query: search })}</div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="book-card glass-panel">
            <button
              type="button"
              className="book-toggle-btn"
              onClick={() => setShowBook((v) => !v)}
              aria-expanded={showBook}
            >
              <span>
                <span className="eyebrow">{t("orderBookEyebrow")}</span>
                <strong>
                  {outcomeLabel} · {activeMarket?.question}
                </strong>
              </span>
              <ChevronDown
                size={18}
                style={{
                  transform: showBook ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 160ms ease",
                }}
              />
            </button>

            {showBook ? (
              <>
                <div className="book-grid">
                  <div className="book-table">
                    <header>
                      <span>{t("bid")}</span>
                      <span>{t("size")}</span>
                      <span>{t("total")}</span>
                    </header>
                    {(book.bids.length ? book.bids.slice(0, 6) : new Array(3).fill(null)).map(
                      (row, index) => (
                        <div className="book-table-row bid" key={`bid-${index}`}>
                          <strong>{row ? Number(row.price).toFixed(2) : "--"}</strong>
                          <span>{row ? formatCompactNumber(row.size) : "--"}</span>
                          <span>{row ? formatCurrency(row.total) : "--"}</span>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="book-table">
                    <header>
                      <span>{t("ask")}</span>
                      <span>{t("size")}</span>
                      <span>{t("total")}</span>
                    </header>
                    {(book.asks.length ? book.asks.slice(0, 6) : new Array(3).fill(null)).map(
                      (row, index) => (
                        <div className="book-table-row ask" key={`ask-${index}`}>
                          <strong>{row ? Number(row.price).toFixed(2) : "--"}</strong>
                          <span>{row ? formatCompactNumber(row.size) : "--"}</span>
                          <span>{row ? formatCurrency(row.total) : "--"}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
                {bookError ? (
                  <div className="feedback-box warning" style={{ marginTop: 12 }}>
                    {t("bookUnavailable")} {bookError}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="event-footer-meta">
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
      <SignInModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
