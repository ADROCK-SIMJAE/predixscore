"use client";

// Identity-only wallet. The server pays gas via the sponsor wallet — the user
// never signs an onchain transaction or holds RON. We still keep a per-user
// burner so each user has a stable EVM address that the contract records as
// the owner of their commits.
//
// The wallet is generated automatically on first sign-in, stored in IndexedDB,
// and the address is bound to the Supabase user via /api/blockchain/commits
// (the RPC upserts user_wallets when the first commit lands).

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { createWallet, getStoredAddress, hasWallet, unlockWallet } from "@/lib/blockchain/wallet";
import { getChainConfig, isRegistryConfigured } from "@/lib/blockchain/config";

const AUTO_PASSWORD_STORAGE_KEY = "predixscore:wallet:auto-pass";

function ensureAutoPassword(): string {
  if (typeof window === "undefined") return "predixscore-poc";
  let value = window.localStorage.getItem(AUTO_PASSWORD_STORAGE_KEY);
  if (!value) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    value = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
    window.localStorage.setItem(AUTO_PASSWORD_STORAGE_KEY, value);
  }
  return value;
}

type WalletContextValue = {
  ready: boolean;
  configured: boolean;
  address: `0x${string}` | null;
  chainId: number;
  chainName: string;
  explorerUrl: string;
  ensureAddress: () => Promise<`0x${string}` | null>;
};

const Context = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const cfg = getChainConfig();
  const configured = isRegistryConfigured();
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [ready, setReady] = useState(false);

  const userKey = user?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!userKey) {
        setAddress(null);
        setReady(true);
        return;
      }
      const password = ensureAutoPassword();
      const exists = await hasWallet(userKey);
      let addr: `0x${string}` | null;
      if (exists) {
        const info = await unlockWallet(userKey, password);
        addr = info?.address ?? (await getStoredAddress(userKey));
      } else {
        const info = await createWallet(userKey, password);
        addr = info.address;
      }
      if (cancelled) return;
      setAddress(addr);
      setReady(true);
    }
    setReady(false);
    init();
    return () => {
      cancelled = true;
    };
  }, [userKey]);

  const ensureAddress = useCallback(async () => {
    if (!userKey) return null;
    const password = ensureAutoPassword();
    const exists = await hasWallet(userKey);
    if (!exists) {
      const info = await createWallet(userKey, password);
      setAddress(info.address);
      return info.address;
    }
    const info = await unlockWallet(userKey, password);
    const addr = info?.address ?? (await getStoredAddress(userKey));
    setAddress(addr);
    return addr;
  }, [userKey]);

  const value = useMemo<WalletContextValue>(
    () => ({
      ready,
      configured,
      address,
      chainId: cfg.chainId,
      chainName: cfg.name,
      explorerUrl: cfg.explorerUrl,
      ensureAddress,
    }),
    [ready, configured, address, cfg.chainId, cfg.name, cfg.explorerUrl, ensureAddress],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWallet() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
