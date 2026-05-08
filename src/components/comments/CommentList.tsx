"use client";

import { Info, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommentItem, type CommentItemData } from "@/components/comments/CommentItem";

export type CommentSort = "newest" | "popular";

type CommentListProps = {
  comments: CommentItemData[];
  loading: boolean;
  sort: CommentSort;
  onSortChange: (next: CommentSort) => void;
  onLikeToggled: (id: string, liked: boolean, likeCount: number) => void;
  onDeleted: (id: string) => void;
};

export function CommentList({
  comments,
  loading,
  sort,
  onSortChange,
  onLikeToggled,
  onDeleted,
}: CommentListProps) {
  const t = useTranslations("comments");

  return (
    <div className="grid gap-3">
      {/* 정렬 + 보유자 필터 (placeholder) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Select value={sort} onValueChange={(v) => onSortChange(v as CommentSort)}>
          <SelectTrigger className="h-9 min-h-[36px] w-[120px] rounded-full px-3 text-[12px]" aria-label="Sort comments">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("sortNewest")}</SelectItem>
            <SelectItem value="popular">{t("sortPopular")}</SelectItem>
          </SelectContent>
        </Select>

        {/* 보유자 필터 — Phase 2, disabled placeholder */}
        <label
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-line/60 bg-white/60 px-3 py-1.5 text-[12px] font-semibold text-muted opacity-70"
          title={t("comingSoon")}
        >
          <input
            type="checkbox"
            disabled
            className="h-3.5 w-3.5 cursor-not-allowed accent-accent"
          />
          {t("holdersOnly")}
          <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-accent-deep">
            {t("comingSoon")}
          </span>
        </label>
      </div>

      {/* 외부 링크 주의 배너 */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-300/40 bg-amber-50/60 px-3 py-2 text-[12px] leading-snug text-amber-900">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>{t("externalLinkWarning")}</span>
      </div>

      {/* 목록 */}
      <div className="grid gap-2">
        {loading ? (
          <div className="grid gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[88px] animate-pulse rounded-2xl border border-line/40 bg-white/40"
              />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-line/60 bg-white/40 px-4 py-10 text-center">
            <MessageSquare size={22} className="text-muted" />
            <span className="text-[13px] text-muted-strong">{t("empty")}</span>
          </div>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onLikeToggled={onLikeToggled}
              onDeleted={onDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}
