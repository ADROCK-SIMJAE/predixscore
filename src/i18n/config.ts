export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";
export const LOCALE_COOKIE = "predixscore-locale";

export const localeLabels: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
};

export function isValidLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
