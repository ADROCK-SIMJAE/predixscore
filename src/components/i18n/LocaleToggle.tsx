"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { setLocale } from "@/i18n/setLocale";
import { locales, localeLabels, type Locale } from "@/i18n/config";

export function LocaleToggle() {
  const current = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === current || pending) return;
    const fd = new FormData();
    fd.set("locale", next);
    startTransition(() => {
      setLocale(fd);
    });
  }

  return (
    <div
      className="inline-flex h-[38px] items-center gap-0.5 rounded-full border border-[rgba(16,44,75,0.06)] bg-white/60 pl-0 pr-1"
      role="group"
      aria-label="Language"
    >
      <Globe size={13} aria-hidden="true" className="ml-2 text-muted" />
      {locales.map((locale) => {
        const isActive = current === locale;
        return (
          <button
            key={locale}
            type="button"
            className={`rounded-full border-0 px-[11px] py-[5px] text-xs font-semibold tracking-[0.02em] transition-[background-color,color] duration-150 ease-linear ${
              isActive
                ? "bg-accent text-white"
                : "cursor-pointer bg-transparent text-muted-strong hover:bg-[rgba(16,44,75,0.05)] hover:text-ink disabled:cursor-default disabled:opacity-40"
            }`}
            onClick={() => switchTo(locale)}
            disabled={pending && current !== locale}
            aria-pressed={isActive}
          >
            {locale === "ko" ? "KO" : "EN"}
            <span className="sr-only">{localeLabels[locale]}</span>
          </button>
        );
      })}
    </div>
  );
}
