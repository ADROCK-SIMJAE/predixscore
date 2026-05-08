"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { PositionsList } from "@/components/portfolio/PositionsList";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { PaperPositionSummary } from "@/lib/paper";

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

  const realizedDisplay =
    Math.round(stats?.realizedPnl ?? 0 * 100) > 0
      ? `+${formatCurrency(stats?.realizedPnl ?? 0)}`
      : formatCurrency(stats?.realizedPnl ?? 0);

  const pnlPercent =
    data && data.totals.staked > 0
      ? (Math.round(data.totals.pnl * 100) / 100) / data.totals.staked
      : 0;

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-[min(1480px,calc(100vw-48px))] flex-col gap-[18px] pt-[88px] pb-[60px]">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          right={
            <button
              type="button"
              onClick={manualSettle}
              disabled={settling}
              className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-lg border border-line/60 bg-white/60 px-4 text-[13px] font-semibold tracking-tight text-muted-strong transition-colors hover:border-line-strong/40 hover:bg-white/95 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {settling ? t("settling") : t("settleNow")}
            </button>
          }
        />

        {stats ? (
          <div className="grid gap-5 rounded-2xl border border-positive/20 bg-gradient-to-b from-positive/[0.04] to-white/95 p-6 shadow-sm backdrop-blur-2xl">
            <div className="grid grid-cols-[56px_1fr] items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-positive to-positive-light text-white shadow-[0_10px_24px_rgba(15,169,104,0.32)]">
                <Wallet size={22} />
              </div>
              <div className="grid gap-0.5">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  {tBalance("title")}
                </span>
                <strong className="bg-gradient-to-br from-positive to-positive-light bg-clip-text text-[42px] font-bold leading-tight tracking-tighter tabular-nums text-transparent">
                  {formatCurrency(stats.availableBalance)}
                </strong>
                <span className="mt-1 text-xs tracking-wide text-muted">
                  {tBalance("starting", { amount: formatCurrency(stats.startingBalance) })}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 border-t border-line/40 pt-4 max-[720px]:grid-cols-2 max-[720px]:gap-4">
              {[
                { label: t("pending"), value: formatCurrency(stats.pendingStaked) },
                {
                  label: tBalance("realized"),
                  value: realizedDisplay,
                  tone: stats.realizedPnl > 0 ? "positive" : undefined,
                },
                {
                  label: t("record"),
                  value: `${stats.wonCount}W · ${stats.lostCount}L · ${stats.pendingCount}P`,
                },
                { label: t("pnlPercent"), value: formatPercent(pnlPercent) },
              ].map((item, idx) => (
                <div
                  key={item.label}
                  className={`grid gap-1 px-4 ${idx > 0 ? "border-l border-line/40 max-[720px]:border-l-0" : ""}`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {item.label}
                  </span>
                  <strong
                    className={`text-lg leading-tight tracking-tight tabular-nums ${
                      item.tone === "positive" ? "text-positive-text" : "text-ink"
                    }`}
                  >
                    {item.value}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {tabs.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === value
                  ? "border border-accent bg-accent text-white"
                  : "border border-line/60 bg-white/60 text-muted-strong hover:border-line-strong/40 hover:bg-white/95 hover:text-ink"
              }`}
            >
              {t(`tab.${value}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid place-items-center gap-2.5 rounded-2xl border border-dashed border-ink/[0.14] bg-white/60 px-6 py-14 text-center">
            <p className="m-0 text-sm leading-relaxed text-muted">{t("loading")}</p>
          </div>
        ) : (
          <PositionsList positions={data?.positions ?? []} />
        )}
      </main>
    </>
  );
}
