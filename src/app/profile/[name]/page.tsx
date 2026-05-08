"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
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
    <main className="page-shell">
      <header className="shell-header glass-panel">
        <div className="brand-row">
          <Link
            href="/leaderboard"
            className="ghost-button"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <ArrowLeft size={16} />
            {t("back")}
          </Link>
          <div className="brand-copy">
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1 className="brand-title">{name}</h1>
          </div>
        </div>
        <div className="header-actions">
          <LocaleToggle />
        </div>
      </header>

      {loading ? (
        <div className="empty-state-card">
          <p>{t("loading")}</p>
        </div>
      ) : error || !profile ? (
        <div className="empty-state-card">
          <User size={32} className="empty-state-icon" />
          <h3>{t("notFoundTitle")}</h3>
          <p>{t("notFoundHint")}</p>
        </div>
      ) : (
        <>
          <div className="profile-hero glass-panel">
            <div className="profile-avatar">{name.slice(0, 2).toUpperCase()}</div>
            <div>
              <span className="eyebrow">{t("displayName")}</span>
              <h2 className="profile-name">{profile.displayName}</h2>
              <p className="empty-state-copy">{t("subtitle")}</p>
            </div>
          </div>

          <div className="event-meta-card glass-panel">
            <div className="event-meta-stats">
              <div>
                <span>{t("totalPredictions")}</span>
                <strong>{profile.totalPredictions}</strong>
              </div>
              <div>
                <span>{t("winRate")}</span>
                <strong>{formatPercent(profile.winRate)}</strong>
              </div>
              <div>
                <span>{t("record")}</span>
                <strong>
                  {profile.wonCount}W / {profile.lostCount}L
                </strong>
              </div>
              <div>
                <span>{t("realizedPnl")}</span>
                <strong className={profile.realizedPnl > 0 ? "profit-positive" : ""}>
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
  );
}
