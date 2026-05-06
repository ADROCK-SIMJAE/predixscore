"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Send, MessageCircle } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { Conversation } from "@/types";

interface DMChatScreenProps {
  conv?: Conversation;
  onBack: () => void;
}

interface DMMessage {
  id: number;
  from: "expert" | "me";
  msg: string;
  time: string;
}

/* ── DMChatScreen ─────────────── */
export const DMChatScreen = ({ conv, onBack }: DMChatScreenProps) => {
  const c: Conversation = conv || { name: "VisionKing", gk: "seer", online: true };
  const [msgs, setMsgs] = useState<DMMessage[]>([
    { id: 1, from: "expert", msg: "안녕하세요! 최근 비트코인 포지션 어떻게 보시나요?", time: "09:14" },
    { id: 2, from: "me",     msg: "10만 달러 돌파 예상해서 매수 포지션 잡았어요.",      time: "09:16" },
    { id: 3, from: "expert", msg: "저도 같은 판단입니다. 기관 수요가 받쳐주고 있거든요.", time: "09:18" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView(); }, [msgs]);
  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { id: m.length + 1, from: "me", msg: input, time: "지금" }]);
    setInput("");
  };
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, animation: "slideIn 0.28s" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
        background: C.bg1, borderBottom: `1px solid ${C.bd}`, flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          width: 32, height: 32, borderRadius: T.r_pill, background: C.bg2,
          border: `1px solid ${C.bd}`, display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", color: C.t1,
        }}>
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <Avatar name={c.name} size={32} gk={c.gk} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: T.sm, fontWeight: T.bold, color: C.t1 }}>{c.name}</span>
            <Badge gk={c.gk} sm />
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
            <span style={{ fontSize: T.xs, color: C.green }}>온라인</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map(m => {
          const isMe = m.from === "me";
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 7 }}>
              {!isMe && <Avatar name={c.name} size={24} gk={c.gk} />}
              <div style={{ maxWidth: "76%" }}>
                <div style={{
                  background: isMe ? C.gold : C.bg1,
                  color: isMe ? "#000" : C.t1,
                  borderRadius: isMe ? `${T.r_lg}px ${T.r_lg}px ${T.r_sm}px ${T.r_lg}px` : `${T.r_lg}px ${T.r_lg}px ${T.r_lg}px ${T.r_sm}px`,
                  padding: "10px 13px", fontSize: T.sm, lineHeight: T.normal,
                  border: isMe ? "none" : `1px solid ${C.bd}`,
                }}>{m.msg}</div>
                <div style={{ fontSize: T.xs, color: C.t3, marginTop: 3, textAlign: isMe ? "right" : "left" }}>{m.time}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div style={{
        padding: "8px 14px calc(28px + env(safe-area-inset-bottom))", background: C.bg1, borderTop: `1px solid ${C.bd}`,
        display: "flex", gap: 8, alignItems: "center",
      }}>
        <div style={{
          flex: 1, background: C.bg2, borderRadius: T.r_pill, border: `1px solid ${C.bd}`,
          display: "flex", alignItems: "center", paddingRight: 8,
        }}>
          <input value={input} onChange={ev => setInput(ev.target.value)}
            onKeyDown={ev => ev.key === "Enter" && send()}
            placeholder="메시지 입력..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              padding: "10px 14px", fontSize: T.sm, color: C.t1,
              fontFamily: T.sans,
            }} />
        </div>
        <button onClick={send}
          style={{
            width: 36, height: 36, borderRadius: T.r_pill,
            background: input.trim() ? C.gold : C.bg2,
            border: "none", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: input.trim() ? "#000" : C.t3, transition: "all 0.18s",
          }}>
          {input.trim() ? <Send size={15} strokeWidth={2.2} /> : <MessageCircle size={15} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
};
