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
      className="balance-chip"
      title={t("tooltip", { locked: formatCurrency(pendingStaked) })}
    >
      <Wallet size={14} />
      <span className="balance-chip-label">{t("short")}</span>
      <strong>{formatCurrency(balance)}</strong>
    </Link>
  );
}
