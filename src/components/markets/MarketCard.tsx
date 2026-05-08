"use client";

import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  formatCompactNumber,
  formatCurrency,
  formatRelativeWindow,
} from "@/lib/format";
import type { MarketSnapshot } from "@/types/polymarket";
import { BetModal } from "./BetModal";

type MarketCardProps = {
  market: MarketSnapshot;
  watched: boolean;
  onToggleWatchlist: (slug: string) => void;
  paperTradingConfigured: boolean;
  onPredictionSaved?: () => void;
};

export function MarketCard({
  market,
  watched,
  onToggleWatchlist,
  paperTradingConfigured,
  onPredictionSaved,
}: MarketCardProps) {
  const t = useTranslations("card");
  const [betOpen, setBetOpen] = useState(false);
  const [side, setSide] = useState<0 | 1>(0);

  const eventHref = `/event/${market.eventSlug}?market=${market.marketSlug}`;
  const yesPercent = Math.round((market.outcomePrices[0] ?? market.yesPrice) * 100);
  const noPercent = Math.round((market.outcomePrices[1] ?? market.noPrice) * 100);

  function openBet(nextSide: 0 | 1, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setSide(nextSide);
    setBetOpen(true);
  }

  return (
    <>
      <article className="market-card">
        <div className="market-card-top">
          <div className="market-card-context">
            <span className="market-category">{market.category}</span>
            <span className="market-timing">{formatRelativeWindow(market.endDate)}</span>
          </div>
          <button
            className={`watch-toggle ${watched ? "active" : ""}`}
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

        <Link href={eventHref} className="market-card-copy">
          <h3 className="market-question">{market.question}</h3>
          {market.description ? (
            <p className="market-description">{market.description}</p>
          ) : null}
        </Link>

        <div className="market-yes-no">
          <button type="button" className="bet-btn yes" onClick={(event) => openBet(0, event)}>
            <span>{t("yes")}</span>
            <strong>{yesPercent}%</strong>
          </button>
          <button type="button" className="bet-btn no" onClick={(event) => openBet(1, event)}>
            <span>{t("no")}</span>
            <strong>{noPercent}%</strong>
          </button>
        </div>

        <div className="market-meta">
          <div className="meta-box">
            <span className="label">{t("volume24h")}</span>
            <span className="value">{formatCurrency(market.volume24h)}</span>
          </div>
          <div className="meta-box">
            <span className="label">{t("liquidity")}</span>
            <span className="value">{formatCurrency(market.liquidity)}</span>
          </div>
          <div className="meta-box">
            <span className="label">{t("openInterest")}</span>
            <span className="value">${formatCompactNumber(market.openInterest)}</span>
          </div>
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
    </>
  );
}
