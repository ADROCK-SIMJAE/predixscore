"use client";

import { Gd } from "@/lib/grades";
import { T } from "@/lib/typography";
import type { GradeKey } from "@/types";

interface AvatarProps {
  name: string;
  size?: number;
  gk?: GradeKey;
}

/* ── Ava ─────────────── */
export const Avatar = ({ name, size = 36, gk = "candidate" }: AvatarProps) => {
  const g = Gd(gk);
  const colorMap: Record<GradeKey, string> = {
    seer:       "#5C2DB8",
    proven:     "#9A7820",
    forecaster: "#2C5DAB",
    candidate:  "#3A3A3A",
  };
  const bg = colorMap[gk] || colorMap.candidate;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: T.display, fontSize: size * 0.42, fontWeight: T.bold, color: "#fff",
      border: `1px solid ${g.color}30`,
    }}>
      {name[0]}
    </div>
  );
};
