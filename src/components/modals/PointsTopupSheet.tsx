"use client";

import { useState } from "react";
import { Gem, CreditCard } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { usePointBalance, useTopupPoints } from "@/hooks/usePoints";

interface PointsTopupSheetProps {
  open: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [100, 300, 1000, 3000];

/* ── PointsTopupSheet ─────────────── */
export const PointsTopupSheet = ({ open, onClose }: PointsTopupSheetProps) => {
  const balance = usePointBalance();
  const topup = useTopupPoints();
  const [selected, setSelected] = useState<number | null>(300);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const amount = (() => {
    const c = Number(custom.replace(/[^0-9]/g, ""));
    if (custom.trim() && !isNaN(c)) return c;
    return selected ?? 0;
  })();

  const onCharge = async () => {
    setError(null);
    if (amount <= 0) {
      setError("충전할 금액을 선택하거나 입력하세요.");
      return;
    }
    try {
      await topup.mutateAsync(amount);
      setCustom("");
      setSelected(null);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "충전 실패";
      setError(msg);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 820,
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn 0.2s",
      }}
    >
      <div style={{ flex: 1, background: "rgba(0,0,0,0.7)" }} onClick={onClose} />
      <div
        style={{
          background: C.bg1,
          borderRadius: `${T.r_xl}px ${T.r_xl}px 0 0`,
          border: `1px solid ${C.bd}`,
          borderBottom: "none",
          padding: "16px 20px calc(28px + env(safe-area-inset-bottom))",
          animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: T.shadow_md,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 36, height: 4, background: C.bd, borderRadius: T.r_pill }} />
        </div>

        {/* 헤더 + 잔액 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: T.r_md,
              background: C.goldBg,
              border: `1px solid ${C.goldBd}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Gem size={18} color={C.gold} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: T.md, fontWeight: T.bold, color: C.t1, fontFamily: T.display }}>
              포인트 충전
            </div>
            <div style={{ fontSize: T.xs, color: C.t3, marginTop: 2 }}>
              열람·구독에 사용됩니다
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 2 }}>보유</div>
            <div
              style={{
                fontSize: T.md,
                fontWeight: T.bold,
                color: C.goldL,
                fontFamily: T.mono,
              }}
            >
              {balance.toLocaleString()}P
            </div>
          </div>
        </div>

        {/* 프리셋 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {PRESET_AMOUNTS.map((a) => {
            const active = selected === a && !custom;
            return (
              <button
                key={a}
                onClick={() => {
                  setSelected(a);
                  setCustom("");
                }}
                style={{
                  padding: "14px 0",
                  background: active ? C.goldBg : C.bg2,
                  border: `1px solid ${active ? C.gold : C.bd}`,
                  borderRadius: T.r_md,
                  color: active ? C.goldL : C.t1,
                  fontSize: T.md,
                  fontWeight: T.bold,
                  fontFamily: T.mono,
                  cursor: "pointer",
                  transition: "all 0.18s",
                }}
              >
                {a.toLocaleString()}P
              </button>
            );
          })}
        </div>

        {/* 직접 입력 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>
            직접 입력
          </div>
          <input
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setSelected(null);
            }}
            placeholder="원하는 금액 입력 (P)"
            inputMode="numeric"
            style={{
              width: "100%",
              padding: "12px 14px",
              background: C.bg2,
              border: `1px solid ${custom ? C.gold : C.bd}`,
              borderRadius: T.r_md,
              fontSize: T.base,
              color: C.t1,
              outline: "none",
              fontFamily: T.mono,
            }}
          />
        </div>

        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: T.r_md,
              fontSize: T.sm,
              color: C.red,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={onCharge}
          disabled={topup.isPending || amount <= 0}
          style={{
            width: "100%",
            padding: "14px 0",
            background: amount > 0 && !topup.isPending ? C.gold : C.bg2,
            border: "none",
            borderRadius: T.r_md,
            color: amount > 0 && !topup.isPending ? "#000" : C.t3,
            fontSize: T.md,
            fontWeight: T.bold,
            cursor: amount > 0 && !topup.isPending ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <CreditCard size={16} strokeWidth={2.2} />
          {topup.isPending ? "충전 중…" : `${amount.toLocaleString()}P 충전`}
        </button>
        <div
          style={{
            textAlign: "center",
            marginTop: 8,
            fontSize: T.xs,
            color: C.t3,
          }}
        >
          충전 후 즉시 사용할 수 있습니다.
        </div>
      </div>
    </div>
  );
};
