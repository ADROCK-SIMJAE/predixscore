"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { SealBadge } from "@/components/ui/SealBadge";
import { signIn, signUp } from "@/lib/supabase/auth";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

/* ── AuthModal ─────────────── */
export const AuthModal = ({ onClose, onSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const translateError = (msg: string): string => {
    if (!msg) return "오류가 발생했습니다.";
    if (msg.includes("Invalid login credentials"))
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    if (msg.includes("Email not confirmed"))
      return "이메일 확인이 필요합니다. 받은 메일의 인증 링크를 클릭해 주세요.";
    if (msg.includes("already registered") || msg.includes("User already registered"))
      return "이미 가입된 이메일입니다. 로그인 탭으로 이동해 주세요.";
    if (msg.includes("Password should be at least"))
      return "비밀번호는 8자 이상이어야 합니다.";
    if (msg.toLowerCase().includes("rate limit"))
      return "잠시 후 다시 시도해주세요.";
    if (msg.includes("over_email_send_rate_limit"))
      return "이메일 전송 한도 초과. 잠시 후 다시 시도해주세요.";
    return msg;
  };

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!email || !pw) {
      setError("이메일과 비밀번호를 입력하세요.");
      return;
    }
    if (mode === "signup" && !handle.trim()) {
      setError("닉네임을 입력하세요.");
      return;
    }
    if (pw.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await signUp({ email, password: pw, handle: handle.trim() });
        if (res.needsEmailConfirmation) {
          // 이메일 확인 필요: 세션 없음. 사용자에게 안내 후 로그인 탭으로 전환
          setInfo(
            `${email} 로 확인 메일을 발송했습니다.\n메일의 인증 링크를 클릭한 뒤 로그인해 주세요.`,
          );
          setMode("login");
          setHandle("");
          setLoading(false);
          return;
        }
        // 세션 즉시 발급된 경우 (이메일 확인 OFF)
        onSuccess();
        onClose();
      } else {
        await signIn({ email, password: pw });
        onSuccess();
        onClose();
      }
    } catch (e: any) {
      setError(translateError(e?.message ?? ""));
    } finally {
      setLoading(false);
    }
  };

  const IS = (v: string | boolean): React.CSSProperties => ({
    width: "100%", padding: "12px 14px", background: C.bg2,
    border: `1px solid ${v ? C.gold : C.bd}`, borderRadius: T.r_md,
    fontSize: T.base, color: C.t1, outline: "none",
    fontFamily: T.sans,
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", animation: "fadeIn 0.2s",
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
        <div style={{ padding: "16px 24px 0", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <SealBadge size={48} gk="seer" />
          </div>
          <div style={{
            fontFamily: T.display, fontSize: T.lg, fontWeight: T.bold,
            color: C.t1, marginBottom: 4,
          }}>Predix Score</div>
          <div style={{ fontSize: T.sm, color: C.t2, marginBottom: 18 }}>
            예측을 증명하는 가장 빠른 방법
          </div>
          <div style={{
            display: "flex", gap: 0, background: C.bg2, borderRadius: T.r_md,
            padding: 3, marginBottom: 18, border: `1px solid ${C.bd}`,
          }}>
            {([["login", "로그인"], ["signup", "회원가입"]] as const).map(([m, l]) => (
              <button key={m} onClick={() => { setMode(m); setError(null); setInfo(null); }}
                style={{
                  flex: 1, padding: "9px 0", background: mode === m ? C.gold : "transparent",
                  border: "none",
                  borderRadius: T.r_sm, color: mode === m ? "#000" : C.t3,
                  fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer", transition: "all 0.18s",
                }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
          {mode === "signup" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>닉네임</div>
              <input value={handle} onChange={e => setHandle(e.target.value)}
                placeholder="사용할 닉네임" style={IS(handle)} />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>이메일</div>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com" type="email" autoComplete="email" style={IS(email)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>비밀번호</div>
            <input value={pw} onChange={e => setPw(e.target.value)}
              placeholder="8자 이상" type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              style={IS(pw)} />
          </div>
          {error && (
            <div style={{
              marginBottom: 12, padding: "10px 12px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: T.r_md, fontSize: T.sm, color: C.red, whiteSpace: "pre-line",
            }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{
              marginBottom: 12, padding: "10px 12px",
              background: "rgba(122,192,116,0.08)", border: "1px solid rgba(122,192,116,0.35)",
              borderRadius: T.r_md, fontSize: T.sm, color: "#7AC074", whiteSpace: "pre-line",
            }}>
              {info}
            </div>
          )}
          {mode === "signup" && !info && (
            <div style={{ fontSize: T.xs, color: C.t3, marginBottom: 16, lineHeight: T.relaxed }}>
              가입 후 이메일 인증 링크를 클릭해야 로그인할 수 있습니다.
            </div>
          )}
        </div>
        <div style={{ padding: "12px 24px calc(32px + env(safe-area-inset-bottom))", borderTop: `1px solid ${C.bd}` }}>
          <button onClick={submit} disabled={loading}
            style={{
              width: "100%",
              background: loading ? C.bg2 : C.gold,
              border: "none", borderRadius: T.r_md,
              color: loading ? C.t3 : "#000",
              fontSize: T.md, fontWeight: T.bold, padding: 15,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}
          </button>
        </div>
      </div>
    </div>
  );
};
