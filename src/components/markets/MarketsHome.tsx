"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { AlertCircle, Search, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { SignInModal } from "@/components/auth/SignInModal";
import { MarketCard } from "@/components/markets/MarketCard";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
import { BalanceChip } from "@/components/portfolio/BalanceChip";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatCurrency, formatPercent } from "@/lib/format";
import type {
  HomeSnapshot,
  MarketSnapshot,
  MarketSort,
  PaperPosition,
} from "@/types/polymarket";

type MarketsHomeProps = {
  snapshot: HomeSnapshot;
  authConfigured: boolean;
  paperTradingConfigured: boolean;
  loadError: string | null;
};

const SORT_KEYS: MarketSort[] = ["trending", "liquidity", "ending", "new"];

export function MarketsHome({
  snapshot,
  authConfigured,
  paperTradingConfigured,
  loadError,
}: MarketsHomeProps) {
  const t = useTranslations("home");
  const tHeader = useTranslations("header");
  const tSort = useTranslations("sort");
  const tTags = useTranslations("tags");
  const tPortfolio = useTranslations("portfolio");
  const { user, profile } = useAuth();

  const PAGE_SIZE = 60;
  const [markets, setMarkets] = useState(snapshot.markets);
  const [total, setTotal] = useState<number>(snapshot.markets.length);
  const [hasMore, setHasMore] = useState<boolean>(snapshot.markets.length >= PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [sort, setSort] = useState<MarketSort>("trending");
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [directoryError, setDirectoryError] = useState<string | null>(loadError);
  const [portfolio, setPortfolio] = useState<{
    positions: PaperPosition[];
    totals: { staked: number; currentValue: number; pnl: number; pnlPercent: number };
  } | null>(null);
  const [, setPortfolioLoading] = useState(true);
  const [, setPortfolioError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const featured = snapshot.featured[0];

  useEffect(() => {
    setMarkets(snapshot.markets);
    setDirectoryError(loadError);
  }, [loadError, snapshot.markets]);

  const refreshPortfolio = () => {
    setPortfolioLoading(true);
    fetch("/api/paper/positions")
      .then(async (response) => {
        const data = (await response.json()) as {
          error?: string;
          positions?: PaperPosition[];
          totals?: { staked: number; currentValue: number; pnl: number; pnlPercent: number };
        };
        if (!response.ok) throw new Error(data.error ?? "Paper portfolio could not be loaded.");
        setPortfolio({
          positions: data.positions ?? [],
          totals: data.totals ?? { staked: 0, currentValue: 0, pnl: 0, pnlPercent: 0 },
        });
        setPortfolioError(null);
      })
      .catch((error) => {
        setPortfolioError(error instanceof Error ? error.message : "Paper portfolio could not be loaded.");
      })
      .finally(() => setPortfolioLoading(false));
  };

  useEffect(() => {
    refreshPortfolio();
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem("predixscore-watchlist");
    if (raw) {
      try {
        setWatchlist(JSON.parse(raw));
      } catch {
        setWatchlist([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("predixscore-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    startTransition(() => {
      const params = new URLSearchParams({
        sort,
        tag: selectedTag,
        q: deferredQuery,
        limit: String(PAGE_SIZE),
        offset: "0",
      });
      fetch(`/api/polymarket/markets?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          const data = (await response.json()) as {
            error?: string;
            markets?: MarketSnapshot[];
            total?: number;
            hasMore?: boolean;
          };
          if (!response.ok) throw new Error(data.error ?? "Market directory refresh failed.");
          setMarkets(data.markets ?? []);
          setTotal(data.total ?? data.markets?.length ?? 0);
          setHasMore(Boolean(data.hasMore));
          setDirectoryError(null);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            setDirectoryError(error instanceof Error ? error.message : "Market directory refresh failed.");
          }
        })
        .finally(() => setLoading(false));
    });
    return () => controller.abort();
  }, [deferredQuery, selectedTag, sort]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        sort,
        tag: selectedTag,
        q: deferredQuery,
        limit: String(PAGE_SIZE),
        offset: String(markets.length),
      });
      const r = await fetch(`/api/polymarket/markets?${params.toString()}`);
      const data = (await r.json()) as {
        markets?: MarketSnapshot[];
        total?: number;
        hasMore?: boolean;
      };
      setMarkets((prev) => {
        const seen = new Set(prev.map((m) => m.slug));
        const next = (data.markets ?? []).filter((m) => !seen.has(m.slug));
        return [...prev, ...next];
      });
      setTotal(data.total ?? total);
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoadingMore(false);
    }
  }

  const watchMarketsCount = useMemo(() => {
    const combined = [...snapshot.watchSeed, ...markets];
    const unique = new Map(combined.map((market) => [market.slug, market]));
    return watchlist.filter((slug) => unique.has(slug)).length;
  }, [markets, snapshot.watchSeed, watchlist]);

  const localizedTag = (tag: string) => (tag.toLowerCase() === "all" ? tTags("all") : tag);

  const showSearchEmpty = !loading && !directoryError && markets.length === 0 && (query || selectedTag !== "All");
  const showLoadFailure = !loading && Boolean(directoryError) && markets.length === 0;

  return (
    <>
      <main className="page-shell">
        <header className="shell-header glass-panel">
          <div className="brand-row">
            <div className="brand-mark" aria-hidden="true">
              PS
            </div>
            <div className="brand-copy">
              <span className="eyebrow">{tHeader("tagline")}</span>
              <h1 className="brand-title">{tHeader("brandName")}</h1>
            </div>
          </div>

          <nav className="header-nav">
            <a className="header-pill" href="#market-grid">
              {tHeader("navPredict")}
            </a>
            <Link className="header-pill" href="/positions">
              {tHeader("navPositions")}
            </Link>
            <Link className="header-pill" href="/leaderboard">
              {tHeader("navLeaderboard")}
            </Link>
            <Link className="header-pill" href="/profile/me">
              {tHeader("navProfile")}
            </Link>
          </nav>

          <div className="header-actions">
            <BalanceChip refreshKey={portfolio?.positions.length ?? 0} />
            <LocaleToggle />
            {user ? (
              <Link className="ghost-button" href="/profile/me">
                {profile?.display_name ?? user.email?.split("@")[0] ?? tHeader("profile")}
              </Link>
            ) : (
              <button className="solid-button" type="button" onClick={() => setAuthOpen(true)}>
                {tHeader("signIn")}
              </button>
            )}
          </div>
        </header>

        <section className="hero-grid hero-grid-compact">
          <div className="hero-card">
            <div className="hero-content">
              <span className="eyebrow">{t("heroEyebrow")}</span>
              <h2 className="hero-title">{t("heroTitle")}</h2>
              <p className="hero-copy">{t("heroCopy")}</p>

              <div className="hero-actions">
                <Link
                  href={featured ? `/event/${featured.eventSlug}?market=${featured.marketSlug}` : "#market-grid"}
                  className="solid-button"
                >
                  {t("heroCtaPrimary")}
                </Link>
                <a className="ghost-button" href="#market-grid">
                  {t("heroCtaSecondary")}
                </a>
              </div>
            </div>

            {directoryError && markets.length > 0 ? (
              <div className="feedback-box warning" style={{ marginTop: 16 }}>
                <AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                {directoryError}
              </div>
            ) : null}

            <div className="hero-meta-grid hero-meta-tight">
              <div className="stat-card">
                <span className="stat-label">{t("statsEvents")}</span>
                <span className="stat-value">{snapshot.stats.totalMarkets}</span>
                <span className="stat-footnote">{t("statsEventsHint")}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">{t("statsLiquidity")}</span>
                <span className="stat-value">{formatCurrency(snapshot.stats.totalLiquidity)}</span>
                <span className="stat-footnote">{t("statsLiquidityHint")}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">{t("statsVolume")}</span>
                <span className="stat-value">{formatCurrency(snapshot.stats.totalVolume)}</span>
                <span className="stat-footnote">{t("statsVolumeHint")}</span>
              </div>
            </div>
          </div>

          <div className="featured-side">
            {featured ? (
              <Link
                href={`/event/${featured.eventSlug}?market=${featured.marketSlug}`}
                className="featured-card glass-panel"
              >
                <div className="featured-card-head">
                  <span className="eyebrow">{t("topEventEyebrow")}</span>
                  <span className="loading-pill" aria-hidden="true">
                    <span className="pulse-dot" />
                  </span>
                </div>
                <h3 className="featured-card-title">{featured.question}</h3>
                <div
                  className="featured-card-bar"
                  style={{ ["--prob" as string]: `${(featured.probability * 100).toFixed(1)}%` }}
                  aria-hidden="true"
                >
                  <div className="featured-card-bar-fill" />
                </div>
                <div className="featured-card-meta">
                  <div>
                    <span>Yes</span>
                    <strong>{formatPercent(featured.probability)}</strong>
                  </div>
                  <div>
                    <span>24h vol</span>
                    <strong>{formatCurrency(featured.volume24h)}</strong>
                  </div>
                </div>
                <span className="featured-card-cta">{t("topEventOpen")} →</span>
              </Link>
            ) : (
              <div className="featured-card glass-panel">
                <span className="eyebrow">{t("topEventEyebrow")}</span>
                <p className="empty-state-copy" style={{ marginTop: 12 }}>
                  {t("topEventEmpty")}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="content-grid">
          <div className="section-card glass-panel" id="market-grid">
            <div className="section-head">
              <div>
                <span className="eyebrow">{t("directoryEyebrow")}</span>
                <h2 className="section-title">{t("directoryTitle")}</h2>
                <p className="section-copy">{t("directoryCopy")}</p>
              </div>
              {loading ? (
                <span className="loading-pill">
                  <span className="pulse-dot" />
                  {t("refreshing")}
                </span>
              ) : null}
            </div>

            <div className="toolbar">
              <label className="search-field">
                <Search size={18} color="#6d7f94" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                />
              </label>

              <select
                className="select-field"
                value={sort}
                onChange={(event) => setSort(event.target.value as MarketSort)}
              >
                {SORT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {tSort(key)}
                  </option>
                ))}
              </select>
            </div>

            <div className="chip-row">
              {snapshot.tags.map((tag) => (
                <button
                  key={tag}
                  className={`chip-button ${selectedTag === tag ? "active" : ""}`}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                >
                  {localizedTag(tag)}
                </button>
              ))}
            </div>

            {markets.length ? (
              <>
                <div className="market-grid">
                  {markets.map((market) => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      watched={watchlist.includes(market.slug)}
                      paperTradingConfigured={paperTradingConfigured}
                      onPredictionSaved={refreshPortfolio}
                      onToggleWatchlist={(slug) =>
                        setWatchlist((current) =>
                          current.includes(slug)
                            ? current.filter((entry) => entry !== slug)
                            : [slug, ...current].slice(0, 12),
                        )
                      }
                    />
                  ))}
                </div>
                <div className="market-grid-footer">
                  <span className="market-grid-count">
                    {markets.length} / {total}
                  </span>
                  {hasMore ? (
                    <button
                      type="button"
                      className="solid-button"
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? t("refreshing") : t("loadMore")}
                    </button>
                  ) : null}
                </div>
              </>
            ) : showLoadFailure ? (
              <div className="empty-state-card">
                <AlertCircle size={32} className="empty-state-icon" />
                <h3>{t("loadFailedTitle")}</h3>
                <p>{t("loadFailedHint")}</p>
                {directoryError ? <code className="empty-state-detail">{directoryError}</code> : null}
              </div>
            ) : showSearchEmpty ? (
              <div className="empty-state-card">
                <SearchX size={32} className="empty-state-icon" />
                <h3>{t("noResultsTitle")}</h3>
                <p>{t("noResultsHint")}</p>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setQuery("");
                    setSelectedTag("All");
                  }}
                >
                  {tTags("all")}
                </button>
              </div>
            ) : (
              <div className="market-grid">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div className="market-card-skeleton" key={`sk-${index}`}>
                    <div className="skeleton-line short" />
                    <div className="skeleton-line wide" />
                    <div className="skeleton-buttons" />
                    <div className="skeleton-meta" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="sidebar-stack" id="watchlist">
            <div className="watch-card glass-panel">
              <span className="eyebrow">{tPortfolio("title")}</span>
              {portfolio && portfolio.positions.length ? (
                <>
                  <div className="portfolio-totals">
                    <div>
                      <span>{tPortfolio("staked")}</span>
                      <strong>{formatCurrency(portfolio.totals.staked)}</strong>
                    </div>
                    <div>
                      <span>{tPortfolio("value")}</span>
                      <strong>{formatCurrency(portfolio.totals.currentValue)}</strong>
                    </div>
                    <div>
                      <span>{tPortfolio("pnl")}</span>
                      <strong className={portfolio.totals.pnl > 0 ? "profit-positive" : ""}>
                        {portfolio.totals.pnl > 0
                          ? `+${formatCurrency(portfolio.totals.pnl)}`
                          : formatCurrency(portfolio.totals.pnl)}
                      </strong>
                    </div>
                  </div>
                  <ul className="portfolio-list">
                    {portfolio.positions.slice(0, 5).map((position) => (
                      <li key={position.id}>
                        <strong>{position.outcomeLabel}</strong>
                        <span>{position.marketQuestion}</span>
                        <em>{formatCurrency(position.stakeAmount)}</em>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="empty-state-copy" style={{ marginTop: 12 }}>
                  {tPortfolio("empty")}
                </p>
              )}
            </div>

            {watchMarketsCount > 0 ? (
              <div className="watch-card glass-panel">
                <span className="eyebrow">{tPortfolio("watchlistTitle")}</span>
                <p className="empty-state-copy" style={{ marginTop: 12 }}>
                  {tPortfolio("watchlistCount", { count: watchMarketsCount })}
                </p>
              </div>
            ) : null}
          </aside>
        </section>
      </main>

      <SignInModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
