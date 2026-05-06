"use client";

import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";

/* ── BlindBox ─────────────── */
/* 블라인드 박스 — 골드 글로우 제거, 정적 표시 */
export const BlindBox = () => (
  <span style={{
    display: "inline-block",
    background: C.goldBg,
    border: `1px solid ${C.gold}`,
    borderRadius: T.r_sm,
    padding: "1px 10px",
    fontSize: T.sm, fontWeight: T.bold,
    color: C.gold,
    letterSpacing: T.ls_normal,
    fontFamily: T.mono,
    verticalAlign: "middle",
    margin: "0 2px",
  }}>?</span>
);
