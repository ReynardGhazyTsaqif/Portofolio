import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, getLocale } from "@/i18n/dictionary";
import { localePath, locales } from "@/i18n/config";
import { getPost, getPosts, staticSlugs } from "@/lib/sanity/content";
import { imageUrl } from "@/lib/sanity/client";
import { projectImage } from "@/lib/projects";
import { Reveal } from "@/components/motion/Reveal";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { ReadingProgress } from "@/components/motion/ReadingProgress";
import { TransitionLink } from "@/components/motion/PageTransition";
import { RichText } from "@/components/work/RichText";
import Image from "next/image";

export async function generateStaticParams() {
  const lists = await Promise.all(locales.map((l) => getPosts(l)));
  return staticSlugs(lists.flat().map((p) => p.slug));
}

/** Words in Portable Text, for the reading-time estimate. */
function wordCount(blocks: unknown[] | null): number {
  let n = 0;
  for (const b of blocks ?? []) {
    const children = (b as { children?: { text?: string }[] }).children ?? [];
    for (const c of children) n += (c.text ?? "").split(/\s+/).filter(Boolean).length;
  }
  return n;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/notes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const image = imageUrl(post.cover, 1200);
  return { title: post.title, description: post.excerpt ?? undefined, openGraph: { type: "article", publishedTime: post.publishedAt, images: image ? [{ url: image }] : undefined } };
}

export default async function NotePage({ params }: PageProps<"/[lang]/notes/[slug]">) {
  const { slug } = await params;
  const lang = await getLocale();
  const [dict, post] = await Promise.all([getDictionary(), getPost(slug)]);
  if (!post) notFound();

  const copy = dict.pages.notes;
  const fmt = new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const minutes = Math.max(1, Math.round(wordCount(post.body) / 220));
  const cover = projectImage(post.cover, post.title, 2000);
  const otherLang = post.language === lang ? null : post.language;
  const translation = post.translation && post.translation.language === lang ? post.translation : null;

  return (
    <article id="note">
      <ReadingProgress target="note" label={copy.progress} />
      <header className="gutter mx-auto max-w-[1100px] pt-[calc(128px+env(safe-area-inset-top))]">
        <TransitionLink href={localePath(lang, "/notes")} label={dict.nav.notes} className="inline-flex items-center gap-2 text-[14px] font-semibold text-muted transition-colors hover:text-ink">
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M14 8H3M7 4 3 8l4 4" />
          </svg>
          {copy.back}
        </TransitionLink>
        <p className="mt-10 text-[14px] font-semibold text-muted tabular-nums">
          {fmt.format(new Date(post.publishedAt))} · {minutes} {copy.minutes}
        </p>
        <Reveal as="h1" delay={0.2} className="mt-3 text-[clamp(2.4rem,6vw,5.2rem)] leading-[0.98] font-extrabold tracking-[-0.045em]">
          {post.title}
        </Reveal>
        {post.excerpt && (
          <Reveal as="p" delay={0.4} className="mt-6 max-w-[52ch] text-[clamp(1.1rem,1.6vw,1.35rem)] leading-snug text-muted">
            {post.excerpt}
          </Reveal>
        )}
        {post.tags && post.tags.length > 0 && <p className="mt-5 font-serif text-[1.1rem] text-moss italic">{post.tags.join(", ")}</p>}
        {otherLang && !translation && <p className="mt-6 rounded-md border border-line bg-surface px-4 py-3 text-[15px] text-muted">{copy.onlyIn}</p>}
        {translation && (
          <TransitionLink href={localePath(lang, `/notes/${translation.slug}`)} className="mt-6 inline-block text-[15px] font-semibold underline decoration-moss underline-offset-4">
            {copy.readIn}
          </TransitionLink>
        )}
      </header>

      {cover && (
        <ClipReveal delay={0.3} className="gutter mx-auto mt-[clamp(40px,5vw,72px)] max-w-[1300px]">
          <Image src={cover.src} width={cover.width} height={cover.height} alt={cover.alt} priority sizes="100vw" className="w-full rounded-xl border border-line" />
        </ClipReveal>
      )}

      <div className="gutter mx-auto max-w-[760px] py-[clamp(56px,8vw,110px)]">{post.body && <RichText value={post.body} tone="article" />}</div>
    </article>
  );
}
