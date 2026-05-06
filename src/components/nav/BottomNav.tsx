"use client";

import { Home, Newspaper, Trophy, User, Target } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";

interface BottomNavProps {
  active: string;
  onNav: (id: string) => void;
}

/* ── BottomNav — glass blur + 골드 언더라인 인디케이터 ── */
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
      background: "rgba(10,9,8,0.88)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: `1px solid ${C.bd}`,
      display: "flex",
      paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
      paddingTop: 10,
      zIndex: 100,
    }}>
      {items.map(it => {
        const isC = it.id === "challenge";
        const isA = active === it.id;

        if (isC) return (
          <button key={it.id} onClick={() => onNav(it.id)}
            style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 0, position: "relative",
              transition: "opacity 180ms",
            }}>
            <div style={{
              width: 50, height: 50, borderRadius: T.r_pill, marginTop: -24,
              background: `linear-gradient(180deg, ${C.goldL}, ${C.gold})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${C.bg1}`,
              zIndex: 10,
              boxShadow: T.shadow_gold,
            }}>
              <Target size={22} color="#000" strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: T.xs, fontWeight: T.semibold,
              color: isA ? C.goldL : C.gold,
              marginTop: 4,
            }}>도전하기</span>
          </button>
        );

        const Icon = it.Icon;
        return (
          <button key={it.id} onClick={() => onNav(it.id)}
            style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, position: "relative",
              transition: "color 180ms cubic-bezier(0.32,0.72,0,1)",
              color: isA ? C.goldL : C.t3,
            }}>
            {Icon && <Icon size={20} strokeWidth={isA ? 2.4 : 1.8} />}
            <span style={{
              fontSize: T.xs,
              fontWeight: isA ? T.semibold : T.medium,
            }}>{it.label}</span>
            {/* 골드 언더라인 인디케이터 */}
            <div style={{
              position: "absolute",
              bottom: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: isA ? 24 : 0,
              height: 3,
              borderRadius: T.r_pill,
              background: `linear-gradient(90deg, ${C.goldL}, ${C.gold})`,
              transition: "width 220ms cubic-bezier(0.32,0.72,0,1)",
            }} />
          </button>
        );
      })}
    </div>
  );
};
