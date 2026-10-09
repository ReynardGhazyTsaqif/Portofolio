"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";

export type TimelineItem = {
  id: string;
  range: string;
  kind: string | null;
  org: string;
  role: string;
  highlights: string[];
  tags: string[];
};

/**
 * Experience as a thick rail with one node per role. The rail fills as you scroll; each node lights up
 * and starts its dashed ring turning when the fill reaches it.
 */
export function Timeline({ items }: { items: TimelineItem[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const list = ref.current!;
      if (prefersReducedMotion()) {
        gsap.set(fill.current, { scaleY: 1 });
        list.querySelectorAll(":scope > li").forEach((li) => li.classList.add("is-on"));
        return;
      }
      gsap.fromTo(fill.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: list, start: "top 65%", end: "bottom 65%", scrub: 0.6 } });
      gsap.utils.toArray<HTMLElement>(list.querySelectorAll(":scope > li")).forEach((li) => {
        ScrollTrigger.create({ trigger: li, start: "top 65%", toggleClass: "is-on" });
        gsap.fromTo(
          li.querySelectorAll("[data-part]"),
          { x: 32, opacity: 0 },
          { x: 0, opacity: 1, duration: 1, stagger: 0.07, ease: "expo.out", scrollTrigger: { trigger: li, start: "top 80%", once: true } },
        );
      });
    },
    { scope: ref },
  );

  return (
    <ol ref={ref} className="relative mx-auto mt-[clamp(56px,8vw,100px)] grid max-w-[980px] gap-[clamp(56px,8vw,110px)] pl-14 md:pl-20">
      <span className="absolute top-0 bottom-0 left-[14px] w-[6px] rounded-full bg-line/70 md:left-[22px]" aria-hidden />
      <span ref={fill} className="absolute top-0 bottom-0 left-[14px] w-[6px] origin-top rounded-full bg-gradient-to-b from-moss to-moss/50 md:left-[22px]" aria-hidden />
      {items.map((item) => (
        <li key={item.id} className="group relative">
          <span
            className="absolute top-1 -left-14 -ml-px grid size-9 place-items-center rounded-full border border-line bg-surface transition-[scale,border-color] duration-500 ease-out-expo group-hover:scale-125 group-[.is-on]:border-moss md:-left-20 md:ml-[7px]"
            aria-hidden
          >
            <span className="absolute inset-[7px] animate-[spin_7s_linear_infinite] rounded-full border border-dashed border-moss opacity-30 transition-opacity duration-500 group-[.is-on]:opacity-100" />
            <span className="size-1.5 rounded-full bg-moss" />
          </span>

          <div data-part className="flex flex-wrap items-center gap-3">
            <time className="text-[14px] font-bold tracking-[0.03em] text-moss tabular-nums">{item.range}</time>
            {item.kind && <span className="rounded border border-line bg-paper px-2 py-0.5 text-[12px] font-semibold text-muted">{item.kind}</span>}
          </div>
          <p data-part className="mt-2 bg-gradient-to-r from-ink to-muted bg-clip-text font-serif text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.05] text-transparent italic">
            {item.org}
          </p>
          <h3 data-part className="mt-1 text-[clamp(1.25rem,2.2vw,1.8rem)] leading-tight font-extrabold tracking-[-0.025em] transition-colors duration-300 group-hover:text-moss">
            {item.role}
          </h3>
          {item.highlights.length > 0 && (
            <ul data-part className="mt-4 grid max-w-[64ch] gap-2 text-muted">
              {item.highlights.map((h, i) => (
                <li key={i} className="relative pl-5 before:absolute before:top-[0.78em] before:left-0 before:h-[1.5px] before:w-2.5 before:bg-moss">
                  {h}
                </li>
              ))}
            </ul>
          )}
          {item.tags.length > 0 && (
            <ul data-part className="mt-5 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <li key={tag} className="rounded-full border border-line bg-paper px-3 py-1 text-[13px]">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
