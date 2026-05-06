"use client";

import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";

interface ScoreGaugeProps {
  score: number;
  size?: "lg" | "sm";
}

/* ── ScoreGauge ─────────────── */
/* Predix Score 게이지 */
export const ScoreGauge = ({ score, size = "lg" }: ScoreGaugeProps) => {
  const r = size === "lg" ? 44 : 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const isGold = score >= 70;
  const isSeer = score >= 85;
  const color = isSeer ? C.seerL : isGold ? C.gold : "#3B82F6";
  const sz = size === "lg" ? 110 : 70;
  return (
    <div style={{
      position: "relative", width: sz, height: sz, display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width={sz} height={sz} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={C.bd} strokeWidth={size === "lg" ? 6 : 4} />
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={color} strokeWidth={size === "lg" ? 6 : 4}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: size === "lg" ? T.xxl : T.md, fontWeight: T.bold, color,
          fontFamily: T.mono, lineHeight: T.tight,
        }}>{score}</div>
        <div style={{ fontSize: T.xs, color: C.t3, marginTop: 2, letterSpacing: T.ls_label }}>SCORE</div>
      </div>
    </div>
  );
};
