"use client";

import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { SealBadge } from "@/components/ui/SealBadge";
import type { GradeKey } from "@/types";
import type { ReactNode } from "react";

export interface UnlockSheetOption {
  /** 좌측 아이콘 — lucide-react 컴포넌트 권장 (또는 텍스트/이미지) */
  icon: ReactNode;
  title: string;
  desc: string;
  badge: string;
  /** 텍스트 컬러 */
  c: string;
  /** 옵션 카드 배경 */
  bg: string;
  /** 옵션 카드 보더 (지정하지 않으면 c color 기반) */
  bd?: string;
}

interface UnlockSheetProps {
  open: boolean;
  onClose: () => void;
  /** 기본 옵션 리스트 — 부모에서 자유롭게 구성 */
  options: UnlockSheetOption[];
  /** 시트 헤더 (제목/설명/씰 등) — 미지정 시 기본 헤더 표시 */
  header?: ReactNode;
  /** 헤더 기본 표시용 등급 (header 미지정 시) */
  sealGk?: GradeKey;
  headerTitle?: string;
  headerDesc?: string;
  /** 옵션 클릭 시 호출 — 지정 안 하면 시트만 닫음 */
  onSelect?: (opt: UnlockSheetOption, index: number) => void;
}

/**
 * UnlockSheet — FeedCard와 EventDetail에서 공유되는 공통 열람 옵션 바텀시트.
 */
export const UnlockSheet = ({
  open, onClose, options, header,
  sealGk = "proven",
  headerTitle = "열람 방법 선택",
  headerDesc = "아래 방법 중 하나를 선택하세요",
  onSelect,
}: UnlockSheetProps) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 800,
      display: "flex", flexDirection: "column", animation: "fadeIn 0.2s",
    }}>
      <div style={{ flex: 1, background: "rgba(0,0,0,0.7)" }} onClick={onClose} />
      <div style={{
        background: C.bg1, borderRadius: `${T.r_xl}px ${T.r_xl}px 0 0`,
        border: `1px solid ${C.bd}`, borderBottom: "none",
        padding: "16px 20px calc(32px + env(safe-area-inset-bottom))",
        animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
        boxShadow: T.shadow_md,
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 36, height: 4, background: C.bd, borderRadius: T.r_pill }} />
        </div>
        {header ?? (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <SealBadge size={48} gk={sealGk} />
            </div>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{
                fontFamily: T.display, fontSize: T.md, fontWeight: T.bold,
                color: C.t1, marginBottom: 4,
              }}>{headerTitle}</div>
              <div style={{ fontSize: T.sm, color: C.t2 }}>{headerDesc}</div>
            </div>
          </>
        )}

        {options.map((opt, i) => (
          <div key={i} onClick={() => { onSelect?.(opt, i); onClose(); }}
            style={{
              background: opt.bg,
              border: `1px solid ${opt.bd ?? `${opt.c}30`}`,
              borderRadius: T.r_lg, padding: "13px 14px",
              marginBottom: i < options.length - 1 ? 8 : 0,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
            }}>
            <div style={{
              width: 38, height: 38, borderRadius: T.r_md,
              background: `${opt.c}12`, border: `1px solid ${opt.c}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>{opt.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.base, fontWeight: T.semibold, color: opt.c, marginBottom: 2 }}>{opt.title}</div>
              <div style={{ fontSize: T.xs, color: C.t3 }}>{opt.desc}</div>
            </div>
            <span style={{
              background: `${opt.c}18`, border: `1px solid ${opt.c}40`, borderRadius: T.r_pill,
              padding: "3px 10px", fontSize: T.xs, fontWeight: T.bold, color: opt.c, flexShrink: 0,
            }}>{opt.badge}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
