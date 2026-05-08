"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { SignInModal } from "@/components/auth/SignInModal";

type CommentComposeProps = {
  eventSlug: string;
  onPosted: () => void;
};

const MAX_LENGTH = 1000;

export function CommentCompose({ eventSlug, onPosted }: CommentComposeProps) {
  const t = useTranslations("comments");
  const { user, profile } = useAuth();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  const isAuthed = Boolean(user);
  const trimmed = body.trim();
  const canSubmit = isAuthed && trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !submitting;

  // 작성자 아바타 이니셜
  const initial = (profile?.display_name ?? user?.email ?? "?").trim().charAt(0).toUpperCase();

  async function handleSubmit() {
    if (!isAuthed) {
      setSignInOpen(true);
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventSlug, body: trimmed }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Could not post.");
      setBody("");
      onPosted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 rounded-2xl border border-line/60 bg-white/70 px-3.5 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/30 to-accent-deep/40 text-[13px] font-bold text-white">
          {initial}
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
            onClick={() => {
              if (!isAuthed) setSignInOpen(true);
            }}
            placeholder={isAuthed ? t("composePlaceholder") : t("composeSignIn")}
            disabled={!isAuthed || submitting}
            rows={1}
            className="min-h-[36px] w-full resize-none border-none bg-transparent text-[14px] leading-snug text-ink placeholder:text-muted focus:outline-none disabled:cursor-pointer disabled:opacity-90"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {isAuthed ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] tabular-nums text-muted">
                {trimmed.length}/{MAX_LENGTH}
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-semibold tracking-tight text-white transition-[transform,opacity] hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {submitting ? t("posting") : t("post")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
