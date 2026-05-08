"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
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
    <main className="page-shell">
      <header className="shell-header glass-panel">
        <div className="brand-row">
          <Link href="/" className="ghost-button" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ArrowLeft size={16} />
            Markets
          </Link>
          <div className="brand-copy">
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1 className="brand-title">{t("title")}</h1>
          </div>
        </div>
        <div className="header-actions">
          <LocaleToggle />
        </div>
      </header>

      <div className="leaderboard-card glass-panel">
        {loading ? (
          <p className="empty-state-copy">{t("loading")}</p>
        ) : entries.length === 0 ? (
          <div className="empty-state-card">
            <Trophy size={32} className="empty-state-icon" />
            <h3>{t("emptyTitle")}</h3>
            <p>{t("emptyHint")}</p>
          </div>
        ) : (
          <div className="leaderboard-table">
            <header>
              <span>#</span>
              <span>{t("colUser")}</span>
              <span>{t("colWinRate")}</span>
              <span>{t("colRecord")}</span>
              <span>{t("colPnl")}</span>
            </header>
            {entries.map((entry, index) => (
              <Link
                key={entry.userId}
                className="leaderboard-row"
                href={`/profile/${encodeURIComponent(entry.displayName)}`}
              >
                <strong>{index + 1}</strong>
                <span className="lb-name">{entry.displayName}</span>
                <span>{formatPercent(entry.winRate)}</span>
                <span>
                  {entry.wonCount}W / {entry.lostCount}L
                </span>
                <strong className={entry.realizedPnl > 0 ? "profit-positive" : ""}>
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
  );
}
