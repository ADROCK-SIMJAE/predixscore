"use client";

import { useState } from "react";
import { Crown, Award, Hexagon, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { C } from "@/lib/tokens";
import { Gd } from "@/lib/grades";
import { T } from "@/lib/typography";
import { useExperts } from "@/hooks/useExperts";
import { Logo } from "@/components/ui/Logo";
import { NotifBell } from "@/components/ui/NotifBell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SealBadge } from "@/components/ui/SealBadge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { BottomNav } from "@/components/nav/BottomNav";
import type { GradeKey } from "@/types";

interface RankingScreenProps {
  onNav: (screen: string) => void;
  push: (screen: string, data?: any) => void;
}

const GradeIconMap: Record<GradeKey, LucideIcon> = {
  seer: Crown, proven: Award, forecaster: Hexagon, candidate: Circle,
};

/* 카테고리별 필터 액센트 */
const catColors: Record<string, string> = {
  "전체": C.gold,
  "코인": C.gold,
  "주식": C.cyan,
  "스포츠": C.peach,
  "이슈": C.rose,
  "정치": C.plum,
};

/* ── RankingScreen ─────────────── */
export const RankingScreen = ({ onNav, push }: RankingScreenProps) => {
  const [cat, setCat] = useState("전체");
  const cats = ["전체", "코인", "주식", "스포츠", "이슈", "정치"];
  const { data: experts = [], isLoading } = useExperts();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      {/* 헤더 */}
      <div style={{ padding: "10px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <NotifBell push={push} />
      </div>

      {/* 타이틀 */}
      <div style={{ padding: "10px 16px 6px" }}>
        <div style={{
          fontFamily: T.display, fontSize: T.xl, fontWeight: T.bold,
          color: C.t1, letterSpacing: "-0.02em",
        }}>예측가 랭킹</div>
        <div style={{ fontSize: T.sm, color: C.t3, marginTop: 3 }}>분기별 Predix Score 기준</div>
      </div>

      {/* 카테고리 탭 */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "6px 16px 10px", flexShrink: 0 }}>
        {cats.map(c => {
          const isActive = cat === c;
          const accent = catColors[c] ?? C.gold;
          return (
            <button key={c} onClick={() => setCat(c)}
              style={{
                flexShrink: 0, padding: "5px 13px",
                background: isActive
                  ? `linear-gradient(180deg, ${accent}dd, ${accent})`
                  : C.bg2,
                border: `1px solid ${isActive ? accent + "60" : C.bd}`,
                borderRadius: T.r_pill,
                color: isActive ? "#000" : C.t2,
                fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer",
                transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
                boxShadow: isActive ? `0 2px 8px ${accent}28` : "none",
              }}>
              {c}
            </button>
          );
        })}
      </div>

      {/* 포디움 */}
      <div style={{
        padding: "4px 16px 10px", display: "flex", alignItems: "flex-end",
        gap: 8, justifyContent: "center", flexShrink: 0,
      }}>
        {experts.length >= 3 && [experts[1], experts[0], experts[2]].map((e, i) => {
          const hs = [70, 100, 56];
          const rank = [2, 1, 3];
          const g = Gd(e.gk);
          const Icon = GradeIconMap[e.gk];
          const isTop = i === 1;
          return (
            <div key={e.rank} onClick={() => push("expert", { expert: e })}
              style={{ flex: 1, textAlign: "center", cursor: "pointer" }}>
              <div style={{
                fontSize: T.xs, fontWeight: T.semibold, color: g.color,
                marginBottom: 4, letterSpacing: T.ls_label,
              }}>{e.name}</div>
              <Icon size={14} color={g.color} strokeWidth={2.2} style={{ marginBottom: 4 }} />
              <div style={{
                height: hs[i],
                background: isTop
                  ? "linear-gradient(180deg, rgba(201,160,48,0.14), rgba(201,160,48,0.04))"
                  : C.bg1,
                border: `1px solid ${isTop ? C.goldBd : C.bd}`,
                borderRadius: `${T.r_md}px ${T.r_md}px 0 0`,
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 3,
                boxShadow: isTop ? T.shadow_gold : "none",
              }}>
                <span style={{
                  fontSize: T.md, fontWeight: T.bold,
                  color: isTop ? C.goldL : C.t1,
                  fontFamily: T.mono,
                }}>{e.score}</span>
                <span style={{ fontSize: T.xs, color: isTop ? C.gold : C.t3 }}>#{rank[i]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 리스트 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {isLoading && (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.t3, fontSize: T.sm }}>
            랭킹 불러오는 중…
          </div>
        )}
        {!isLoading && experts.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.t3, fontSize: T.sm }}>
            랭킹에 표시할 전문가가 없습니다.
          </div>
        )}
        {experts.map((e, i) => {
          const g = Gd(e.gk);
          const isTop3 = i < 3;
          return (
            <div key={e.rank} onClick={() => push("expert", { expert: e })}
              style={{
                background: C.bg1,
                border: `1px solid ${isTop3 ? C.goldBd : C.bd}`,
                borderRadius: T.r_lg, padding: "12px 13px",
                display: "flex", alignItems: "center",
                gap: 10, cursor: "pointer",
                boxShadow: isTop3
                  ? "inset 0 1px 0 rgba(255,255,255,0.04), " + T.shadow_sm
                  : "inset 0 1px 0 rgba(255,255,255,0.04)",
                transition: "transform 180ms cubic-bezier(0.32,0.72,0,1)",
              }}
              onMouseEnter={e2 => { (e2.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e2 => { (e2.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              {/* 순위 */}
              <div style={{
                width: 24, textAlign: "center", fontFamily: T.mono,
                fontSize: T.sm, fontWeight: T.bold,
                color: isTop3 ? C.goldL : C.t3,
              }}>{e.rank}</div>

              <div style={{ position: "relative" }}>
                <Avatar name={e.name} size={36} gk={e.gk} />
                <div style={{ position: "absolute", bottom: -2, right: -2 }}>
                  <SealBadge size={14} gk={e.gk} />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>{e.name}</span>
                  <Badge gk={e.gk} sm />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: T.xs, color: C.t2 }}>
                    적중 <span style={{ color: C.mint, fontWeight: T.semibold }}>{e.acc}%</span>
                  </span>
                  <span style={{ fontSize: T.xs, color: C.t3 }}>·</span>
                  <span style={{ fontSize: T.xs, color: C.t2 }}>
                    예측 <span style={{ fontFamily: T.mono }}>{e.preds}회</span>
                  </span>
                  {e.subs > 0 && (
                    <span style={{ fontSize: T.xs, color: g.color }}>구독 {e.subs.toLocaleString()}</span>
                  )}
                </div>
              </div>

              <ScoreGauge score={e.score} size="sm" />
            </div>
          );
        })}

        {/* CTA */}
        <div style={{
          background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
          padding: "16px", textAlign: "center", marginTop: 4,
        }}>
          <div style={{ fontSize: T.sm, color: C.t2, marginBottom: 4 }}>여기에 이름을 올려보세요</div>
          <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 12 }}>예측을 봉인하고 Predix Score를 쌓으세요</div>
          <button onClick={() => onNav("challenge")}
            style={{
              padding: "11px 28px",
              background: `linear-gradient(180deg, ${C.goldL}, ${C.gold})`,
              border: `1px solid ${C.goldL}40`,
              borderRadius: T.r_md, color: "#000",
              fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
              boxShadow: T.shadow_gold,
              transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
            }}>
            도전 시작하기
          </button>
        </div>
        <div style={{ height: 90 }} />
      </div>

      <BottomNav active="ranking" onNav={onNav} />
    </div>
  );
};
