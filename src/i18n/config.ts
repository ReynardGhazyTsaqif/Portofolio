export const locales = ["en", "id"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function hasLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** Prefixes an app path with the locale: ("id", "/work") -> "/id/work". */
export function localePath(lang: Locale, path = "/"): string {
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** Swaps the locale segment of a pathname: "/en/work" -> "/id/work". */
export function switchLocalePath(pathname: string, to: Locale): string {
  const parts = pathname.split("/");
  if (hasLocale(parts[1])) parts[1] = to;
  else parts.splice(1, 0, to);
  return parts.join("/") || `/${to}`;
}
