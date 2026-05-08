"use client";

import { useEffect, useState } from "react";
import { LogIn, Mail, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import { getBrowserSupabase } from "@/lib/supabase/browser";

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
  const [feedback, setFeedback] = useState<{ tone: "idle" | "success" | "error"; message: string }>({
    tone: "idle",
    message: "",
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleEmail() {
    if (!email.includes("@")) {
      setFeedback({ tone: "error", message: t("emailInvalid") });
      return;
    }
    setSubmitting(true);
    setFeedback({ tone: "idle", message: "" });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    setSubmitting(false);
    if (error) {
      setFeedback({ tone: "error", message: error.message });
    } else {
      setFeedback({ tone: "success", message: t("emailSent", { email }) });
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (error) {
      setSubmitting(false);
      setFeedback({ tone: "error", message: error.message });
    }
  }

  return (
    <div className="bet-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bet-modal signin-modal" onClick={(e) => e.stopPropagation()}>
        <header className="bet-modal-head">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h2>{user ? t("signedInAs", { email: user.email ?? "" }) : t("title")}</h2>
            {!user ? <p className="signin-copy">{t("copy")}</p> : null}
          </div>
          <button
            type="button"
            className="bet-modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

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
            <button type="button" className="solid-button" onClick={handleGoogle} disabled={submitting}>
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

            {feedback.tone !== "idle" ? (
              <div className={`feedback-box ${feedback.tone}`}>{feedback.message}</div>
            ) : null}

            <p className="footer-note">{t("legalNote")}</p>
          </>
        )}
      </div>
    </div>
  );
}
