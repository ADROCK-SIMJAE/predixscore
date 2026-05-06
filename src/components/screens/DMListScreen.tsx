"use client";

import { Mail } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { useDMList } from "@/hooks/useDMs";
import { useAuthStore } from "@/store/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BackBar } from "@/components/ui/BackBar";
import type { GradeKey } from "@/types";

interface DMListScreenProps {
  onBack: () => void;
  push: (screen: string, data?: any) => void;
}

interface PartnerInfo {
  id: string;
  handle: string;
  grade: GradeKey;
  avatar_url: string | null;
}

// "1분 전 / 1시간 전 / 1일 전 / yyyy.mm.dd"
function formatRelative(iso: string | null): string {
  if (!iso) return "";
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

/* ── DMListScreen ─────────────── */
export const DMListScreen = ({ onBack, push }: DMListScreenProps) => {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { data: list = [], isLoading } = useDMList();

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        animation: "slideIn 0.28s",
      }}
    >
      <BackBar title="메시지" onBack={onBack} dark />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {isLoading && (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.t3, fontSize: T.sm }}>
            대화 목록을 불러오는 중…
          </div>
        )}
        {!isLoading && list.length === 0 && (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: C.t3,
            }}
          >
            <Mail size={36} color={C.t3} strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: T.sm, color: C.t2, marginBottom: 4 }}>
              아직 메시지가 없습니다
            </div>
            <div style={{ fontSize: T.xs, color: C.t3 }}>
              전문가 프로필에서 대화를 시작해 보세요.
            </div>
          </div>
        )}
        {list.map((c) => {
          // 본인이 a 면 b 가 상대방
          const partner: PartnerInfo | null = (() => {
            const me = userId;
            if (c.user_a === me && c.b) {
              return {
                id: c.b.id,
                handle: c.b.handle,
                grade: (c.b.grade ?? "candidate") as GradeKey,
                avatar_url: c.b.avatar_url,
              };
            }
            if (c.user_b === me && c.a) {
              return {
                id: c.a.id,
                handle: c.a.handle,
                grade: (c.a.grade ?? "candidate") as GradeKey,
                avatar_url: c.a.avatar_url,
              };
            }
            return null;
          })();

          // 마지막 메시지: 정렬 후 최신 1건
          const lastMsg = (c.messages ?? [])
            .slice()
            .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0];

          return (
            <div
              key={c.id}
              onClick={() =>
                push("dm_chat", {
                  conversationId: c.id,
                  otherProfile: partner,
                })
              }
              style={{
                display: "flex",
                gap: 11,
                padding: "13px 16px",
                background: C.bg1,
                borderBottom: `1px solid ${C.bd}`,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar
                  name={partner?.handle ?? "?"}
                  size={42}
                  gk={partner?.grade ?? "candidate"}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>
                      {partner?.handle ?? "알 수 없음"}
                    </span>
                    {partner && <Badge gk={partner.grade} sm />}
                  </div>
                  <span style={{ fontSize: T.xs, color: C.t3 }}>
                    {formatRelative(lastMsg?.created_at ?? c.last_message_at)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: T.sm,
                    color: C.t2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lastMsg?.content ?? "메시지를 시작해보세요"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
