"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { PaperPositionSummary, PaperPositionStatus } from "@/lib/paper";

type PositionsListProps = {
  positions: PaperPositionSummary[];
  emptyHint?: string;
};

const STATUS_PILL_BASE =
  "inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]";

const STATUS_PILL_CLASS: Record<PaperPositionStatus, string> = {
  pending: `${STATUS_PILL_BASE} bg-accent/10 text-accent-deep`,
  won: `${STATUS_PILL_BASE} bg-positive/[0.16] text-positive-text`,
  lost: `${STATUS_PILL_BASE} bg-negative/[0.16] text-negative-text`,
  voided: `${STATUS_PILL_BASE} bg-ink/[0.08] text-muted`,
};

function pnlClass(pnl: number | null) {
  if (pnl === null) return "";
  if (Math.round(pnl * 100) > 0) return "text-[#0e6d44]";
  if (Math.round(pnl * 100) < 0) return "text-[#b13036]";
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
      <div className="grid place-items-center gap-2.5 py-[56px] px-6 rounded-[14px] bg-white/60 border border-dashed border-ink/[0.14] text-center">
        <h3 className="m-0 text-[18px] tracking-[-0.02em]">{t("emptyTitle")}</h3>
        {emptyHint ? (
          <p className="m-0 text-muted text-[14px] max-w-[320px] leading-[1.5]">{emptyHint}</p>
        ) : (
          <p className="m-0 text-muted text-[14px] max-w-[320px] leading-[1.5]">{t("emptyHint")}</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-1.5">
      {/* header */}
      <header className="grid [grid-template-columns:minmax(0,1.6fr)_110px_110px_130px_110px] gap-3.5 items-center px-4 py-2 rounded-[12px] bg-white/40 text-[11px] uppercase tracking-[0.08em] text-muted max-[720px]:[grid-template-columns:minmax(0,1.4fr)_80px_100px]">
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
            className="grid [grid-template-columns:minmax(0,1.6fr)_110px_110px_130px_110px] gap-3.5 items-center px-4 py-3.5 rounded-[14px] bg-white/70 border border-ink/[0.06] no-underline text-inherit transition-[transform,box-shadow,background] duration-150 hover:bg-white/95 hover:-translate-y-px hover:shadow-[0_8px_22px_rgba(13,28,65,0.08)] max-[720px]:[grid-template-columns:minmax(0,1.4fr)_80px_100px]"
            key={p.id}
          >
            <div className="grid gap-1 min-w-0">
              <strong className="text-[15px] tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis">{p.marketQuestion}</strong>
              {showSubtitle ? (
                <span className="text-[12px] text-muted whitespace-nowrap overflow-hidden text-ellipsis">{p.eventTitle}</span>
              ) : null}
            </div>
            <div className="grid gap-0.5">
              <strong className={`text-[14px] ${p.outcomeIndex === 0 ? "text-[#0e6d44]" : "text-[#b13036]"}`}>
                {p.outcomeLabel}
              </strong>
              <span className="text-[12px] text-muted tabular-nums">{Math.round(p.entryPrice * 100)}%</span>
            </div>
            <div className="tabular-nums font-semibold">{formatCurrency(p.stakeAmount)}</div>
            <div className={`grid gap-0.5 tabular-nums font-semibold ${tone}`}>
              {formatSignedCurrency(p.pnlAmount)}
              {p.pnlPercent !== null && Math.round(p.pnlPercent * 1000) !== 0 ? (
                <em className="not-italic text-[11px] text-muted font-medium">{formatPercent(p.pnlPercent)}</em>
              ) : null}
            </div>
            <div>
              <span className={STATUS_PILL_CLASS[p.status]}>{t(`status.${p.status}`)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
