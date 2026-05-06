"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Send, MessageCircle } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { useDMMessages, useSendMessage } from "@/hooks/useDMs";
import { useAuthStore } from "@/store/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { Conversation, GradeKey } from "@/types";

interface OtherProfile {
  id?: string;
  handle: string;
  grade: GradeKey;
  avatar_url?: string | null;
}

interface DMChatScreenProps {
  conv?: Conversation;
  conversationId?: number | null;
  otherProfile?: OtherProfile | null;
  onBack: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ── DMChatScreen ─────────────── */
export const DMChatScreen = ({
  conv,
  conversationId,
  otherProfile,
  onBack,
}: DMChatScreenProps) => {
  // legacy conv props 호환 — 실제 데이터는 conversationId 기반
  const partner: OtherProfile = otherProfile ?? {
    handle: conv?.name ?? "알 수 없음",
    grade: (conv?.gk ?? "candidate") as GradeKey,
  };
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { data: msgs = [], isLoading } = useDMMessages(conversationId ?? null);
  const sendMessage = useSendMessage();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView();
  }, [msgs.length]);

  const send = async () => {
    if (!input.trim() || !conversationId) return;
    setError(null);
    const content = input;
    setInput("");
    try {
      await sendMessage.mutateAsync({ conversationId, content });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "전송 실패";
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
        <Avatar name={partner.handle} size={32} gk={partner.grade} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: T.sm, fontWeight: T.bold, color: C.t1 }}>
              {partner.handle}
            </span>
            <Badge gk={partner.grade} sm />
          </div>
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
        {!conversationId && (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: C.t3,
              fontSize: T.sm,
            }}
          >
            대화를 불러올 수 없습니다.
          </div>
        )}
        {conversationId && isLoading && (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.t3, fontSize: T.sm }}>
            메시지를 불러오는 중…
          </div>
        )}
        {conversationId && !isLoading && msgs.length === 0 && (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: C.t3,
            }}
          >
            <MessageCircle size={36} color={C.t3} strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: T.sm, color: C.t2 }}>메시지를 시작해보세요</div>
          </div>
        )}
        {msgs.map((m) => {
          const isMe = m.sender_id === userId;
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: isMe ? "row-reverse" : "row",
                gap: 7,
              }}
            >
              {!isMe && <Avatar name={partner.handle} size={24} gk={partner.grade} />}
              <div style={{ maxWidth: "76%" }}>
                <div
                  style={{
                    background: isMe ? C.gold : C.bg1,
                    color: isMe ? "#000" : C.t1,
                    borderRadius: isMe
                      ? `${T.r_lg}px ${T.r_lg}px ${T.r_sm}px ${T.r_lg}px`
                      : `${T.r_lg}px ${T.r_lg}px ${T.r_lg}px ${T.r_sm}px`,
                    padding: "10px 13px",
                    fontSize: T.sm,
                    lineHeight: T.normal,
                    border: isMe ? "none" : `1px solid ${C.bd}`,
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
            placeholder={conversationId ? "메시지 입력..." : "대화를 먼저 선택하세요"}
            disabled={!conversationId || sendMessage.isPending}
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
          disabled={!conversationId || sendMessage.isPending}
          style={{
            width: 36,
            height: 36,
            borderRadius: T.r_pill,
            background: input.trim() && conversationId ? C.gold : C.bg2,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() && conversationId ? "pointer" : "default",
            color: input.trim() && conversationId ? "#000" : C.t3,
            transition: "all 0.18s",
          }}
        >
          {input.trim() ? <Send size={15} strokeWidth={2.2} /> : <MessageCircle size={15} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
};
