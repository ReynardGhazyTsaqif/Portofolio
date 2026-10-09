import type { Locale } from "@/i18n/config";
import type { Localized } from "./types";

/** Picks the field for the current language, falling back to English, then to `fallback`. */
export function t(value: Localized, lang: Locale, fallback = ""): string {
  return value?.[lang] || value?.en || fallback;
}

/** Splits a localized paragraph field into paragraphs on blank lines. */
export function paragraphs(value: Localized, lang: Locale, fallback = ""): string[] {
  return t(value, lang, fallback)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const MONTHS: Record<Locale, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
};

/** "2026-03-01" -> "Mar 2026", read from the string so time zones can't shift it. */
export function formatMonth(iso: string | null | undefined, lang: Locale): string {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  return `${MONTHS[lang][Number(m) - 1]} ${y}`;
}

export function formatRange(start: string | null | undefined, end: string | null | undefined, lang: Locale): string {
  const from = formatMonth(start, lang);
  const now = lang === "id" ? "sekarang" : "now";
  if (!from) return "";
  if (!end) return `${from} – ${now}`;
  const to = formatMonth(end, lang);
  return from === to ? from : `${from} – ${to}`;
}
