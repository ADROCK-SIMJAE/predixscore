"use client";

import { C } from "@/lib/tokens";
import { Gd } from "@/lib/grades";
import { T } from "@/lib/typography";
import { EXPERTS } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BackBar } from "@/components/ui/BackBar";

interface DMListScreenProps {
  onBack: () => void;
  push: (screen: string, data?: any) => void;
}

/* ── DMListScreen ─────────────── */
export const DMListScreen = ({ onBack, push }: DMListScreenProps) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, animation: "slideIn 0.28s" }}>
    <BackBar title="메시지" onBack={onBack} dark />
    {EXPERTS.slice(0, 3).map(e => {
      Gd(e.gk);
      return (
        <div key={e.rank} onClick={() => push("dm_chat", { conv: { name: e.name, gk: e.gk, online: true } })}
          style={{
            display: "flex", gap: 11, padding: "13px 16px", background: C.bg1,
            borderBottom: `1px solid ${C.bd}`, cursor: "pointer", transition: "background 0.15s",
          }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar name={e.name} size={42} gk={e.gk} />
            <div style={{
              position: "absolute", bottom: 1, right: 1, width: 10, height: 10,
              borderRadius: "50%", background: C.green, border: `1.5px solid ${C.bg}`,
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1 }}>{e.name}</span>
                <Badge gk={e.gk} sm />
              </div>
              <span style={{ fontSize: T.xs, color: C.t3 }}>10분 전</span>
            </div>
            <div style={{ fontSize: T.sm, color: C.t2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              최근 예측 분석 공유했어요.
            </div>
          </div>
        </div>
      );
    })}
  </div>
);
