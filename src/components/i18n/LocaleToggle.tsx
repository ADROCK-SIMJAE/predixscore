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
    <div className="locale-toggle" role="group" aria-label="Language">
      <Globe size={14} aria-hidden="true" />
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          className={`locale-toggle-btn ${current === locale ? "active" : ""}`}
          onClick={() => switchTo(locale)}
          disabled={pending && current !== locale}
          aria-pressed={current === locale}
        >
          {locale === "ko" ? "KO" : "EN"}
          <span className="sr-only">{localeLabels[locale]}</span>
        </button>
      ))}
    </div>
  );
}
