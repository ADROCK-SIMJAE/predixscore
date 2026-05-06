"use client";

import { Home, Newspaper, Trophy, User, Target } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";

interface BottomNavProps {
  active: string;
  onNav: (id: string) => void;
}

/* ── Nav ─────────────── */
/* 하단 네비 — 아이콘 lucide-react로, 골드 글로우 절제 */
export const BottomNav = ({ active, onNav }: BottomNavProps) => {
  const items = [
    { id: "home",      Icon: Home,      label: "홈" },
    { id: "feed",      Icon: Newspaper, label: "피드" },
    { id: "challenge", Icon: null,      label: "도전" },
    { id: "ranking",   Icon: Trophy,    label: "랭킹" },
    { id: "my",        Icon: User,      label: "MY" },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: "#0A0800", borderTop: `1px solid ${C.bd}`,
      display: "flex", paddingBottom: "calc(16px + env(safe-area-inset-bottom))", paddingTop: 10,
      zIndex: 100,
    }}>
      {items.map(it => {
        const isC = it.id === "challenge", isA = active === it.id;
        if (isC) return (
          <button key={it.id} onClick={() => onNav(it.id)}
            style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 0, position: "relative",
            }}>
            <div style={{
              width: 50, height: 50, borderRadius: T.r_pill, marginTop: -24,
              background: C.gold,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${C.bg1}`, zIndex: 10,
              boxShadow: T.shadow_md,
            }}>
              <Target size={22} color="#000" strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: T.xs, fontWeight: T.semibold, color: isA ? C.goldL : C.gold,
              marginTop: 4, letterSpacing: T.ls_normal,
            }}>도전하기</span>
          </button>
        );
        const Icon = it.Icon;
        return (
          <button key={it.id} onClick={() => onNav(it.id)}
            style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color: isA ? C.gold : C.t3, transition: "color 0.18s",
            }}>
            {Icon && <Icon size={20} strokeWidth={isA ? 2.4 : 1.8} />}
            <span style={{ fontSize: T.xs, fontWeight: isA ? T.semibold : T.medium }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};
