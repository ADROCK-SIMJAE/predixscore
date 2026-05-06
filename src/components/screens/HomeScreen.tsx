"use client";

import { useState, useEffect } from "react";
import { Zap, ChevronLeft, ChevronRight, Trophy, Plus } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { usePreds } from "@/hooks/usePreds";
import { BRAND_LOGOS } from "@/lib/assets";
import { Logo } from "@/components/ui/Logo";
import { NotifBell } from "@/components/ui/NotifBell";
import { SealBadge } from "@/components/ui/SealBadge";
import { BottomNav } from "@/components/nav/BottomNav";
import { PredictCard } from "@/components/cards/PredictCard";
import { PredictModal } from "@/components/modals/PredictModal";
import { CreatePredictionModal } from "@/components/modals/CreatePredictionModal";
import type { Pred } from "@/types";

interface HomeScreenProps {
  onNav: (screen: string) => void;
  push: (screen: string, data?: any) => void;
  loggedIn: boolean;
  onAuth: () => void;
}

/* ── HomeScreen ─────────────── */
export const HomeScreen = ({ onNav, push, loggedIn, onAuth }: HomeScreenProps) => {
  const [tab, setTab] = useState<string>("all");
  const [modal, setModal] = useState<Pred | null>(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const cats = ["전체", "코인", "주식", "스포츠", "이슈", "정치"];
  const { data: preds = [], isLoading: loadingPreds } = usePreds();

  // 카테고리별 액센트 컬러
  const catColors: Record<string, string> = {
    "전체": C.gold,
    "코인": C.gold,
    "주식": C.cyan,
    "스포츠": C.peach,
    "이슈": C.rose,
    "정치": C.plum,
  };

  // 자동 슬라이드
  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % 3), 4500);
    return () => clearInterval(t);
  }, []);

  const BANNERS = [
    // ─── 배너 1: 도전하기 ───────────────────────────
    {
      render: () => (
        <div style={{
          height: 200,
          background: "linear-gradient(145deg,#140D02 0%,#0A0700 60%,#120A01 100%)",
          borderRadius: T.r_xl, margin: "10px 16px",
          border: `1px solid ${C.goldBd}`,
          overflow: "hidden", position: "relative",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "16px 18px",
          boxShadow: "0 4px 24px rgba(201,160,48,0.08)",
        }}>
          {/* 배경 glow */}
          <div style={{
            position: "absolute", top: -20, right: -20,
            width: 120, height: 120, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,160,48,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SealBadge size={48} gk="seer" />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: T.xs, color: C.goldL, fontWeight: T.semibold,
                marginBottom: 4, letterSpacing: T.ls_label,
                textTransform: "uppercase" as const,
              }}>예측 챌린지</div>
              <div style={{ fontFamily: T.display, fontWeight: T.bold, lineHeight: T.tight }}>
                <div style={{ fontSize: T.lg, color: C.t1, letterSpacing: "-0.02em" }}>예측 실력을</div>
                <div style={{ fontSize: T.lg, color: C.goldL, letterSpacing: "-0.02em" }}>증명해보세요</div>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 2 }}>현재 봉인</div>
              <div style={{
                fontSize: T.lg, fontWeight: T.bold, color: C.goldL,
                fontFamily: T.mono,
              }}>2,324건</div>
            </div>
          </div>
          <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.normal }}>
            공개 예측에 참여하고 적중률을 데이터로 남기세요.
          </div>
          <button onClick={() => onNav("challenge")}
            style={{
              width: "100%", padding: "12px 0",
              background: `linear-gradient(180deg, ${C.goldL}, ${C.gold})`,
              border: `1px solid ${C.goldL}40`,
              borderRadius: T.r_md, color: "#000",
              fontSize: T.sm, fontWeight: T.bold,
              cursor: "pointer",
              boxShadow: T.shadow_gold,
              transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
            }}>
            도전 시작하기
          </button>
        </div>
      )
    },
    // ─── 배너 2: 종목 배틀 ──────────────────────────
    {
      render: () => (
        <div style={{
          height: 200,
          background: "linear-gradient(145deg,#0C0924 0%,#08051A 60%,#0D0A22 100%)",
          borderRadius: T.r_xl, margin: "10px 16px",
          border: `1px solid ${C.seerBd}`,
          overflow: "hidden", position: "relative",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "16px 18px",
          boxShadow: "0 4px 24px rgba(124,58,237,0.08)",
        }}>
          <div style={{
            position: "absolute", top: -20, right: -20,
            width: 120, height: 120, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(194,159,232,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{
              background: C.seer,
              borderRadius: T.r_sm, padding: "3px 9px",
              fontSize: T.xs, fontWeight: T.semibold, color: "#fff",
              letterSpacing: T.ls_label,
            }}>
              Proven · Seer 전용
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)",
              borderRadius: T.r_pill, padding: "2px 9px",
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: C.rose,
                animation: "pulse 1.5s infinite",
              }} />
              <span style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.rose }}>LIVE</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: T.display, fontSize: T.lg, fontWeight: T.bold,
                color: C.t1, marginBottom: 4, lineHeight: T.tight,
                letterSpacing: "-0.02em",
              }}>종목 배틀 예측</div>
              <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.normal }}>
                전문가들의 매일 상승/하락 예측
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              {([{ logo: "tesla" }, { logo: "apple" }, { logo: "samsung" }] as const).map((s, i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: T.r_md, overflow: "hidden",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={BRAND_LOGOS[s.logo]} alt={s.logo}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => push("event", {})}
            style={{
              width: "100%", padding: "12px 0",
              background: C.seer,
              border: `1px solid ${C.seerL}30`,
              borderRadius: T.r_md, color: "#fff",
              fontSize: T.sm, fontWeight: T.bold,
              cursor: "pointer",
              transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
            }}>
            전문가 예측 보기
          </button>
        </div>
      )
    },
    // ─── 배너 3: 수익 배틀 ──────────────────────────
    {
      render: () => (
        <div style={{
          height: 200,
          background: "linear-gradient(145deg,#120A02 0%,#0A0800 60%,#130B01 100%)",
          borderRadius: T.r_xl, margin: "10px 16px",
          border: `1px solid ${C.goldBd}`,
          overflow: "hidden", position: "relative",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "16px 18px",
          boxShadow: "0 4px 24px rgba(201,160,48,0.08)",
        }}>
          <div style={{
            position: "absolute", bottom: -20, left: -20,
            width: 100, height: 100, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,160,48,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: C.goldBg, border: `1px solid ${C.goldBd}`,
              borderRadius: T.r_sm, padding: "3px 9px",
            }}>
              <Trophy size={12} color={C.goldL} strokeWidth={2.2} />
              <span style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.goldL }}>10일 배틀</span>
            </div>
            <div style={{ fontSize: T.xs, color: C.t3 }}>수익 → 우승 전문가</div>
          </div>
          <div>
            <div style={{
              fontFamily: T.display, fontSize: T.lg, fontWeight: T.bold,
              color: C.t1, marginBottom: 6, lineHeight: T.tight,
              letterSpacing: "-0.02em",
            }}>
              열람 수익을<br /><span style={{ color: C.goldL }}>예측가에게 보냅니다</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ n: "1", t: "예측 봉인" }, { n: "2", t: "열람 수익" }, { n: "3", t: "우승자 획득" }].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(180deg, ${C.goldL}, ${C.gold})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: T.xs, fontWeight: T.bold, color: "#000",
                  }}>{s.n}</div>
                  <span style={{ fontSize: T.xs, color: C.t2 }}>{s.t}</span>
                  {i < 2 && <ChevronRight size={11} color={C.t3} strokeWidth={2} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => push("event", {})}
            style={{
              width: "100%", padding: "12px 0",
              background: `linear-gradient(180deg, ${C.goldL}, ${C.gold})`,
              border: `1px solid ${C.goldL}40`,
              borderRadius: T.r_md, color: "#000",
              fontSize: T.sm, fontWeight: T.bold,
              cursor: "pointer",
              boxShadow: T.shadow_gold,
              transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
            }}>
            수익 확인하기
          </button>
        </div>
      )
    },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, position: "relative" }}>
      {/* 헤더 */}
      <div style={{
        padding: "10px 16px 0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <Logo />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => push("event", {})}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 11px",
              background: C.goldBg,
              border: `1px solid ${C.goldBd}`, borderRadius: T.r_pill,
              cursor: "pointer", position: "relative",
              transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
            }}>
            <Zap size={13} color={C.goldL} strokeWidth={2} />
            <span style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.goldL }}>이벤트</span>
            <div style={{
              position: "absolute", top: -2, right: -2, width: 8, height: 8,
              borderRadius: "50%", background: C.rose, border: `1.5px solid ${C.bg}`,
            }} />
          </button>
          <NotifBell push={push} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* 슬라이드 배너 */}
        <div style={{ position: "relative" }}>
          <div key={bannerIdx} style={{ animation: "fadeUp 0.35s ease" }}>
            {BANNERS[bannerIdx].render()}
          </div>
          {/* 인디케이터 */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 6,
            marginTop: -4, marginBottom: 14,
          }}>
            {BANNERS.map((_, i) => (
              <div key={i} onClick={() => setBannerIdx(i)}
                style={{
                  height: 3, borderRadius: T.r_pill, cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
                  width: i === bannerIdx ? 24 : 6,
                  background: i === bannerIdx
                    ? (bannerIdx === 1 ? C.seerL : C.goldL)
                    : "rgba(255,255,255,0.15)",
                }} />
            ))}
          </div>
          {/* 좌우 화살표 */}
          <button onClick={() => setBannerIdx(i => (i + 2) % 3)}
            style={{
              position: "absolute", left: 22, top: "45%", transform: "translateY(-50%)",
              width: 28, height: 28, borderRadius: T.r_pill,
              background: "rgba(10,9,8,0.5)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 150ms",
            }}>
            <ChevronLeft size={14} strokeWidth={2} />
          </button>
          <button onClick={() => setBannerIdx(i => (i + 1) % 3)}
            style={{
              position: "absolute", right: 22, top: "45%", transform: "translateY(-50%)",
              width: 28, height: 28, borderRadius: T.r_pill,
              background: "rgba(10,9,8,0.5)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 150ms",
            }}>
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 16px 14px", flexShrink: 0 }}>
          {cats.map(c => {
            const key = c === "전체" ? "all" : c;
            const isActive = tab === key;
            const accentColor = catColors[c] ?? C.gold;
            return (
              <button key={c} onClick={() => setTab(key)}
                style={{
                  flexShrink: 0, padding: "6px 14px",
                  background: isActive
                    ? `linear-gradient(180deg, ${accentColor}dd, ${accentColor})`
                    : C.bg2,
                  border: `1px solid ${isActive ? accentColor + "60" : C.bd}`,
                  borderRadius: T.r_pill,
                  color: isActive ? "#000" : C.t2,
                  fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer",
                  transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
                  boxShadow: isActive ? `0 2px 8px ${accentColor}30` : "none",
                }}>
                {c}
              </button>
            );
          })}
        </div>

        {/* 예측 리스트 */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {loadingPreds && (
            <div style={{ padding: "40px 0", textAlign: "center", color: C.t3, fontSize: T.sm }}>
              불러오는 중…
            </div>
          )}
          {!loadingPreds && preds.length === 0 && (
            <div style={{
              padding: "48px 0", textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <div style={{ fontSize: 32 }}>◎</div>
              <div style={{ fontSize: T.base, color: C.t2, fontWeight: T.medium }}>아직 예측이 없습니다</div>
              <div style={{ fontSize: T.sm, color: C.t3 }}>첫 번째 예측을 봉인해보세요</div>
            </div>
          )}
          {preds.filter(p => tab === "all" || p.cat === tab).map(p => (
            <PredictCard key={p.id} pred={p} onOpen={pred => {
              if (pred.status === "revealed" || pred.myPred) { push("result", { pred }); return; }
              setModal(pred);
            }} />
          ))}
        </div>

        <div style={{ height: 90 }} />
      </div>

      {modal && (
        <PredictModal pred={modal} onClose={() => setModal(null)} loggedIn={loggedIn} onAuth={onAuth} />
      )}

      {/* FAB */}
      <button
        onClick={() => { if (!loggedIn) { onAuth(); return; } setShowCreate(true); }}
        style={{
          position: "absolute", right: 20, bottom: 80,
          width: 52, height: 52, borderRadius: "50%",
          background: `linear-gradient(180deg, ${C.goldL}, ${C.gold})`,
          color: "#000",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: T.shadow_gold,
          zIndex: 50, border: "none", cursor: "pointer",
          transition: "transform 180ms cubic-bezier(0.32,0.72,0,1)",
        }}
        onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)"; }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        <Plus size={24} strokeWidth={2.4} />
      </button>

      <CreatePredictionModal open={showCreate} onClose={() => setShowCreate(false)} />
      <BottomNav active="home" onNav={onNav} />
    </div>
  );
};
