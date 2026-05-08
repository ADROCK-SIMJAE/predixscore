"use client";

import { useState } from "react";
import { Heart, MoreHorizontal, Share2, Flag, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeAgo } from "@/lib/format";

export type CommentItemData = {
  id: string;
  body: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  likeCount: number;
  likedByMe: boolean;
};

type CommentItemProps = {
  comment: CommentItemData;
  onLikeToggled: (id: string, liked: boolean, likeCount: number) => void;
  onDeleted: (id: string) => void;
};

export function CommentItem({ comment, onLikeToggled, onDeleted }: CommentItemProps) {
  const t = useTranslations("comments");
  const { user } = useAuth();
  const [busyLike, setBusyLike] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  const isMine = user?.id === comment.user.id;
  const displayName = comment.user.displayName ?? "anonymous";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const ago = formatRelativeAgo(comment.createdAt) ?? "";

  async function handleLike() {
    if (busyLike) return;
    setBusyLike(true);
    // 낙관적 업데이트
    const prevLiked = comment.likedByMe;
    const nextLiked = !prevLiked;
    const optimisticCount = comment.likeCount + (nextLiked ? 1 : -1);
    onLikeToggled(comment.id, nextLiked, Math.max(optimisticCount, 0));
    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, { method: "POST" });
      const json = (await res.json()) as { error?: string; liked?: boolean; likeCount?: number };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onLikeToggled(comment.id, Boolean(json.liked), json.likeCount ?? 0);
    } catch (error) {
      // 롤백
      onLikeToggled(comment.id, prevLiked, comment.likeCount);
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusyLike(false);
    }
  }

  async function handleShare() {
    try {
      const url = `${window.location.origin}${window.location.pathname}#comment-${comment.id}`;
      await navigator.clipboard.writeText(url);
      toast.success(t("shared"));
    } catch {
      toast.error("Clipboard error");
    }
  }

  function handleReport() {
    toast.success(t("reported"));
  }

  async function handleDelete() {
    if (busyDelete) return;
    if (!window.confirm(t("deleteConfirm"))) return;
    setBusyDelete(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      toast.success(t("deleted"));
      onDeleted(comment.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusyDelete(false);
    }
  }

  return (
    <article
      id={`comment-${comment.id}`}
      className="flex items-start gap-3 rounded-2xl border border-line/40 bg-white/60 px-3.5 py-3 transition-colors hover:bg-white/90"
    >
      {comment.user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={comment.user.avatarUrl}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/30 to-accent-deep/40 text-[13px] font-bold text-white">
          {initial}
        </span>
      )}

      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-ink">{displayName}</span>
          <span className="text-[11px] text-muted tabular-nums">{ago}</span>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                  aria-label="More"
                >
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 size={14} />
                  {t("share")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReport}>
                  <Flag size={14} />
                  {t("report")}
                </DropdownMenuItem>
                {isMine ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onClick={handleDelete} disabled={busyDelete}>
                      <Trash2 size={14} />
                      {t("delete")}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="m-0 whitespace-pre-wrap break-words text-[14px] leading-snug text-ink/90">
          {comment.body}
        </p>

        <div className="mt-0.5">
          <button
            type="button"
            onClick={handleLike}
            disabled={busyLike}
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-semibold tabular-nums transition-colors ${
              comment.likedByMe
                ? "bg-rose-50 text-rose-600"
                : "text-muted hover:bg-ink/5 hover:text-ink"
            } disabled:opacity-60`}
            aria-pressed={comment.likedByMe}
          >
            <Heart size={14} fill={comment.likedByMe ? "currentColor" : "none"} />
            {comment.likeCount > 0 ? comment.likeCount : ""}
          </button>
        </div>
      </div>
    </article>
  );
}
