import { NextResponse, type NextRequest } from "next/server";

// Kept local on purpose: proxy runs separately from the app and should not import shared modules.
const LOCALES = ["en", "id"];
const DEFAULT_LOCALE = "en";

function preferredLocale(header: string | null): string {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((r) => LOCALES.includes(r.lang))?.lang ?? DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;

  const saved = request.cookies.get("lang")?.value;
  const lang = saved && LOCALES.includes(saved) ? saved : preferredLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, the Sanity Studio and any file with an extension (public assets).
  matcher: ["/((?!_next|api|studio|.*\\..*).*)"],
};
