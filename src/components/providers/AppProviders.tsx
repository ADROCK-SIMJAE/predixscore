"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { WalletProvider } from "./WalletProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WalletProvider>{children}</WalletProvider>
    </AuthProvider>
  );
}
