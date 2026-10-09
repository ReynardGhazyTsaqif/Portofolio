import type { MetadataRoute } from "next";
import { locales, localePath } from "@/i18n/config";
import { getPosts, getProjects } from "@/lib/sanity/content";
import { navItems, site } from "@/lib/site";

/** Every page in both languages, with hreflang alternates; notes only in the language they're written in. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, ...postsByLang] = await Promise.all([getProjects(), ...locales.map((l) => getPosts(l))]);
  const both = (path: string, priority: number): MetadataRoute.Sitemap =>
    locales.map((lang) => ({
      url: `${site.url}${localePath(lang, path)}`,
      priority,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${site.url}${localePath(l, path)}`])) },
    }));

  return [
    ...navItems.flatMap((item) => both(item.path, item.path === "/" ? 1 : 0.8)),
    ...projects.flatMap((p) => both(`/work/${p.slug}`, 0.7)),
    ...postsByLang.flat().map((p) => ({ url: `${site.url}${localePath(p.language, `/notes/${p.slug}`)}`, lastModified: p.publishedAt, priority: 0.6 })),
  ];
}
