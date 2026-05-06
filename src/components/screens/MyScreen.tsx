"use client";

import { useState } from "react";
import { Mail, Settings, Lock, ChevronRight, User as UserIcon, Star, Bell, Link2, Info } from "lucide-react";
import { C } from "@/lib/tokens";
import { calcScore } from "@/lib/score";
import { T } from "@/lib/typography";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { SealBadge } from "@/components/ui/SealBadge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { BottomNav } from "@/components/nav/BottomNav";

interface MyScreenProps {
  onNav: (screen: string) => void;
  push: (screen: string, data?: any) => void;
  loggedIn: boolean;
  onAuth: () => void;
  onLogout: () => void;
}

/* ── MyScreen ─────────────── */
export const MyScreen = ({ onNav, push, loggedIn, onAuth, onLogout }: MyScreenProps) => {
  const [tab, setTab] = useState<"record" | "nft" | "settings">("record");
  const myScore = { accuracy: 61.2, confidence: 58, difficulty: 55, recency: 64 };
  const totalScore = calcScore(myScore);
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const scores = [52, 54, 58, 56, 61, 63, 58, 65];
  const maxS = Math.max(...scores);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "10px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => push("dm_list", {})}
            style={{
              width: 32, height: 32, borderRadius: T.r_pill, background: C.bg2,
              border: `1px solid ${C.bd}`, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: C.t1, position: "relative",
            }}>
            <Mail size={15} strokeWidth={2} />
            <div style={{
              position: "absolute", top: 4, right: 4, width: 7, height: 7,
              borderRadius: "50%", background: C.red, border: `1.5px solid ${C.bg}`,
            }} />
          </button>
          <button onClick={() => setTab("settings")}
            style={{
              width: 32, height: 32, borderRadius: T.r_pill,
              background: tab === "settings" ? C.gold : C.bg2,
              border: `1px solid ${tab === "settings" ? C.gold : C.bd}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: tab === "settings" ? "#000" : C.t1,
            }}>
            <Settings size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
      {/* 탭 */}
      <div style={{
        display: "flex", gap: 0, margin: "12px 16px 0", background: C.bg1,
        borderRadius: T.r_md, padding: 3, border: `1px solid ${C.bd}`,
      }}>
        {([["record", "내 기록"], ["nft", "배지 · NFT"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "9px 0",
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
        {tab === "record" && (
          <div style={{ animation: "fadeUp 0.25s" }}>
            {/* 등급 + Score 배너 */}
            <div style={{
              background: "linear-gradient(135deg,#100B02,#0A0700)",
              border: `1px solid ${C.goldBd}`, borderRadius: T.r_xl,
              padding: "16px", marginBottom: 14, position: "relative", overflow: "hidden",
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                <ScoreGauge score={totalScore} />
                <div>
                  <div style={{
                    fontSize: T.xs, color: C.t3, marginBottom: 4,
                  }}>현재 등급 · 2026 Q2</div>
                  <div style={{
                    fontFamily: T.display, fontSize: T.lg, fontWeight: T.bold,
                    color: C.t1, marginBottom: 4,
                  }}>Candidate</div>
                  <div style={{ fontSize: T.sm, color: C.t2 }}>예측에 참여하고 등급을 쌓으세요</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: T.xs, color: C.t2 }}>적중 <span style={{ color: C.green, fontWeight: T.semibold }}>61.2%</span></span>
                    <span style={{ fontSize: T.xs, color: C.t2 }}>총 42회</span>
                  </div>
                </div>
              </div>
              {/* Score 분해 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                {[
                  { l: "적중률 ×0.4", v: Math.round(myScore.accuracy * 0.4), c: C.green },
                  { l: "신뢰도 ×0.2", v: Math.round(myScore.confidence * 0.2), c: C.blue },
                  { l: "난이도 ×0.2", v: Math.round(myScore.difficulty * 0.2), c: C.gold },
                  { l: "최근성 ×0.2", v: Math.round(myScore.recency * 0.2), c: C.seerL },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: T.r_md, padding: "8px 10px" }}>
                    <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 3 }}>{s.l}</div>
                    <div style={{
                      fontSize: T.md, fontWeight: T.bold, color: s.c,
                      fontFamily: T.mono,
                    }}>+{s.v}</div>
                  </div>
                ))}
              </div>
              {/* Proven까지 */}
              <div style={{
                background: "rgba(201,160,48,0.06)", border: `1px solid ${C.goldBd}`,
                borderRadius: T.r_md, padding: "10px 12px",
              }}>
                <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.gold, marginBottom: 6 }}>
                  Proven까지 필요한 것
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { l: "Score", gap: `+${70 - totalScore}`, c: C.gold },
                    { l: "예측", gap: "+58회", c: C.t2 },
                    { l: "적중률", gap: "+3.8%", c: C.green },
                  ].map((r, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{
                        fontSize: T.md, fontWeight: T.bold, color: r.c,
                        fontFamily: T.mono,
                      }}>{r.gap}</div>
                      <div style={{ fontSize: T.xs, color: C.t3, marginTop: 2 }}>{r.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* 도전 버튼 */}
            <button onClick={() => onNav("challenge")}
              style={{
                width: "100%", padding: "13px 0", marginBottom: 14,
                background: C.gold,
                border: "none", borderRadius: T.r_md, color: "#000",
                fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
              }}>
              Forecaster 도전 신청하기
            </button>
            {/* Score 추이 차트 */}
            <div style={{
              background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
              padding: 13, marginBottom: 12,
            }}>
              <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t2, marginBottom: 10 }}>Predix Score 추이</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
                {scores.map((s, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: "100%", borderRadius: `${T.r_sm}px ${T.r_sm}px 0 0`,
                      height: `${Math.round((s / maxS) * 56)}px`,
                      background: i === scores.length - 1 ? C.gold : `rgba(201,160,48,0.2)`,
                    }} />
                    <span style={{ fontSize: T.xs, color: C.t3 }}>{months[i]}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: T.xs, color: C.t3 }}>52</span>
                <span style={{ fontSize: T.xs, color: C.goldL, fontWeight: T.semibold }}>65 (+25%)</span>
              </div>
            </div>
            {/* 통계 4종 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 11 }}>
              {[
                { l: "총 예측", v: "42건", s: "이번 달 +8", c: C.gold },
                { l: "전체 적중률", v: "61.2%", s: "Forecaster까지 3.8%", c: C.green },
                { l: "난이도 평균", v: "55점", s: "중배당 위주", c: C.blue },
                { l: "연속 적중", v: "3회", s: "최고 5회", c: C.t1 },
              ].map(s => (
                <div key={s.l} style={{
                  background: C.bg1, border: `1px solid ${C.bd}`,
                  borderRadius: T.r_lg, padding: "12px",
                }}>
                  <div style={{
                    fontSize: T.xl, fontWeight: T.bold, color: s.c,
                    fontFamily: T.mono, marginBottom: 4,
                  }}>{s.v}</div>
                  <div style={{ fontSize: T.sm, color: C.t1, fontWeight: T.medium }}>{s.l}</div>
                  <div style={{ fontSize: T.xs, color: C.t3, marginTop: 3 }}>{s.s}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "nft" && (
          <div style={{ animation: "fadeUp 0.25s" }}>
            <div style={{
              background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
              padding: "14px 16px", marginBottom: 14, textAlign: "center",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <SealBadge size={56} gk="proven" />
              </div>
              <div style={{
                fontFamily: T.display, fontSize: T.md, fontWeight: T.bold,
                color: C.t1, marginBottom: 4,
              }}>인증 배지 · Sealed Eye</div>
              <div style={{ fontSize: T.sm, color: C.t2 }}>Proven 이상 등급에서 발급 · 온체인 영구 기록</div>
            </div>
            <div style={{
              background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
              padding: "20px", textAlign: "center",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <Lock size={28} color={C.t3} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>아직 배지가 없습니다</div>
              <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 16, lineHeight: T.relaxed }}>
                Proven 등급에 도달하면<br />Sealed Eye 배지가 발급됩니다.
              </div>
              <button onClick={() => onNav("challenge")}
                style={{
                  padding: "11px 24px",
                  background: C.gold,
                  border: "none", borderRadius: T.r_md, color: "#000",
                  fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
                }}>
                Proven 도전하기
              </button>
            </div>
          </div>
        )}
        {tab === "settings" && (
          <div style={{ animation: "fadeUp 0.25s" }}>
            {loggedIn ? (
              <div style={{
                background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
                padding: "14px 15px", marginBottom: 14, display: "flex", gap: 11, alignItems: "center",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: T.r_md, background: C.bg2,
                  border: `1px solid ${C.bd}`, display: "flex", alignItems: "center",
                  justifyContent: "center",
                }}>
                  <UserIcon size={20} color={C.t1} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1, marginBottom: 4 }}>YourHandle</div>
                  <Badge gk="candidate" quarter="2026 Q2" sm />
                </div>
                <button onClick={onLogout}
                  style={{
                    padding: "6px 12px", background: C.bg2, border: `1px solid ${C.bd}`,
                    borderRadius: T.r_md, color: C.t2, fontSize: T.xs, fontWeight: T.semibold, cursor: "pointer",
                  }}>
                  로그아웃
                </button>
              </div>
            ) : (
              <div onClick={onAuth}
                style={{
                  background: C.bg1,
                  border: `1px solid ${C.goldBd}`, borderRadius: T.r_lg, padding: "16px",
                  marginBottom: 14, cursor: "pointer", display: "flex", gap: 11, alignItems: "center",
                }}>
                <div style={{
                  width: 42, height: 42, borderRadius: T.r_md,
                  background: C.goldBg, border: `1px solid ${C.goldBd}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <UserIcon size={20} color={C.gold} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: T.sm, fontWeight: T.bold, color: C.t1 }}>로그인 / 회원가입</div>
                  <div style={{ fontSize: T.xs, color: C.t2, marginTop: 2 }}>도전을 시작하세요</div>
                </div>
                <ChevronRight size={16} color={C.t3} strokeWidth={2} />
              </div>
            )}
            {([
              { Icon: Star, title: "도전 · 등급", items: [{ l: "분기 도전 신청", s: "Q3", act: () => onNav("challenge") }, { l: "구독 관리", s: "Standard 30명" }, { l: "포인트 충전", s: "보유 240P" }] as Array<{ l: string; s?: string; act?: () => void }> },
              { Icon: Bell, title: "알림",      items: [{ l: "알림 설정", s: "등급 변동 · 결과 · 배지" }] },
              { Icon: Link2, title: "계정",      items: [{ l: "지갑 연결", s: "0x4a2f...3c81" }, { l: "기록 내보내기", s: "CSV" }] },
              { Icon: Info, title: "기타",       items: [{ l: "앱 버전", s: "v11.0.0" }, { l: "서비스 약관" }, { l: "고객센터" }] },
            ]).map((sec, si) => (
              <div key={si} style={{ marginBottom: 14 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                  <sec.Icon size={12} color={C.t3} strokeWidth={2} />
                  <span style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t3 }}>{sec.title}</span>
                </div>
                <div style={{ background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_md, overflow: "hidden" }}>
                  {sec.items.map((item, ii) => (
                    <div key={ii} onClick={() => item.act && item.act()}
                      style={{
                        display: "flex", alignItems: "center", gap: 11, padding: "12px 14px",
                        borderBottom: ii < sec.items.length - 1 ? `1px solid ${C.bd}` : "none",
                        cursor: item.act ? "pointer" : "default", transition: "background 0.15s",
                      }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: T.sm, fontWeight: T.medium, color: C.t1 }}>{item.l}</div>
                        {item.s && <div style={{ fontSize: T.xs, color: C.t3, marginTop: 2 }}>{item.s}</div>}
                      </div>
                      {item.act && <ChevronRight size={14} color={C.t3} strokeWidth={2} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 80 }} />
      </div>
      <BottomNav active="my" onNav={onNav} />
    </div>
  );
};
