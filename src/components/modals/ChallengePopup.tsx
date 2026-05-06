"use client";

import { X, BarChart3, Target, Flame, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { SealBadge } from "@/components/ui/SealBadge";

interface ChallengeSlide {
  Icon: LucideIcon | null;
  useImg: boolean;
  title: string;
  desc: string;
  tag: string;
  points?: string[];
}

/* ── CHALLENGE_SLIDES ─────────────── */
export const CHALLENGE_SLIDES: ChallengeSlide[] = [
  {
    Icon: null,
    useImg: true,
    title: "예측 챌린지에\n참여하세요",
    desc: "공개 예측에 참여하고 적중률을 쌓아\n나만의 등급을 인증받으세요.",
    tag: "Predix Challenge",
  },
  {
    Icon: BarChart3,
    useImg: false,
    title: "실력으로\n도전 자격을 얻습니다",
    desc: "공개 예측에 참여해 일정 수준 이상의\nPredix Score를 달성하면\n도전 자격이 자동으로 주어집니다.",
    tag: "STEP 1 — 자격 획득",
    points: ["예측 30회 이상 참여", "Predix Score 55점 이상", "기본 적중률 충족"],
  },
  {
    Icon: Target,
    useImg: false,
    title: "등급에 맞는\n예측 문제 도전",
    desc: "도전을 시작하면 현재 등급에 맞춘\n새로운 예측 문제가 제시됩니다.\n비공개로 봉인되어 조작 없이 검증됩니다.",
    tag: "STEP 2 — 도전 시작",
    points: ["등급별 난이도 출제", "비공개 봉인 예측", "블록체인 기록"],
  },
  {
    Icon: Flame,
    useImg: false,
    title: "10일 동안\n매일 새로운 문제",
    desc: "10일 동안 매일 새로운 예측 문제가 제시됩니다.\n꾸준히 풀어 적중률을 높이고\n실력을 데이터로 증명하세요.",
    tag: "STEP 3 — 10일 챌린지",
    points: ["매일 1문제 이상", "연속 적중 보너스", "난이도 점진 상승"],
  },
  {
    Icon: Crown,
    useImg: false,
    title: "기준 통과 시\n등급 인증",
    desc: "10일 챌린지에서 기준 적중률을 달성하면\n도전한 등급이 공식 인증됩니다.\nForecaster → Proven → Seer 순서로 성장하세요.",
    tag: "STEP 4 — 등급 인증",
    points: ["Forecaster: Score 55+", "Proven: Score 70+", "Seer: Score 85+"],
  },
];

interface ChallengePopupProps {
  onClose: () => void;
  onEnter: () => void;
  imgSrc?: string;
  idx: number;
  setIdx: (updater: (i: number) => number) => void;
}

/* ── ChallengePopup ─────────────── */
export const ChallengePopup = ({ onClose, onEnter, imgSrc, idx, setIdx }: ChallengePopupProps) => {
  const total = CHALLENGE_SLIDES.length;
  const slide = CHALLENGE_SLIDES[idx];
  const isLast = idx === total - 1;
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => { if (isLast) onEnter(); else setIdx(i => i + 1); };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 600,
      display: "flex", flexDirection: "column", animation: "fadeIn 0.2s",
    }}>
      <div style={{ flex: 1, background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div style={{
        background: C.bg1, borderRadius: `${T.r_xl}px ${T.r_xl}px 0 0`, maxHeight: "92%",
        display: "flex", flexDirection: "column",
        animation: "slideUp 0.35s cubic-bezier(0.32,0.72,0,1)",
        boxShadow: T.shadow_md,
        border: `1px solid ${C.bd}`, borderBottom: "none",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, background: C.bd, borderRadius: T.r_pill }} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 16px 0" }}>
          <button onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "none", borderRadius: T.r_pill,
              width: 28, height: 28, color: C.t2,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        {/* 슬라이드 본문 */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {slide.useImg && imgSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc} alt="Predix Challenge" style={{ width: "100%", display: "block" }} />
          )}
          {slide.useImg && !imgSrc && (
            <div style={{ padding: "32px 24px", textAlign: "center", background: "linear-gradient(180deg,#0F0A00,#0A0700)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <SealBadge size={80} gk="seer" />
              </div>
              <div style={{
                fontFamily: T.display, fontSize: T.xl, fontWeight: T.bold,
                color: C.t1, marginBottom: 8, whiteSpace: "pre-line",
              }}>{slide.title}</div>
              <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.relaxed, whiteSpace: "pre-line" }}>{slide.desc}</div>
            </div>
          )}
          {!slide.useImg && slide.Icon && (
            <div style={{ padding: "28px 24px 16px", animation: "fadeUp 0.3s" }}>
              {/* 태그 */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: `rgba(201,160,48,0.08)`, border: `1px solid ${C.goldBd}`,
                borderRadius: T.r_pill, padding: "4px 12px", marginBottom: 20,
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%", background: C.gold,
                }} />
                <span style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.gold }}>
                  {slide.tag}
                </span>
              </div>
              {/* 아이콘 */}
              <div style={{ marginBottom: 18, textAlign: "center" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 56, height: 56, borderRadius: T.r_lg,
                  background: C.goldBg, border: `1px solid ${C.goldBd}`,
                }}>
                  <slide.Icon size={26} color={C.gold} strokeWidth={2} />
                </div>
              </div>
              {/* 제목 */}
              <div style={{
                fontFamily: T.display, fontSize: T.xl, fontWeight: T.bold,
                color: C.t1, marginBottom: 12, lineHeight: T.tight, whiteSpace: "pre-line", textAlign: "center",
              }}>
                {slide.title}
              </div>
              {/* 설명 */}
              <div style={{
                fontSize: T.sm, color: C.t2, lineHeight: T.relaxed, marginBottom: 20,
                whiteSpace: "pre-line", textAlign: "center",
              }}>{slide.desc}</div>
              {/* 포인트 리스트 */}
              {slide.points && (
                <div style={{
                  background: "rgba(201,160,48,0.04)", border: `1px solid ${C.goldBd}`,
                  borderRadius: T.r_lg, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10,
                }}>
                  {slide.points.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: T.r_pill, background: C.goldBg,
                        border: `1px solid ${C.gold}`, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: T.xs, fontWeight: T.bold, color: C.gold, flexShrink: 0,
                      }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: T.sm, color: C.t1, fontWeight: T.medium }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 — 페이지 인디케이터 + 버튼 */}
        <div style={{
          padding: "12px 20px calc(32px + env(safe-area-inset-bottom))", background: "#0A0800",
          borderTop: `1px solid ${C.bd}`,
        }}>
          {/* 인디케이터 */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 14 }}>
            {CHALLENGE_SLIDES.map((_, i) => (
              <div key={i} onClick={() => setIdx(() => i)}
                style={{
                  height: 4, borderRadius: T.r_pill, cursor: "pointer", transition: "all 0.3s",
                  width: i === idx ? 20 : 6,
                  background: i === idx ? C.gold : "rgba(201,160,48,0.2)",
                }} />
            ))}
          </div>
          {/* 버튼 */}
          <div style={{ display: "flex", gap: 8 }}>
            {idx > 0 && (
              <button onClick={prev}
                style={{
                  flex: 1, padding: "13px 0",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.bd}`, borderRadius: T.r_md,
                  color: C.t2, fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                <ChevronLeft size={16} strokeWidth={2.2} />
                이전
              </button>
            )}
            <button onClick={next}
              style={{
                flex: 2, padding: "13px 0",
                background: C.gold,
                border: "none", borderRadius: T.r_md,
                color: "#000", fontSize: T.md, fontWeight: T.bold,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
              {isLast ? "도전 시작하기" : "다음"}
              {!isLast && <ChevronRight size={16} strokeWidth={2.2} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
