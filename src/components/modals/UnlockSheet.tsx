"use client";

import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { SealBadge } from "@/components/ui/SealBadge";
import type { GradeKey } from "@/types";
import type { ReactNode } from "react";

export interface UnlockSheetOption {
  /** 좌측 아이콘 — lucide-react 컴포넌트 권장 */
  icon: ReactNode;
  title: string;
  desc: string;
  badge: string;
  c: string;
  bg: string;
  bd?: string;
  method?: "points" | "subscription" | "ad" | "free";
  cost?: number;
}

interface UnlockSheetProps {
  open: boolean;
  onClose: () => void;
  options: UnlockSheetOption[];
  header?: ReactNode;
  sealGk?: GradeKey;
  headerTitle?: string;
  headerDesc?: string;
  onSelect?: (opt: UnlockSheetOption, index: number) => void;
}

/**
 * UnlockSheet — 공통 열람 옵션 바텀시트.
 * backdrop blur 강화 + grip handle 골드 톤
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
      display: "flex", flexDirection: "column",
      animation: "fadeIn 0.2s",
    }}>
      {/* backdrop */}
      <div
        style={{
          flex: 1,
          background: "rgba(0,0,0,0.78)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      />

      {/* 시트 */}
      <div style={{
        background: C.bg1,
        borderRadius: `${T.r_xl}px ${T.r_xl}px 0 0`,
        border: `1px solid ${C.bd}`,
        borderBottom: "none",
        padding: "16px 20px calc(32px + env(safe-area-inset-bottom))",
        animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
        boxShadow: T.shadow_lift,
      }}>
        {/* grip handle — 골드 라이트 톤 */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{
            width: 36, height: 4,
            background: `linear-gradient(90deg, ${C.goldD}, ${C.goldL}, ${C.goldD})`,
            borderRadius: T.r_pill,
            opacity: 0.5,
          }} />
        </div>

        {/* 헤더 구분선 영역 */}
        {header ?? (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <SealBadge size={48} gk={sealGk} />
            </div>
            <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.bd}` }}>
              <div style={{
                fontFamily: T.display, fontSize: T.md, fontWeight: T.bold,
                color: C.t1, marginBottom: 6,
                letterSpacing: T.ls_tight + "em",
              }}>{headerTitle}</div>
              <div style={{ fontSize: T.sm, color: C.t2, lineHeight: T.normal }}>{headerDesc}</div>
            </div>
          </>
        )}

        {/* 옵션 목록 */}
        {options.map((opt, i) => (
          <div
            key={i}
            onClick={() => { onSelect?.(opt, i); onClose(); }}
            style={{
              background: opt.bg,
              border: `1px solid ${opt.bd ?? `${opt.c}30`}`,
              borderRadius: T.r_lg, padding: "13px 14px",
              marginBottom: i < options.length - 1 ? 8 : 0,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
              transition: "transform 150ms cubic-bezier(0.32,0.72,0,1), opacity 150ms",
            }}
            onMouseDown={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(0.98)"; }}
            onMouseUp={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: T.r_md,
              background: `${opt.c}12`, border: `1px solid ${opt.c}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>{opt.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: T.base, fontWeight: T.semibold, color: opt.c, marginBottom: 3,
              }}>{opt.title}</div>
              <div style={{ fontSize: T.xs, color: C.t2, lineHeight: T.normal }}>{opt.desc}</div>
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
