"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Send, MessageCircle } from "lucide-react";
import { C } from "@/lib/tokens";
import { Gd } from "@/lib/grades";
import { T } from "@/lib/typography";
import { useChatroomMessages, useSendChatroomMessage } from "@/hooks/useChatroom";
import { useExpertByName } from "@/hooks/useExperts";
import { useAuthStore } from "@/store/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { Expert, GradeKey } from "@/types";

interface ChatroomScreenProps {
  expert?: Expert & { id?: number };
  expertId?: number | null;
  onBack: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ── ChatroomScreen ─────────────── */
export const ChatroomScreen = ({ expert, expertId, onBack }: ChatroomScreenProps) => {
  // expert.id 가 있으면 그것 사용, 없으면 expertId, 없으면 expert.name 으로 lookup
  const propId = expert?.id ?? expertId ?? null;
  const { data: byName } = useExpertByName(!propId ? expert?.name ?? null : null);
  const resolvedId = propId ?? byName?.id ?? null;

  // expert 표시 정보 (UI 용 fallback)
  const e: Expert = expert ?? byName ?? {
    rank: 0,
    name: "전문가",
    gk: "candidate" as GradeKey,
    score: 0,
    acc: "0",
    preds: 0,
    subs: 0,
    cat: "",
    bio: "",
    badges: [],
    certs: [],
    qScores: [],
  };

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { data: msgs = [], isLoading } = useChatroomMessages(resolvedId);
  const sendMsg = useSendChatroomMessage();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const g = Gd(e.gk);

  const send = async () => {
    if (!input.trim() || !resolvedId) return;
    setError(null);
    const content = input;
    setInput("");
    try {
      await sendMsg.mutateAsync({ expertId: resolvedId, content });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "전송 실패";
      setError(msg);
      setInput(content);
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          background: C.bg1,
          borderBottom: `1px solid ${C.bd}`,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: 32,
            height: 32,
            borderRadius: T.r_pill,
            background: C.bg2,
            border: `1px solid ${C.bd}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: C.t1,
          }}
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <div style={{ position: "relative" }}>
          <Avatar name={e.name} size={32} gk={e.gk} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: T.sm, fontWeight: T.bold, color: C.t1 }}>{e.name}</span>
            <Badge gk={e.gk} sm />
          </div>
          <div style={{ fontSize: T.xs, color: C.t3 }}>
            구독자 {e.subs.toLocaleString()}명 전용
          </div>
        </div>
      </div>
      <div
        style={{
          padding: "5px 16px 5px",
          background: g.bg,
          borderBottom: `1px solid ${g.bd}`,
        }}
      >
        <div style={{ fontSize: T.xs, color: g.color, fontWeight: T.semibold }}>
          {g.label} 전용 채팅방
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {!resolvedId && (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: C.t3,
              fontSize: T.sm,
            }}
          >
            전문가 정보를 불러올 수 없습니다.
          </div>
        )}
        {resolvedId && isLoading && (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.t3, fontSize: T.sm }}>
            채팅방 메시지를 불러오는 중…
          </div>
        )}
        {resolvedId && !isLoading && msgs.length === 0 && (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: C.t3,
            }}
          >
            <MessageCircle size={36} color={C.t3} strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: T.sm, color: C.t2 }}>아직 채팅이 없습니다</div>
            <div style={{ fontSize: T.xs, color: C.t3, marginTop: 4 }}>
              첫 번째 메시지를 남겨보세요.
            </div>
          </div>
        )}
        {msgs.map((m) => {
          const isMe = m.user_id === userId;
          const isHost = !!expert && m.user_id && expert.name && m.profile?.handle === expert.name;
          const handle = m.profile?.handle ?? (isMe ? "나" : "사용자");
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                gap: 7,
                flexDirection: isMe ? "row-reverse" : "row",
              }}
            >
              {!isMe && (
                <Avatar
                  name={handle[0] ?? "?"}
                  size={26}
                  gk={(m.profile?.grade ?? (isHost ? e.gk : "candidate")) as GradeKey}
                />
              )}
              <div style={{ maxWidth: "74%" }}>
                {!isMe && (
                  <div
                    style={{
                      fontSize: T.xs,
                      fontWeight: T.semibold,
                      color: isHost ? g.color : C.t2,
                      marginBottom: 4,
                      display: "flex",
                      gap: 5,
                      alignItems: "center",
                    }}
                  >
                    {handle}
                    {isHost && <Badge gk={e.gk} sm />}
                  </div>
                )}
                <div
                  style={{
                    background: isMe ? C.gold : isHost ? g.bg : C.bg1,
                    color: isMe ? "#000" : C.t1,
                    borderRadius: isMe
                      ? `${T.r_lg}px ${T.r_lg}px ${T.r_sm}px ${T.r_lg}px`
                      : `${T.r_lg}px ${T.r_lg}px ${T.r_lg}px ${T.r_sm}px`,
                    padding: "10px 13px",
                    fontSize: T.sm,
                    lineHeight: T.normal,
                    border: isMe ? "none" : `1px solid ${isHost ? g.bd : C.bd}`,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                </div>
                <div
                  style={{
                    fontSize: T.xs,
                    color: C.t3,
                    marginTop: 3,
                    textAlign: isMe ? "right" : "left",
                  }}
                >
                  {formatTime(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {error && (
        <div
          style={{
            padding: "8px 14px",
            background: "rgba(239,68,68,0.08)",
            color: C.red,
            fontSize: T.xs,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
      <div
        style={{
          padding: "8px 14px calc(28px + env(safe-area-inset-bottom))",
          background: C.bg1,
          borderTop: `1px solid ${C.bd}`,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            background: C.bg2,
            borderRadius: T.r_pill,
            border: `1px solid ${C.bd}`,
            display: "flex",
            alignItems: "center",
            paddingRight: 8,
          }}
        >
          <input
            value={input}
            onChange={(ev) => setInput(ev.target.value)}
            onKeyDown={(ev) => ev.key === "Enter" && send()}
            placeholder="메시지 입력..."
            disabled={!resolvedId || sendMsg.isPending}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              padding: "10px 14px",
              fontSize: T.sm,
              color: C.t1,
              fontFamily: T.sans,
            }}
          />
        </div>
        <button
          onClick={send}
          disabled={!resolvedId || sendMsg.isPending}
          style={{
            width: 36,
            height: 36,
            borderRadius: T.r_pill,
            background: input.trim() && resolvedId ? C.gold : C.bg2,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() && resolvedId ? "pointer" : "default",
            color: input.trim() && resolvedId ? "#000" : C.t3,
            transition: "all 0.18s",
          }}
        >
          {input.trim() ? <Send size={15} strokeWidth={2.2} /> : <MessageCircle size={15} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
};
