"use client";

import { useState } from "react";
import { AlertTriangle, Lock, Check } from "lucide-react";
import { C } from "@/lib/tokens";
import { Cm } from "@/lib/categories";
import { T } from "@/lib/typography";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SealBadge } from "@/components/ui/SealBadge";
import { Countdown } from "@/components/ui/Countdown";
import { useSubmitPrediction } from "@/hooks/usePreds";
import type { Pred } from "@/types";

interface PredictModalProps {
  pred: Pred;
  onClose: () => void;
  loggedIn: boolean;
  onAuth: () => void;
}

/* ── PredictModal ─────────────── */
export const PredictModal = ({ pred, onClose, loggedIn, onAuth }: PredictModalProps) => {
  const [step, setStep] = useState(0); // 0:선택 1:확인 2:봉인완료
  const [sel, setSel] = useState<"A" | "B" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cm = Cm(pred.cat);
  const submit = useSubmitPrediction();

  const handleConfirm = async () => {
    if (!sel) return;
    setError(null);
    try {
      await submit.mutateAsync({ predictionId: pred.id, choice: sel });
      setStep(2);
    } catch (e: any) {
      const msg = e?.message ?? "제출 실패";
      const ko =
        msg.includes("duplicate key") ? "이미 예측을 제출한 항목입니다."
        : msg.includes("violates row-level security") ? "권한이 없습니다. 다시 로그인해 주세요."
        : msg;
      setError(ko);
    }
  };

  /* 봉인 완료 화면 */
  if (step === 2) return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500, background: C.bg,
      display: "flex", flexDirection: "column", animation: "fadeIn 0.2s",
    }}>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "32px 24px", textAlign: "center",
      }}>
        <div style={{ marginBottom: 20 }}>
          <SealBadge size={84} gk="proven" />
        </div>
        <div style={{
          fontFamily: T.display, fontSize: T.xl, fontWeight: T.bold,
          color: C.t1, marginBottom: 8,
        }}>
          예측이 제출되었습니다
        </div>
        <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.relaxed, marginBottom: 22 }}>
          DB에 봉인 저장 완료.<br />결과가 공개되면 검증됩니다.
        </div>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 8 }}>결과 공개까지</div>
          <Countdown time="01 : 23 : 10" large />
        </div>
        <div style={{
          width: "100%", background: C.bg1, border: `1px solid ${C.bd}`,
          borderRadius: T.r_lg, padding: 14, marginBottom: 22,
        }}>
          {[
            { k: "선택", v: sel === "A" ? pred.A : pred.B, c: C.t1 },
            { k: "봉인", v: "DB 암호화", c: C.green },
            { k: "공개", v: "결과 발표 후", c: C.t2 },
            { k: "수정", v: "불가", c: C.red },
          ].map((r, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "9px 0", borderBottom: i < 3 ? `1px solid ${C.bd}` : "none",
            }}>
              <span style={{ fontSize: T.sm, color: C.t3 }}>{r.k}</span>
              <span style={{
                fontSize: T.sm, fontWeight: T.semibold, color: r.c,
                fontFamily: T.mono,
              }}>{r.v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <button onClick={() => onClose()}
            style={{
              flex: 1, padding: "13px 0", background: C.bg2,
              border: `1px solid ${C.bd}`, borderRadius: T.r_md,
              color: C.t2, fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer",
            }}>
            내 기록 보기
          </button>
          <button onClick={() => onClose()}
            style={{
              flex: 1, padding: "13px 0",
              background: C.gold,
              border: "none", borderRadius: T.r_md,
              color: "#000", fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
            }}>
            다음 예측 보기
          </button>
        </div>
      </div>
    </div>
  );

  /* 확인 화면 */
  if (step === 1) return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", animation: "fadeIn 0.2s",
    }}>
      <div style={{ flex: 1 }} onClick={onClose} />
      <div style={{
        background: C.bg1, borderRadius: `${T.r_xl}px ${T.r_xl}px 0 0`,
        border: `1px solid ${C.bd}`, borderBottom: "none",
        padding: "20px 24px calc(32px + env(safe-area-inset-bottom))",
        animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
        boxShadow: T.shadow_md,
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 36, height: 4, background: C.bd, borderRadius: T.r_pill }} />
        </div>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{
            fontSize: T.lg, fontWeight: T.bold, color: C.t1,
            fontFamily: T.display, marginBottom: 6,
          }}>예측 확인</div>
          <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.normal }}>{pred.q}</div>
        </div>
        <div style={{
          background: "rgba(201,160,48,0.06)", border: `1px solid ${C.goldBd}`,
          borderRadius: T.r_md, padding: "12px 14px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <AlertTriangle size={18} color={C.gold} strokeWidth={2} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.gold, marginBottom: 2 }}>
              제출 후 수정할 수 없습니다
            </div>
            <div style={{ fontSize: T.xs, color: C.t2 }}>
              DB에 영구 기록됩니다
            </div>
          </div>
        </div>
        <div style={{
          background: C.goldBg,
          border: `1px solid ${C.gold}`,
          borderRadius: T.r_lg, padding: "16px", textAlign: "center", marginBottom: 16,
        }}>
          <div style={{ fontSize: T.xxl, marginBottom: 6 }}>{sel === "A" ? pred.eA : pred.eB}</div>
          <div style={{ fontSize: T.md, fontWeight: T.bold, color: C.t1 }}>
            {sel === "A" ? pred.A : pred.B}
          </div>
        </div>
        {error && (
          <div style={{
            marginBottom: 12, padding: "10px 12px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: T.r_md, fontSize: T.sm, color: C.red,
          }}>{error}</div>
        )}
        <button onClick={handleConfirm} disabled={submit.isPending}
          style={{
            width: "100%", padding: "15px 0",
            background: submit.isPending ? C.bg2 : C.gold,
            border: "none", borderRadius: T.r_md,
            color: submit.isPending ? C.t3 : "#000",
            fontSize: T.md, fontWeight: T.bold,
            cursor: submit.isPending ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: submit.isPending ? 0.7 : 1,
          }}>
          <Lock size={16} strokeWidth={2.2} />
          {submit.isPending ? "제출 중…" : "예측 제출"}
        </button>
      </div>
    </div>
  );

  /* 선택 화면 */
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", animation: "fadeIn 0.2s",
    }}>
      <div style={{ flex: 1 }} onClick={onClose} />
      <div style={{
        background: C.bg1, borderRadius: `${T.r_xl}px ${T.r_xl}px 0 0`,
        border: `1px solid ${C.bd}`, borderBottom: "none",
        maxHeight: "88%", display: "flex", flexDirection: "column",
        animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
        boxShadow: T.shadow_md,
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, background: C.bd, borderRadius: T.r_pill }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 22px" }}>
          {/* 카테고리 + 마감 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{
              background: cm.bg, color: cm.c, border: `1px solid ${cm.c}30`,
              borderRadius: T.r_pill, padding: "3px 10px", fontSize: T.xs, fontWeight: T.semibold,
            }}>{cm.e} {pred.cat}</span>
            <Countdown time={pred.dl} />
          </div>
          {/* 예측자 정보 */}
          {pred.agk && (
            <div style={{
              display: "flex", gap: 10, alignItems: "center",
              background: C.bg2, border: `1px solid ${C.bd}`,
              borderRadius: T.r_lg, padding: "10px 12px", marginBottom: 14,
            }}>
              <Avatar name={pred.aName ?? ""} size={32} gk={pred.agk} />
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>{pred.aName}</span>
                  <Badge gk={pred.agk} sm />
                </div>
                <div style={{ fontSize: T.xs, color: C.t2, marginTop: 2 }}>
                  Score {pred.aScore} · 적중률 {pred.aAcc}%
                </div>
              </div>
            </div>
          )}
          {/* 질문 */}
          <div style={{
            fontSize: T.lg, fontWeight: T.bold, color: C.t1, lineHeight: T.normal, marginBottom: 16,
          }}>{pred.q}</div>
          {/* 봉인 안내 */}
          <div style={{
            padding: "10px 12px", background: `rgba(201,160,48,0.06)`,
            border: `1px solid ${C.goldBd}`, borderRadius: T.r_md, marginBottom: 16,
            display: "flex", gap: 8, alignItems: "center",
          }}>
            <Lock size={14} color={C.gold} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: T.sm, color: C.gold }}>
              다른 사람의 선택은 결과 공개 전까지 비공개입니다
            </span>
          </div>
          {/* A/B 선택 카드 */}
          <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t2, marginBottom: 10 }}>
            예측 선택
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {([
              { s: "A" as const, l: pred.A, e: pred.eA },
              { s: "B" as const, l: pred.B, e: pred.eB },
            ]).map(o => (
              <div key={o.s} onClick={() => setSel(o.s)}
                style={{
                  flex: 1, background: sel === o.s ? C.goldBg : C.bg2,
                  border: `1px solid ${sel === o.s ? C.gold : C.bd}`,
                  borderRadius: T.r_lg, padding: "16px 10px", textAlign: "center",
                  cursor: "pointer", transition: "all 0.18s",
                }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{o.e}</div>
                <div style={{
                  fontSize: T.xs, fontWeight: T.bold, color: sel === o.s ? C.goldL : C.t3,
                  marginBottom: 4,
                }}>{o.s}</div>
                <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: sel === o.s ? C.t1 : C.t2 }}>{o.l}</div>
                {sel === o.s && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 6, color: C.gold }}>
                    <Check size={11} strokeWidth={2.5} />
                    <span style={{ fontSize: T.xs, fontWeight: T.semibold }}>선택됨</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ height: 8 }} />
        </div>
        <div style={{ padding: "12px 22px calc(32px + env(safe-area-inset-bottom))", borderTop: `1px solid ${C.bd}` }}>
          <button onClick={() => { if (!loggedIn) { onClose(); onAuth(); return; } if (sel) setStep(1); }}
            disabled={!sel}
            style={{
              width: "100%",
              background: sel ? C.gold : C.bg2,
              border: `1px solid ${sel ? C.gold : C.bd}`, borderRadius: T.r_md,
              color: sel ? "#000" : C.t3, fontSize: T.md, fontWeight: T.bold, padding: 15,
              cursor: sel ? "pointer" : "default", transition: "all 0.18s",
            }}>
            {sel ? "다음" : "선택지를 먼저 고르세요"}
          </button>
        </div>
      </div>
    </div>
  );
};
