"use client";

import { useState } from "react";
import { Play, Gem, Crown, Lock, Unlock, User, Clock } from "lucide-react";
import { C } from "@/lib/tokens";
import { Gd } from "@/lib/grades";
import { Cm } from "@/lib/categories";
import { T } from "@/lib/typography";
import { EXPERTS } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SealBadge } from "@/components/ui/SealBadge";
import { BlindTitle } from "@/components/ui/BlindTitle";
import { UnlockSheet, UnlockSheetOption } from "@/components/modals/UnlockSheet";
import type { FeedItem } from "@/types";

interface FeedCardProps {
  item: FeedItem;
  onOpen?: () => void;
  push?: (screen: string, data?: any) => void;
}

/* ── FeedCard ─────────────── */
export const FeedCard = ({ item, push }: FeedCardProps) => {
  const [showUnlock, setShowUnlock] = useState(false);
  const g = Gd(item.agk);
  const cm = Cm(item.cat);

  const unlockOptions: UnlockSheetOption[] = [
    {
      icon: <Play size={18} color="#7AC074" strokeWidth={2} />,
      title: "광고 시청으로 무료 보기",
      desc: "30초 광고 시청 → 즉시 열람",
      badge: "무료", c: "#7AC074",
      bg: "rgba(122,192,116,0.08)",
      bd: "rgba(122,192,116,0.3)",
    },
    {
      icon: <Gem size={18} color={C.goldL} strokeWidth={2} />,
      title: "포인트로 보기",
      desc: "보유 포인트 차감 · 즉시 열람",
      badge: `${item.price}P`, c: C.goldL,
      bg: C.goldBg, bd: C.goldBd,
    },
    {
      icon: <Crown size={18} color={C.seerL} strokeWidth={2} />,
      title: `${item.author} 구독하기`,
      desc: "모든 예측 무제한 열람",
      badge: "구독", c: C.seerL,
      bg: C.seerBg, bd: C.seerBd,
    },
  ];

  return (
    <>
      <UnlockSheet
        open={showUnlock}
        onClose={() => setShowUnlock(false)}
        options={unlockOptions}
        sealGk={item.agk}
      />
      <div style={{
        background: C.bg1,
        border: `1px solid ${C.bd}`,
        borderRadius: T.r_lg, overflow: "hidden", marginBottom: 12,
        boxShadow: T.shadow_sm,
      }}>
        <div style={{ padding: "13px 14px" }}>
          {/* 작성자 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ position: "relative" }}>
              <Avatar name={item.author} size={38} gk={item.agk} />
              <div style={{ position: "absolute", bottom: -2, right: -2 }}>
                <SealBadge size={16} gk={item.agk} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: T.base, fontWeight: T.semibold, color: C.t1 }}>{item.author}</span>
                <Badge gk={item.agk} sm />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: T.xs, color: C.t2 }}>
                  Score <span style={{
                    color: g.color, fontWeight: T.semibold,
                    fontFamily: T.mono,
                  }}>{item.score}</span>
                </span>
                <span style={{ fontSize: T.xs, color: C.t3 }}>·</span>
                <span style={{ fontSize: T.xs, color: C.t2 }}>
                  적중 <span style={{ color: C.green, fontWeight: T.semibold }}>{item.acc}%</span>
                </span>
                <span style={{ fontSize: T.xs, color: C.t3 }}>·</span>
                <span style={{ fontSize: T.xs, color: C.t3 }}>{item.preds}회</span>
              </div>
            </div>
            <span style={{
              background: cm.bg, color: cm.c, border: `1px solid ${cm.c}30`,
              borderRadius: T.r_pill, padding: "2px 9px", fontSize: T.xs, fontWeight: T.semibold, flexShrink: 0,
            }}>
              {item.cat}
            </span>
          </div>

          {/* 예측 제목 */}
          <div style={{
            fontSize: T.md, fontWeight: T.semibold, color: C.t1,
            lineHeight: T.relaxed, marginBottom: 12,
          }}>
            <BlindTitle parts={item.titleParts} />
          </div>

          {/* 마감 + 안내 */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 12,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: `rgba(201,160,48,0.06)`, border: `1px solid ${C.goldBd}`,
              borderRadius: T.r_pill, padding: "3px 10px",
            }}>
              <Clock size={11} color={C.gold} strokeWidth={2} />
              <span style={{ fontSize: T.xs, color: C.gold, fontWeight: T.semibold }}>{item.dl}</span>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: T.xs, color: C.t3 }}>
              <Lock size={10} strokeWidth={1.8} />
              열람 후 공개
            </span>
          </div>

          {/* 열람 버튼 */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowUnlock(true)}
              style={{
                flex: 1, padding: "11px 0",
                background: C.gold,
                border: "none", borderRadius: T.r_md,
                color: "#000", fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
              <Unlock size={14} strokeWidth={2.2} />
              열람하기
            </button>
            <button onClick={() => {
              const expert = EXPERTS.find(e => e.name === item.author);
              if (expert && push) push("expert", { expert });
            }}
              style={{
                flex: 1, padding: "11px 0",
                background: C.bg2,
                border: `1px solid ${C.bd}`, borderRadius: T.r_md,
                color: C.t1, fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
              <User size={14} strokeWidth={2} />
              예측자
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
