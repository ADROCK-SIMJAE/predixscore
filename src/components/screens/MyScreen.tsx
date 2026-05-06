"use client";

import { useState } from "react";
import { Mail, Settings, Lock, ChevronRight, User as UserIcon, Star, Bell, Link2, Info } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { useMyProfile } from "@/hooks/useProfile";
import { useDMList } from "@/hooks/useDMs";
import { useAuthStore } from "@/store/auth";
import { Gd } from "@/lib/grades";
import { getSupabase } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { NotifBell } from "@/components/ui/NotifBell";
import { Badge } from "@/components/ui/Badge";
import { SealBadge } from "@/components/ui/SealBadge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { BottomNav } from "@/components/nav/BottomNav";
import { ProfileEditModal } from "@/components/modals/ProfileEditModal";
import { PointsTopupSheet } from "@/components/modals/PointsTopupSheet";

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
  const [showEdit, setShowEdit] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const { data: profile } = useMyProfile();
  const { data: dmList = [] } = useDMList();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const unreadDM = dmList.filter((c) => {
    const last = (c.messages ?? [])
      .slice()
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0];
    return last && last.sender_id !== userId;
  }).length;

  const handleExportCSV = async () => {
    if (!userId) { alert("로그인이 필요합니다."); return; }
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("user_predictions")
        .select("prediction_id,choice,is_correct,sealed_at")
        .eq("user_id", userId)
        .order("sealed_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        prediction_id: number; choice: string;
        is_correct: boolean | null; sealed_at: string;
      }>;
      const header = "prediction_id,choice,is_correct,sealed_at";
      const csvLines = [header, ...rows.map((r) =>
        [r.prediction_id, r.choice, r.is_correct ?? "", r.sealed_at].join(","),
      )];
      const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `predixscore-records-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "내보내기 실패");
    }
  };

  const totalScore = Math.round(profile?.score ?? 0);
  const accuracyPct = profile?.accuracy ?? 0;
  const predsCount = profile?.preds_count ?? 0;
  const subsCount = profile?.subs_count ?? 0;
  const points = profile?.points ?? 0;
  const myGrade = profile?.grade ?? "candidate";
  const myGradeMeta = Gd(myGrade);
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const scores = [52, 54, 58, 56, 61, 63, 58, totalScore];
  const maxS = Math.max(...scores, 1);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      {/* 헤더 */}
      <div style={{ padding: "10px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => push("dm_list", {})}
            style={{
              width: 32, height: 32, borderRadius: T.r_pill, background: C.bg2,
              border: `1px solid ${C.bd}`, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: C.t1, position: "relative",
              transition: "all 180ms",
            }}>
            <Mail size={15} strokeWidth={2} />
            {unreadDM > 0 && (
              <div style={{
                position: "absolute", top: 4, right: 4, width: 7, height: 7,
                borderRadius: "50%", background: C.rose, border: `1.5px solid ${C.bg}`,
              }} />
            )}
          </button>
          <NotifBell push={push} />
          <button onClick={() => setTab("settings")}
            style={{
              width: 32, height: 32, borderRadius: T.r_pill,
              background: tab === "settings"
                ? `linear-gradient(180deg, ${C.goldL}, ${C.gold})`
                : C.bg2,
              border: `1px solid ${tab === "settings" ? C.goldL + "40" : C.bd}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: tab === "settings" ? "#000" : C.t1,
              transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
            }}>
            <Settings size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 탭 세그먼트 */}
      <div style={{
        display: "flex", gap: 0, margin: "12px 16px 0", background: C.bg2,
        borderRadius: T.r_md, padding: 3, border: `1px solid ${C.bd}`,
      }}>
        {([["record", "내 기록"], ["nft", "배지 · NFT"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "9px 0",
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
        {tab === "record" && (
          <div style={{ animation: "fadeUp 0.25s" }}>
            {/* 등급 + Score 배너 */}
            <div style={{
              background: "linear-gradient(145deg,#140D02 0%,#0A0700 50%,#120A01 100%)",
              border: `1px solid ${C.goldBd}`,
              borderRadius: T.r_xl,
              padding: "16px", marginBottom: 14,
              position: "relative", overflow: "hidden",
              boxShadow: "0 4px 24px rgba(201,160,48,0.08)",
            }}>
              {/* 배경 glow */}
              <div style={{
                position: "absolute", top: -30, right: -30,
                width: 140, height: 140, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(201,160,48,0.1) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                <ScoreGauge score={totalScore} />
                <div>
                  <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 4, letterSpacing: T.ls_label }}>
                    현재 등급 · 2026 Q2
                  </div>
                  <div style={{
                    fontFamily: T.display, fontSize: T.lg, fontWeight: T.bold,
                    color: myGradeMeta.color, marginBottom: 4,
                    letterSpacing: "-0.02em",
                  }}>{myGradeMeta.label}</div>
                  <div style={{ fontSize: T.sm, color: C.t2 }}>예측에 참여하고 등급을 쌓으세요</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: T.xs, color: C.t2 }}>
                      적중 <span style={{ color: C.mint, fontWeight: T.semibold }}>{accuracyPct}%</span>
                    </span>
                    <span style={{ fontSize: T.xs, color: C.t2 }}>총 {predsCount}회</span>
                  </div>
                </div>
              </div>

              {/* Score 분해 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                {[
                  { l: "적중률 ×0.4", v: Math.round(accuracyPct * 0.4), c: C.mint },
                  { l: "신뢰도 ×0.2", v: Math.round(totalScore * 0.2), c: C.blue },
                  { l: "난이도 ×0.2", v: Math.round(totalScore * 0.2), c: C.goldL },
                  { l: "최근성 ×0.2", v: Math.round(totalScore * 0.2), c: C.plum },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid rgba(255,255,255,0.05)`,
                    borderRadius: T.r_md, padding: "8px 10px",
                  }}>
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
                background: C.goldBg, border: `1px solid ${C.goldBd}`,
                borderRadius: T.r_md, padding: "10px 12px",
              }}>
                <div style={{
                  fontSize: T.xs, fontWeight: T.semibold, color: C.goldL, marginBottom: 6,
                  letterSpacing: T.ls_label,
                }}>
                  Proven까지 필요한 것
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { l: "Score", gap: `+${Math.max(0, 70 - totalScore)}`, c: C.goldL },
                    { l: "예측", gap: "+58회", c: C.t2 },
                    { l: "적중률", gap: "+3.8%", c: C.mint },
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
                background: `linear-gradient(180deg, ${C.goldL}, ${C.gold})`,
                border: `1px solid ${C.goldL}40`,
                borderRadius: T.r_md, color: "#000",
                fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
                boxShadow: T.shadow_gold,
                transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
              }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              Forecaster 도전 신청하기
            </button>

            {/* Score 추이 차트 */}
            <div style={{
              background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
              padding: 13, marginBottom: 12,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t2, marginBottom: 10 }}>
                Predix Score 추이
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
                {scores.map((s, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: "100%", borderRadius: `${T.r_sm}px ${T.r_sm}px 0 0`,
                      height: `${Math.round((s / maxS) * 56)}px`,
                      background: i === scores.length - 1
                        ? `linear-gradient(180deg, ${C.goldL}, ${C.gold})`
                        : `rgba(201,160,48,0.18)`,
                      transition: "height 0.4s cubic-bezier(0.32,0.72,0,1)",
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
                { l: "총 예측", v: `${predsCount}건`, s: "누적", c: C.goldL },
                { l: "전체 적중률", v: `${accuracyPct}%`, s: "분기 누적", c: C.mint },
                { l: "보유 포인트", v: `${points.toLocaleString()}P`, s: "충전 가능", c: C.blue },
                { l: "구독", v: `${subsCount}명`, s: "내 구독자", c: C.t1 },
              ].map(s => (
                <div key={s.l} style={{
                  background: C.bg1, border: `1px solid ${C.bd}`,
                  borderRadius: T.r_lg, padding: "13px",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}>
                  <div style={{
                    fontSize: T.xxl, fontWeight: T.bold, color: s.c,
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
              padding: "16px", marginBottom: 14, textAlign: "center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <SealBadge size={56} gk="proven" />
              </div>
              <div style={{
                fontFamily: T.display, fontSize: T.md, fontWeight: T.bold,
                color: C.t1, marginBottom: 6, letterSpacing: "-0.01em",
              }}>인증 배지 · Sealed Eye</div>
              <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.normal }}>Proven 이상 등급에서 발급 · 온체인 영구 기록</div>
            </div>
            <div style={{
              background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg,
              padding: "24px 20px", textAlign: "center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <Lock size={28} color={C.t3} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: T.base, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>아직 배지가 없습니다</div>
              <div style={{ fontSize: T.sm, color: C.t3, marginBottom: 18, lineHeight: T.relaxed }}>
                Proven 등급에 도달하면<br />Sealed Eye 배지가 발급됩니다.
              </div>
              <button onClick={() => onNav("challenge")}
                style={{
                  padding: "11px 24px",
                  background: `linear-gradient(180deg, ${C.goldL}, ${C.gold})`,
                  border: `1px solid ${C.goldL}40`,
                  borderRadius: T.r_md, color: "#000",
                  fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
                  boxShadow: T.shadow_gold,
                  transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
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
                padding: "14px 15px", marginBottom: 14,
                display: "flex", gap: 11, alignItems: "center",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: T.r_md, background: C.bg2,
                  border: `1px solid ${C.bd}`, display: "flex", alignItems: "center",
                  justifyContent: "center",
                }}>
                  <UserIcon size={20} color={C.t1} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1, marginBottom: 4 }}>
                    {profile?.handle ?? "—"}
                  </div>
                  <Badge gk={myGrade} quarter="2026 Q2" sm />
                </div>
                <button onClick={onLogout}
                  style={{
                    padding: "6px 12px", background: C.bg2, border: `1px solid ${C.bd}`,
                    borderRadius: T.r_md, color: C.t2,
                    fontSize: T.xs, fontWeight: T.semibold, cursor: "pointer",
                    transition: "all 150ms",
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
                  transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
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
              {
                Icon: Star, title: "도전 · 등급",
                items: [
                  { l: "분기 도전 신청", s: "Q3", act: () => onNav("challenge") },
                  { l: "프로필 편집", s: profile?.handle ?? "—", act: () => setShowEdit(true) },
                  { l: "포인트 충전", s: `보유 ${points.toLocaleString()}P`, act: () => setShowTopup(true) },
                ] as Array<{ l: string; s?: string; act?: () => void }>,
              },
              {
                Icon: Bell, title: "알림",
                items: [
                  { l: "알림 설정", s: "등급 변동 · 결과 · 배지", act: () => alert("알림 설정은 곧 제공됩니다.") },
                ] as Array<{ l: string; s?: string; act?: () => void }>,
              },
              {
                Icon: Link2, title: "계정",
                items: [
                  { l: "지갑 연결", s: profile?.wallet ?? "미연결", act: () => setShowEdit(true) },
                  { l: "기록 내보내기", s: "CSV", act: handleExportCSV },
                ] as Array<{ l: string; s?: string; act?: () => void }>,
              },
              {
                Icon: Info, title: "기타",
                items: [
                  { l: "앱 버전", s: "v11.0.0" },
                  { l: "서비스 약관", act: () => alert("준비 중입니다.") },
                  { l: "고객센터", act: () => alert("준비 중입니다.") },
                ] as Array<{ l: string; s?: string; act?: () => void }>,
              },
            ]).map((sec, si) => (
              <div key={si} style={{ marginBottom: 14 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                  <sec.Icon size={12} color={C.t3} strokeWidth={2} />
                  <span style={{
                    fontSize: T.xs, fontWeight: T.semibold, color: C.t3,
                    letterSpacing: T.ls_label,
                  }}>{sec.title}</span>
                </div>
                <div style={{
                  background: C.bg1, border: `1px solid ${C.bd}`,
                  borderRadius: T.r_md, overflow: "hidden",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}>
                  {sec.items.map((item, ii) => (
                    <div key={ii} onClick={() => item.act && item.act()}
                      style={{
                        display: "flex", alignItems: "center", gap: 11, padding: "13px 14px",
                        borderBottom: ii < sec.items.length - 1 ? `1px solid ${C.bd}` : "none",
                        cursor: item.act ? "pointer" : "default",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => {
                        if (item.act) (e.currentTarget as HTMLDivElement).style.background = C.bg2;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.background = "transparent";
                      }}
                    >
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
      <ProfileEditModal open={showEdit} onClose={() => setShowEdit(false)} />
      <PointsTopupSheet open={showTopup} onClose={() => setShowTopup(false)} />
    </div>
  );
};
