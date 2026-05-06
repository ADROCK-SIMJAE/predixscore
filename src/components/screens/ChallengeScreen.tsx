"use client";

import { useState } from "react";
import { Crown, Award, Hexagon, Circle, Check, X as XIcon, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { C } from "@/lib/tokens";
import { Gd } from "@/lib/grades";
import { T } from "@/lib/typography";
import { useApplyChallenge, useMyChallengeApps } from "@/hooks/useChallenge";
import { Logo } from "@/components/ui/Logo";
import { NotifBell } from "@/components/ui/NotifBell";
import { Badge } from "@/components/ui/Badge";
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
export const ChallengeScreen = ({ onNav, push, loggedIn, onAuth }: ChallengeScreenProps) => {
  const [tab, setTab] = useState<"overview" | "apply" | "history">("overview");
  const [motivation, setMotivation] = useState("");
  const [targetGrade, setTargetGrade] = useState<GradeKey>("forecaster");
  const [applyError, setApplyError] = useState<string | null>(null);
  const apply = useApplyChallenge();
  const { data: myApps = [] } = useMyChallengeApps();

  // 등급별 신청 진행 상태 — pending 또는 approved 면 해당 등급은 다시 신청 불가
  const isAppliedFor = (g: GradeKey) =>
    myApps.some((a) => a.target_grade === g && (a.status === "pending" || a.status === "approved"));

  const appliedTarget = isAppliedFor(targetGrade);

  const handleApply = async () => {
    if (!loggedIn) {
      onAuth();
      return;
    }
    setApplyError(null);
    try {
      await apply.mutateAsync({
        targetGrade,
        motivation: motivation.trim() || undefined,
      });
      setMotivation("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "신청 실패";
      setApplyError(msg);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "10px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: T.xs, color: C.gold, fontFamily: T.mono, fontWeight: T.semibold }}>2026 Q3</div>
          <NotifBell push={push} />
        </div>
      </div>
      {/* 히어로 */}
      <div style={{
        margin: "12px 16px 0",
        background: "linear-gradient(145deg,#140D02 0%,#0A0700 55%,#120A01 100%)",
        borderRadius: T.r_xl, padding: "18px 16px 14px", position: "relative", overflow: "hidden",
        border: `1px solid ${C.goldBd}`,
        boxShadow: "0 4px 24px rgba(201,160,48,0.08)",
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
        display: "flex", gap: 0, margin: "12px 16px 0", background: C.bg2,
        borderRadius: T.r_md, padding: 3, border: `1px solid ${C.bd}`,
      }}>
        {([["overview", "챌린지 소개"], ["apply", "도전 신청"], ["history", "내 이력"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "8px 0",
              background: tab === id
                ? `linear-gradient(180deg, ${C.goldL}cc, ${C.gold})`
                : "transparent",
              border: "none", borderRadius: T.r_sm,
              color: tab === id ? "#000" : C.t3,
              fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer",
              transition: "all 200ms cubic-bezier(0.32,0.72,0,1)",
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
            <div>
              {/* 등급 선택 */}
              <div
                style={{
                  background: C.bg1,
                  border: `1px solid ${C.bd}`,
                  borderRadius: T.r_lg,
                  padding: "14px",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t2, marginBottom: 10 }}>
                  도전 등급 선택
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["forecaster", "proven", "seer"] as GradeKey[]).map((gkOpt) => {
                    const g = Gd(gkOpt);
                    const Icon = GradeIconMap[gkOpt];
                    const active = targetGrade === gkOpt;
                    const inProgress = isAppliedFor(gkOpt);
                    return (
                      <button
                        key={gkOpt}
                        onClick={() => setTargetGrade(gkOpt)}
                        style={{
                          flex: 1,
                          padding: "10px 4px",
                          background: active ? g.bg : C.bg2,
                          border: `1px solid ${active ? g.color : C.bd}`,
                          borderRadius: T.r_md,
                          color: active ? g.color : C.t2,
                          fontSize: T.xs,
                          fontWeight: T.bold,
                          cursor: "pointer",
                          textAlign: "center",
                          position: "relative",
                        }}
                      >
                        <Icon size={14} color={active ? g.color : C.t3} strokeWidth={2.2} />
                        <div style={{ marginTop: 4 }}>{g.label}</div>
                        {inProgress && (
                          <div
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: C.gold,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                {appliedTarget && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "8px 10px",
                      background: C.goldBg,
                      border: `1px solid ${C.goldBd}`,
                      borderRadius: T.r_md,
                      fontSize: T.xs,
                      color: C.goldL,
                    }}
                  >
                    이 등급은 이미 신청 중입니다. 다른 등급을 선택하거나 &lsquo;내 이력&rsquo; 탭에서 진행 상태를 확인하세요.
                  </div>
                )}
              </div>

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
                      {Gd(targetGrade).label} 도전 신청
                    </span>
                  </div>
                  <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.relaxed, marginBottom: 12 }}>
                    선택한 등급으로 신청합니다. 신청 이력은 &lsquo;내 이력&rsquo; 탭에서 확인하세요.<br />
                    Forecaster → Proven → Seer 순서로 성장하세요.
                  </div>
                  <textarea
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="도전 동기 (선택)"
                    rows={3}
                    maxLength={300}
                    disabled={appliedTarget}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: C.bg2,
                      border: `1px solid ${C.bd}`,
                      borderRadius: T.r_md,
                      fontSize: T.sm,
                      color: C.t1,
                      outline: "none",
                      fontFamily: T.sans,
                      resize: "none",
                      marginBottom: 10,
                      lineHeight: T.relaxed,
                      opacity: appliedTarget ? 0.5 : 1,
                    }}
                  />
                  {applyError && (
                    <div
                      style={{
                        marginBottom: 10,
                        padding: "8px 12px",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.35)",
                        borderRadius: T.r_md,
                        fontSize: T.xs,
                        color: C.red,
                      }}
                    >
                      {applyError}
                    </div>
                  )}
                  <button
                    onClick={handleApply}
                    disabled={apply.isPending || appliedTarget}
                    style={{
                      width: "100%",
                      padding: "13px 0",
                      background: appliedTarget
                        ? C.bg2
                        : apply.isPending
                        ? C.bg2
                        : `linear-gradient(180deg, ${C.goldL}, ${C.gold})`,
                      border: appliedTarget || apply.isPending
                        ? `1px solid ${C.bd}`
                        : `1px solid ${C.goldL}40`,
                      borderRadius: T.r_md,
                      color: appliedTarget || apply.isPending ? C.t3 : "#000",
                      fontSize: T.sm,
                      fontWeight: T.bold,
                      cursor: apply.isPending || appliedTarget ? "default" : "pointer",
                      boxShadow: appliedTarget || apply.isPending ? "none" : T.shadow_gold,
                      transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
                      opacity: appliedTarget || apply.isPending ? 0.5 : 1,
                    }}
                  >
                    {appliedTarget
                      ? `${Gd(targetGrade).label} 신청 진행 중`
                      : apply.isPending
                      ? "신청 중…"
                      : `${Gd(targetGrade).label} 도전 신청`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === "history" && (
          <div style={{ animation: "fadeUp 0.25s" }}>
            {myApps.length === 0 && (
              <div
                style={{
                  padding: "30px 0",
                  textAlign: "center",
                  color: C.t3,
                  fontSize: T.sm,
                }}
              >
                아직 도전 신청 이력이 없습니다.
              </div>
            )}
            {myApps.map((r) => {
              const g = Gd(r.target_grade);
              const Icon = GradeIconMap[r.target_grade];
              const statusLabel =
                r.status === "approved" ? "승인" : r.status === "rejected" ? "반려" : "심사 중";
              const statusColor =
                r.status === "approved" ? C.green : r.status === "rejected" ? C.red : C.gold;
              return (
                <div
                  key={r.id}
                  style={{
                    background: C.bg1,
                    border: `1px solid ${C.bd}`,
                    borderRadius: T.r_md,
                    padding: "11px 13px",
                    marginBottom: 8,
                    display: "flex",
                    gap: 11,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: T.r_md,
                      background: g.bg,
                      border: `1px solid ${g.bd}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color={g.color} strokeWidth={2.2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>
                      {g.label} 도전
                    </div>
                    <div style={{ fontSize: T.xs, color: statusColor, marginTop: 1 }}>
                      {statusLabel}
                    </div>
                  </div>
                  <Badge gk={r.target_grade} sm />
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
