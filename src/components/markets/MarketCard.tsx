"use client";

import Link from "next/link";
import { useState } from "react";
import { Flame, Sparkles, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  formatCompactNumber,
  formatCurrency,
  formatRelativeWindow,
} from "@/lib/format";
import type { MarketSnapshot } from "@/types/polymarket";
import { useAuth } from "@/components/providers/AuthProvider";
import { SignInModal } from "@/components/auth/SignInModal";
import { BetModal } from "./BetModal";

type MarketCardProps = {
  market: MarketSnapshot;
  watched: boolean;
  onToggleWatchlist: (slug: string) => void;
  paperTradingConfigured: boolean;
  onPredictionSaved?: () => void;
  onRequireSignIn?: () => void;
};

export function MarketCard({
  market,
  watched,
  onToggleWatchlist,
  paperTradingConfigured,
  onPredictionSaved,
  onRequireSignIn,
}: MarketCardProps) {
  const t = useTranslations("card");
  const { user } = useAuth();
  const [betOpen, setBetOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [side, setSide] = useState<0 | 1>(0);

  const eventHref = `/event/${market.eventSlug}?market=${market.marketSlug}`;
  const yesPercent = Math.round((market.outcomePrices[0] ?? market.yesPrice) * 100);
  const noPercent = Math.round((market.outcomePrices[1] ?? market.noPrice) * 100);
  const thumb = market.image || market.icon;
  const isCloseCall =
    market.competitive >= 0.45 &&
    market.competitive <= 0.55 &&
    market.volume24h > 1000;
  const isHot = market.volume24h >= 100_000;
  const isFeatured = market.featured;

  function openBet(nextSide: 0 | 1, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      if (onRequireSignIn) onRequireSignIn();
      else setSignInOpen(true);
      return;
    }
    setSide(nextSide);
    setBetOpen(true);
  }

  return (
    <>
      <article className="relative overflow-hidden rounded-[16px] border border-[rgba(16,44,75,0.08)] bg-white/85 p-[14px_16px] grid gap-[10px] min-h-[200px] shadow-[0_2px_8px_rgba(80,109,145,0.06)] transition-[border-color,box-shadow] duration-160 hover:border-accent/30 hover:shadow-[0_4px_12px_rgba(15,109,255,0.08)]">
        {/* top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            {thumb ? (
              <span className="inline-grid place-items-center w-[26px] h-[26px] rounded-[8px] overflow-hidden bg-ink/[0.06] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 px-3 py-2 text-[12px] text-muted-strong bg-accent/[0.08] rounded-full">
              {market.category}
            </span>
            <span className="text-muted text-[13px]">{formatRelativeWindow(market.endDate)}</span>
          </div>
          <button
            className={`inline-flex items-center justify-center w-7 h-7 rounded-[14px] border-0 bg-white/[0.84] transition-[transform,color] duration-160 active:scale-[0.85] will-change-transform ${watched ? "text-[#f5a524]" : "text-muted-strong"}`}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleWatchlist(market.slug);
            }}
            aria-label={watched ? t("watchRemove") : t("watchAdd")}
          >
            <Star size={18} fill={watched ? "currentColor" : "none"} />
          </button>
        </div>

        {/* badges */}
        {market.isNew || isCloseCall || isHot || isFeatured ? (
          <div className="flex gap-1.5 flex-wrap">
            {isFeatured ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.04em] bg-amber-brand/10 text-amber-text">
                <Star size={12} fill="currentColor" /> Featured
              </span>
            ) : null}
            {market.isNew ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.04em] bg-gradient-to-r from-accent/[0.16] to-[rgba(66,160,255,0.08)] text-[#0a3d8f]">
                <Sparkles size={12} /> NEW
              </span>
            ) : null}
            {isCloseCall ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.04em] bg-gradient-to-r from-[rgba(245,165,36,0.18)] to-[rgba(244,173,66,0.08)] text-[#91590b]">
                ⚖ 50/50
              </span>
            ) : null}
            {isHot ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.04em] bg-gradient-to-r from-negative/[0.18] to-[rgba(255,122,131,0.08)] text-negative-text">
                <Flame size={12} /> Hot
              </span>
            ) : null}
          </div>
        ) : null}

        {/* question */}
        <Link href={eventHref} className="grid gap-2.5">
          <h3 className="m-0 text-[15px] leading-[1.32] tracking-[-0.01em] [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden min-h-[60px]">
            {market.question}
          </h3>
        </Link>

        {/* prob bar */}
        <div className="relative h-2 bg-ink/[0.06] rounded-[4px] overflow-hidden -mt-1" aria-hidden="true">
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0fa968] to-[#1cc97e] rounded-[4px]"
            style={{ width: `${Math.max(2, yesPercent)}%` }}
          />
          <span className="absolute right-1.5 -top-4 text-[11px] font-bold text-muted-strong tabular-nums">
            {yesPercent}%
          </span>
        </div>

        {/* yes/no buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] border border-[rgba(15,169,104,0.18)] bg-gradient-to-b from-[rgba(15,169,104,0.16)] to-[rgba(15,169,104,0.06)] text-[#0e6d44] font-semibold text-[13px] cursor-pointer transition-[transform,background] duration-120 hover:-translate-y-px hover:from-[rgba(15,169,104,0.24)] hover:to-[rgba(15,169,104,0.10)] active:scale-[0.98] will-change-transform"
            onClick={(event) => openBet(0, event)}
          >
            <span className="text-[13px]">{t("yes")}</span>
            <strong className="text-[14px] tabular-nums tracking-[-0.02em]">{yesPercent}%</strong>
          </button>
          <button
            type="button"
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] border border-[rgba(239,91,97,0.18)] bg-gradient-to-b from-[rgba(239,91,97,0.16)] to-[rgba(239,91,97,0.06)] text-[#b13036] font-semibold text-[13px] cursor-pointer transition-[transform,background] duration-120 hover:-translate-y-px hover:from-[rgba(239,91,97,0.24)] hover:to-[rgba(239,91,97,0.10)] active:scale-[0.98] will-change-transform"
            onClick={(event) => openBet(1, event)}
          >
            <span className="text-[13px]">{t("no")}</span>
            <strong className="text-[14px] tabular-nums tracking-[-0.02em]">{noPercent}%</strong>
          </button>
        </div>

        {/* foot */}
        <div className="flex gap-1.5 text-[11px] text-muted mt-auto pt-1 border-t border-ink/[0.04] tabular-nums">
          <span>${formatCompactNumber(market.volume24h)} 24h</span>
          {market.volume1wk > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span>${formatCompactNumber(market.volume1wk)} 7d</span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>${formatCompactNumber(market.liquidity)} {t("liquidity")}</span>
        </div>
      </article>

      <BetModal
        open={betOpen}
        onClose={() => setBetOpen(false)}
        market={market}
        eventSlug={market.eventSlug}
        eventTitle={market.question}
        initialOutcomeIndex={side}
        paperTradingConfigured={paperTradingConfigured}
        onSuccess={onPredictionSaved}
      />
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
