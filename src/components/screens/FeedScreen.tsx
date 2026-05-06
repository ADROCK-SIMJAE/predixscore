"use client";

import { useState } from "react";
import { Globe, Award } from "lucide-react";
import { C } from "@/lib/tokens";
import { T } from "@/lib/typography";
import { usePreds } from "@/hooks/usePreds";
import { useFeed } from "@/hooks/useFeed";
import { Logo } from "@/components/ui/Logo";
import { SealBadge } from "@/components/ui/SealBadge";
import { BottomNav } from "@/components/nav/BottomNav";
import { PredictCard } from "@/components/cards/PredictCard";
import { FeedCard } from "@/components/cards/FeedCard";

interface FeedScreenProps {
  onNav: (screen: string) => void;
  push: (screen: string, data?: any) => void;
}

/* ── FeedScreen ─────────────── */
export const FeedScreen = ({ onNav, push }: FeedScreenProps) => {
  const [mainTab, setMainTab] = useState<"public" | "expert">("public");
  const [cat, setCat] = useState("전체");
  const cats = ["전체", "코인", "주식", "스포츠", "이슈", "정치"];
  const { data: preds = [] } = usePreds();
  const { data: feedItems = [] } = useFeed();

  const filteredPreds = cat === "전체"
    ? preds
    : preds.filter(p => p.cat === cat);

  const filteredFeed = cat === "전체"
    ? feedItems
    : feedItems.filter(f => f.cat === cat);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      {/* 헤더 */}
      <div style={{ padding: "10px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{
            fontSize: T.lg, fontWeight: T.bold, color: C.t1,
            fontFamily: T.display,
          }}>예측 피드</div>
        </div>
        <Logo />
      </div>

      {/* 메인 탭 */}
      <div style={{
        display: "flex", gap: 0, margin: "0 16px 0", background: C.bg1,
        borderRadius: T.r_md, padding: 3, border: `1px solid ${C.bd}`, flexShrink: 0,
      }}>
        <button onClick={() => setMainTab("public")}
          style={{
            flex: 1, padding: "10px 0",
            background: mainTab === "public" ? C.gold : "transparent",
            border: "none", borderRadius: T.r_sm,
            color: mainTab === "public" ? "#000" : C.t3,
            fontSize: T.sm, fontWeight: T.bold, cursor: "pointer", transition: "all 0.18s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
          <Globe size={14} strokeWidth={2.2} /> 공개 예측
        </button>
        <button onClick={() => setMainTab("expert")}
          style={{
            flex: 1, padding: "10px 0",
            background: mainTab === "expert" ? C.gold : "transparent",
            border: "none", borderRadius: T.r_sm,
            color: mainTab === "expert" ? "#000" : C.t3,
            fontSize: T.sm, fontWeight: T.bold, cursor: "pointer", transition: "all 0.18s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
          <Award size={14} strokeWidth={2.2} /> 전문가 예측
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 16px 8px", flexShrink: 0 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            style={{
              flexShrink: 0, padding: "5px 13px",
              background: cat === c ? C.gold : C.bg1,
              border: `1px solid ${cat === c ? C.gold : C.bd}`,
              borderRadius: T.r_pill, color: cat === c ? "#000" : C.t2,
              fontSize: T.sm, fontWeight: T.semibold, cursor: "pointer", transition: "all 0.18s",
            }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 16px 0" }}>

        {/* ── 공개 예측 탭 ── */}
        {mainTab === "public" && (
          <div style={{ animation: "fadeUp 0.25s" }}>
            <div style={{
              background: C.bg1, border: `1px solid ${C.bd}`,
              borderRadius: T.r_lg, padding: "10px 13px", marginBottom: 12,
              display: "flex", gap: 10, alignItems: "center",
            }}>
              <Globe size={18} color={C.gold} strokeWidth={2} />
              <div>
                <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1, marginBottom: 2 }}>
                  누구나 참여하는 공개 예측
                </div>
                <div style={{ fontSize: T.xs, color: C.t3 }}>
                  결과 공개 전까지 선택은 봉인됩니다
                </div>
              </div>
            </div>
            {filteredPreds.map(pred => (
              <div key={pred.id} style={{ marginBottom: 12 }}>
                <PredictCard pred={pred} onOpen={p => {
                  if (p.status === "revealed") { push("result", { pred: p }); return; }
                  push("pred_detail", { pred: p });
                }} />
              </div>
            ))}
          </div>
        )}

        {/* ── 전문가 예측 탭 ── */}
        {mainTab === "expert" && (
          <div style={{ animation: "fadeUp 0.25s" }}>
            <div style={{
              background: C.bg1, border: `1px solid ${C.bd}`,
              borderRadius: T.r_lg, padding: "10px 13px", marginBottom: 12,
              display: "flex", gap: 10, alignItems: "center",
            }}>
              <SealBadge size={22} gk="seer" />
              <div>
                <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.t1, marginBottom: 2 }}>
                  검증된 예측가의 분석
                </div>
                <div style={{ fontSize: T.xs, color: C.t3 }}>
                  Proven · Seer 전용 · 핵심 수치는 열람 후 공개
                </div>
              </div>
            </div>
            {filteredFeed.map(item => (
              <FeedCard key={item.id} item={item}
                onOpen={() => push("feed_detail", { item })} push={push} />
            ))}
          </div>
        )}

        <div style={{ height: 90 }} />
      </div>
      <BottomNav active="feed" onNav={onNav} />
    </div>
  );
};
