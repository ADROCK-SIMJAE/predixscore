"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { AlertCircle, Search, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/format";
import { MarketCard } from "@/components/markets/MarketCard";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DirectoryTag,
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
const ALL_TAG = "all";
const PAGE_SIZE = 60;

export function MarketsHome({
  snapshot,
  authConfigured,
  paperTradingConfigured,
  loadError,
}: MarketsHomeProps) {
  const t = useTranslations("home");
  const tSort = useTranslations("sort");
  const tTags = useTranslations("tags");

  const [markets, setMarkets] = useState(snapshot.markets);
  const [total, setTotal] = useState<number>(snapshot.markets.length);
  const [hasMore, setHasMore] = useState<boolean>(snapshot.markets.length >= PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>(ALL_TAG);
  const [sort, setSort] = useState<MarketSort>("trending");
  const [loading, setLoading] = useState(false);
  const [, setPortfolio] = useState<{
    positions: PaperPosition[];
    totals: { staked: number; currentValue: number; pnl: number; pnlPercent: number };
  } | null>(null);
  const [directoryError, setDirectoryError] = useState<string | null>(loadError);
  const deferredQuery = useDeferredValue(query);

  const featured = snapshot.featured[0];

  useEffect(() => {
    setMarkets(snapshot.markets);
    setTotal(snapshot.markets.length);
    setHasMore(snapshot.markets.length >= PAGE_SIZE);
    setDirectoryError(loadError);
  }, [loadError, snapshot.markets]);

  const selectedTagMeta =
    selectedTag === ALL_TAG ? null : snapshot.tags.find((tag) => tag.id === selectedTag) ?? null;

  const refreshPortfolio = () => {
    fetch("/api/paper/positions")
      .then(async (response) => {
        const data = (await response.json()) as {
          error?: string;
          positions?: PaperPosition[];
          totals?: { staked: number; currentValue: number; pnl: number; pnlPercent: number };
        };
        if (!response.ok) return;
        setPortfolio({
          positions: data.positions ?? [],
          totals: data.totals ?? { staked: 0, currentValue: 0, pnl: 0, pnlPercent: 0 },
        });
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshPortfolio();
  }, []);

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
      if (selectedTagMeta?.slug) params.set("tagSlug", selectedTagMeta.slug);

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
  }, [deferredQuery, selectedTag, selectedTagMeta?.slug, sort]);

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
      if (selectedTagMeta?.slug) params.set("tagSlug", selectedTagMeta.slug);
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

  const tagLabel = (tag: DirectoryTag | typeof ALL_TAG) =>
    tag === ALL_TAG ? tTags("all") : tag.label;

  const showSearchEmpty =
    !loading && !directoryError && markets.length === 0 && (query || selectedTag !== ALL_TAG);
  const showLoadFailure = !loading && Boolean(directoryError) && markets.length === 0;

  return (
    <>
      <main className="w-[min(1480px,calc(100vw-48px))] mx-auto pt-[88px] pb-[60px] flex flex-col gap-[18px]">
        <AppHeader />

        {/* Hero strip */}
        {featured ? (
          <section className="grid grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)] gap-4 max-[960px]:grid-cols-1">
            <Link
              href={`/event/${featured.eventSlug}?market=${featured.marketSlug}`}
              className="block p-[24px_28px] text-inherit no-underline transition-[transform,box-shadow] duration-160 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(13,28,65,0.14)] bg-surface border border-white/70 shadow-[0_2px_8px_rgba(80,109,145,0.06)] backdrop-blur-[28px] rounded-[14px]"
            >
              <div className="grid gap-[14px]">
                <span className="text-muted text-[12px] tracking-[0.14em] uppercase">{t("topEventEyebrow")}</span>
                <h2 className="m-0 text-[clamp(22px,2.4vw,32px)] tracking-[-0.03em] leading-[1.15]">{featured.question}</h2>
                <div
                  className="h-2 bg-ink/[0.08] rounded-[4px] overflow-hidden relative"
                  style={{ ["--prob" as string]: `${(featured.probability * 100).toFixed(1)}%` }}
                  aria-hidden="true"
                >
                  <div className="absolute inset-0 w-[var(--prob,0%)] bg-gradient-to-r from-accent to-[#42a0ff] rounded-[4px] transition-[width] duration-200" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-ink/[0.06]">
                  <div className="grid gap-0.5">
                    <span className="text-[11px] uppercase tracking-[0.06em] text-muted">Yes</span>
                    <strong className="text-[18px] tracking-[-0.01em] tabular-nums">{formatPercent(featured.probability)}</strong>
                  </div>
                  <div className="grid gap-0.5">
                    <span className="text-[11px] uppercase tracking-[0.06em] text-muted">24h vol</span>
                    <strong className="text-[18px] tracking-[-0.01em] tabular-nums">{formatCurrency(featured.volume24h)}</strong>
                  </div>
                  <div className="grid gap-0.5">
                    <span className="text-[11px] uppercase tracking-[0.06em] text-muted">{t("statsLiquidity")}</span>
                    <strong className="text-[18px] tracking-[-0.01em] tabular-nums">{formatCurrency(featured.liquidity)}</strong>
                  </div>
                </div>
                <span className="inline-block mt-1 text-[13px] font-semibold text-accent">{t("topEventOpen")} →</span>
              </div>
            </Link>

            <div className="grid grid-rows-[1fr_1fr] gap-4 max-[960px]:grid-rows-none max-[960px]:grid-cols-2 max-[640px]:grid-cols-1">
              {snapshot.featured.slice(1, 3).map((sub) => (
                <Link
                  key={sub.id}
                  href={`/event/${sub.eventSlug}?market=${sub.marketSlug}`}
                  className="p-[16px_18px] grid gap-2 no-underline text-inherit transition-transform duration-160 hover:-translate-y-px bg-surface border border-white/70 shadow-[0_2px_8px_rgba(80,109,145,0.06)] backdrop-blur-[28px] rounded-[14px]"
                >
                  <span className="inline-flex items-center gap-2 px-3 py-2 text-[12px] text-muted-strong bg-accent/[0.08] rounded-full self-start">
                    {sub.category}
                  </span>
                  <strong className="text-[15px] tracking-[-0.01em] leading-[1.3] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">{sub.question}</strong>
                  <div
                    className="h-2 bg-ink/[0.08] rounded-[4px] overflow-hidden relative"
                    style={{ ["--prob" as string]: `${(sub.probability * 100).toFixed(1)}%` }}
                    aria-hidden="true"
                  >
                    <div className="absolute inset-0 w-[var(--prob,0%)] bg-gradient-to-r from-accent to-[#42a0ff] rounded-[4px] transition-[width] duration-200" />
                  </div>
                  <span className="text-[12px] text-muted tabular-nums">
                    Yes {formatPercent(sub.probability)} · ${formatCompactNumber(sub.volume24h)} 24h
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Category bar */}
        <nav className="sticky top-3 z-10 flex gap-2 overflow-x-auto px-4 py-3 bg-surface border border-white/70 shadow-[0_2px_8px_rgba(80,109,145,0.06)] backdrop-blur-[28px] rounded-[14px] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold tracking-[-0.01em] cursor-pointer transition-all duration-160 whitespace-nowrap border ${selectedTag === ALL_TAG ? "bg-accent border-accent text-white" : "bg-white/70 border-ink/[0.06] text-muted-strong hover:bg-white/95"}`}
            onClick={() => setSelectedTag(ALL_TAG)}
          >
            {tagLabel(ALL_TAG)}
          </button>
          {snapshot.tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold tracking-[-0.01em] cursor-pointer transition-all duration-160 whitespace-nowrap border ${selectedTag === tag.id ? "bg-accent border-accent text-white" : "bg-white/70 border-ink/[0.06] text-muted-strong hover:bg-white/95"}`}
              onClick={() => setSelectedTag(tag.id)}
            >
              {tagLabel(tag)}
            </button>
          ))}
        </nav>

        {/* Error banner */}
        {directoryError && markets.length > 0 ? (
          <div className="px-4 py-3.5 rounded-[14px] text-[14px] leading-[1.5] bg-[rgba(244,173,66,0.16)] text-[#91590b] my-4">
            <AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6, display: "inline" }} />
            {directoryError}
          </div>
        ) : null}

        {/* Market grid section */}
        <section className="flex flex-col gap-[18px]">
          <div className="p-[18px] rounded-[14px] bg-surface border border-white/70 shadow-[0_2px_8px_rgba(80,109,145,0.06)] backdrop-blur-[28px]" id="market-grid">
            {/* section head */}
            <div className="flex items-center justify-between gap-4 mb-[18px]">
              <div>
                <span className="text-muted text-[12px] tracking-[0.14em] uppercase">{t("directoryEyebrow")}</span>
                <h2 className="text-[30px] m-0 font-display tracking-[-0.04em]">
                  {selectedTagMeta ? selectedTagMeta.label : t("directoryTitle")}
                </h2>
              </div>
              {loading ? (
                <span className="inline-flex items-center gap-2 text-muted text-[13px]">
                  <span className="w-[9px] h-[9px] rounded-full bg-[var(--green)] shadow-[0_0_0_rgba(15,169,104,0.4)] animate-[pulse_1.8s_infinite]" />
                  {t("refreshing")}
                </span>
              ) : null}
            </div>

            {/* toolbar */}
            <div className="flex gap-3 flex-wrap mb-[18px]">
              <label className="flex items-center gap-3 flex-1 basis-[320px] px-4 border border-ink/[0.08] rounded-[14px] bg-white/[0.88] text-ink min-h-[52px]">
                <Search size={18} color="#6d7f94" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full border-0 bg-transparent outline-none font-[inherit] text-inherit placeholder:text-muted"
                />
              </label>

              <Select value={sort} onValueChange={(v) => setSort(v as MarketSort)}>
                <SelectTrigger className="min-w-[180px]" aria-label="Sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {tSort(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {markets.length ? (
              <>
                <div className="grid grid-cols-4 gap-[14px] max-[1280px]:grid-cols-3 max-[960px]:grid-cols-2 max-[640px]:grid-cols-1">
                  {markets.map((market) => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      watched={false}
                      paperTradingConfigured={paperTradingConfigured}
                      onPredictionSaved={refreshPortfolio}
                      onToggleWatchlist={() => {}}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center mt-6 px-5 py-4 border-t border-ink/[0.06]">
                  <span className="text-[13px] text-muted tabular-nums">
                    {markets.length} / {total}
                  </span>
                  {hasMore ? (
                    <button
                      type="button"
                      className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-[8px] bg-accent px-4 text-[13px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0a5cdc] active:bg-[#0950c2] disabled:opacity-60"
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? t("refreshing") : t("loadMore")}
                    </button>
                  ) : null}
                </div>
              </>
            ) : showLoadFailure ? (
              <div className="grid place-items-center gap-2.5 py-[56px] px-6 rounded-[14px] bg-white/60 border border-dashed border-ink/[0.14] text-center">
                <AlertCircle size={32} className="text-muted opacity-70" />
                <h3 className="m-0 text-[18px] tracking-[-0.02em]">{t("loadFailedTitle")}</h3>
                <p className="m-0 text-muted text-[14px] max-w-[320px] leading-[1.5]">{t("loadFailedHint")}</p>
                {directoryError ? (
                  <code className="mt-2 text-[11px] bg-ink/[0.06] px-2.5 py-1.5 rounded-[8px] text-muted-strong max-w-full break-words">{directoryError}</code>
                ) : null}
              </div>
            ) : showSearchEmpty ? (
              <div className="grid place-items-center gap-2.5 py-[56px] px-6 rounded-[14px] bg-white/60 border border-dashed border-ink/[0.14] text-center">
                <SearchX size={32} className="text-muted opacity-70" />
                <h3 className="m-0 text-[18px] tracking-[-0.02em]">{t("noResultsTitle")}</h3>
                <p className="m-0 text-muted text-[14px] max-w-[320px] leading-[1.5]">{t("noResultsHint")}</p>
                <button
                  type="button"
                  className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-[8px] bg-white/60 border border-ink/[0.08] px-4 text-[13px] font-semibold tracking-[-0.01em] text-muted-strong transition-colors hover:bg-white/95 hover:border-ink/[0.14] hover:text-ink"
                  onClick={() => {
                    setQuery("");
                    setSelectedTag(ALL_TAG);
                  }}
                >
                  {tTags("all")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-[14px] max-[1280px]:grid-cols-3 max-[960px]:grid-cols-2 max-[640px]:grid-cols-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`sk-${index}`}
                    className="p-[14px] rounded-[12px] bg-white/60 border border-ink/[0.06] grid gap-2.5 min-h-[180px]"
                  >
                    <div className="h-3 w-[30%] rounded-[8px] bg-gradient-to-r from-ink/[0.06] via-ink/[0.12] to-ink/[0.06] bg-[length:200%_100%] animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
                    <div className="h-[22px] w-[90%] rounded-[8px] bg-gradient-to-r from-ink/[0.06] via-ink/[0.12] to-ink/[0.06] bg-[length:200%_100%] animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
                    <div className="h-12 rounded-[14px] mt-2 bg-gradient-to-r from-ink/[0.06] via-ink/[0.12] to-ink/[0.06] bg-[length:200%_100%] animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
                    <div className="h-[38px] rounded-[12px] bg-gradient-to-r from-ink/[0.06] via-ink/[0.12] to-ink/[0.06] bg-[length:200%_100%] animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
