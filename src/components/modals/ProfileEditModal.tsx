"use client";

import { useState } from "react";
import { ChevronLeft, Save } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { useMyProfile, useUpdateProfile } from "@/hooks/useProfile";

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

const CATS = ["코인", "주식", "스포츠", "이슈", "정치"];

/* ── ProfileEditModal ─────────────── */
export const ProfileEditModal = ({ open, onClose }: ProfileEditModalProps) => {
  const { data: profile } = useMyProfile();
  const update = useUpdateProfile();
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [category, setCategory] = useState<string | null>(profile?.category ?? null);
  const [wallet, setWallet] = useState(profile?.wallet ?? "");
  const [error, setError] = useState<string | null>(null);

  // 모달이 새로 열릴 때 최신 프로필로 초기화
  if (!open) return null;

  const onSave = async () => {
    setError(null);
    if (!handle.trim()) {
      setError("닉네임을 입력하세요.");
      return;
    }
    try {
      await update.mutateAsync({
        handle: handle.trim(),
        name: name.trim() || null,
        bio: bio.trim() || null,
        category,
        wallet: wallet.trim() || null,
      });
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "저장 실패";
      setError(msg);
    }
  };

  const IS: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
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
        zIndex: 700,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        animation: "slideIn 0.28s",
      }}
    >
      {/* 상단 바 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          background: C.bg1,
          borderBottom: `1px solid ${C.bd}`,
        }}
      >
        <button
          onClick={onClose}
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
        <span
          style={{
            flex: 1,
            fontSize: T.md,
            fontWeight: T.bold,
            color: C.t1,
            fontFamily: T.display,
          }}
        >
          프로필 편집
        </span>
        <button
          onClick={onSave}
          disabled={update.isPending}
          style={{
            padding: "7px 14px",
            background: update.isPending ? C.bg2 : C.gold,
            border: "none",
            borderRadius: T.r_md,
            color: update.isPending ? C.t3 : "#000",
            fontSize: T.sm,
            fontWeight: T.bold,
            cursor: update.isPending ? "default" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Save size={13} strokeWidth={2.2} />
          {update.isPending ? "저장 중…" : "저장"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>
            닉네임 *
          </div>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="사용할 닉네임"
            style={IS}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>
            이름
          </div>
          <input
            value={name ?? ""}
            onChange={(e) => setName(e.target.value)}
            placeholder="실명 또는 활동명"
            style={IS}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>
            소개
          </div>
          <textarea
            value={bio ?? ""}
            onChange={(e) => setBio(e.target.value)}
            placeholder="간단한 자기 소개 (최대 200자)"
            maxLength={200}
            rows={4}
            style={{ ...IS, resize: "none", lineHeight: T.relaxed }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>
            전문 분야
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATS.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(active ? null : c)}
                  style={{
                    padding: "6px 14px",
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
        {/* 지갑 주소 — Web3 연동용 (선택) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: T.xs, fontWeight: T.semibold, color: C.t2, marginBottom: 6 }}>
            지갑 주소
          </div>
          <textarea
            value={wallet ?? ""}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="예) 0x1234... (선택 사항)"
            rows={2}
            maxLength={120}
            style={{ ...IS, resize: "none", fontFamily: T.mono, lineHeight: T.relaxed }}
          />
        </div>
        {error && (
          <div
            style={{
              marginTop: 12,
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
    </div>
  );
};
