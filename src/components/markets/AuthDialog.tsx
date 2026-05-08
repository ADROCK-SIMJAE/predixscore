"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AuthDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const t = useTranslations("auth");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="grid gap-4 p-6 sm:max-w-[420px]">
        <DialogHeader className="space-y-2 text-left">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {t("eyebrow")}
          </span>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight text-ink">
            {t("title")}
          </DialogTitle>
          <p className="m-0 text-sm leading-relaxed text-muted-strong">{t("copy")}</p>
        </DialogHeader>
        <p className="text-xs leading-relaxed text-muted">{t("currentBuild")}</p>
      </DialogContent>
    </Dialog>
  );
}
