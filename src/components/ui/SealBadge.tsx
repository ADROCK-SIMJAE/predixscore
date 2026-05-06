"use client";

import { C } from "@/lib/tokens";
import { SEAL_IMG } from "@/lib/assets";
import type { GradeKey } from "@/types";

interface SealBadgeProps {
  size?: number;
  gk?: GradeKey;
}

/* ── SealBadge ─────────────── */
/* 봉인 뱃지 (Sealed Eye) — animation 제거, isSeer일 때만 약한 글로우 */
export const SealBadge = ({ size = 48, gk = "proven" }: SealBadgeProps) => {
  const isSeer = gk === "seer";
  const borderColor = isSeer ? C.seerL : C.gold;
  const glow = isSeer
    ? `0 0 ${Math.round(size * 0.3)}px rgba(124,58,237,0.25)`
    : "none";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      border: `${size > 60 ? 2 : 1.5}px solid ${borderColor}`,
      boxShadow: glow,
      background: "#0A0800",
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SEAL_IMG} alt="Sealed Eye"
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          display: "block", borderRadius: "50%",
        }} />
    </div>
  );
};
