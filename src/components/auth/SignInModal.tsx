"use client";

import { useState } from "react";
import { LogIn, Mail } from "lucide-react";
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

export function SignInModal({ open, onClose }: SignInModalProps) {
  const t = useTranslations("signin");
  const { user, signOut } = useAuth();
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleEmail() {
    if (!email.includes("@")) {
      toast.error(t("emailInvalid"));
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else toast.success(t("emailSent", { email }));
  }

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
      <DialogContent className="grid gap-4 p-6">
        <DialogHeader>
          <span className="eyebrow">{t("eyebrow")}</span>
          <DialogTitle>
            {user ? t("signedInAs", { email: user.email ?? "" }) : t("title")}
          </DialogTitle>
          {!user ? <p className="signin-copy">{t("copy")}</p> : null}
        </DialogHeader>

        {user ? (
          <button
            type="button"
            className="ghost-button"
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
              className="solid-button inline-flex items-center justify-center gap-2"
              onClick={handleGoogle}
              disabled={submitting}
            >
              <LogIn size={16} />
              {t("continueGoogle")}
            </button>

            <div className="signin-divider">
              <span>{t("or")}</span>
            </div>

            <div className="bet-modal-section">
              <label className="bet-modal-label">{t("emailLabel")}</label>
              <div className="bet-modal-stake-row">
                <Mail size={16} className="signin-mail-icon" />
                <input
                  type="email"
                  className="bet-modal-stake-input signin-email-input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("emailPlaceholder")}
                  autoComplete="email"
                />
              </div>
              <button
                type="button"
                className="solid-button"
                onClick={handleEmail}
                disabled={submitting || !email}
              >
                {submitting ? t("sending") : t("sendMagicLink")}
              </button>
            </div>

            <p className="text-xs text-muted">{t("legalNote")}</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
