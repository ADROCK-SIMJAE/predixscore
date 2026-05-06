"use client";

import { useState } from "react";
import { Crown, Award, Hexagon, Circle, Check, X as XIcon, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { C } from "@/lib/tokens";
import { Gd } from "@/lib/grades";
import { T } from "@/lib/typography";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { SealBadge } from "@/components/ui/SealBadge";
import { BottomNav } from "@/components/nav/BottomNav";
import type { GradeKey } from "@/types";

interface ChallengeScreenProps {
  onNav: (screen: string) => void;
  push: (screen: string, data?: any) => void;
  loggedIn: boolean;
  onAuth: () => void;
  showPopup?: any;
  onPopupClose?: any;
}

const GradeIconMap: Record<GradeKey, LucideIcon> = {
  seer: Crown,
  proven: Award,
  forecaster: Hexagon,
  candidate: Circle,
};

/* ── ChallengeScreen ─────────────── */
export const ChallengeScreen = ({ onNav, loggedIn, onAuth }: ChallengeScreenProps) => {
  const [tab, setTab] = useState<"overview" | "apply" | "history">("overview");
  const [applied, setApplied] = useState(false);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "10px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <div style={{ fontSize: T.xs, color: C.gold, fontFamily: T.mono, fontWeight: T.semibold }}>2026 Q3</div>
      </div>
      {/* 히어로 */}
      <div style={{
        margin: "12px 16px 0", background: "linear-gradient(180deg,#100B02,#0A0700)",
        borderRadius: T.r_xl, padding: "18px 16px 14px", position: "relative", overflow: "hidden",
        border: `1px solid ${C.goldBd}`,
      }}>
        <div style={{
          fontFamily: T.display, fontSize: T.xl, fontWeight: T.bold,
          color: C.t1, marginBottom: 6,
        }}>예측 챌린지</div>
        <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.normal, marginBottom: 14 }}>
          공개 예측에 참여해 등급을 인증받으세요.
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          {[
            { gk: "seer" as GradeKey, l: "Seer", sub: "상위 0.1%" },
            { gk: "proven" as GradeKey, l: "Proven", sub: "상위 5%" },
            { gk: "forecaster" as GradeKey, l: "Forecaster", sub: "상위 30%" },
          ].map((x, i) => {
            const g = Gd(x.gk);
            const Icon = GradeIconMap[x.gk];
            return (
              <div key={i} style={{
                flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: T.r_md,
                padding: "10px 5px", textAlign: "center", border: `1px solid rgba(255,255,255,0.06)`,
              }}>
                <Icon size={16} color={g.color} strokeWidth={2.2} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: T.xs, fontWeight: T.bold, color: g.color }}>{x.l}</div>
                <div style={{ fontSize: T.xs, color: C.t3, marginTop: 2 }}>{x.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* 탭 */}
      <div style={{
        display: "flex", gap: 0, margin: "12px 16px 0", background: C.bg1,
        borderRadius: T.r_md, padding: 3, border: `1px solid ${C.bd}`,
      }}>
        {([["overview", "챌린지 소개"], ["apply", "도전 신청"], ["history", "내 이력"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "8px 0",
              background: tab === id ? C.gold : "transparent",
              border: "none", borderRadius: T.r_sm,
              color: tab === id ? "#000" : C.t3,
              fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer", transition: "all 0.18s",
            }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {tab === "overview" && (
          <div style={{ animation: "fadeUp 0.25s" }}>
            {/* Predix Score 설명 */}
            <div style={{
              background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
              padding: "14px", marginBottom: 12,
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <BarChart3 size={14} color={C.gold} strokeWidth={2.2} />
                <span style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>Predix Score 구조</span>
              </div>
              {[
                { l: "적중률", pct: "40%", c: C.green },
                { l: "신뢰도", pct: "20%", c: C.blue },
                { l: "난이도", pct: "20%", c: C.gold },
                { l: "최근 성과", pct: "20%", c: C.seerL },
              ].map((s, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 0", borderBottom: i < 3 ? `1px solid ${C.bd}` : "none",
                }}>
                  <span style={{ fontSize: T.sm, color: C.t2 }}>{s.l}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: C.bg2, borderRadius: T.r_pill, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", background: s.c, borderRadius: T.r_pill,
                        width: s.pct === "40%" ? "100%" : "50%",
                      }} />
                    </div>
                    <span style={{
                      fontSize: T.sm, fontWeight: T.semibold, color: s.c,
                      fontFamily: T.mono,
                    }}>{s.pct}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* 등급 피라미드 */}
            <div style={{
              background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
              padding: "14px", marginBottom: 12,
            }}>
              <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1, marginBottom: 12 }}>등급 체계</div>
              {([
                { g: "seer" as GradeKey,       label: "Seer",       req: "예측 300+ · Score 85+", w: "55%" },
                { g: "proven" as GradeKey,     label: "Proven",     req: "예측 100+ · Score 70+", w: "72%" },
                { g: "forecaster" as GradeKey, label: "Forecaster", req: "예측 30+ · Score 55+",  w: "88%" },
                { g: "candidate" as GradeKey,  label: "Candidate",  req: "조건 없음",                w: "100%" },
              ]).map((r, i) => {
                const g = Gd(r.g);
                const Icon = GradeIconMap[r.g];
                return (
                  <div key={i} style={{
                    width: r.w, margin: "0 auto 6px",
                    background: g.bg, border: `1px solid ${g.bd}`,
                    borderRadius: T.r_md, padding: "9px 12px", textAlign: "center",
                  }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Icon size={13} color={g.color} strokeWidth={2.2} />
                      <span style={{
                        fontSize: T.sm, fontWeight: T.bold, color: g.color,
                      }}>{r.label}</span>
                    </div>
                    <div style={{ fontSize: T.xs, color: g.color, opacity: 0.6, marginTop: 2 }}>{r.req}</div>
                  </div>
                );
              })}
            </div>
            {/* 권한 정책 */}
            <div style={{ background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg, padding: "14px" }}>
              <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1, marginBottom: 12 }}>권한 정책</div>
              {([
                { g: "seer" as GradeKey,       perks: ["예측 참여", "피드 우선 노출", "유료 예측 발행", "구독자 모집", "프리미엄 배지"] },
                { g: "proven" as GradeKey,     perks: ["예측 참여", "피드 발행", "유료 예측 발행", "구독자 모집"] },
                { g: "forecaster" as GradeKey, perks: ["예측 참여", "프로필 일부 노출"] },
                { g: "candidate" as GradeKey,  perks: ["예측 참여"] },
              ]).map((r, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, padding: "9px 0",
                  borderBottom: i < 3 ? `1px solid ${C.bd}` : "none", alignItems: "flex-start",
                }}>
                  <Badge gk={r.g} sm />
                  <div style={{ flex: 1, display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                    {r.perks.map((p2, j) => (
                      <span key={j} style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        fontSize: T.xs, background: C.bg2, color: C.t2,
                        border: `1px solid ${C.bd}`, borderRadius: T.r_pill, padding: "2px 8px",
                      }}>
                        <Check size={9} strokeWidth={2.5} /> {p2}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "apply" && (
          <div style={{ animation: "fadeUp 0.25s" }}>
            {applied ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                  <SealBadge size={64} gk="proven" />
                </div>
                <div style={{
                  fontFamily: T.display, fontSize: T.xl, fontWeight: T.bold,
                  color: C.t1, marginBottom: 8,
                }}>도전 신청 완료</div>
                <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.relaxed }}>
                  2026 Q3 Proven 도전이 시작됩니다.<br />7월 1일부터 예측이 집계됩니다.
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
                  padding: "14px", marginBottom: 12,
                }}>
                  <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t2, marginBottom: 10 }}>내 현황</div>
                  {[
                    { l: "Predix Score", v: "58.4", need: "70+", ok: false },
                    { l: "예측 횟수", v: "42회", need: "100+", ok: false },
                    { l: "적중률", v: "61.2%", need: "65%+", ok: false },
                  ].map((r, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${C.bd}` : "none",
                    }}>
                      <div>
                        <div style={{ fontSize: T.sm, fontWeight: T.medium, color: C.t1 }}>{r.l}</div>
                        <div style={{ fontSize: T.xs, color: C.t3, marginTop: 2 }}>기준 {r.need}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: T.sm, fontWeight: T.semibold,
                          color: r.ok ? C.green : C.red,
                          fontFamily: T.mono,
                        }}>{r.v}</span>
                        {r.ok
                          ? <Check size={14} color={C.green} strokeWidth={2.5} />
                          : <XIcon size={14} color={C.red} strokeWidth={2.5} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{
                  background: C.redB, border: `1px solid ${C.red}30`,
                  borderRadius: T.r_md, padding: "11px 13px", marginBottom: 14,
                }}>
                  <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.red, marginBottom: 2 }}>Proven 조건 미충족</div>
                  <div style={{ fontSize: T.xs, color: C.t2 }}>Score +11.6, 예측 +58회, 적중률 +3.8% 필요</div>
                </div>
                <div style={{
                  background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
                  padding: "14px", marginBottom: 14,
                }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Check size={13} color={C.green} strokeWidth={2.5} />
                    <span style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>
                      Forecaster 도전 가능
                    </span>
                  </div>
                  <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.relaxed, marginBottom: 12 }}>
                    현재 조건으로 Forecaster 등급에 도전할 수 있습니다.<br />
                    Forecaster → Proven → Seer 순서로 성장하세요.
                  </div>
                  <button onClick={() => loggedIn ? setApplied(true) : onAuth()}
                    style={{
                      width: "100%", padding: "13px 0",
                      background: "#3B82F6",
                      border: "none", borderRadius: T.r_md, color: "#fff",
                      fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
                    }}>
                    Forecaster 도전 신청
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {tab === "history" && (
          <div style={{ animation: "fadeUp 0.25s" }}>
            {([
              { q: "2026 Q2", gk: "candidate" as GradeKey, status: "현재" },
              { q: "2026 Q1", gk: "candidate" as GradeKey, status: "유지" },
              { q: "2025 Q4", gk: "candidate" as GradeKey, status: "첫 예측 시작" },
            ]).map((r, i) => {
              const g = Gd(r.gk);
              const Icon = GradeIconMap[r.gk];
              return (
                <div key={i} style={{
                  background: C.bg1, border: `1px solid ${C.bd}`,
                  borderRadius: T.r_md, padding: "11px 13px", marginBottom: 8,
                  display: "flex", gap: 11, alignItems: "center",
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: T.r_md, background: g.bg,
                    border: `1px solid ${g.bd}`, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon size={15} color={g.color} strokeWidth={2.2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>{r.q}</div>
                    <div style={{ fontSize: T.xs, color: C.t3, marginTop: 1 }}>{r.status}</div>
                  </div>
                  <Badge gk={r.gk} sm />
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>
      <BottomNav active="challenge" onNav={onNav} />
    </div>
  );
};
