"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { useUnreadCount } from "@/hooks/useNotifications";
import { NotificationsSheet } from "@/components/modals/NotificationsSheet";

interface NotifBellProps {
  push: (screen: string, data?: any) => void;
}

/* ── NotifBell ─────────────── */
// 헤더에서 사용하는 알림 벨 아이콘 + unread dot + 시트 모달
export const NotifBell = ({ push }: NotifBellProps) => {
  const [open, setOpen] = useState(false);
  const unreadNotif = useUnreadCount();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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
          position: "relative",
        }}
      >
        <Bell size={15} strokeWidth={2} />
        {unreadNotif > 0 && (
          <div
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: C.red,
              border: `1.5px solid ${C.bg}`,
            }}
          />
        )}
      </button>
      <NotificationsSheet
        open={open}
        onClose={() => setOpen(false)}
        onItemClick={(n) => {
          // HomeScreen 의 알림 라우팅 로직과 동일
          if (n.link_screen === "dm_chat" || n.link_screen === "dm_list") {
            setOpen(false);
            push("dm_list", {});
          } else if (n.link_screen === "expert" && n.link_data) {
            const data = n.link_data as { expert_id?: number; expert_name?: string };
            setOpen(false);
            push("expert", { expertId: data.expert_id, expertName: data.expert_name });
          } else if (n.link_screen === "result" && n.link_data) {
            const data = n.link_data as { pred_id?: number };
            if (data.pred_id) {
              setOpen(false);
              push("result", { predId: data.pred_id });
            }
          }
        }}
      />
    </>
  );
};
