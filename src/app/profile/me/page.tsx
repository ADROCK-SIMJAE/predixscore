"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
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
    <main className="page-shell">
      <header className="shell-header glass-panel">
        <div className="brand-row">
          <Link href="/" className="ghost-button" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ArrowLeft size={16} />
            Markets
          </Link>
          <div className="brand-copy">
            <span className="eyebrow">{t("eyebrowMe")}</span>
            <h1 className="brand-title">{profile?.display_name ?? t("anonymous")}</h1>
          </div>
        </div>
        <div className="header-actions">
          <LocaleToggle />
        </div>
      </header>

      {!user ? (
        <div className="empty-state-card">
          <h3>{t("signInRequired")}</h3>
          <p>{t("signInRequiredHint")}</p>
          <button type="button" className="solid-button" onClick={() => setSignInOpen(true)}>
            {t("signInCta")}
          </button>
        </div>
      ) : (
        <>
          <div className="profile-hero glass-panel">
            <div className="profile-avatar">
              {(profile?.display_name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="profile-hero-copy">
              <span className="eyebrow">{t("displayName")}</span>
              <h2 className="profile-name">
                {profile?.display_name ?? t("anonymous")}
              </h2>
              <p className="empty-state-copy">{user.email}</p>
            </div>
            <button type="button" className="ghost-button" onClick={() => setNameOpen(true)}>
              <Edit3 size={14} />
              {profile?.display_name ? t("editName") : t("setName")}
            </button>
          </div>

          {stats ? (
            <>
              <div className="event-meta-card glass-panel highlight-balance">
                <div className="event-meta-stats">
                  <div>
                    <span>{t("balance")}</span>
                    <strong className="big-balance">
                      {formatCurrency(stats.availableBalance)}
                    </strong>
                  </div>
                  <div>
                    <span>{t("totalPredictions")}</span>
                    <strong>{stats.totalPredictions}</strong>
                  </div>
                  <div>
                    <span>{t("winRate")}</span>
                    <strong>{formatPercent(stats.winRate)}</strong>
                  </div>
                  <div>
                    <span>{t("realizedPnl")}</span>
                    <strong className={stats.realizedPnl > 0 ? "profit-positive" : ""}>
                      {stats.realizedPnl > 0
                        ? `+${formatCurrency(stats.realizedPnl)}`
                        : formatCurrency(stats.realizedPnl)}
                    </strong>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      <DisplayNameModal open={nameOpen} onClose={() => setNameOpen(false)} />
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </main>
  );
}
