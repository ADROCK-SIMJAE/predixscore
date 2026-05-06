"use client";

import { useState } from "react";
import { Crown, Award, Hexagon, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { C } from "@/lib/tokens";
import { Gd } from "@/lib/grades";
import { T } from "@/lib/typography";
import { useExperts } from "@/hooks/useExperts";
import { Logo } from "@/components/ui/Logo";
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

/* ── RankingScreen ─────────────── */
export const RankingScreen = ({ onNav, push }: RankingScreenProps) => {
  const [cat, setCat] = useState("전체");
  const cats = ["전체", "코인", "주식", "스포츠", "이슈", "정치"];
  const { data: experts = [], isLoading } = useExperts();
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "10px 16px 0" }}><Logo /></div>
      <div style={{ padding: "8px 16px 6px" }}>
        <div style={{ fontFamily: T.display, fontSize: T.xl, fontWeight: T.bold, color: C.t1 }}>예측가 랭킹</div>
        <div style={{ fontSize: T.xs, color: C.t3, marginTop: 2 }}>분기별 Predix Score 기준</div>
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "8px 16px 8px", flexShrink: 0 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            style={{
              flexShrink: 0, padding: "5px 13px",
              background: cat === c ? C.gold : C.bg1,
              border: `1px solid ${cat === c ? C.gold : C.bd}`,
              borderRadius: T.r_pill, color: cat === c ? "#000" : C.t2,
              fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer",
            }}>
            {c}
          </button>
        ))}
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
          return (
            <div key={e.rank} onClick={() => push("expert", { expert: e })}
              style={{ flex: 1, textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: g.color, marginBottom: 4 }}>{e.name}</div>
              <Icon size={14} color={g.color} strokeWidth={2.2} style={{ marginBottom: 4 }} />
              <div style={{
                height: hs[i],
                background: i === 1 ? C.goldBg : C.bg1,
                border: `1px solid ${i === 1 ? C.goldBd : C.bd}`,
                borderRadius: `${T.r_md}px ${T.r_md}px 0 0`,
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 3,
              }}>
                <span style={{
                  fontSize: T.md, fontWeight: T.bold, color: i === 1 ? C.goldL : C.t1,
                  fontFamily: T.mono,
                }}>{e.score}</span>
                <span style={{ fontSize: T.xs, color: C.t3 }}>#{rank[i]}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {isLoading && (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.t3, fontSize: T.sm }}>
            랭킹 불러오는 중…
          </div>
        )}
        {experts.map((e, i) => {
          return (
            <div key={e.rank} onClick={() => push("expert", { expert: e })}
              style={{
                background: C.bg1,
                border: `1px solid ${C.bd}`,
                borderRadius: T.r_lg, padding: "12px 13px", display: "flex", alignItems: "center",
                gap: 10, cursor: "pointer", transition: "all 0.18s",
                boxShadow: T.shadow_sm,
              }}>
              <div style={{
                width: 24, textAlign: "center", fontFamily: T.mono,
                fontSize: T.sm, color: i < 3 ? C.goldL : C.t3, fontWeight: T.bold,
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
                  <span style={{ fontSize: T.xs, color: C.t2 }}>적중 <span style={{ color: C.green, fontWeight: T.semibold }}>{e.acc}%</span></span>
                  <span style={{ fontSize: T.xs, color: C.t3 }}>·</span>
                  <span style={{ fontSize: T.xs, color: C.t2 }}>예측 <span style={{ fontFamily: T.mono }}>{e.preds}회</span></span>
                  {e.subs > 0 && <span style={{ fontSize: T.xs, color: C.gold }}>구독 {e.subs.toLocaleString()}</span>}
                </div>
              </div>
              <ScoreGauge score={e.score} size="sm" />
            </div>
          );
        })}
        {/* 나도 도전하기 */}
        <div style={{
          background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
          padding: "14px", textAlign: "center", marginTop: 4,
        }}>
          <div style={{ fontSize: T.sm, color: C.t2, marginBottom: 12 }}>
            여기에 이름을 올려보세요
          </div>
          <button style={{
            padding: "11px 28px",
            background: C.gold,
            border: "none", borderRadius: T.r_md, color: "#000",
            fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
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
