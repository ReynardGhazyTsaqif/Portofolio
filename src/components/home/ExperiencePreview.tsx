import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import type { Experience } from "@/lib/sanity/types";
import { formatRange, t } from "@/lib/sanity/locale";
import { SectionHead } from "@/components/ui/SectionHead";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Rule, Stagger } from "@/components/motion/Stagger";

/** The most recent roles as a compact list, with a link to the full timeline on About. */
export function ExperiencePreview({ items, lang, dict, href }: { items: Experience[]; lang: Locale; dict: Dictionary; href: string }) {
  const copy = dict.home.experience;
  return (
    <section className="gutter py-[clamp(100px,13vw,190px)]">
      <SectionHead label={copy.label} title={copy.title} accent={copy.accent} action={<ArrowLink href={href}>{copy.all}</ArrowLink>} />
      <Stagger as="ol" className="mt-[clamp(40px,5vw,72px)] border-b border-line">
        {items.slice(0, 4).map((e) => (
          <li key={e._id} data-stagger className="group relative grid gap-x-8 gap-y-1 py-6 md:grid-cols-[200px_minmax(0,1fr)_auto] md:items-baseline">
            <Rule />
            <p className="text-[14px] font-semibold text-muted tabular-nums">{formatRange(e.startDate, e.endDate, lang)}</p>
            <div className="min-w-0">
              <h3 className="text-[clamp(1.25rem,2.2vw,1.75rem)] leading-tight font-extrabold tracking-[-0.025em] transition-[color,translate] duration-500 ease-out-expo group-hover:translate-x-2 group-hover:text-moss">
                {t(e.roleLocalized, lang, e.role)}
              </h3>
              <p className="mt-1 font-serif text-[clamp(1.1rem,1.6vw,1.35rem)] text-muted italic">{e.company}</p>
            </div>
            {e.kind && (
              <span className="mt-2 justify-self-start rounded border border-line bg-surface px-2.5 py-1 text-[12px] font-semibold text-muted md:mt-0">
                {dict.kinds[e.kind]}
              </span>
            )}
          </li>
        ))}
      </Stagger>
    </section>
  );
}
