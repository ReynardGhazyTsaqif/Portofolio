import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getDictionary, getLocale } from "@/i18n/dictionary";
import { localePath } from "@/i18n/config";
import { getPosts } from "@/lib/sanity/content";
import { PageHeader } from "@/components/site/PageHeader";
import { Stagger } from "@/components/motion/Stagger";
import { TransitionLink } from "@/components/motion/PageTransition";

export async function generateMetadata(): Promise<Metadata> {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const page = dict.pages.notes;
  return pageMetadata(lang, "/notes", `${page.title} ${page.accent}`, page.intro);
}

export default async function NotesPage() {
  const lang = await getLocale();
  const [dict, posts] = await Promise.all([getDictionary(), getPosts(lang)]);
  const page = dict.pages.notes;
  const fmt = new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <PageHeader title={page.title} accent={page.accent} intro={page.intro} />
      <div className="gutter pb-[clamp(110px,14vw,200px)]">
        {posts.length === 0 ? (
          <p className="max-w-[52ch] rounded-lg border border-dashed border-line bg-surface px-6 py-8 text-muted">{page.empty}</p>
        ) : (
          <Stagger as="ol" className="border-b border-line">
            {posts.map((p) => (
              <li key={p._id} data-stagger className="border-t border-line">
                <TransitionLink href={localePath(lang, `/notes/${p.slug}`)} label={p.title} className="group grid gap-x-10 gap-y-2 py-8 md:grid-cols-[180px_minmax(0,1fr)]">
                  <time className="text-[14px] font-semibold text-muted tabular-nums">{fmt.format(new Date(p.publishedAt))}</time>
                  <div className="min-w-0">
                    <h2 className="text-[clamp(1.5rem,3vw,2.4rem)] leading-tight font-extrabold tracking-[-0.035em] transition-colors duration-300 group-hover:text-moss">{p.title}</h2>
                    {p.excerpt && <p className="mt-3 max-w-[62ch] text-muted">{p.excerpt}</p>}
                    {p.tags && p.tags.length > 0 && <p className="mt-3 font-serif text-[1.05rem] text-moss italic">{p.tags.join(", ")}</p>}
                  </div>
                </TransitionLink>
              </li>
            ))}
          </Stagger>
        )}
      </div>
    </>
  );
}
