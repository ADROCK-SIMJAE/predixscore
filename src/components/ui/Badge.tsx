"use client";

import { Crown, Award, Hexagon, Circle } from "lucide-react";
import { Gd } from "@/lib/grades";
import { T } from "@/lib/typography";
import type { GradeKey } from "@/types";

interface BadgeProps {
  gk: GradeKey;
  sm?: boolean;
  quarter?: string;
}

/* ── Badge ─────────────── */
/* 등급 배지 — animation 제거, 정적 표시 */
export const Badge = ({ gk, sm, quarter }: BadgeProps) => {
  const g = Gd(gk);
  const iconSize = sm ? 11 : 13;
  const Icon = gk === "seer" ? Crown
    : gk === "proven" ? Award
    : gk === "forecaster" ? Hexagon
    : Circle;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: g.bg, border: `1px solid ${g.bd}`,
      borderRadius: T.r_pill, padding: sm ? "2px 8px" : "4px 11px",
      whiteSpace: "nowrap",
    }}>
      <Icon size={iconSize} color={g.color} strokeWidth={2.2} />
      <span style={{
        fontSize: sm ? T.xs : T.sm, fontWeight: T.bold, color: g.color,
        letterSpacing: T.ls_normal,
      }}>{g.label}</span>
      {quarter && <span style={{
        fontSize: T.xs, color: g.color, opacity: 0.7,
        fontFamily: T.mono,
      }}>{quarter}</span>}
    </span>
  );
};
