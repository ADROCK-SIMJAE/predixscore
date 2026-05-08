"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
import { BalanceChip } from "@/components/portfolio/BalanceChip";
import { SignInModal } from "@/components/auth/SignInModal";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const NAV_LINK_BASE =
  "relative inline-flex h-[38px] items-center px-1 text-[13px] font-semibold tracking-tight text-muted-strong transition-colors hover:text-ink";
const NAV_LINK_UNDERLINE_BASE =
  "after:absolute after:left-1 after:right-1 after:bottom-1 after:h-[2px] after:rounded-[1px] after:bg-transparent after:transition-colors";
const NAV_LINK_HOVER_UNDERLINE = "hover:after:bg-ink/20";
const NAV_LINK_ACTIVE = "text-ink after:bg-accent";

const NAV_LINK_MOBILE_BASE =
  "inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[12px] font-semibold tracking-tight transition-colors";
const NAV_LINK_MOBILE_ACTIVE =
  "bg-[linear-gradient(135deg,#0f6dff_0%,#42a0ff_100%)] text-white shadow-[0_4px_12px_rgba(15,109,255,0.2)]";
const NAV_LINK_MOBILE_INACTIVE =
  "text-[color:var(--muted-strong)] hover:bg-white/95";

export function AppHeader() {
  const t = useTranslations("header");
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const navLinkClass = (href: string) =>
    [
      NAV_LINK_BASE,
      NAV_LINK_UNDERLINE_BASE,
      isActive(href) ? NAV_LINK_ACTIVE : NAV_LINK_HOVER_UNDERLINE,
    ].join(" ");

  const mobileNavLinkClass = (href: string) =>
    [
      NAV_LINK_MOBILE_BASE,
      isActive(href) ? NAV_LINK_MOBILE_ACTIVE : NAV_LINK_MOBILE_INACTIVE,
    ].join(" ");

  const displayName =
    profile?.display_name ?? user?.email?.split("@")[0] ?? t("profile");

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-line/60 bg-white/80 backdrop-blur-xl shadow-[0_4px_16px_rgba(13,28,65,0.04)]">
        <div className="flex items-center justify-between gap-3 px-3 py-2 md:gap-6 md:px-5 md:py-3">
          <Link href="/" className="flex items-center no-underline">
            <h1 className="m-0 font-display text-lg font-bold tracking-tight text-ink md:text-2xl">
              {t("brandName")}
            </h1>
          </Link>

          <nav className="hidden items-center gap-[18px] md:flex">
            <Link className={navLinkClass("/")} href="/">
              {t("navPredict")}
            </Link>
            <Link className={navLinkClass("/positions")} href="/positions">
              {t("navPositions")}
            </Link>
            <Link className={navLinkClass("/leaderboard")} href="/leaderboard">
              {t("navLeaderboard")}
            </Link>
            <Link className={navLinkClass("/profile")} href="/profile/me">
              {t("navProfile")}
            </Link>
          </nav>

          <div className="flex items-center gap-1.5 md:gap-2">
            <BalanceChip />
            <div className="hidden md:block">
              <LocaleToggle />
            </div>
            {loading ? (
              <span
                className="inline-flex h-[34px] items-center justify-center rounded-lg border border-line/60 bg-white/60 px-3 text-[13px] font-semibold text-muted-strong opacity-40 md:h-[38px] md:px-4"
                aria-hidden="true"
              >
                …
              </span>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-[34px] items-center justify-center gap-1 rounded-lg border border-line/60 bg-white/60 px-2.5 text-[13px] font-semibold tracking-tight text-muted-strong transition-colors hover:border-line-strong/40 hover:bg-white/95 hover:text-ink data-[state=open]:border-line-strong/40 data-[state=open]:bg-white/95 data-[state=open]:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:h-[38px] md:gap-1.5 md:px-4"
                  >
                    <span className="max-w-[64px] truncate md:max-w-[160px]">{displayName}</span>
                    <ChevronDown
                      size={14}
                      className="text-muted transition-transform data-[state=open]:rotate-180"
                      aria-hidden="true"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="truncate">
                    {user.email ?? displayName}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile/me" className="flex items-center gap-2 no-underline">
                      <UserRound size={14} aria-hidden="true" />
                      <span>{t("viewProfile")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    destructive
                    onSelect={async (event) => {
                      event.preventDefault();
                      await signOut();
                    }}
                  >
                    <LogOut size={14} aria-hidden="true" />
                    <span>{t("signOut")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="inline-flex h-[34px] items-center justify-center gap-1.5 rounded-lg bg-accent px-3 text-[13px] font-semibold tracking-tight text-white transition-colors hover:bg-accent-mid active:bg-accent-deep md:h-[38px] md:px-4"
              >
                {t("signIn")}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line/40 px-3 py-1.5 md:hidden">
          <nav className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/" className={mobileNavLinkClass("/")}>
              {t("navPredict")}
            </Link>
            <Link href="/positions" className={mobileNavLinkClass("/positions")}>
              {t("navPositions")}
            </Link>
            <Link href="/leaderboard" className={mobileNavLinkClass("/leaderboard")}>
              {t("navLeaderboard")}
            </Link>
            <Link href="/profile/me" className={mobileNavLinkClass("/profile")}>
              {t("navProfile")}
            </Link>
          </nav>
          <LocaleToggle />
        </div>
      </header>

      <SignInModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
