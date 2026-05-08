"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setName(profile?.display_name ?? "");
  }, [profile?.display_name]);

  async function submit() {
    if (name.trim().length < 2) {
      toast.error(t("tooShort"));
      return;
    }
    setSubmitting(true);
    const { error: rpcError } = await supabase.rpc("set_display_name", { p_name: name.trim() });
    setSubmitting(false);
    if (rpcError) {
      toast.error(rpcError.message);
      return;
    }
    await refreshProfile();
    toast.success(t("save"));
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="grid gap-4 p-6">
        <DialogHeader>
          <span className="text-muted text-[12px] tracking-[0.14em] uppercase">{t("eyebrow")}</span>
          <DialogTitle>{t("title")}</DialogTitle>
          <p className="mt-2.5 text-muted-strong text-[14px] leading-[1.55]">{t("copy")}</p>
        </DialogHeader>

        <div className="grid gap-2.5">
          <label className="text-[12px] uppercase tracking-[0.08em] text-muted font-semibold">{t("label")}</label>
          <div className="flex items-center gap-2 px-[18px] py-3.5 rounded-[16px] bg-white/[0.85] border border-ink/[0.08]">
            <input
              className="flex-1 border-none bg-transparent outline-none text-[28px] font-semibold tracking-[-0.02em] text-ink tabular-nums"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("placeholder")}
              maxLength={20}
              autoFocus
            />
          </div>
        </div>

        <button
          type="button"
          className="w-full py-3.5 rounded-[8px] border-none cursor-pointer font-bold text-[15px] tracking-[-0.01em] text-white bg-[#0fa968] transition-colors duration-[160ms] hover:enabled:bg-[#0d8e58] disabled:bg-ink/10 disabled:text-ink/40 disabled:cursor-not-allowed"
          onClick={submit}
          disabled={submitting || name.trim().length < 2}
        >
          {submitting ? t("saving") : t("save")}
        </button>
      </DialogContent>
    </Dialog>
  );
}
