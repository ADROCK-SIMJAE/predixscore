"use client";

import { useState } from "react";
import { Play, Gem, Crown, Lock, Unlock, User, Clock } from "lucide-react";
import { C } from "@/lib/tokens";
import { Gd } from "@/lib/grades";
import { Cm } from "@/lib/categories";
import { T } from "@/lib/typography";
import { useUnlock, useIsUnlocked } from "@/hooks/useUnlock";
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
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const g = Gd(item.agk);
  const cm = Cm(item.cat);
  const stripeColor = cm.stripe ?? cm.c;
  const unlock = useUnlock();
  const { data: isUnlocked } = useIsUnlocked("feed_item", item.id);

  const unlockOptions: UnlockSheetOption[] = [
    {
      icon: <Play size={18} color={C.mint} strokeWidth={2} />,
      title: "광고 시청으로 무료 보기",
      desc: "30초 광고 시청 → 즉시 열람",
      badge: "무료",
      c: C.mint,
      bg: "rgba(110,231,183,0.07)",
      bd: "rgba(110,231,183,0.25)",
      method: "ad",
      cost: 0,
    },
    {
      icon: <Gem size={18} color={C.goldL} strokeWidth={2} />,
      title: "포인트로 보기",
      desc: "보유 포인트 차감 · 즉시 열람",
      badge: `${item.price}P`,
      c: C.goldL,
      bg: C.goldBg,
      bd: C.goldBd,
      method: "points",
      cost: item.price,
    },
    {
      icon: <Crown size={18} color={C.seerL} strokeWidth={2} />,
      title: `${item.author} 구독하기`,
      desc: "모든 예측 무제한 열람",
      badge: "구독",
      c: C.seerL,
      bg: C.seerBg,
      bd: C.seerBd,
      method: "subscription",
      cost: 0,
    },
  ];

  const handleUnlock = async (opt: UnlockSheetOption) => {
    if (!opt.method) return;
    setUnlockError(null);
    try {
      await unlock.mutateAsync({
        contentType: "feed_item",
        contentId: item.id,
        method: opt.method,
        cost: opt.cost ?? 0,
      });
      setShowUnlock(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "열람 실패";
      const ko = msg.includes("insufficient") ? "포인트가 부족합니다." : msg;
      setUnlockError(ko);
    }
  };

  return (
    <>
      <UnlockSheet
        open={showUnlock}
        onClose={() => setShowUnlock(false)}
        options={unlockOptions}
        sealGk={item.agk}
        headerDesc={unlockError ?? "아래 방법 중 하나를 선택하세요"}
        onSelect={handleUnlock}
      />
      <div style={{
        background: C.bg1,
        border: `1px solid ${C.bd}`,
        borderRadius: T.r_lg,
        overflow: "hidden",
        marginBottom: 10,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        display: "flex",
        transition: "transform 180ms cubic-bezier(0.32,0.72,0,1), box-shadow 180ms cubic-bezier(0.32,0.72,0,1)",
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = T.shadow_lift + ", inset 0 1px 0 rgba(255,255,255,0.04)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04)";
        }}
      >
        {/* 카테고리 컬러 스트라이프 */}
        <div style={{
          width: 3,
          flexShrink: 0,
          background: stripeColor,
          opacity: 0.85,
        }} />

        <div style={{ flex: 1, padding: "14px 14px" }}>
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
                  적중 <span style={{ color: C.mint, fontWeight: T.semibold }}>{item.acc}%</span>
                </span>
                <span style={{ fontSize: T.xs, color: C.t3 }}>·</span>
                <span style={{ fontSize: T.xs, color: C.t3 }}>{item.preds}회</span>
              </div>
            </div>
            <span style={{
              background: cm.bg, color: cm.c, border: `1px solid ${cm.c}28`,
              borderRadius: T.r_pill, padding: "2px 9px",
              fontSize: T.xs, fontWeight: T.semibold, flexShrink: 0,
              letterSpacing: T.ls_label,
            }}>
              {item.cat}
            </span>
          </div>

          {/* 예측 제목 */}
          <div style={{
            fontSize: T.md, fontWeight: T.semibold, color: C.t1,
            lineHeight: T.normal, marginBottom: 12,
            letterSpacing: "-0.01em",
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
              background: C.goldBg, border: `1px solid ${C.goldBd}`,
              borderRadius: T.r_pill, padding: "3px 10px",
            }}>
              <Clock size={11} color={C.gold} strokeWidth={2} />
              <span style={{ fontSize: T.xs, color: C.gold, fontWeight: T.semibold, fontFamily: T.mono }}>{item.dl}</span>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: T.xs, color: C.t3 }}>
              <Lock size={10} strokeWidth={1.8} />
              열람 후 공개
            </span>
          </div>

          {/* 열람 버튼 */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowUnlock(true)}
              style={{
                flex: 1, padding: "11px 0",
                background: isUnlocked
                  ? C.bg2
                  : `linear-gradient(180deg, ${C.goldL}, ${C.gold})`,
                border: isUnlocked ? `1px solid ${C.bd}` : `1px solid ${C.goldL}40`,
                borderRadius: T.r_md,
                color: isUnlocked ? C.gold : "#000",
                fontSize: T.sm, fontWeight: T.bold, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
              }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              <Unlock size={14} strokeWidth={2.2} />
              {isUnlocked ? "열람 완료" : "열람하기"}
            </button>
            <button
              onClick={() => { if (push) push("expert", { expertName: item.author }); }}
              style={{
                flex: 1, padding: "11px 0",
                background: C.bg2,
                border: `1px solid ${C.bd}`, borderRadius: T.r_md,
                color: C.t1, fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.bdL; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.bd; }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              <User size={14} strokeWidth={2} />
              예측자
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
