"use client";

import { useState } from "react";
import { Play, Gem, Crown, Unlock, Lock, Flame, TrendingUp, TrendingDown } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { EXPERTS } from "@/lib/data";
import { BRAND_LOGOS } from "@/lib/assets";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BlindBox } from "@/components/ui/BlindBox";
import { BackBar } from "@/components/ui/BackBar";
import { UnlockSheet, UnlockSheetOption } from "@/components/modals/UnlockSheet";
import type { EventItem } from "@/types";

interface EventDetailProps {
  ev: EventItem;
  onBack: () => void;
  push: (screen: string, data?: any) => void;
}

/* ── EventDetail ─────────────── */
export const EventDetail = ({ ev, onBack, push }: EventDetailProps) => {
  const [showUnlock, setShowUnlock] = useState(false);

  const unlockOptions: UnlockSheetOption[] = [
    { icon: <Play size={18} color="#7AC074" strokeWidth={2} />, title: "광고 시청으로 무료 보기", desc: "30초 광고 → 즉시 열람", badge: "무료", c: "#7AC074", bg: "rgba(122,192,116,0.08)", bd: "rgba(122,192,116,0.3)" },
    { icon: <Gem size={18} color={C.goldL} strokeWidth={2} />, title: "포인트로 보기",            desc: "보유 포인트 차감 · 즉시 열람",  badge: "50P",  c: C.goldL,  bg: C.goldBg, bd: C.goldBd },
    { icon: <Crown size={18} color={C.seerL} strokeWidth={2} />, title: `${ev.brand} 이벤트 구독`, desc: "기간 전체 무제한 열람",         badge: "구독", c: C.seerL,  bg: C.seerBg, bd: C.seerBd },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, animation: "slideIn 0.28s" }}>
      <UnlockSheet
        open={showUnlock}
        onClose={() => setShowUnlock(false)}
        options={unlockOptions}
        headerTitle="오늘의 예측 열람"
        headerDesc="전문가들의 오늘 예측을 확인하세요"
      />
      <BackBar title={`${ev.brand} ${ev.duration}일 배틀`} onBack={onBack} dark />
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {/* 브랜드 히어로 */}
        <div style={{
          background: `linear-gradient(135deg,${ev.brandColor}15,${C.bg1})`,
          border: `1px solid ${ev.brandColor}30`, borderRadius: T.r_xl, padding: "16px", marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: T.r_lg,
              background: `${ev.brandColor}18`, border: `1px solid ${ev.brandColor}40`,
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              {ev.logo && BRAND_LOGOS[ev.logo as keyof typeof BRAND_LOGOS]
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={BRAND_LOGOS[ev.logo as keyof typeof BRAND_LOGOS]} alt={ev.brand}
                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
                : <span style={{ fontSize: T.xxl }}>{ev.icon}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.display, fontSize: T.lg, fontWeight: T.bold, color: C.t1, marginBottom: 4 }}>{ev.brand}</div>
              <div style={{ fontSize: T.xs, color: C.t2 }}>{ev.sym} · {ev.duration}일 전문가 배틀</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: T.lg, fontWeight: T.bold, color: C.gold, fontFamily: T.mono }}>{ev.deadline}</div>
              <div style={{ fontSize: T.xs, color: C.t3 }}>마감</div>
            </div>
          </div>
          <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.relaxed, marginBottom: 12 }}>{ev.desc}</div>
          <div style={{
            background: C.goldBg, border: `1px solid ${C.goldBd}`, borderRadius: T.r_md,
            padding: "11px 13px", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 3 }}>열람 수익풀</div>
              <div style={{ fontSize: T.lg, fontWeight: T.bold, color: C.goldL, fontFamily: T.mono }}>
                {ev.prizePool.toLocaleString()}P
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 3 }}>우승 조건</div>
              <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.gold }}>최다 적중 전문가</div>
              <div style={{ fontSize: T.xs, color: C.t3 }}>전액 지급</div>
            </div>
          </div>
        </div>
        {/* 일별 결과 */}
        <div style={{ background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg, padding: "13px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t2, marginBottom: 10 }}>일별 결과</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {ev.history.map((h, i) => {
              const isUp = h.actual === "📈";
              const isDn = h.actual === "📉";
              return (
                <div key={i} style={{
                  flexShrink: 0, textAlign: "center", width: 44, padding: "8px 4px",
                  background: h.actual ? C.bg2 : "rgba(201,160,48,0.06)",
                  border: `1px solid ${h.actual ? "transparent" : C.goldBd}`, borderRadius: T.r_md,
                }}>
                  <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 4, fontFamily: T.mono }}>{h.date}</div>
                  <div style={{ marginBottom: 2, display: "flex", justifyContent: "center", height: 18 }}>
                    {isUp && <TrendingUp size={16} color={C.green} strokeWidth={2.2} />}
                    {isDn && <TrendingDown size={16} color={C.red} strokeWidth={2.2} />}
                    {!h.actual && <Lock size={14} color={C.gold} strokeWidth={2} />}
                  </div>
                  <div style={{
                    fontSize: T.xs, fontWeight: T.semibold,
                    color: h.actual ? (isUp ? C.green : C.red) : C.gold,
                  }}>
                    {h.actual ? (isUp ? "상승" : "하락") : `D${h.day}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* 전문가 순위 */}
        <div style={{ background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_lg, padding: "13px 14px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t2 }}>전문가 현황</div>
            <div style={{ fontSize: T.xs, color: C.t3 }}>오늘 예측은 열람 후 공개</div>
          </div>
          {ev.experts.map((exp, i) => {
            const isTop = i === 0;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 12px",
                background: isTop ? C.goldBg : C.bg2,
                border: `1px solid ${isTop ? C.goldBd : C.bd}`,
                borderRadius: T.r_md, marginBottom: 8, cursor: "pointer",
              }}
                onClick={() => { const expert = EXPERTS.find(e => e.name === exp.name); if (expert) push("expert", { expert }); }}>
                <div style={{ width: 22, textAlign: "center", flexShrink: 0 }}>
                  {isTop ? <Crown size={14} color={C.goldL} strokeWidth={2.2} />
                    : <span style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t3, fontFamily: T.mono }}>{i + 1}</span>}
                </div>
                <Avatar name={exp.name} size={32} gk={exp.gk} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>{exp.name}</span>
                    <Badge gk={exp.gk} sm />
                  </div>
                  {exp.streak > 0 && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C.green }}>
                      <Flame size={11} strokeWidth={2.2} />
                      <span style={{ fontSize: T.xs, fontWeight: T.semibold }}>{exp.streak}연속 적중</span>
                    </div>
                  )}
                </div>
                <div style={{
                  background: C.bg, border: `1px solid ${C.bd}`, borderRadius: T.r_md,
                  padding: "5px 10px", textAlign: "center", flexShrink: 0,
                }}>
                  <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 1 }}>적중</div>
                  <div style={{
                    fontSize: T.md, fontWeight: T.bold, color: isTop ? C.goldL : C.t1,
                    fontFamily: T.mono,
                  }}>{exp.correct}/{exp.total}</div>
                </div>
                <div onClick={e => { e.stopPropagation(); setShowUnlock(true); }}
                  style={{
                    background: C.goldBg, border: `1px solid ${C.goldBd}`,
                    borderRadius: T.r_md, padding: "5px 9px", textAlign: "center", flexShrink: 0, cursor: "pointer",
                  }}>
                  <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 1 }}>오늘</div>
                  <BlindBox />
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => setShowUnlock(true)}
          style={{
            width: "100%", padding: "14px 0",
            background: C.gold,
            border: "none", borderRadius: T.r_md, color: "#000",
            fontSize: T.md, fontWeight: T.bold, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          <Unlock size={16} strokeWidth={2.2} />
          전문가 오늘 예측 열람
        </button>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={{ fontSize: T.xs, color: C.t3 }}>열람 수익은 우승 전문가에게 전액 지급됩니다</span>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};
