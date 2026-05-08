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
      <DialogContent className="grid gap-4 p-6">
        <DialogHeader>
          <span className="eyebrow">{t("eyebrow")}</span>
          <DialogTitle>{t("title")}</DialogTitle>
          <p className="signin-copy">{t("copy")}</p>
        </DialogHeader>
        <p className="footer-note text-xs text-muted">{t("currentBuild")}</p>
      </DialogContent>
    </Dialog>
  );
}
