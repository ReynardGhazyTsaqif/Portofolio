import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import type { PostCard } from "@/lib/sanity/types";
import { SectionHead } from "@/components/ui/SectionHead";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { TransitionLink } from "@/components/motion/PageTransition";
import { Stagger } from "@/components/motion/Stagger";

const dateFormat = (lang: Locale) =>
  new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function NotesPreview({ posts, lang, dict }: { posts: PostCard[]; lang: Locale; dict: Dictionary }) {
  const copy = dict.home.notes;
  const fmt = dateFormat(lang);
  return (
    <section className="gutter pb-[clamp(110px,14vw,200px)]">
      <SectionHead
        label={copy.label}
        title={copy.title}
        accent={copy.accent}
        action={posts.length > 0 ? <ArrowLink href={localePath(lang, "/notes")}>{copy.all}</ArrowLink> : undefined}
      />
      {posts.length === 0 ? (
        <p className="mt-[clamp(40px,5vw,72px)] max-w-[48ch] rounded-lg border border-dashed border-line bg-surface px-6 py-8 text-muted">{copy.empty}</p>
      ) : (
        <Stagger as="ul" className="mt-[clamp(40px,5vw,72px)] grid gap-6 md:grid-cols-3">
          {posts.slice(0, 3).map((p) => (
            <li key={p._id} data-stagger>
              <TransitionLink
                href={localePath(lang, `/notes/${p.slug}`)}
                label={p.title}
                data-tilt="4"
                className="group block h-full rounded-lg border border-line bg-surface p-6 transition-colors hover:border-ink"
              >
                <p className="text-[13px] font-semibold text-muted tabular-nums">{fmt.format(new Date(p.publishedAt))}</p>
                <h3 className="mt-3 text-[1.35rem] leading-snug font-extrabold tracking-[-0.02em] group-hover:text-moss">{p.title}</h3>
                {p.excerpt && <p className="mt-3 text-[15px] text-muted">{p.excerpt}</p>}
              </TransitionLink>
            </li>
          ))}
        </Stagger>
      )}
    </section>
  );
}
