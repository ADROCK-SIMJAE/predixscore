"use client";

import { useState } from "react";
import { ChevronLeft, Mail, MessageCircle, Check, Circle as CircleIcon } from "lucide-react";
import { C } from "@/lib/tokens";
import { Gd } from "@/lib/grades";
import { Cm } from "@/lib/categories";
import { T } from "@/lib/typography";
import { useExpert, useExpertByName } from "@/hooks/useExperts";
import { useIsSubscribed, useToggleSubscription } from "@/hooks/useSubscriptions";
import { usePreds } from "@/hooks/usePreds";
import { useStartConversation } from "@/hooks/useDMs";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SealBadge } from "@/components/ui/SealBadge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import type { Expert } from "@/types";

interface ExpertWithId extends Expert {
  id: number;
}

interface ExpertScreenProps {
  expert?: Expert | ExpertWithId;
  expertId?: number | null;
  expertName?: string | null;
  onBack: () => void;
  push: (screen: string, data?: any) => void;
  loggedIn?: boolean;
  onAuth?: () => void;
}

/* ── ExpertScreen ─────────────── */
export const ExpertScreen = ({
  expert,
  expertId,
  expertName,
  onBack,
  push,
  loggedIn,
  onAuth,
}: ExpertScreenProps) => {
  const [tab, setTab] = useState<"history" | "certs" | "graph" | "rationale">("history");
  const [dmError, setDmError] = useState<string | null>(null);

  // 1. props 로 expert 가 들어왔으면 그것을 우선 사용
  // 2. expertId 가 있으면 useExpert
  // 3. expertName 이 있으면 useExpertByName
  const propExpertId = (expert as ExpertWithId | undefined)?.id ?? null;
  const byId = useExpert(propExpertId ? null : expertId ?? null);
  const byName = useExpertByName(!propExpertId && !expertId ? expertName ?? null : null);

  const e: ExpertWithId | Expert | null =
    (expert as ExpertWithId | undefined) ?? byId.data ?? byName.data ?? null;
  const resolvedId =
    (e as ExpertWithId | null)?.id ?? propExpertId ?? expertId ?? byId.data?.id ?? byName.data?.id ?? null;

  const { data: catPreds = [] } = usePreds(e?.cat);
  const isSubscribedQ = useIsSubscribed(resolvedId);
  const toggleSub = useToggleSubscription();
  const startConv = useStartConversation();

  // 데이터 로딩 / 빈 상태
  if (!e) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ fontSize: T.sm, color: C.t3, marginBottom: 16 }}>
          전문가 정보를 불러올 수 없습니다.
        </div>
        <button
          onClick={onBack}
          style={{
            padding: "10px 20px",
            background: C.bg2,
            border: `1px solid ${C.bd}`,
            borderRadius: T.r_md,
            color: C.t1,
            fontSize: T.sm,
            cursor: "pointer",
          }}
        >
          뒤로
        </button>
      </div>
    );
  }

  const g = Gd(e.gk);
  const cm = Cm(e.cat);
  const maxV = Math.max(...((e.qScores || []).map((s) => s.v).concat([1])));
  const isSubscribed = !!isSubscribedQ.data;

  const handleSubscribeToggle = () => {
    if (!loggedIn) {
      onAuth?.();
      return;
    }
    if (!resolvedId) return;
    toggleSub.mutate(resolvedId);
  };

  const handleDM = async () => {
    if (!loggedIn) {
      onAuth?.();
      return;
    }
    const profileId = (e as Expert & { profileId?: string | null }).profileId ?? null;
    if (!profileId) {
      setDmError("이 전문가는 아직 DM 연동이 되어있지 않습니다.");
      setTimeout(() => setDmError(null), 2500);
      return;
    }
    try {
      const conversationId = await startConv.mutateAsync(profileId);
      push("dm_chat", {
        conversationId,
        otherProfile: {
          id: profileId,
          handle: e.name,
          grade: e.gk,
          avatar_url: null,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "DM 시작 실패";
      setDmError(msg);
      setTimeout(() => setDmError(null), 3000);
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        animation: "slideIn 0.28s",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* 히어로 */}
        <div
          style={{
            background:
              e.gk === "seer"
                ? `linear-gradient(135deg,${C.seerBg},#100620)`
                : `linear-gradient(135deg,${C.goldBg},#100B02)`,
            position: "relative",
            padding: "0 16px 18px",
            borderBottom: `1px solid ${g.color}25`,
          }}
        >
          {/* 상단 버튼 바 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 10,
              marginBottom: 16,
            }}
          >
            <button
              onClick={onBack}
              style={{
                width: 32,
                height: 32,
                borderRadius: T.r_pill,
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: C.t1,
              }}
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <Badge gk={e.gk} quarter="2026 Q2" />
            <button
              onClick={handleDM}
              disabled={startConv.isPending}
              style={{
                width: 32,
                height: 32,
                borderRadius: T.r_pill,
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: C.gold,
              }}
            >
              <Mail size={15} strokeWidth={2} />
            </button>
          </div>
          {/* 아바타 + 이름 */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar name={e.name} size={56} gk={e.gk} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: T.display,
                  fontSize: T.xl,
                  fontWeight: T.bold,
                  color: C.t1,
                  marginBottom: 6,
                }}
              >
                {e.name}
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <span
                  style={{
                    background: cm.bg,
                    color: cm.c,
                    border: `1px solid ${cm.c}30`,
                    borderRadius: T.r_pill,
                    padding: "2px 9px",
                    fontSize: T.xs,
                    fontWeight: T.semibold,
                  }}
                >
                  {e.cat}
                </span>
                <span
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: T.r_pill,
                    padding: "2px 9px",
                    fontSize: T.xs,
                    fontWeight: T.semibold,
                  }}
                >
                  #{e.rank}위
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DM 에러 토스트 */}
        {dmError && (
          <div
            style={{
              margin: "10px 16px 0",
              padding: "9px 12px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: T.r_md,
              fontSize: T.sm,
              color: C.red,
            }}
          >
            {dmError}
          </div>
        )}

        {/* 프로필 카드 */}
        <div
          style={{
            margin: "12px 16px",
            background: C.bg1,
            borderRadius: T.r_xl,
            padding: "14px 15px",
            border: `1px solid ${C.bd}`,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.relaxed, marginBottom: 12 }}>
            {e.bio}
          </div>
          {e.badges && e.badges.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
              {e.badges.map((b, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: C.goldBg,
                    border: `1px solid ${C.goldBd}`,
                    borderRadius: T.r_pill,
                    padding: "3px 10px",
                    fontSize: T.xs,
                    fontWeight: T.semibold,
                    color: C.gold,
                  }}
                >
                  <SealBadge size={12} gk={e.gk} /> {b}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => push("chatroom", { expert: e, expertId: resolvedId })}
              style={{
                flex: 1,
                padding: "10px 0",
                background: C.bg2,
                border: `1px solid ${C.bd}`,
                borderRadius: T.r_md,
                color: C.t1,
                fontSize: T.sm,
                fontWeight: T.semibold,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <MessageCircle size={14} strokeWidth={2} />
              채팅방
            </button>
            <button
              onClick={handleSubscribeToggle}
              disabled={toggleSub.isPending}
              style={{
                flex: 2,
                padding: "10px 0",
                background: isSubscribed
                  ? C.bg2
                  : e.gk === "seer"
                  ? C.seer
                  : C.gold,
                border: isSubscribed ? `1px solid ${C.bd}` : "none",
                borderRadius: T.r_md,
                color: isSubscribed ? C.t2 : e.gk === "seer" ? "#fff" : "#000",
                fontSize: T.sm,
                fontWeight: T.bold,
                cursor: toggleSub.isPending ? "default" : "pointer",
                opacity: toggleSub.isPending ? 0.7 : 1,
              }}
            >
              {toggleSub.isPending
                ? "처리 중…"
                : isSubscribed
                ? "구독 중 · 해지"
                : "구독하기"}
            </button>
          </div>
        </div>
        {/* 핵심 지표 */}
        <div
          style={{
            margin: "0 16px 12px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <div
            style={{
              background: C.bg1,
              border: `1px solid ${C.bd}`,
              borderRadius: T.r_lg,
              padding: "12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <ScoreGauge score={e.score} />
            <div>
              <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 4 }}>Predix Score</div>
              <div style={{ fontSize: T.xs, color: C.t2 }}>
                적중{" "}
                <span style={{ color: C.green, fontWeight: T.semibold }}>{e.acc}%</span>
              </div>
              <div style={{ fontSize: T.xs, color: C.t2 }}>
                총 <span style={{ fontFamily: T.mono }}>{e.preds}회</span>
              </div>
            </div>
          </div>
          <div
            style={{
              background: C.bg1,
              border: `1px solid ${C.bd}`,
              borderRadius: T.r_lg,
              padding: "12px",
            }}
          >
            <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 8 }}>구독자</div>
            <div
              style={{
                fontSize: T.xxl,
                fontWeight: T.bold,
                color: C.gold,
                fontFamily: T.mono,
                marginBottom: 2,
              }}
            >
              {e.subs.toLocaleString()}
            </div>
            <div style={{ fontSize: T.xs, color: C.t3 }}>명</div>
            {g.canPublish && (
              <div
                style={{
                  marginTop: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  color: C.green,
                }}
              >
                <Check size={11} strokeWidth={2.5} />
                <span style={{ fontSize: T.xs, fontWeight: T.medium }}>발행 권한</span>
              </div>
            )}
          </div>
        </div>
        {/* 탭 */}
        <div
          style={{
            display: "flex",
            gap: 0,
            margin: "0 16px 12px",
            background: C.bg1,
            borderRadius: T.r_md,
            padding: 3,
            border: `1px solid ${C.bd}`,
          }}
        >
          {(
            [
              ["history", "기록"],
              ["certs", "인증"],
              ["graph", "그래프"],
              ["rationale", "사유"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                padding: "8px 0",
                background: tab === id ? C.gold : "transparent",
                border: "none",
                borderRadius: T.r_sm,
                color: tab === id ? "#000" : C.t3,
                fontSize: T.sm,
                fontWeight: T.semibold,
                cursor: "pointer",
                transition: "all 0.18s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ padding: "0 16px" }}>
          {tab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {catPreds.length === 0 && (
                <div
                  style={{
                    padding: "30px 0",
                    textAlign: "center",
                    color: C.t3,
                    fontSize: T.sm,
                  }}
                >
                  최근 예측이 없습니다.
                </div>
              )}
              {catPreds.slice(0, 4).map((p) => {
                const pm = Cm(p.cat);
                return (
                  <div
                    key={p.id}
                    style={{
                      background: C.bg1,
                      border: `1px solid ${C.bd}`,
                      borderRadius: T.r_lg,
                      padding: "11px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: T.r_md,
                        background: p.stage === "done" ? C.goldBg : C.bg2,
                        border: `1px solid ${p.stage === "done" ? C.gold : C.bd}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {p.stage === "done" ? (
                        <Check size={13} color={C.goldL} strokeWidth={2.5} />
                      ) : (
                        <CircleIcon size={11} color={C.t3} strokeWidth={2} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: T.sm,
                          fontWeight: T.medium,
                          color: C.t1,
                          marginBottom: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.q}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span
                          style={{
                            background: pm.bg,
                            color: pm.c,
                            border: `1px solid ${pm.c}30`,
                            borderRadius: T.r_pill,
                            padding: "1px 7px",
                            fontSize: T.xs,
                            fontWeight: T.semibold,
                          }}
                        >
                          {p.cat}
                        </span>
                        <span style={{ fontSize: T.xs, color: C.t3 }}>{p.dl}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {tab === "certs" && (
            <div>
              <div
                style={{
                  fontSize: T.sm,
                  color: C.t2,
                  lineHeight: T.normal,
                  marginBottom: 12,
                  padding: "10px 12px",
                  background: C.goldBg,
                  border: `1px solid ${C.goldBd}`,
                  borderRadius: T.r_md,
                }}
              >
                인증은 분기마다 누적됩니다.
              </div>
              {(e.certs || []).length === 0 && (
                <div
                  style={{
                    padding: "30px 0",
                    textAlign: "center",
                    color: C.t3,
                    fontSize: T.sm,
                  }}
                >
                  아직 인증 이력이 없습니다.
                </div>
              )}
              {(e.certs || []).map((cert, i) => {
                const cg = Gd(cert.gk);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 11,
                      alignItems: "center",
                      padding: "11px 13px",
                      background: C.bg1,
                      border: `1px solid ${C.bd}`,
                      borderRadius: T.r_md,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: T.r_md,
                        background: cg.bg,
                        border: `1px solid ${cg.bd}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: cg.color,
                        flexShrink: 0,
                        fontSize: T.sm,
                        fontWeight: T.bold,
                        fontFamily: T.mono,
                      }}
                    >
                      {cg.label[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>
                        {cert.q}
                      </div>
                      <div style={{ fontSize: T.xs, color: C.t3, marginTop: 2 }}>
                        {cg.label} 인증
                      </div>
                    </div>
                    <div style={{ fontSize: T.xs, color: C.green, fontWeight: T.semibold }}>
                      #{i + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {tab === "graph" && (
            <div>
              <div
                style={{
                  background: C.bg1,
                  border: `1px solid ${C.bd}`,
                  borderRadius: T.r_lg,
                  padding: "12px 14px",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: T.sm,
                    fontWeight: T.semibold,
                    color: C.t2,
                    marginBottom: 8,
                  }}
                >
                  분기별 예측력
                </div>
                <div style={{ position: "relative", height: 90 }}>
                  {[60, 70, 80, 90].map((v) => (
                    <div
                      key={v}
                      style={{
                        position: "absolute",
                        left: 24,
                        right: 0,
                        top: `${Math.round(100 - (v / maxV) * 90)}%`,
                        borderTop: `1px dashed ${C.bd}`,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: T.xs,
                          color: C.t3,
                          background: C.bg1,
                          paddingRight: 2,
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 4,
                      paddingLeft: 24,
                    }}
                  >
                    {(e.qScores || []).map((s, i) => {
                      const h = Math.round((s.v / maxV) * 80);
                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <span
                            style={{
                              fontSize: T.xs,
                              color: C.goldL,
                              fontWeight: T.semibold,
                              fontFamily: T.mono,
                            }}
                          >
                            {s.v}
                          </span>
                          <div
                            style={{
                              width: "100%",
                              height: `${h}px`,
                              background: C.gold,
                              borderRadius: `${T.r_sm}px ${T.r_sm}px 0 0`,
                            }}
                          />
                          <span
                            style={{
                              fontSize: T.xs,
                              color: C.t3,
                              fontFamily: T.mono,
                            }}
                          >
                            {s.q}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: C.bg1,
                  border: `1px solid ${C.bd}`,
                  borderRadius: T.r_lg,
                  padding: "12px 14px",
                }}
              >
                {[
                  { l: "분기 평균 적중률", v: e.acc + "%", c: C.green },
                  { l: "Predix Score", v: String(e.score), c: C.gold },
                  { l: "인증 누적", v: `${(e.certs || []).length}회`, c: C.goldL },
                  { l: "총 예측", v: `${e.preds}회`, c: C.t2 },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "9px 0",
                      borderBottom: i < 3 ? `1px solid ${C.bd}` : "none",
                    }}
                  >
                    <span style={{ fontSize: T.sm, color: C.t2 }}>{s.l}</span>
                    <span
                      style={{
                        fontSize: T.sm,
                        fontWeight: T.semibold,
                        color: s.c,
                        fontFamily: T.mono,
                      }}
                    >
                      {s.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "rationale" && (
            <div
              style={{
                background: C.bg1,
                border: `1px solid ${C.bd}`,
                borderRadius: T.r_xl,
                padding: 24,
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <SealBadge size={52} gk={e.gk} />
              </div>
              <div
                style={{
                  fontFamily: T.display,
                  fontSize: T.lg,
                  fontWeight: T.bold,
                  color: C.t1,
                  marginBottom: 8,
                }}
              >
                구독자 전용
              </div>
              <div
                style={{
                  fontSize: T.sm,
                  color: C.t2,
                  lineHeight: T.relaxed,
                  marginBottom: 18,
                }}
              >
                {e.name}의 예측 근거와 상세 분석은
                <br />
                구독자에게만 공개됩니다.
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[
                  { t: "단건", p: "300P", c: C.gold },
                  { t: "구독", p: "월 구독", c: C.seerL },
                ].map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: C.bg2,
                      border: `1px solid ${C.bd}`,
                      borderRadius: T.r_md,
                      padding: "11px 6px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: T.xs,
                        fontWeight: T.semibold,
                        color: opt.c,
                        marginBottom: 2,
                      }}
                    >
                      {opt.t}
                    </div>
                    <div
                      style={{
                        fontSize: T.md,
                        fontWeight: T.bold,
                        color: opt.c,
                        fontFamily: T.mono,
                      }}
                    >
                      {opt.p}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubscribeToggle}
                disabled={toggleSub.isPending}
                style={{
                  width: "100%",
                  background: isSubscribed
                    ? C.bg2
                    : e.gk === "seer"
                    ? C.seer
                    : C.gold,
                  border: isSubscribed ? `1px solid ${C.bd}` : "none",
                  borderRadius: T.r_md,
                  color: isSubscribed ? C.t2 : e.gk === "seer" ? "#fff" : "#000",
                  fontSize: T.sm,
                  fontWeight: T.bold,
                  padding: 13,
                  cursor: toggleSub.isPending ? "default" : "pointer",
                  opacity: toggleSub.isPending ? 0.7 : 1,
                }}
              >
                {isSubscribed ? "구독 중 · 해지" : "구독하고 전체 보기"}
              </button>
            </div>
          )}
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};
