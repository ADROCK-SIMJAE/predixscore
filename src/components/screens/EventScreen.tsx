"use client";

import { useState } from "react";
import { Trophy, Award, Gem, Crown, Unlock, Calendar, Flame } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { useEvents } from "@/hooks/useEvents";
import { BRAND_LOGOS } from "@/lib/assets";
import { Badge } from "@/components/ui/Badge";
import { BackBar } from "@/components/ui/BackBar";
import { EventDetail } from "./EventDetail";
import type { EventItem } from "@/types";

interface EventScreenProps {
  onBack: () => void;
  push: (screen: string, data?: any) => void;
}

/* ── EventScreen ─────────────── */
export const EventScreen = ({ onBack, push }: EventScreenProps) => {
  const [selEvent, setSelEvent] = useState<EventItem | null>(null);
  const { data: events = [], isLoading } = useEvents();
  if (selEvent) return <EventDetail ev={selEvent} onBack={() => setSelEvent(null)} push={push} />;
  const isLive = (ev: EventItem) => ev.status === "live";
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, animation: "slideIn 0.28s" }}>
      <BackBar title="이벤트 배틀" onBack={onBack} dark />
      {/* 히어로 */}
      <div style={{
        margin: "12px 16px 0", background: "linear-gradient(135deg,#0D0520,#100B02)",
        borderRadius: T.r_xl, padding: "16px", border: `1px solid ${C.goldBd}`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Trophy size={14} color={C.gold} strokeWidth={2.2} />
          <span style={{ fontSize: T.xs, color: C.gold, fontWeight: T.semibold }}>이벤트 배틀</span>
        </div>
        <div style={{ fontFamily: T.display, fontSize: T.lg, fontWeight: T.bold, color: C.t1, marginBottom: 6, lineHeight: T.tight }}>
          전문가들의 매일 예측,<br /><span style={{ color: C.gold }}>우승자가 수익을 가져갑니다</span>
        </div>
        <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.relaxed }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Award size={12} color={C.gold} strokeWidth={2} />
            Proven · Seer 전문가가 매일 상승/하락 예측
          </div>
          <br />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Gem size={12} color={C.goldL} strokeWidth={2} />
            일반 사용자는 열람 비용 지불
          </div>
          <br />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Trophy size={12} color={C.gold} strokeWidth={2} />
            가장 많이 맞춘 전문가가 전체 수익 획득
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {isLoading && (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.t3, fontSize: T.sm }}>
            이벤트 불러오는 중…
          </div>
        )}
        {events.map((ev, i) => {
          const live = isLive(ev);
          const top = ev.experts.length > 0 ? ev.experts.reduce((a, b) => a.correct > b.correct ? a : b) : null;
          return (
            <div key={ev.id} onClick={() => live && setSelEvent(ev)}
              style={{
                background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_xl,
                overflow: "hidden", marginBottom: 12, cursor: live ? "pointer" : "default",
                transition: "all 0.18s", boxShadow: T.shadow_sm,
                animation: `fadeUp 0.35s ${i * 0.08}s both`,
              }}>
              <div style={{ padding: "13px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: T.r_lg, flexShrink: 0,
                    background: `${ev.brandColor}18`,
                    border: `1px solid ${ev.brandColor}40`,
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                  }}>
                    {ev.logo && BRAND_LOGOS[ev.logo as keyof typeof BRAND_LOGOS]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={BRAND_LOGOS[ev.logo as keyof typeof BRAND_LOGOS]} alt={ev.brand}
                          style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }} />
                      : <span style={{ fontSize: T.xl }}>{ev.icon}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontFamily: T.display, fontSize: T.md, fontWeight: T.bold, color: C.t1 }}>{ev.brand}</span>
                      <span style={{
                        background: C.goldBg, border: `1px solid ${C.goldBd}`, borderRadius: T.r_pill,
                        padding: "1px 8px", fontSize: T.xs, fontWeight: T.semibold, color: C.gold,
                      }}>{ev.duration}일 배틀</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%", background: live ? C.green : C.t3,
                        animation: live ? "pulse 1.5s infinite" : "none",
                      }} />
                      <span style={{ fontSize: T.xs, color: live ? C.green : C.t3, fontWeight: T.medium }}>{live ? "진행중" : "예정"}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: T.md, fontWeight: T.bold, color: live ? C.gold : C.t3,
                      fontFamily: T.mono,
                    }}>{ev.deadline}</div>
                    <div style={{ fontSize: T.xs, color: C.t3 }}>마감</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 7, marginBottom: live && top ? 11 : 0 }}>
                  <div style={{ flex: 1, background: C.bg2, borderRadius: T.r_md, padding: "9px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 3 }}>기간</div>
                    <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t1 }}>{ev.startDate.slice(5)} ~ {ev.endDate.slice(5)}</div>
                  </div>
                  <div style={{ flex: 1, background: C.bg2, borderRadius: T.r_md, padding: "9px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 3 }}>참여</div>
                    <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t1 }}>{ev.experts.length}명</div>
                  </div>
                  {live && <div style={{
                    flex: 1, background: C.goldBg, border: `1px solid ${C.goldBd}`, borderRadius: T.r_md,
                    padding: "9px 10px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 3 }}>수익풀</div>
                    <div style={{ fontSize: T.sm, fontWeight: T.bold, color: C.goldL, fontFamily: T.mono }}>
                      {(ev.prizePool / 10000).toFixed(0)}만P
                    </div>
                  </div>}
                </div>
                {live && top && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 9, marginTop: 11,
                    padding: "10px 12px", background: C.bg2, borderRadius: T.r_md, border: `1px solid ${C.bd}`,
                  }}>
                    <Crown size={16} color={C.goldL} strokeWidth={2.2} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 2 }}>현재 선두</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>{top.name}</span>
                        <Badge gk={top.gk} sm />
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: T.md, fontWeight: T.bold, color: C.green, fontFamily: T.mono }}>{top.correct}/{top.total}</div>
                      <div style={{ fontSize: T.xs, color: C.t3 }}>적중</div>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 11 }}>
                  <button style={{
                    width: "100%", padding: "11px 0",
                    background: live ? C.gold : C.bg2,
                    border: live ? "none" : `1px solid ${C.bd}`, borderRadius: T.r_md,
                    color: live ? "#000" : C.t3, fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    {live ? <><Unlock size={14} strokeWidth={2.2} /> 열람하고 선두 확인</> : <><Calendar size={14} strokeWidth={2} /> 오픈 예정</>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};
