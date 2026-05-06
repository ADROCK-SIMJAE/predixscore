"use client";

import { Target } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";

/* ── Logo ─────────────── */
export const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{
      width: 28, height: 28, borderRadius: T.r_md,
      background: C.gold,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Target size={16} color="#000" strokeWidth={2.5} />
    </div>
    <div style={{ fontFamily: T.display, fontSize: T.lg, fontWeight: T.bold, letterSpacing: T.ls_normal, color: C.t1 }}>
      Predix<span style={{ color: C.gold }}> Score</span>
    </div>
  </div>
);
