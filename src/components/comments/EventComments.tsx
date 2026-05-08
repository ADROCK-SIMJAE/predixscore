"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { CommentCompose } from "@/components/comments/CommentCompose";
import {
  CommentList,
  type CommentSort,
} from "@/components/comments/CommentList";
import type { CommentItemData } from "@/components/comments/CommentItem";

type EventCommentsProps = {
  eventSlug: string;
};

type TabKey = "comments" | "holders" | "positions" | "activity";

const TABS: { key: TabKey; labelKey: "tabComments" | "tabHolders" | "tabPositions" | "tabActivity" }[] = [
  { key: "comments", labelKey: "tabComments" },
  { key: "holders", labelKey: "tabHolders" },
  { key: "positions", labelKey: "tabPositions" },
  { key: "activity", labelKey: "tabActivity" },
];

export function EventComments({ eventSlug }: EventCommentsProps) {
  const t = useTranslations("comments");
  const [tab, setTab] = useState<TabKey>("comments");
  const [comments, setComments] = useState<CommentItemData[]>([]);
  const [sort, setSort] = useState<CommentSort>("newest");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/comments?eventSlug=${encodeURIComponent(eventSlug)}&sort=${sort}&limit=50`,
          { signal, cache: "no-store" },
        );
        const json = (await res.json()) as { error?: string; comments?: CommentItemData[] };
        if (!res.ok) throw new Error(json.error ?? "Failed");
        setComments(json.comments ?? []);
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        // 조회 실패는 콘솔 노이즈 최소화 — 에러 영역 노출 대신 빈 목록 처리
        setComments([]);
      } finally {
        setLoading(false);
      }
    },
    [eventSlug, sort],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void reload(ctrl.signal);
    return () => ctrl.abort();
  }, [reload]);

  const handlePosted = useCallback(() => {
    void reload();
  }, [reload]);

  const handleLikeToggled = useCallback(
    (id: string, liked: boolean, likeCount: number) => {
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, likedByMe: liked, likeCount } : c)),
      );
    },
    [],
  );

  const handleDeleted = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <section className="glass-panel grid gap-4 p-[20px_22px]">
      {/* 탭 헤더 */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-line/60 -mx-1.5">
        {TABS.map(({ key, labelKey }) => {
          const isActive = tab === key;
          const label =
            key === "comments" ? t(labelKey, { count: comments.length }) : t(labelKey);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`relative shrink-0 px-3.5 py-2.5 text-[13px] font-semibold tracking-tight transition-colors ${
                isActive ? "text-ink" : "text-muted hover:text-ink"
              }`}
              aria-pressed={isActive}
            >
              {label}
              {isActive ? (
                <span className="absolute inset-x-1.5 -bottom-px h-[2px] rounded-full bg-accent" />
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "comments" ? (
        <>
          <CommentCompose eventSlug={eventSlug} onPosted={handlePosted} />
          <CommentList
            comments={comments}
            loading={loading}
            sort={sort}
            onSortChange={setSort}
            onLikeToggled={handleLikeToggled}
            onDeleted={handleDeleted}
          />
        </>
      ) : (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-line/60 bg-white/40 px-4 py-12 text-center">
          <Sparkles size={20} className="text-accent" />
          <span className="text-[13px] font-semibold text-ink">{t("comingSoon")}</span>
        </div>
      )}
    </section>
  );
}
