"use client";

import { useState } from "react";
import { Check, X as XIcon, Share2, Heart } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { PREDS } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BackBar } from "@/components/ui/BackBar";
import type { Pred, GradeKey } from "@/types";

interface ResultScreenProps {
  pred?: Pred;
  onBack: () => void;
  push: (screen: string, data?: any) => void;
}

interface CommentItem {
  id: number;
  user: string;
  gk: GradeKey;
  text: string;
  likes: number;
  liked: boolean;
  time: string;
}

/* ── ResultScreen ─────────────── */
export const ResultScreen = ({ pred, onBack }: ResultScreenProps) => {
  const [reaction, setReaction] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([
    { id: 1, user: "VisionKing", gk: "seer",   text: "예상대로 기관 수요가 받쳐줬습니다.", likes: 241, liked: false, time: "1시간 전" },
    { id: 2, user: "KimOracle",  gk: "proven", text: "이번엔 놓쳤네요. 기록은 남습니다.",   likes: 87,  liked: false, time: "2시간 전" },
  ]);
  const [input, setInput] = useState("");
  const myPred = pred?.myPred;
  const iWon = myPred === pred?.result;
  const p = pred || PREDS[4];

  const addC = () => {
    if (!input.trim()) return;
    setComments(c => [{
      id: Date.now(), user: "나", gk: "candidate",
      text: input, likes: 0, liked: false, time: "방금",
    }, ...c]);
    setInput("");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, animation: "slideIn 0.28s" }}>
      <BackBar title="결과 공개" onBack={onBack} dark
        right={<span style={{
          background: C.greenB, color: C.green, border: `1px solid ${C.green}30`,
          borderRadius: T.r_pill, padding: "2px 9px", fontSize: T.xs, fontWeight: T.semibold,
        }}>결과 확정</span>} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* 결과 배너 */}
        <div style={{
          background: iWon
            ? `linear-gradient(135deg,#052010,#0A2818)`
            : `linear-gradient(135deg,#150508,#1C0E10)`,
          padding: "24px 20px", borderBottom: `1px solid ${iWon ? C.green + "30" : C.red + "30"}`,
        }}>
          {/* 아이콘 */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{
              width: 68, height: 68, borderRadius: "50%",
              background: iWon ? C.greenB : C.redB,
              border: `2px solid ${iWon ? C.green : C.red}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "popIn 0.5s ease",
            }}>
              {iWon
                ? <Check size={32} color={C.green} strokeWidth={2.5} />
                : <XIcon size={32} color={C.red} strokeWidth={2.5} />}
            </div>
          </div>
          {/* 결과 메시지 */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{
              fontFamily: T.display, fontSize: T.xl, fontWeight: T.bold,
              color: iWon ? C.green : C.red, marginBottom: 6,
            }}>
              {iWon ? "예측 성공" : "예측 실패"}
            </div>
            <div style={{
              fontSize: T.sm, color: iWon ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.75)",
              lineHeight: T.relaxed,
            }}>
              {iWon
                ? "기록이 남았습니다."
                : "다음에 다시 도전하세요."}
            </div>
          </div>
          {/* Score 변화 */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{
              background: "rgba(0,0,0,0.4)", border: `1px solid ${iWon ? C.green : C.red}30`,
              borderRadius: T.r_md, padding: "10px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 4 }}>Predix Score</div>
              <div style={{
                fontSize: T.xl, fontWeight: T.bold,
                color: iWon ? C.green : C.red,
                fontFamily: T.mono,
              }}>
                {iWon ? "+2.4" : "-1.2"}
              </div>
            </div>
          </div>
          {/* 결과 비교 */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { s: "A", l: p.A, e: p.eA, r: p.aR ?? 0 },
              { s: "B", l: p.B, e: p.eB, r: p.bR ?? 0 },
            ].map(o => {
              const isAnswer = p.result === o.s;
              return (
                <div key={o.s} style={{
                  flex: o.r,
                  background: isAnswer ? C.goldBg : "rgba(255,255,255,0.04)",
                  borderRadius: T.r_md, padding: "11px 8px", textAlign: "center",
                  border: isAnswer ? `1px solid ${C.gold}50` : `1px solid ${C.bd}`,
                }}>
                  <div style={{ fontSize: T.xl, marginBottom: 4 }}>{o.e}</div>
                  <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: isAnswer ? C.goldL : C.t2 }}>{o.l}</div>
                  <div style={{ fontSize: T.xs, color: C.t3, marginTop: 2 }}>{o.r}%</div>
                  {isAnswer && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4, color: C.green }}>
                      <Check size={10} strokeWidth={2.5} />
                      <span style={{ fontSize: T.xs, fontWeight: T.semibold }}>정답</span>
                    </div>
                  )}
                  {myPred === o.s && <div style={{ fontSize: T.xs, color: C.gold, fontWeight: T.semibold, marginTop: 2 }}>내 예측</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* 통계 */}
        <div style={{ margin: "14px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { l: "총 참여자", v: `${(p.totalP || p.p).toLocaleString()}명`, c: C.t1 },
            { l: "성공",     v: p.successP ? `${p.successP.toLocaleString()}명` : "—", c: C.green },
            { l: "실패",     v: p.failP ? `${p.failP.toLocaleString()}명` : "—",       c: C.red },
          ].map((s, i) => (
            <div key={i} style={{
              background: C.bg1, borderRadius: T.r_md, padding: "11px 8px", textAlign: "center",
              border: `1px solid ${C.bd}`,
            }}>
              <div style={{ fontSize: T.sm, fontWeight: T.bold, color: s.c, fontFamily: T.mono }}>{s.v}</div>
              <div style={{ fontSize: T.xs, color: C.t3, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* 공유/다음 버튼 */}
        <div style={{ margin: "14px 16px 0", display: "flex", gap: 8 }}>
          <button style={{
            flex: 1, padding: "12px 0", background: C.bg2, border: `1px solid ${C.bd}`,
            borderRadius: T.r_md, color: C.t2, fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <Share2 size={14} strokeWidth={2} />
            공유
          </button>
          <button onClick={onBack}
            style={{
              flex: 2, padding: "12px 0",
              background: C.gold,
              border: "none", borderRadius: T.r_md, color: "#000",
              fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
            }}>
            다음 예측 보기
          </button>
        </div>

        {/* 반응 */}
        <div style={{
          margin: "16px 16px 0", background: C.bg1, border: `1px solid ${C.bd}`,
          borderRadius: T.r_lg, padding: "13px 14px",
        }}>
          <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t2, marginBottom: 10 }}>반응 남기기</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["🏆", "🤯", "😮", "😂", "🔥", "👏", "💎", "🔒"].map(r => (
              <button key={r} onClick={() => setReaction(r === reaction ? null : r)}
                style={{
                  width: 40, height: 40, borderRadius: T.r_md,
                  background: reaction === r ? C.goldBg : C.bg2,
                  border: `1px solid ${reaction === r ? C.gold : C.bd}`,
                  fontSize: T.lg, cursor: "pointer", transition: "all 0.15s",
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 댓글 */}
        <div style={{ margin: "16px 16px 0" }}>
          <div style={{
            fontFamily: T.display, fontSize: T.md, fontWeight: T.bold,
            marginBottom: 10, color: C.t1,
          }}>댓글 {comments.length}</div>
          <div style={{
            background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: T.r_md,
            padding: "9px 12px", marginBottom: 10, display: "flex", gap: 9, alignItems: "center",
          }}>
            <Avatar name="나" size={26} gk="candidate" />
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addC()}
              placeholder="결과에 대한 생각을 남겨보세요"
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                fontSize: T.sm, color: C.t1, fontFamily: T.sans,
              }} />
            <button onClick={addC}
              style={{
                padding: "5px 12px", background: input.trim() ? C.gold : C.bg2,
                border: `1px solid ${input.trim() ? C.gold : C.bd}`, borderRadius: T.r_md,
                color: input.trim() ? "#000" : C.t3, fontSize: T.xs, fontWeight: T.bold, cursor: "pointer",
              }}>
              등록
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {comments.map(cm2 => (
              <div key={cm2.id} style={{
                background: C.bg1, border: `1px solid ${C.bd}`,
                borderRadius: T.r_md, padding: "11px 13px",
              }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "center" }}>
                  <Avatar name={cm2.user} size={24} gk={cm2.gk} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>{cm2.user}</span>
                      {cm2.gk && cm2.gk !== "candidate" && <Badge gk={cm2.gk} sm />}
                    </div>
                    <div style={{ fontSize: T.xs, color: C.t3, marginTop: 1 }}>{cm2.time}</div>
                  </div>
                  {cm2.likes > 0 && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C.t3 }}>
                      <Heart size={11} strokeWidth={1.8} />
                      <span style={{ fontSize: T.xs }}>{cm2.likes}</span>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.normal }}>{cm2.text}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};
