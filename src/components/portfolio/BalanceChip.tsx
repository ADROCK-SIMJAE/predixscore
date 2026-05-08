"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/format";

type StatsResponse = {
  stats: {
    availableBalance: number;
    pendingStaked: number;
    startingBalance: number;
  };
};

export function BalanceChip({ refreshKey }: { refreshKey?: number }) {
  const t = useTranslations("balance");
  const [balance, setBalance] = useState<number | null>(null);
  const [pendingStaked, setPendingStaked] = useState<number>(0);

  useEffect(() => {
    fetch("/api/paper/stats")
      .then((r) => r.json() as Promise<StatsResponse>)
      .then((d) => {
        setBalance(d.stats?.availableBalance ?? 10000);
        setPendingStaked(d.stats?.pendingStaked ?? 0);
      })
      .catch(() => setBalance(10000));
  }, [refreshKey]);

  if (balance === null) return null;

  return (
    <Link
      href="/positions"
      className="inline-flex h-[38px] items-center gap-2 rounded-full border border-[rgba(16,44,75,0.06)] bg-white/60 px-4 text-[13px] font-semibold tracking-tight text-ink no-underline tabular-nums transition-[transform,background-color,border-color] duration-[160ms] ease-linear hover:-translate-y-px hover:border-[rgba(16,44,75,0.1)] hover:bg-white/95 [&_svg]:text-positive-text"
      title={t("tooltip", { locked: formatCurrency(pendingStaked) })}
    >
      <Wallet size={14} />
      <span className="hidden text-[11px] font-semibold uppercase tracking-[0.08em] text-muted sm:inline">
        {t("short")}
      </span>
      <strong className="text-[14px] tracking-tight text-positive-text">{formatCurrency(balance)}</strong>
    </Link>
  );
}
