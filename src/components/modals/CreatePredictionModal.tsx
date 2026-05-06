"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import { qk } from "@/hooks/queryKeys";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";

interface CreatePredictionModalProps {
  open: boolean;
  onClose: () => void;
}

// 템플릿 — A/B 라벨 자동 채움
const TEMPLATES = [
  { id: "yesno", label: "예/아니오", a: "예 (YES)", b: "아니오 (NO)", eA: "✅", eB: "❌" },
  { id: "rise",  label: "상승/하락", a: "올라간다",  b: "내려간다",     eA: "📈", eB: "📉" },
  { id: "win",   label: "승/패",     a: "승리",      b: "패배",         eA: "🏆", eB: "❌" },
  { id: "custom", label: "직접 입력", a: "",         b: "",             eA: "🅰️", eB: "🅱️" },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];

const CATS = ["코인", "주식", "스포츠", "이슈", "정치"] as const;

interface CreateInput {
  cat: string;
  q: string;
  A: string;
  B: string;
  eA: string;
  eB: string;
  dl: string;
}

/* ── CreatePredictionModal ─────────────── */
// 사용자가 직접 yes/no 또는 상승/하락 같은 새 예측을 작성하는 모달
export const CreatePredictionModal = ({ open, onClose }: CreatePredictionModalProps) => {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const profile = useAuthStore((s) => s.profile);
  const qc = useQueryClient();

  const [cat, setCat] = useState<string>("코인");
  const [tplId, setTplId] = useState<TemplateId>("yesno");
  const [q, setQ] = useState("");
  const [A, setA] = useState("예 (YES)");
  const [B, setB] = useState("아니오 (NO)");
  const [eA, setEA] = useState("✅");
  const [eB, setEB] = useState("❌");
  const [dl, setDl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async (input: CreateInput) => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("predictions")
        .insert({
          author_user_id: userId,
          author_name: profile?.handle ?? null,
          author_gk: profile?.grade ?? "candidate",
          author_score: profile?.score ?? 0,
          author_acc: profile?.accuracy ?? 0,
          cat: input.cat,
          q: input.q,
          a_label: input.A,
          b_label: input.B,
          ea: input.eA,
          eb: input.eB,
          deadline_text: input.dl || null,
          stage: "active",
          blind: true,
          hot: false,
          price: 0,
          participants: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.preds() });
    },
  });

  if (!open) return null;

  const pickTemplate = (id: TemplateId) => {
    setTplId(id);
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (id !== "custom") {
      setA(t.a);
      setB(t.b);
      setEA(t.eA);
      setEB(t.eB);
    } else {
      setA("");
      setB("");
      setEA(t.eA);
      setEB(t.eB);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    const trimmedQ = q.trim();
    if (trimmedQ.length < 5) {
      setError("질문은 5자 이상 입력해 주세요.");
      return;
    }
    if (trimmedQ.length > 200) {
      setError("질문은 최대 200자까지 입력 가능합니다.");
      return;
    }
    if (!A.trim() || !B.trim()) {
      setError("A/B 선택지를 모두 입력해 주세요.");
      return;
    }
    try {
      await create.mutateAsync({
        cat,
        q: trimmedQ,
        A: A.trim(),
        B: B.trim(),
        eA: eA.trim() || "🅰️",
        eB: eB.trim() || "🅱️",
        dl: dl.trim(),
      });
      // 초기화 후 닫기
      setQ("");
      setDl("");
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "예측 작성에 실패했습니다.";
      const ko = msg.includes("violates row-level security")
        ? "권한이 없습니다. 로그인 상태를 확인해 주세요."
        : msg;
      setError(ko);
    }
  };

  const IS: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: C.bg2,
    border: `1px solid ${C.bd}`,
    borderRadius: T.r_md,
    fontSize: T.base,
    color: C.t1,
    outline: "none",
    fontFamily: T.sans,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 750,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn 0.2s",
      }}
    >
      <div style={{ flex: 1 }} onClick={onClose} />
      <div
        style={{
          background: C.bg1,
          borderRadius: `${T.r_xl}px ${T.r_xl}px 0 0`,
          border: `1px solid ${C.bd}`,
          borderBottom: "none",
          maxHeight: "90%",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: T.shadow_md,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, background: C.bd, borderRadius: T.r_pill }} />
        </div>
        <div style={{ padding: "12px 22px 6px", textAlign: "center" }}>
          <div
            style={{
              fontFamily: T.display,
              fontSize: T.lg,
              fontWeight: T.bold,
              color: C.t1,
              marginBottom: 4,
            }}
          >
            예측 만들기
          </div>
          <div style={{ fontSize: T.xs, color: C.t3 }}>
            예/아니오 또는 A/B 형태의 예측을 만들어 보세요.
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 22px" }}>
          {/* 카테고리 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>
              카테고리
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATS.map((c) => {
                const active = cat === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    style={{
                      padding: "5px 12px",
                      background: active ? C.gold : C.bg2,
                      border: `1px solid ${active ? C.gold : C.bd}`,
                      borderRadius: T.r_pill,
                      color: active ? "#000" : C.t2,
                      fontSize: T.sm,
                      fontWeight: T.semibold,
                      cursor: "pointer",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 질문 */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: T.xs,
                fontWeight: T.semibold,
                color: C.t2,
                marginBottom: 6,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>질문 *</span>
              <span style={{ color: C.t3, fontFamily: T.mono }}>{q.length}/200</span>
            </div>
            <textarea
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="예) 비트코인이 이번 주 100K USD를 돌파할까?"
              maxLength={200}
              rows={3}
              style={{ ...IS, resize: "none", lineHeight: T.relaxed }}
            />
          </div>

          {/* 템플릿 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>
              선택지 템플릿
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TEMPLATES.map((t) => {
                const active = tplId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => pickTemplate(t.id)}
                    style={{
                      padding: "5px 12px",
                      background: active ? C.goldBg : C.bg2,
                      border: `1px solid ${active ? C.gold : C.bd}`,
                      borderRadius: T.r_pill,
                      color: active ? C.goldL : C.t2,
                      fontSize: T.sm,
                      fontWeight: T.semibold,
                      cursor: "pointer",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* A/B 라벨 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>
                A 선택지 {tplId !== "custom" && <span style={{ color: C.t3 }}>(고정)</span>}
              </div>
              <input
                value={A}
                onChange={(e) => setA(e.target.value)}
                readOnly={tplId !== "custom"}
                placeholder="예) 올라간다"
                style={{
                  ...IS,
                  background: tplId !== "custom" ? C.bg1 : C.bg2,
                  color: tplId !== "custom" ? C.t2 : C.t1,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>
                B 선택지 {tplId !== "custom" && <span style={{ color: C.t3 }}>(고정)</span>}
              </div>
              <input
                value={B}
                onChange={(e) => setB(e.target.value)}
                readOnly={tplId !== "custom"}
                placeholder="예) 내려간다"
                style={{
                  ...IS,
                  background: tplId !== "custom" ? C.bg1 : C.bg2,
                  color: tplId !== "custom" ? C.t2 : C.t1,
                }}
              />
            </div>
          </div>

          {/* 마감 텍스트 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>
              마감 (텍스트)
            </div>
            <input
              value={dl}
              onChange={(e) => setDl(e.target.value)}
              placeholder="예) 오늘 자정 / D-1 / 7월 1일"
              style={IS}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.35)",
                borderRadius: T.r_md,
                fontSize: T.sm,
                color: C.red,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "12px 22px calc(28px + env(safe-area-inset-bottom))",
            borderTop: `1px solid ${C.bd}`,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "13px 0",
              background: C.bg2,
              border: `1px solid ${C.bd}`,
              borderRadius: T.r_md,
              color: C.t2,
              fontSize: T.sm,
              fontWeight: T.semibold,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={create.isPending}
            style={{
              flex: 2,
              padding: "13px 0",
              background: create.isPending ? C.bg2 : C.gold,
              border: "none",
              borderRadius: T.r_md,
              color: create.isPending ? C.t3 : "#000",
              fontSize: T.sm,
              fontWeight: T.bold,
              cursor: create.isPending ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Lock size={14} strokeWidth={2.2} />
            {create.isPending ? "작성 중…" : "예측 등록"}
          </button>
        </div>
      </div>
    </div>
  );
};
