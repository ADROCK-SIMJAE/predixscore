"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency, formatPercent } from "@/lib/format";

type Profile = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPredictions: number;
  wonCount: number;
  lostCount: number;
  winRate: number;
  realizedPnl: number;
};

export default function ProfilePage() {
  const t = useTranslations("profile");
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/profile/${encodeURIComponent(name)}`)
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error ?? "Profile not found");
        }
        return r.json();
      })
      .then((d) => setProfile(d.profile))
      .catch((err) => setError(err instanceof Error ? err.message : "Profile not found"))
      .finally(() => setLoading(false));
  }, [name]);

  return (
    <>
      <AppHeader />
      <main className="w-[min(1480px,calc(100vw-48px))] mx-auto pt-[88px] pb-[60px] flex flex-col gap-[18px]">
        <PageHeader eyebrow={t("eyebrow")} title={name} />

        {loading ? (
          <div className="grid place-items-center gap-2.5 py-[56px] px-6 rounded-[14px] bg-white/60 border border-dashed border-ink/[0.14] text-center">
            <p className="m-0 text-muted text-[14px]">{t("loading")}</p>
          </div>
        ) : error || !profile ? (
          <div className="grid place-items-center gap-2.5 py-[56px] px-6 rounded-[14px] bg-white/60 border border-dashed border-ink/[0.14] text-center">
            <User size={32} className="text-muted opacity-70" />
            <h3 className="m-0 text-[18px] tracking-[-0.02em]">{t("notFoundTitle")}</h3>
            <p className="m-0 text-muted text-[14px] max-w-[320px] leading-[1.5]">{t("notFoundHint")}</p>
          </div>
        ) : (
          <>
            {/* Profile hero */}
            <div className="glass-panel grid [grid-template-columns:80px_minmax(0,1fr)] gap-[18px] items-center p-[22px] rounded-[14px] bg-gradient-to-b from-accent/[0.04] to-white/[0.94] max-[720px]:[grid-template-columns:64px_1fr]">
              <div className="w-20 h-20 rounded-[14px] bg-gradient-to-br from-accent to-[#42a0ff] text-white grid place-items-center font-[800] text-[28px] tracking-[0.04em] shadow-[0_12px_28px_rgba(15,109,255,0.32)]">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-muted text-[12px] tracking-[0.14em] uppercase">{t("displayName")}</span>
                <h2 className="m-0 mt-1 text-[28px] tracking-[-0.03em] leading-[1.1] max-[720px]:text-[22px]">{profile.displayName}</h2>
                <p className="text-muted-strong text-[13px] leading-[1.5] m-0">{t("subtitle")}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="glass-panel p-[20px_22px] grid gap-3.5">
              <div className="grid grid-cols-4 gap-4 max-[720px]:grid-cols-2">
                <div className="grid gap-1">
                  <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("totalPredictions")}</span>
                  <strong className="text-[18px] tracking-[-0.02em] tabular-nums">{profile.totalPredictions}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("winRate")}</span>
                  <strong className="text-[18px] tracking-[-0.02em] tabular-nums">{formatPercent(profile.winRate)}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("record")}</span>
                  <strong className="text-[18px] tracking-[-0.02em] tabular-nums">
                    {profile.wonCount}W / {profile.lostCount}L
                  </strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-[12px] text-muted uppercase tracking-[0.06em]">{t("realizedPnl")}</span>
                  <strong className={`text-[18px] tracking-[-0.02em] tabular-nums ${profile.realizedPnl > 0 ? "text-positive-text" : ""}`}>
                    {profile.realizedPnl > 0
                      ? `+${formatCurrency(profile.realizedPnl)}`
                      : formatCurrency(profile.realizedPnl)}
                  </strong>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
