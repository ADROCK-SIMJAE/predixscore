"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useLoginWithOAuth,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { ArrowRight, Wallet, X } from "lucide-react";

type AuthDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const t = useTranslations("auth");

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="auth-modal" onClick={onClose}>
      <div className="auth-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal-head">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h3>{t("title")}</h3>
            <p>{t("copy")}</p>
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {process.env.NEXT_PUBLIC_PRIVY_APP_ID ? (
          <PrivyAuthBody onClose={onClose} />
        ) : (
          <p className="footer-note">{t("currentBuild")}</p>
        )}
      </div>
    </div>
  );
}

function PrivyAuthBody({ onClose }: { onClose: () => void }) {
  const t = useTranslations("auth");
  const { ready, authenticated, user, logout, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth();
  const [walletError, setWalletError] = useState<string | null>(null);
  const autoLoginRequested = useRef(false);

  useEffect(() => {
    if (!authenticated && wallets[0] && !autoLoginRequested.current) {
      autoLoginRequested.current = true;
      wallets[0]
        .loginOrLink()
        .catch((error) => {
          const message = error instanceof Error ? error.message : "Wallet login failed.";
          setWalletError(message);
          autoLoginRequested.current = false;
        });
    }
  }, [authenticated, wallets]);

  useEffect(() => {
    if (authenticated) onClose();
  }, [authenticated, onClose]);

  const identity = useMemo(() => {
    const linkedAccounts = (user as unknown as { linkedAccounts?: Array<Record<string, unknown>> })
      ?.linkedAccounts ?? [];
    const emailAccount = linkedAccounts.find((account) => "email" in account);
    const walletAccount =
      linkedAccounts.find((account) => "address" in account) ?? wallets[0];
    return {
      email: (emailAccount as { email?: string } | undefined)?.email ?? null,
      wallet: (walletAccount as { address?: string } | undefined)?.address ?? null,
    };
  }, [user, wallets]);

  if (!ready) {
    return <p className="footer-note">{t("currentBuild")}</p>;
  }

  if (authenticated) {
    return (
      <>
        <div className="watch-card" style={{ marginTop: 22 }}>
          <strong style={{ fontSize: 18 }}>{t("loggedIn")}</strong>
          <p className="footer-note">
            {identity.email ?? t("noGoogle")}
            <br />
            {identity.wallet ?? t("noWallet")}
          </p>
        </div>
        <div className="auth-action-grid">
          <button className="ghost-button" type="button" onClick={() => logout()}>
            {t("signOut")}
            <ArrowRight size={16} />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="auth-action-grid">
        <button
          className="solid-button"
          type="button"
          onClick={() => initOAuth({ provider: "google" })}
          disabled={oauthLoading}
        >
          {t("continueGoogle")}
          <ArrowRight size={16} />
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={async () => {
            setWalletError(null);
            autoLoginRequested.current = false;
            await connectWallet({
              description: "Connect an EVM wallet to sign in and prepare trading.",
            });
          }}
        >
          {t("continueWallet")}
          <Wallet size={16} />
        </button>
      </div>

      {walletError ? (
        <div className="feedback-box error" style={{ marginTop: 16 }}>
          {walletError}
        </div>
      ) : null}

      <p className="footer-note">{t("walletAuthCopy")}</p>
    </>
  );
}
