"use client";

import { Crown, Award, Hexagon, Circle, Lock, Users, Check, Flame } from "lucide-react";
import { C } from "@/lib/tokens";
import { Gd } from "@/lib/grades";
import { Cm } from "@/lib/categories";
import { T } from "@/lib/typography";
import { Countdown } from "@/components/ui/Countdown";
import type { Pred, GradeKey } from "@/types";

interface PredictCardProps {
  pred: Pred;
  onOpen: (pred: Pred) => void;
}

const GradeIcon = ({ gk, size = 12, color }: { gk: GradeKey; size?: number; color: string }) => {
  const Icon = gk === "seer" ? Crown
    : gk === "proven" ? Award
    : gk === "forecaster" ? Hexagon
    : Circle;
  return <Icon size={size} color={color} strokeWidth={2.2} />;
};

/* ── PCard ─────────────── */
export const PredictCard = ({ pred, onOpen }: PredictCardProps) => {
  const cm = Cm(pred.cat);
  const ag = pred.agk ? Gd(pred.agk) : null;
  const stL = pred.stage === "active" ? "예측중" : pred.stage === "verify" ? "검증중" : "완료";
  const rev = pred.status === "revealed";
  const stripeColor = cm.stripe ?? cm.c;

  return (
    <div
      onClick={() => onOpen(pred)}
      style={{
        background: C.bg1,
        borderRadius: T.r_lg,
        overflow: "hidden",
        border: `1px solid ${C.bd}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        cursor: "pointer",
        transition: "transform 180ms cubic-bezier(0.32,0.72,0,1), box-shadow 180ms cubic-bezier(0.32,0.72,0,1)",
        display: "flex",
        position: "relative",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = T.shadow_lift + ", inset 0 1px 0 rgba(255,255,255,0.04)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04)";
      }}
      onMouseDown={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(0.98)";
      }}
      onMouseUp={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
    >
      {/* 카테고리 컬러 스트라이프 */}
      <div style={{
        width: 3,
        flexShrink: 0,
        background: stripeColor,
        opacity: 0.85,
      }} />

      <div style={{ flex: 1, padding: "13px 14px" }}>
        {/* 상단 메타 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{
              width: 28, height: 28, borderRadius: T.r_md, background: cm.bg,
              border: `1px solid ${cm.c}28`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: T.md,
            }}>{cm.e}</div>
            <div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{
                  background: cm.bg, color: cm.c, border: `1px solid ${cm.c}28`,
                  borderRadius: T.r_pill, padding: "2px 8px",
                  fontSize: T.xs, fontWeight: T.semibold,
                  letterSpacing: T.ls_label,
                }}>{pred.cat}</span>
                {pred.hot && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: C.peach }}>
                    <Flame size={11} strokeWidth={2.2} />
                    <span style={{ fontSize: T.xs, fontWeight: T.semibold }}>HOT</span>
                  </span>
                )}
              </div>
              {ag && pred.aName && (
                <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 4 }}>
                  <GradeIcon gk={pred.agk!} size={11} color={ag.color} />
                  <span style={{ fontSize: T.xs, fontWeight: T.semibold, color: ag.color }}>{pred.aName}</span>
                  <span style={{ fontSize: T.xs, color: C.t3 }}>· {pred.aScore}</span>
                </div>
              )}
            </div>
          </div>

          {/* 우측 뱃지 그룹 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: C.goldBg, border: `1px solid ${C.goldBd}`,
              borderRadius: T.r_pill, padding: "2px 8px",
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%", background: C.gold,
                ...(pred.stage === "verify" ? { animation: "pulse 1.5s infinite" } : {}),
              }} />
              <span style={{ fontSize: T.xs, color: C.gold, fontWeight: T.semibold }}>
                {stL}
              </span>
            </div>
            {pred.blind && (
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "rgba(201,160,48,0.06)", border: `1px solid ${C.goldBd}`,
                borderRadius: T.r_pill, padding: "2px 8px",
              }}>
                <Lock size={10} color={C.gold} strokeWidth={2.2} />
                <span style={{ fontSize: T.xs, color: C.gold, fontWeight: T.semibold }}>{pred.price}P</span>
              </div>
            )}
          </div>
        </div>

        {/* 예측 질문 */}
        <div style={{
          fontSize: T.md, fontWeight: T.semibold, lineHeight: T.normal,
          color: C.t1, marginBottom: 12,
          letterSpacing: "-0.01em",
        }}>{pred.q}</div>

        {/* 결과 공개 / 예측 선택 */}
        {rev ? (
          <div style={{ display: "flex", gap: 0, marginBottom: 10, borderRadius: T.r_md, overflow: "hidden" }}>
            {[
              { s: "A", l: pred.A, e: pred.eA, r: pred.aR ?? 0 },
              { s: "B", l: pred.B, e: pred.eB, r: pred.bR ?? 0 },
            ].map(o => {
              const isAnswer = pred.result === o.s;
              return (
                <div key={o.s} style={{
                  flex: o.r,
                  background: isAnswer ? "rgba(110,231,183,0.08)" : C.bg2,
                  padding: "8px 8px", textAlign: "center",
                  border: isAnswer ? `1px solid ${C.mint}30` : "none",
                }}>
                  <div style={{
                    fontSize: T.sm, fontWeight: T.semibold,
                    color: isAnswer ? C.mint : C.t2,
                  }}>{o.e} {o.l}</div>
                  <div style={{ fontSize: T.xs, color: C.t3, marginTop: 2 }}>{o.r}%</div>
                  {isAnswer && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4, color: C.mint }}>
                      <Check size={10} strokeWidth={2.5} />
                      <span style={{ fontSize: T.xs, fontWeight: T.semibold }}>정답</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[
              { l: pred.A, e: pred.eA },
              { l: pred.B, e: pred.eB },
            ].map((o, i) => {
              const isSelected = pred.myPred === (i === 0 ? "A" : "B");
              return (
                <div key={i} style={{
                  flex: 1,
                  background: isSelected ? C.goldBg : C.bg2,
                  borderRadius: T.r_md, padding: "10px 6px", textAlign: "center",
                  border: `1px solid ${isSelected ? C.goldBd : C.bd}`,
                  transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
                }}>
                  <div style={{ fontSize: T.lg, marginBottom: 4 }}>{o.e}</div>
                  <div style={{ fontSize: T.sm, fontWeight: T.medium, color: isSelected ? C.goldL : C.t2 }}>{o.l}</div>
                  {isSelected && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4, color: C.gold }}>
                      <Lock size={10} strokeWidth={2.2} />
                      <span style={{ fontSize: T.xs, fontWeight: T.semibold }}>내 예측</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 하단 메타 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: T.xs, color: C.t3 }}>
            <Users size={11} strokeWidth={1.8} />
            {pred.p.toLocaleString()}명 참여
          </span>
          {!rev && <Countdown time={pred.dl} />}
        </div>
      </div>
    </div>
  );
};
