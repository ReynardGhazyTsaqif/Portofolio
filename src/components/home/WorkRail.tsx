"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { TransitionLink } from "@/components/motion/PageTransition";

export type RailItem = {
  slug: string;
  href: string;
  title: string;
  category: string;
  year: string;
  tools: string[];
  image: { src: string; width: number; height: number; alt: string } | null;
};

type Labels = { tools: string; moreTitle: string; moreBody: string; all: string; noImage: string };

/**
 * Selected work as a row of boxes. On desktop the section pins and vertical scrolling slides the row
 * sideways; on small screens it is a native swipeable row.
 */
export function WorkRail({ items, labels, allHref, children }: { items: RailItem[]; labels: Labels; allHref: string; children: React.ReactNode }) {
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const distance = () => Math.max(0, el.scrollWidth - window.innerWidth);
        gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pin.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (s) => gsap.set(bar.current, { scaleX: s.progress }),
          },
        });
      });
      return () => mm.revert();
    },
    { scope: pin },
  );

  return (
    <section className="overflow-clip pt-[clamp(100px,13vw,180px)]">
      <div className="gutter">{children}</div>
      <div ref={pin} className="relative md:flex md:h-[100svh] md:items-center">
        <div
          ref={track}
          className="flex will-change-transform max-md:mt-12 max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto max-md:pb-6 md:pl-[var(--gutter)]"
        >
          {items.map((item, i) => (
            <TransitionLink
              key={item.slug}
              href={item.href}
              label={item.title}
              className="group grid w-[min(560px,84vw)] shrink-0 snap-start grid-rows-[auto_auto_1fr] gap-6 border-l border-line px-[clamp(20px,2.6vw,40px)] py-2 first:max-md:ml-[var(--gutter)]"
            >
              <div className="flex items-start gap-5">
                <span className="text-[clamp(2.6rem,4vw,3.6rem)] leading-[0.85] font-extrabold tracking-[-0.05em] text-ink/50 tabular-nums transition-colors duration-500 group-hover:text-moss">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[clamp(1.3rem,2vw,1.7rem)] leading-tight font-extrabold tracking-[-0.025em]">{item.title}</h3>
                  <p className="mt-1 text-[15px] text-muted">
                    {item.category}
                    {item.year && <span className="tabular-nums">, {item.year}</span>}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-muted">{labels.tools}</p>
                <p className="mt-1 text-[15px]">{item.tools.join(", ")}</p>
              </div>
              <div className="self-end overflow-hidden rounded-lg border border-line bg-surface">
                {item.image ? (
                  <Image
                    src={item.image.src}
                    width={item.image.width}
                    height={item.image.height}
                    alt={item.image.alt}
                    sizes="(min-width: 768px) 560px, 84vw"
                    className="aspect-[16/10] w-full scale-[1.06] object-cover object-top transition-[scale] duration-[1.2s] ease-out-expo group-hover:scale-100"
                  />
                ) : (
                  <div className="grid aspect-[16/10] place-items-center text-[14px] text-muted">{labels.noImage}</div>
                )}
              </div>
            </TransitionLink>
          ))}
          <div className="grid w-[min(440px,78vw)] shrink-0 snap-start content-center justify-items-start gap-5 border-x border-line px-[clamp(20px,2.6vw,40px)] max-md:mr-[var(--gutter)]">
            <p className="text-[clamp(1.8rem,3vw,2.6rem)] leading-tight font-extrabold tracking-[-0.035em]">{labels.moreTitle}</p>
            <p className="max-w-[30ch] text-muted">{labels.moreBody}</p>
            <TransitionLink href={allHref} className="rounded-md bg-ink px-5 py-3 text-[15px] font-semibold text-paper transition-transform duration-300 hover:-translate-y-0.5">
              {labels.all}
            </TransitionLink>
          </div>
        </div>
        <div className="gutter absolute inset-x-0 bottom-10 hidden md:block" aria-hidden>
          <div className="h-px bg-line">
            <span ref={bar} className="block h-px origin-left bg-ink" style={{ transform: "scaleX(0)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
