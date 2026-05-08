"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { PaperPositionSummary, PaperPositionStatus } from "@/lib/paper";

type PositionsListProps = {
  positions: PaperPositionSummary[];
  emptyHint?: string;
};

const STATUS_CLASS: Record<PaperPositionStatus, string> = {
  pending: "status-pill pending",
  won: "status-pill won",
  lost: "status-pill lost",
  voided: "status-pill voided",
};

function pnlClass(pnl: number | null) {
  if (pnl === null) return "";
  // Treat sub-cent as zero so "-$0.00" never appears.
  if (Math.round(pnl * 100) > 0) return "positive";
  if (Math.round(pnl * 100) < 0) return "negative";
  return "";
}

function formatSignedCurrency(pnl: number | null) {
  if (pnl === null) return "—";
  const cents = Math.round(pnl * 100);
  if (cents === 0) return formatCurrency(0);
  return cents > 0 ? `+${formatCurrency(pnl)}` : formatCurrency(pnl);
}

export function PositionsList({ positions, emptyHint }: PositionsListProps) {
  const t = useTranslations("positions");

  if (!positions.length) {
    return (
      <div className="empty-state-card">
        <h3>{t("emptyTitle")}</h3>
        {emptyHint ? <p>{emptyHint}</p> : <p>{t("emptyHint")}</p>}
      </div>
    );
  }

  return (
    <div className="positions-table">
      <header className="positions-row positions-row--head">
        <span>{t("colMarket")}</span>
        <span>{t("colCall")}</span>
        <span>{t("colStake")}</span>
        <span>{t("colPnl")}</span>
        <span>{t("colStatus")}</span>
      </header>
      {positions.map((p) => {
        const showSubtitle = p.eventTitle && p.eventTitle !== p.marketQuestion;
        const tone = pnlClass(p.pnlAmount);
        return (
          <Link
            href={`/event/${p.eventSlug}?market=${p.marketSlug}`}
            className="positions-row"
            key={p.id}
          >
            <div className="positions-market">
              <strong>{p.marketQuestion}</strong>
              {showSubtitle ? <span>{p.eventTitle}</span> : null}
            </div>
            <div className="positions-call">
              <strong className={p.outcomeIndex === 0 ? "call-yes" : "call-no"}>
                {p.outcomeLabel}
              </strong>
              <span>{Math.round(p.entryPrice * 100)}%</span>
            </div>
            <div className="positions-stake">{formatCurrency(p.stakeAmount)}</div>
            <div className={`positions-pnl ${tone}`}>
              {formatSignedCurrency(p.pnlAmount)}
              {p.pnlPercent !== null && Math.round(p.pnlPercent * 1000) !== 0 ? (
                <em>{formatPercent(p.pnlPercent)}</em>
              ) : null}
            </div>
            <div>
              <span className={STATUS_CLASS[p.status]}>{t(`status.${p.status}`)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
