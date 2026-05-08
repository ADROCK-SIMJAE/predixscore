"use client";

import { useEffect, useState } from "react";
import { Edit3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { DisplayNameModal } from "@/components/auth/DisplayNameModal";
import { SignInModal } from "@/components/auth/SignInModal";
import { formatCurrency, formatPercent } from "@/lib/format";

type Stats = {
  totalPredictions: number;
  pendingCount: number;
  wonCount: number;
  lostCount: number;
  winRate: number;
  totalStaked: number;
  realizedPnl: number;
  availableBalance: number;
  startingBalance: number;
};

export default function MyProfilePage() {
  const t = useTranslations("profile");
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    fetch("/api/paper/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.stats));
  }, [user?.id]);

  return (
    <>
      <AppHeader />
      <main className="w-[min(1480px,calc(100vw-48px))] mx-auto pt-[88px] pb-[60px] flex flex-col gap-[18px]">
        <PageHeader
          eyebrow={t("eyebrowMe")}
          title={profile?.display_name ?? t("anonymous")}
        />

        {!user ? (
          <div className="grid place-items-center gap-2.5 py-[56px] px-6 rounded-[14px] bg-white/60 border border-dashed border-ink/[0.14] text-center">
            <h3 className="m-0 text-[18px] tracking-[-0.02em]">{t("signInRequired")}</h3>
            <p className="m-0 text-muted text-[14px] max-w-[320px] leading-[1.5]">{t("signInRequiredHint")}</p>
            <button
              type="button"
              className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-[8px] bg-accent px-4 text-[13px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0a5cdc] active:bg-[#0950c2]"
              onClick={() => setSignInOpen(true)}
            >
              {t("signInCta")}
            </button>
          </div>
        ) : (
          <>
            {/* Profile hero */}
            <div className="glass-panel grid [grid-template-columns:80px_minmax(0,1fr)_auto] gap-[18px] items-center p-[22px] rounded-[14px] bg-gradient-to-b from-accent/[0.04] to-white/[0.94] max-[720px]:[grid-template-columns:64px_1fr]">
              <div className="w-20 h-20 rounded-[14px] bg-gradient-to-br from-accent to-[#42a0ff] text-white grid place-items-center font-[800] text-[28px] tracking-[0.04em] shadow-[0_12px_28px_rgba(15,109,255,0.32)]">
                {(profile?.display_name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="grid gap-1">
                <span className="text-muted text-[12px] tracking-[0.14em] uppercase">{t("displayName")}</span>
                <h2 className="m-0 text-[28px] tracking-[-0.03em] leading-[1.1]">
                  {profile?.display_name ?? t("anonymous")}
                </h2>
                <p className="text-muted-strong text-[13px] leading-[1.5] m-0">{user.email}</p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/70 px-4 text-sm font-medium text-muted-strong transition hover:bg-white/90 max-[720px]:col-span-2 max-[720px]:justify-self-start"
                onClick={() => setNameOpen(true)}
              >
                <Edit3 size={14} />
                {profile?.display_name ? t("editName") : t("setName")}
              </button>
            </div>

            {stats ? (
              <div className="glass-panel p-[20px_22px] grid gap-3.5 bg-gradient-to-b from-[rgba(15,169,104,0.05)] to-white/[0.92] border-[rgba(15,169,104,0.18)]">
                <div className="grid grid-cols-4 gap-4 max-[720px]:grid-cols-2">
                  <div className="grid gap-1">
                    <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("balance")}</span>
                    <strong className="text-[28px] tracking-[-0.03em] tabular-nums bg-gradient-to-br from-[#0fa968] to-[#1cc97e] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                      {formatCurrency(stats.availableBalance)}
                    </strong>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("totalPredictions")}</span>
                    <strong className="text-[18px] tracking-[-0.02em] tabular-nums">{stats.totalPredictions}</strong>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("winRate")}</span>
                    <strong className="text-[18px] tracking-[-0.02em] tabular-nums">{formatPercent(stats.winRate)}</strong>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("realizedPnl")}</span>
                    <strong className={`text-[18px] tracking-[-0.02em] tabular-nums ${stats.realizedPnl > 0 ? "text-positive-text" : ""}`}>
                      {stats.realizedPnl > 0
                        ? `+${formatCurrency(stats.realizedPnl)}`
                        : formatCurrency(stats.realizedPnl)}
                    </strong>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        <DisplayNameModal open={nameOpen} onClose={() => setNameOpen(false)} />
        <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      </main>
    </>
  );
}
