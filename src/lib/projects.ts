import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { imageSize, imageUrl } from "@/lib/sanity/client";
import { t } from "@/lib/sanity/locale";
import type { ProjectCard, SanityImage } from "@/lib/sanity/types";

/** Display title: drops a trailing " — Client" so cards stay short; the case study shows the client separately. */
export const projectTitle = (title: string) => title.replace(/\s+—\s+.*$/, "");

export function projectImage(image: SanityImage | null | undefined, alt: string, width = 1400) {
  const size = imageSize(image);
  return size ? { src: imageUrl(image, width), width: size.width, height: size.height, alt: image?.alt || alt } : null;
}

/** Everything a project card needs, in the current language. */
export function projectView(p: ProjectCard, lang: Locale, dict: Dictionary) {
  const title = projectTitle(p.title);
  const categories = p.categories ?? [];
  return {
    slug: p.slug,
    href: localePath(lang, `/work/${p.slug}`),
    title,
    categories,
    categoryLabel: categories.map((c) => dict.categories[c]).join(" / ") || t(p.roleLocalized, lang, p.role ?? ""),
    year: p.year,
    summary: t(p.summary, lang, p.description ?? ""),
    tools: p.techStack ?? [],
    image: projectImage(p.image, title),
  };
}
