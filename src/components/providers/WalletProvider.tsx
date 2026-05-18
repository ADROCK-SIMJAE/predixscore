"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Wallet } from "ethers";
import { useAuth } from "./AuthProvider";
import {
  buildSigner,
  createWallet,
  getStoredAddress,
  hasWallet,
  unlockWallet,
  type WalletInfo,
} from "@/lib/blockchain/wallet";
import { getChainConfig, isRegistryConfigured } from "@/lib/blockchain/config";

type WalletContextValue = {
  ready: boolean;
  configured: boolean;
  address: `0x${string}` | null;
  hasLocalWallet: boolean;
  unlocked: boolean;
  chainId: number;
  chainName: string;
  explorerUrl: string;
  ensureWallet: (password: string) => Promise<WalletInfo>;
  unlock: (password: string) => Promise<WalletInfo | null>;
  lock: () => void;
  getSigner: () => Wallet | null;
};

const Context = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const cfg = getChainConfig();
  const configured = isRegistryConfigured();
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [hasLocalWallet, setHasLocal] = useState(false);
  const [ready, setReady] = useState(false);
  const signerRef = useRef<Wallet | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const userKey = user?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!userKey) {
        setAddress(null);
        setHasLocal(false);
        signerRef.current = null;
        setUnlocked(false);
        setReady(true);
        return;
      }
      const exists = await hasWallet(userKey);
      const addr = await getStoredAddress(userKey);
      if (cancelled) return;
      setHasLocal(exists);
      setAddress(addr);
      setReady(true);
    }
    setReady(false);
    init();
    return () => {
      cancelled = true;
    };
  }, [userKey]);

  const ensureWallet = useCallback(
    async (password: string): Promise<WalletInfo> => {
      if (!userKey) throw new Error("Sign in required.");
      const exists = await hasWallet(userKey);
      let info: WalletInfo | null = null;
      if (exists) {
        info = await unlockWallet(userKey, password);
        if (!info) throw new Error("Wrong wallet password.");
      } else {
        info = await createWallet(userKey, password);
      }
      signerRef.current = buildSigner(info.privateKey);
      setAddress(info.address);
      setHasLocal(true);
      setUnlocked(true);
      return info;
    },
    [userKey],
  );

  const unlock = useCallback(
    async (password: string) => {
      if (!userKey) return null;
      const info = await unlockWallet(userKey, password);
      if (!info) return null;
      signerRef.current = buildSigner(info.privateKey);
      setAddress(info.address);
      setUnlocked(true);
      return info;
    },
    [userKey],
  );

  const lock = useCallback(() => {
    signerRef.current = null;
    setUnlocked(false);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      ready,
      configured,
      address,
      hasLocalWallet,
      unlocked,
      chainId: cfg.chainId,
      chainName: cfg.name,
      explorerUrl: cfg.explorerUrl,
      ensureWallet,
      unlock,
      lock,
      getSigner: () => signerRef.current,
    }),
    [ready, configured, address, hasLocalWallet, unlocked, cfg.chainId, cfg.name, cfg.explorerUrl, ensureWallet, unlock, lock],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWallet() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
