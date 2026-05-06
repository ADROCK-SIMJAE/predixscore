"use client";

import { Bell, Check } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  type NotificationRow,
} from "@/hooks/useNotifications";

interface NotificationsSheetProps {
  open: boolean;
  onClose: () => void;
  onItemClick?: (n: NotificationRow) => void;
}

// "1분 전 / 1시간 전 / 1일 전 / yyyy.mm.dd"
function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/* ── NotificationsSheet ─────────────── */
export const NotificationsSheet = ({ open, onClose, onItemClick }: NotificationsSheetProps) => {
  const { data: items = [], isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const unread = items.filter((n) => !n.is_read).length;

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 850,
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn 0.2s",
      }}
    >
      <div style={{ flex: 1, background: "rgba(0,0,0,0.7)" }} onClick={onClose} />
      <div
        style={{
          background: C.bg1,
          borderRadius: `${T.r_xl}px ${T.r_xl}px 0 0`,
          border: `1px solid ${C.bd}`,
          borderBottom: "none",
          maxHeight: "84%",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: T.shadow_md,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, background: C.bd, borderRadius: T.r_pill }} />
        </div>
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px 10px",
            borderBottom: `1px solid ${C.bd}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={16} color={C.gold} strokeWidth={2.2} />
            <span style={{ fontSize: T.md, fontWeight: T.bold, color: C.t1, fontFamily: T.display }}>
              알림
            </span>
            {unread > 0 && (
              <span
                style={{
                  background: C.red,
                  color: "#fff",
                  borderRadius: T.r_pill,
                  padding: "1px 8px",
                  fontSize: T.xs,
                  fontWeight: T.bold,
                  fontFamily: T.mono,
                }}
              >
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              style={{
                padding: "5px 11px",
                background: C.bg2,
                border: `1px solid ${C.bd}`,
                borderRadius: T.r_pill,
                color: C.gold,
                fontSize: T.xs,
                fontWeight: T.semibold,
                cursor: markAll.isPending ? "default" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Check size={11} strokeWidth={2.5} /> 모두 읽음
            </button>
          )}
        </div>
        {/* 리스트 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 0 calc(20px + env(safe-area-inset-bottom))",
          }}
        >
          {isLoading && (
            <div style={{ padding: "40px 0", textAlign: "center", color: C.t3, fontSize: T.sm }}>
              알림 불러오는 중…
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <Bell size={36} color={C.t3} strokeWidth={1.5} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: T.sm, color: C.t2, marginBottom: 4 }}>알림이 없습니다</div>
              <div style={{ fontSize: T.xs, color: C.t3 }}>
                새 메시지나 결과가 있으면 여기에 표시됩니다
              </div>
            </div>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) markRead.mutate(n.id);
                onItemClick?.(n);
              }}
              style={{
                padding: "12px 18px",
                background: n.is_read ? "transparent" : "rgba(201,160,48,0.04)",
                borderBottom: `1px solid ${C.bd}`,
                display: "flex",
                gap: 11,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              {/* 안읽음 dot */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: n.is_read ? "transparent" : C.gold,
                  flexShrink: 0,
                  marginTop: 6,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: T.sm,
                      fontWeight: n.is_read ? T.medium : T.bold,
                      color: C.t1,
                      lineHeight: T.tight,
                    }}
                  >
                    {n.title}
                  </span>
                  <span style={{ fontSize: T.xs, color: C.t3, flexShrink: 0 }}>
                    {formatRelative(n.created_at)}
                  </span>
                </div>
                {n.body && (
                  <div
                    style={{
                      fontSize: T.xs,
                      color: C.t2,
                      lineHeight: T.relaxed,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {n.body}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
