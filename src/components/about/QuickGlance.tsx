import Image from "next/image";
import { site } from "@/lib/site";
import { SectionHead } from "@/components/ui/SectionHead";
import { Stagger } from "@/components/motion/Stagger";
import { LocalClock } from "@/components/site/LocalClock";

type Props = {
  label: string;
  title: string;
  accent: string;
  paragraphs: string[];
  titles: string[];
  status: string;
  based: string;
  clock: string;
  portrait: { src: string; alt: string };
};

/** Two columns: who I am in a few paragraphs, and a portrait with my current status. */
export function QuickGlance({ label, title, accent, paragraphs, titles, status, based, clock, portrait }: Props) {
  return (
    <section className="gutter pb-[clamp(100px,13vw,190px)]">
      <div className="grid items-center gap-[clamp(40px,6vw,96px)] lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionHead label={label} title={title} accent={accent} />
          <Stagger className="mt-8 grid max-w-[60ch] gap-4 text-[17px] text-muted">
            {paragraphs.map((p, i) => (
              <p key={i} data-stagger className={i === 0 ? "text-ink" : undefined}>
                {p}
              </p>
            ))}
          </Stagger>
          <ul className="mt-8 flex flex-wrap gap-2">
            {titles.map((t) => (
              <li key={t} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[14px] font-semibold">
                {t}
              </li>
            ))}
          </ul>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-semibold">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-moss hover:underline">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Stagger className="relative mx-auto w-full max-w-[440px] lg:col-span-5">
          <div data-stagger className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface">
            <Image src={portrait.src} alt={portrait.alt} fill sizes="(min-width: 1024px) 440px, 90vw" className="object-cover" />
          </div>
          <div data-stagger className="absolute -bottom-6 -left-4 grid gap-0.5 rounded-lg border border-line bg-surface px-5 py-4 text-[14px] shadow-[0_18px_40px_-24px_rgba(29,34,27,0.45)] sm:-left-8">
            <p className="flex items-center gap-2.5 font-bold">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5da35a] opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-[#5da35a]" />
              </span>
              {status}
            </p>
            <p className="text-muted">{based}</p>
            <LocalClock place={clock} className="text-muted" />
          </div>
        </Stagger>
      </div>
    </section>
  );
}
