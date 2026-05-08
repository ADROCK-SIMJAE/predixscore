"use client";

import { useState } from "react";
import { Shield, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SignInModalProps = {
  open: boolean;
  onClose: () => void;
};

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332C4.672 5.166 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function SignInModal({ open, onClose }: SignInModalProps) {
  const t = useTranslations("signin");
  const { user, signOut } = useAuth();
  const supabase = getBrowserSupabase();
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogle() {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="grid gap-4 p-6 sm:max-w-[420px]">
        <DialogHeader className="space-y-2 text-left">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {t("eyebrow")}
          </span>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight text-ink">
            {user ? t("signedInAs", { email: user.email ?? "" }) : t("title")}
          </DialogTitle>
          {!user ? (
            <p className="m-0 text-sm leading-relaxed text-muted-strong">
              {t("copy")}
            </p>
          ) : null}
        </DialogHeader>

        {user ? (
          <button
            type="button"
            className="inline-flex h-[42px] items-center justify-center gap-1.5 rounded-lg border border-line/60 bg-white/60 px-4 text-sm font-semibold text-muted-strong transition-colors hover:border-line-strong/40 hover:bg-white/95 hover:text-ink"
            onClick={async () => {
              await signOut();
              onClose();
            }}
          >
            {t("signOut")}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5 text-[15px] font-semibold tracking-tight text-ink shadow-sm transition-[transform,box-shadow,border-color] hover:-translate-y-px hover:border-line-strong/30 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              <GoogleGlyph />
              {t("continueGoogle")}
            </button>

            <div className="my-0.5 grid grid-cols-[1fr_auto_1fr] items-center gap-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted before:h-px before:bg-gradient-to-r before:from-transparent before:via-ink/15 before:to-transparent before:content-[''] after:h-px after:bg-gradient-to-r after:from-transparent after:via-ink/15 after:to-transparent after:content-['']">
              <span>{t("or")}</span>
            </div>

            <div className="grid gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                {t("walletComingSoonLabel")}
              </span>
              <div
                aria-disabled="true"
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl border border-dashed border-line/80 bg-ink/[0.02] px-4 py-3.5 text-left"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/8 text-accent">
                  <Wallet size={16} />
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="text-[14px] font-semibold tracking-tight text-ink">
                    {t("walletComingSoonTitle")}
                  </span>
                  <span className="truncate text-[12px] leading-snug text-muted">
                    {t("walletComingSoonDesc")}
                  </span>
                </span>
                <span className="shrink-0 rounded-md bg-accent/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-deep">
                  Soon
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-accent/10 bg-accent/[0.04] px-3.5 py-3 text-xs leading-relaxed text-muted-strong">
              <Shield size={14} className="mt-0.5 shrink-0 text-accent" />
              <span>{t("legalNote")}</span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
