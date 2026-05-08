"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { PositionsList } from "@/components/portfolio/PositionsList";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { PaperPositionSummary } from "@/lib/paper";

// Avoid unused warning in case formatPercent isn't used downstream
void formatPercent;

type StatusTab = "all" | "pending" | "won" | "lost";

type PortfolioResponse = {
  positions: PaperPositionSummary[];
  totals: { staked: number; currentValue: number; pnl: number; pnlPercent: number };
};

type Stats = {
  availableBalance: number;
  startingBalance: number;
  pendingStaked: number;
  realizedPnl: number;
  pendingCount: number;
  wonCount: number;
  lostCount: number;
};

export default function PositionsPage() {
  const t = useTranslations("positions");
  const tBalance = useTranslations("balance");
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<StatusTab>("all");
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    fetch("/api/paper/settle", { method: "POST" }).catch(() => {});
  }, []);

  async function refresh(currentTab: StatusTab) {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentTab !== "all") params.set("status", currentTab);
    const [pos, st] = await Promise.all([
      fetch(`/api/paper/positions?${params.toString()}`).then((r) => r.json()),
      fetch("/api/paper/stats").then((r) => r.json()),
    ]);
    setData(pos);
    setStats(st.stats);
    setLoading(false);
  }

  useEffect(() => {
    refresh(tab);
  }, [tab]);

  async function manualSettle() {
    setSettling(true);
    await fetch("/api/paper/settle", { method: "POST" });
    await refresh(tab);
    setSettling(false);
  }

  const tabs: StatusTab[] = ["all", "pending", "won", "lost"];

  return (
    <>
      <AppHeader />
      <main className="page-shell">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          right={
            <button
              type="button"
              className="ghost-button"
              onClick={manualSettle}
              disabled={settling}
            >
              {settling ? t("settling") : t("settleNow")}
            </button>
          }
        />

      {stats ? (
        <div className="balance-hero glass-panel">
          <div className="balance-hero-top">
            <div className="balance-hero-icon">
              <Wallet size={22} />
            </div>
            <div className="balance-hero-copy">
              <span className="eyebrow">{tBalance("title")}</span>
              <strong className="balance-hero-amount">{formatCurrency(stats.availableBalance)}</strong>
              <span className="balance-hero-sub">
                {tBalance("starting", { amount: formatCurrency(stats.startingBalance) })}
              </span>
            </div>
          </div>
          <div className="balance-hero-stats">
            <div>
              <span>{t("pending")}</span>
              <strong>{formatCurrency(stats.pendingStaked)}</strong>
            </div>
            <div>
              <span>{tBalance("realized")}</span>
              <strong className={Math.round(stats.realizedPnl * 100) > 0 ? "text-positive-text" : ""}>
                {Math.round(stats.realizedPnl * 100) > 0
                  ? `+${formatCurrency(stats.realizedPnl)}`
                  : formatCurrency(Math.abs(Math.round(stats.realizedPnl * 100)) === 0 ? 0 : stats.realizedPnl)}
              </strong>
            </div>
            <div>
              <span>{t("record")}</span>
              <strong>
                {stats.wonCount}W · {stats.lostCount}L · {stats.pendingCount}P
              </strong>
            </div>
            <div>
              <span>{t("pnlPercent")}</span>
              <strong>
                {formatPercent(
                  data && data.totals.staked > 0
                    ? (Math.round(data.totals.pnl * 100) / 100) / data.totals.staked
                    : 0,
                )}
              </strong>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2.5">
        {tabs.map((value) => (
          <button
            key={value}
            type="button"
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              tab === value
                ? "bg-[linear-gradient(135deg,#0f6dff_0%,#42a0ff_100%)] text-white shadow-[0_8px_24px_rgba(15,109,255,0.24)]"
                : "bg-white/65 text-[var(--muted-strong)] hover:bg-white/90"
            }`}
            onClick={() => setTab(value)}
          >
            {t(`tab.${value}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state-card">
          <p>{t("loading")}</p>
        </div>
      ) : (
        <PositionsList positions={data?.positions ?? []} />
      )}
      </main>
    </>
  );
}
