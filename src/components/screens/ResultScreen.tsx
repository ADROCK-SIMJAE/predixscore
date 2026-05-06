"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X as XIcon, Share2, Heart, Trash2 } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import {
  useComments,
  useAddComment,
  useDeleteComment,
  useToggleCommentLike,
  useMyCommentLikes,
} from "@/hooks/useComments";
import { useReactions, useMyReactions, useToggleReaction } from "@/hooks/useReactions";
import { getSupabase } from "@/lib/supabase/client";
import { mapPred } from "@/lib/supabase/mappers";
import { useAuthStore } from "@/store/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BackBar } from "@/components/ui/BackBar";
import type { Pred, GradeKey } from "@/types";

interface ResultScreenProps {
  pred?: Pred;
  predId?: number | null;
  onBack: () => void;
  push: (screen: string, data?: any) => void;
}

const REACTION_EMOJIS = ["🔥", "💎", "👑", "😱", "😂"];

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/* ── ResultScreen ─────────────── */
export const ResultScreen = ({ pred, predId, onBack }: ResultScreenProps) => {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const myProfile = useAuthStore((s) => s.profile);

  // pred 가 없으면 predId 로 fetch
  const { data: fetched } = useQuery({
    queryKey: ["predictions", "detail", predId ?? -1],
    enabled: !pred && !!predId,
    queryFn: async () => {
      if (!predId) return null;
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("id", predId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapPred(data) : null;
    },
  });

  const p = pred ?? fetched ?? null;
  const targetPredId = p?.id ?? null;

  const [reactionInput, setReactionInput] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: comments = [] } = useComments(targetPredId);
  const { data: reactionsAgg = [] } = useReactions(targetPredId);
  const { data: myReactions = new Set<string>() } = useMyReactions(targetPredId);
  const { data: myLikes = new Set<number>() } = useMyCommentLikes(targetPredId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const toggleLike = useToggleCommentLike();
  const toggleReaction = useToggleReaction();

  // 빈 화면 / 데이터 부족
  useEffect(() => {
    setReactionInput(null);
  }, [targetPredId]);

  if (!p) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        <BackBar title="결과 공개" onBack={onBack} dark />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.t3,
            fontSize: T.sm,
          }}
        >
          예측 정보를 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  const myPred = p.myPred;
  const iWon = myPred && p.result ? myPred === p.result : false;

  const submitComment = async () => {
    if (!input.trim() || !targetPredId) return;
    setError(null);
    try {
      await addComment.mutateAsync({ predId: targetPredId, content: input });
      setInput("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "등록 실패";
      setError(msg);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Predix Score: ${p.q}`;
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: "Predix Score",
          text,
          url,
        });
        return;
      }
    } catch {
      // 사용자 취소 또는 실패 시 fallback
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
      }
    } catch {
      // noop
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
      <BackBar
        title="결과 공개"
        onBack={onBack}
        dark
        right={
          <span
            style={{
              background: C.greenB,
              color: C.green,
              border: `1px solid ${C.green}30`,
              borderRadius: T.r_pill,
              padding: "2px 9px",
              fontSize: T.xs,
              fontWeight: T.semibold,
            }}
          >
            {p.result ? "결과 확정" : "결과 대기"}
          </span>
        }
      />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* 결과 배너 */}
        <div
          style={{
            background: iWon
              ? `linear-gradient(135deg,#052010,#0A2818)`
              : `linear-gradient(135deg,#150508,#1C0E10)`,
            padding: "24px 20px",
            borderBottom: `1px solid ${iWon ? C.green + "30" : C.red + "30"}`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: iWon ? C.greenB : C.redB,
                border: `2px solid ${iWon ? C.green : C.red}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "popIn 0.5s ease",
              }}
            >
              {iWon ? (
                <Check size={32} color={C.green} strokeWidth={2.5} />
              ) : (
                <XIcon size={32} color={C.red} strokeWidth={2.5} />
              )}
            </div>
          </div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div
              style={{
                fontFamily: T.display,
                fontSize: T.xl,
                fontWeight: T.bold,
                color: iWon ? C.green : C.red,
                marginBottom: 6,
              }}
            >
              {iWon ? "예측 성공" : "예측 실패"}
            </div>
            <div
              style={{
                fontSize: T.sm,
                color: iWon ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.75)",
                lineHeight: T.relaxed,
              }}
            >
              {iWon ? "기록이 남았습니다." : "다음에 다시 도전하세요."}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div
              style={{
                background: "rgba(0,0,0,0.4)",
                border: `1px solid ${iWon ? C.green : C.red}30`,
                borderRadius: T.r_md,
                padding: "10px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 4 }}>Predix Score</div>
              <div
                style={{
                  fontSize: T.xl,
                  fontWeight: T.bold,
                  color: iWon ? C.green : C.red,
                  fontFamily: T.mono,
                }}
              >
                {iWon ? "+2.4" : "-1.2"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { s: "A", l: p.A, e: p.eA, r: p.aR ?? 0 },
              { s: "B", l: p.B, e: p.eB, r: p.bR ?? 0 },
            ].map((o) => {
              const isAnswer = p.result === o.s;
              return (
                <div
                  key={o.s}
                  style={{
                    flex: o.r || 1,
                    background: isAnswer ? C.goldBg : "rgba(255,255,255,0.04)",
                    borderRadius: T.r_md,
                    padding: "11px 8px",
                    textAlign: "center",
                    border: isAnswer ? `1px solid ${C.gold}50` : `1px solid ${C.bd}`,
                  }}
                >
                  <div style={{ fontSize: T.xl, marginBottom: 4 }}>{o.e}</div>
                  <div
                    style={{
                      fontSize: T.sm,
                      fontWeight: T.semibold,
                      color: isAnswer ? C.goldL : C.t2,
                    }}
                  >
                    {o.l}
                  </div>
                  <div style={{ fontSize: T.xs, color: C.t3, marginTop: 2 }}>{o.r}%</div>
                  {isAnswer && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        marginTop: 4,
                        color: C.green,
                      }}
                    >
                      <Check size={10} strokeWidth={2.5} />
                      <span style={{ fontSize: T.xs, fontWeight: T.semibold }}>정답</span>
                    </div>
                  )}
                  {myPred === o.s && (
                    <div
                      style={{
                        fontSize: T.xs,
                        color: C.gold,
                        fontWeight: T.semibold,
                        marginTop: 2,
                      }}
                    >
                      내 예측
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 통계 */}
        <div
          style={{
            margin: "14px 16px 0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          {[
            { l: "총 참여자", v: `${(p.totalP || p.p).toLocaleString()}명`, c: C.t1 },
            { l: "성공", v: p.successP ? `${p.successP.toLocaleString()}명` : "—", c: C.green },
            { l: "실패", v: p.failP ? `${p.failP.toLocaleString()}명` : "—", c: C.red },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: C.bg1,
                borderRadius: T.r_md,
                padding: "11px 8px",
                textAlign: "center",
                border: `1px solid ${C.bd}`,
              }}
            >
              <div
                style={{
                  fontSize: T.sm,
                  fontWeight: T.bold,
                  color: s.c,
                  fontFamily: T.mono,
                }}
              >
                {s.v}
              </div>
              <div style={{ fontSize: T.xs, color: C.t3, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* 공유/다음 버튼 */}
        <div style={{ margin: "14px 16px 0", display: "flex", gap: 8 }}>
          <button
            onClick={handleShare}
            style={{
              flex: 1,
              padding: "12px 0",
              background: C.bg2,
              border: `1px solid ${C.bd}`,
              borderRadius: T.r_md,
              color: C.t2,
              fontSize: T.sm,
              fontWeight: T.semibold,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Share2 size={14} strokeWidth={2} />
            공유
          </button>
          <button
            onClick={onBack}
            style={{
              flex: 2,
              padding: "12px 0",
              background: C.gold,
              border: "none",
              borderRadius: T.r_md,
              color: "#000",
              fontSize: T.sm,
              fontWeight: T.bold,
              cursor: "pointer",
            }}
          >
            다음 예측 보기
          </button>
        </div>

        {/* 반응 */}
        <div
          style={{
            margin: "16px 16px 0",
            background: C.bg1,
            border: `1px solid ${C.bd}`,
            borderRadius: T.r_lg,
            padding: "13px 14px",
          }}
        >
          <div
            style={{
              fontSize: T.sm,
              fontWeight: T.semibold,
              color: C.t2,
              marginBottom: 10,
            }}
          >
            반응 남기기
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {REACTION_EMOJIS.map((r) => {
              const myActive = myReactions.has(r);
              const count = reactionsAgg.find((x) => x.emoji === r)?.count ?? 0;
              return (
                <button
                  key={r}
                  onClick={() => {
                    setReactionInput(r);
                    if (targetPredId)
                      toggleReaction.mutate({ predId: targetPredId, emoji: r });
                  }}
                  style={{
                    minWidth: 56,
                    height: 44,
                    padding: "0 10px",
                    borderRadius: T.r_md,
                    background: myActive ? C.goldBg : C.bg2,
                    border: `1px solid ${myActive ? C.gold : C.bd}`,
                    fontSize: T.lg,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <span>{r}</span>
                  {count > 0 && (
                    <span
                      style={{
                        fontSize: T.xs,
                        color: myActive ? C.goldL : C.t2,
                        fontFamily: T.mono,
                        fontWeight: T.semibold,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {reactionInput && (
            <div style={{ fontSize: T.xs, color: C.t3, marginTop: 8 }}>
              내 반응: {Array.from(myReactions).join(" ") || "없음"}
            </div>
          )}
        </div>

        {/* 댓글 */}
        <div style={{ margin: "16px 16px 0" }}>
          <div
            style={{
              fontFamily: T.display,
              fontSize: T.md,
              fontWeight: T.bold,
              marginBottom: 10,
              color: C.t1,
            }}
          >
            댓글 {comments.length}
          </div>
          <div
            style={{
              background: C.bg1,
              border: `1px solid ${C.bd}`,
              borderRadius: T.r_md,
              padding: "9px 12px",
              marginBottom: 10,
              display: "flex",
              gap: 9,
              alignItems: "center",
            }}
          >
            <Avatar
              name={myProfile?.handle ?? "나"}
              size={26}
              gk={(myProfile?.grade ?? "candidate") as GradeKey}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="결과에 대한 생각을 남겨보세요"
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontSize: T.sm,
                color: C.t1,
                fontFamily: T.sans,
              }}
            />
            <button
              onClick={submitComment}
              disabled={addComment.isPending}
              style={{
                padding: "5px 12px",
                background: input.trim() ? C.gold : C.bg2,
                border: `1px solid ${input.trim() ? C.gold : C.bd}`,
                borderRadius: T.r_md,
                color: input.trim() ? "#000" : C.t3,
                fontSize: T.xs,
                fontWeight: T.bold,
                cursor: input.trim() ? "pointer" : "default",
              }}
            >
              {addComment.isPending ? "…" : "등록"}
            </button>
          </div>
          {error && (
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
              {error}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {comments.length === 0 && (
              <div
                style={{
                  padding: "20px 0",
                  textAlign: "center",
                  color: C.t3,
                  fontSize: T.sm,
                }}
              >
                첫 댓글을 남겨보세요.
              </div>
            )}
            {comments.map((cm2) => {
              const liked = myLikes.has(cm2.id);
              const isMine = cm2.user_id === userId;
              const handle = cm2.profile?.handle ?? "사용자";
              const grade = (cm2.profile?.grade ?? "candidate") as GradeKey;
              return (
                <div
                  key={cm2.id}
                  style={{
                    background: C.bg1,
                    border: `1px solid ${C.bd}`,
                    borderRadius: T.r_md,
                    padding: "11px 13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 7,
                      alignItems: "center",
                    }}
                  >
                    <Avatar name={handle} size={24} gk={grade} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: T.sm,
                            fontWeight: T.semibold,
                            color: C.t1,
                          }}
                        >
                          {handle}
                        </span>
                        {grade && grade !== "candidate" && <Badge gk={grade} sm />}
                      </div>
                      <div style={{ fontSize: T.xs, color: C.t3, marginTop: 1 }}>
                        {formatRelative(cm2.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        targetPredId &&
                        toggleLike.mutate({ commentId: cm2.id, predId: targetPredId })
                      }
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: liked ? C.red : C.t3,
                        padding: 0,
                      }}
                    >
                      <Heart
                        size={11}
                        strokeWidth={1.8}
                        fill={liked ? C.red : "transparent"}
                      />
                      {cm2.likes > 0 && <span style={{ fontSize: T.xs }}>{cm2.likes}</span>}
                    </button>
                    {isMine && (
                      <button
                        onClick={() =>
                          targetPredId &&
                          deleteComment.mutate({ commentId: cm2.id, predId: targetPredId })
                        }
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: C.t3,
                          padding: 0,
                          marginLeft: 6,
                        }}
                      >
                        <Trash2 size={12} strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: T.sm,
                      color: C.t2,
                      lineHeight: T.normal,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {cm2.content}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};
