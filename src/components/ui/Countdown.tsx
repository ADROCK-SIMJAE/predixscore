"use client";

import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";

interface CountdownProps {
  time: string;
  large?: boolean;
}

/* ── Countdown ─────────────── */
/* 카운트다운 — countTick 애니메이션 제거, 정적 표시 */
export const Countdown = ({ time, large }: CountdownProps) => (
  <div style={{
    display: "inline-flex", alignItems: "center",
    background: "rgba(201,160,48,0.06)", border: `1px solid ${C.goldBd}`,
    borderRadius: T.r_md, padding: large ? "8px 16px" : "4px 10px",
  }}>
    <span style={{
      fontSize: large ? T.lg : T.sm, fontWeight: T.semibold, color: C.gold,
      fontFamily: T.mono, letterSpacing: large ? T.ls_label : T.ls_normal,
    }}>{time}</span>
  </div>
);
