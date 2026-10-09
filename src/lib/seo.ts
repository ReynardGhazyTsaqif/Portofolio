import type { Metadata } from "next";
import { locales, localePath, type Locale } from "@/i18n/config";
import { site } from "@/lib/site";

/** Canonical URL and language alternates for an app path ("/work", "/notes/slug") in the given locale. */
export function alternatesFor(lang: Locale, path = "/"): Metadata["alternates"] {
  return {
    canonical: localePath(lang, path),
    languages: { ...Object.fromEntries(locales.map((l) => [l, localePath(l, path)])), "x-default": localePath("en", path) },
  };
}

/**
 * Page metadata with title, description, canonical, alternates and a full Open Graph block.
 * A page's openGraph replaces the layout's rather than merging, so the shared fields and the default
 * share image are repeated here; pass `extra.openGraph` to override any of them.
 */
export function pageMetadata(lang: Locale, path: string, title: string | undefined, description: string | undefined, extra: Metadata = {}): Metadata {
  const { openGraph, ...rest } = extra;
  return {
    title,
    description,
    alternates: alternatesFor(lang, path),
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: lang === "id" ? "id_ID" : "en_US",
      title,
      description,
      url: localePath(lang, path),
      images: [{ url: `/${lang}/opengraph-image`, width: 1200, height: 630 }],
      ...(openGraph ?? {}),
    } as Metadata["openGraph"],
    ...rest,
  };
}
