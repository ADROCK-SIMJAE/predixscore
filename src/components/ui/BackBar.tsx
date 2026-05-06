"use client";

import { ChevronLeft } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import type { ReactNode } from "react";

interface BackBarProps {
  title: string;
  onBack: () => void;
  right?: ReactNode;
  dark?: boolean;
}

/* ── BkBar ─────────────── */
export const BackBar = ({ title, onBack, right, dark }: BackBarProps) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
    background: dark ? "#0A0800" : "#0A0800", borderBottom: `1px solid ${C.bd}`, flexShrink: 0,
  }}>
    <button onClick={onBack} style={{
      width: 32, height: 32, borderRadius: T.r_pill,
      background: "rgba(255,255,255,0.04)", border: `1px solid ${C.bd}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", color: C.t1,
    }}>
      <ChevronLeft size={18} strokeWidth={2} />
    </button>
    <div style={{
      flex: 1, fontFamily: T.display, fontSize: T.md,
      fontWeight: T.bold, color: C.t1, letterSpacing: T.ls_normal,
    }}>{title}</div>
    {right}
  </div>
);
