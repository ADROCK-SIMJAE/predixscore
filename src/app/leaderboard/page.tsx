"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency, formatPercent } from "@/lib/format";

type LeaderboardEntry = {
  userId: string;
  displayName: string;
  totalPredictions: number;
  wonCount: number;
  lostCount: number;
  winRate: number;
  realizedPnl: number;
};

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AppHeader />
      <main className="w-[min(1480px,calc(100vw-48px))] mx-auto pt-[88px] pb-[60px] flex flex-col gap-[18px]">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} />

        <div className="glass-panel p-[22px]">
          {loading ? (
            <p className="text-muted-strong text-[13px] leading-[1.5] m-0">{t("loading")}</p>
          ) : entries.length === 0 ? (
            <div className="grid place-items-center gap-2.5 py-[56px] px-6 rounded-[14px] bg-white/60 border border-dashed border-ink/[0.14] text-center">
              <Trophy size={32} className="text-muted opacity-70" />
              <h3 className="m-0 text-[18px] tracking-[-0.02em]">{t("emptyTitle")}</h3>
              <p className="m-0 text-muted text-[14px] max-w-[320px] leading-[1.5]">{t("emptyHint")}</p>
            </div>
          ) : (
            <div className="grid gap-1.5">
              {/* header */}
              <header className="grid [grid-template-columns:40px_minmax(0,1.4fr)_90px_100px_110px] gap-3.5 px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] text-muted max-[720px]:[grid-template-columns:32px_minmax(0,1fr)_70px_100px]">
                <span>#</span>
                <span>{t("colUser")}</span>
                <span>{t("colWinRate")}</span>
                <span>{t("colRecord")}</span>
                <span className="max-[720px]:hidden">{t("colPnl")}</span>
              </header>
              {entries.map((entry, index) => (
                <Link
                  key={entry.userId}
                  className="grid [grid-template-columns:40px_minmax(0,1.4fr)_90px_100px_110px] gap-3.5 items-center px-3.5 py-3 rounded-[14px] bg-white/70 border border-ink/[0.06] no-underline text-inherit tabular-nums transition-[transform,background] duration-[160ms] hover:bg-white/95 hover:-translate-y-px max-[720px]:[grid-template-columns:32px_minmax(0,1fr)_70px_100px]"
                  href={`/profile/${encodeURIComponent(entry.displayName)}`}
                >
                  <strong
                    className={
                      index === 0
                        ? "w-7 h-7 rounded-full grid place-items-center text-white text-[12px] font-[800] bg-gradient-to-br from-[#f5a524] to-[#ffd700] shadow-[0_4px_12px_rgba(245,165,36,0.32)]"
                        : index === 1
                          ? "w-7 h-7 rounded-full grid place-items-center text-white text-[12px] font-[800] bg-gradient-to-br from-[#94a3b8] to-[#cbd5e1] shadow-[0_4px_12px_rgba(148,163,184,0.32)]"
                          : index === 2
                            ? "w-7 h-7 rounded-full grid place-items-center text-white text-[12px] font-[800] bg-gradient-to-br from-[#cd7f32] to-[#e0a370] shadow-[0_4px_12px_rgba(205,127,50,0.32)]"
                            : "text-muted text-[14px]"
                    }
                  >
                    {index + 1}
                  </strong>
                  <span className="font-semibold text-[15px] tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis">{entry.displayName}</span>
                  <span>{formatPercent(entry.winRate)}</span>
                  <span>{entry.wonCount}W / {entry.lostCount}L</span>
                  <strong className={`max-[720px]:hidden ${entry.realizedPnl > 0 ? "text-positive-text" : ""}`}>
                    {entry.realizedPnl > 0
                      ? `+${formatCurrency(entry.realizedPnl)}`
                      : formatCurrency(entry.realizedPnl)}
                  </strong>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
