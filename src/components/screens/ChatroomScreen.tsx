"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Send, MessageCircle } from "lucide-react";
import { C } from "@/lib/tokens";
import { Gd } from "@/lib/grades";
import { T } from "@/lib/typography";
import { EXPERTS } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { Expert } from "@/types";

interface ChatroomScreenProps {
  expert?: Expert;
  onBack: () => void;
}

interface ChatMessage {
  id: number;
  user: string;
  host: boolean;
  time: string;
  msg: string;
}

/* ── ChatroomScreen ─────────────── */
export const ChatroomScreen = ({ expert, onBack }: ChatroomScreenProps) => {
  const e = expert || EXPERTS[0];
  const g = Gd(e.gk);
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    { id: 1, user: e.name,         host: true,  time: "09:14", msg: "오늘 포지션 분석 공유합니다. 핵심 변수는 Fed 입장입니다." },
    { id: 2, user: "subscriber_A", host: false, time: "09:16", msg: "상세 근거가 포함된 리포트 있나요?" },
    { id: 3, user: e.name,         host: true,  time: "09:18", msg: "네, 오늘 저녁 구독자 전용으로 올리겠습니다." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { id: m.length + 1, user: "나", host: false, time: "지금", msg: input }]);
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
        <div style={{ position: "relative" }}>
          <Avatar name={e.name} size={32} gk={e.gk} />
          <div style={{
            position: "absolute", bottom: 0, right: 0, width: 9, height: 9,
            borderRadius: "50%", background: C.green, border: `1.5px solid ${C.bg}`,
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: T.sm, fontWeight: T.bold, color: C.t1 }}>{e.name}</span>
            <Badge gk={e.gk} sm />
          </div>
          <div style={{ fontSize: T.xs, color: C.t3 }}>구독자 {e.subs.toLocaleString()}명 전용</div>
        </div>
      </div>
      <div style={{ padding: "5px 16px 5px", background: g.bg, borderBottom: `1px solid ${g.bd}` }}>
        <div style={{ fontSize: T.xs, color: g.color, fontWeight: T.semibold }}>{g.label} 전용 채팅방</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map(m => {
          const isMe = m.user === "나";
          return (
            <div key={m.id} style={{ display: "flex", gap: 7, flexDirection: isMe ? "row-reverse" : "row" }}>
              {!isMe && <Avatar name={m.user[0]} size={26} gk={m.host ? e.gk : "candidate"} />}
              <div style={{ maxWidth: "74%" }}>
                {!isMe && <div style={{
                  fontSize: T.xs, fontWeight: T.semibold, color: m.host ? g.color : C.t2,
                  marginBottom: 4, display: "flex", gap: 5, alignItems: "center",
                }}>
                  {m.user}{m.host && <Badge gk={e.gk} sm />}
                </div>}
                <div style={{
                  background: isMe ? C.gold : m.host ? g.bg : C.bg1,
                  color: isMe ? "#000" : C.t1,
                  borderRadius: isMe ? `${T.r_lg}px ${T.r_lg}px ${T.r_sm}px ${T.r_lg}px` : `${T.r_lg}px ${T.r_lg}px ${T.r_lg}px ${T.r_sm}px`,
                  padding: "10px 13px", fontSize: T.sm, lineHeight: T.normal,
                  border: isMe ? "none" : `1px solid ${m.host ? g.bd : C.bd}`,
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
