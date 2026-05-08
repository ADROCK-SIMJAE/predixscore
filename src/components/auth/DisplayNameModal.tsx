"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type DisplayNameModalProps = {
  open: boolean;
  onClose: () => void;
};

export function DisplayNameModal({ open, onClose }: DisplayNameModalProps) {
  const t = useTranslations("displayName");
  const { profile, refreshProfile } = useAuth();
  const supabase = getBrowserSupabase();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(profile?.display_name ?? "");
  }, [profile?.display_name]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit() {
    if (name.trim().length < 2) {
      setError(t("tooShort"));
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("set_display_name", { p_name: name.trim() });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    await refreshProfile();
    onClose();
  }

  return (
    <div className="bet-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bet-modal" onClick={(e) => e.stopPropagation()}>
        <header className="bet-modal-head">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h2>{t("title")}</h2>
            <p className="signin-copy">{t("copy")}</p>
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

        <div className="bet-modal-section">
          <label className="bet-modal-label">{t("label")}</label>
          <div className="bet-modal-stake-row">
            <input
              className="bet-modal-stake-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("placeholder")}
              maxLength={20}
              autoFocus
            />
          </div>
        </div>

        {error ? <div className="feedback-box error">{error}</div> : null}

        <button
          type="button"
          className="bet-submit yes"
          onClick={submit}
          disabled={submitting || name.trim().length < 2}
        >
          {submitting ? t("saving") : t("save")}
        </button>
      </div>
    </div>
  );
}
