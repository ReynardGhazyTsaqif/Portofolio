"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap, Flip, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { TransitionLink } from "@/components/motion/PageTransition";

export type GridItem = {
  slug: string;
  href: string;
  title: string;
  categories: string[];
  categoryLabel: string;
  year: string;
  summary: string;
  tools: string[];
  image: { src: string; width: number; height: number; alt: string } | null;
};

type Labels = { filters: { all: string; web: string; ai: string; data: string; label: string }; count: string; countOne: string; view: string; empty: string };
type Filter = "all" | "web" | "ai" | "data";

/** All projects with a category filter; cards glide to their new places when the filter changes. */
export function ProjectGrid({ items, labels }: { items: GridItem[]; labels: Labels }) {
  const [filter, setFilter] = useState<Filter>("all");
  const grid = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const intros = useRef<gsap.core.Tween[]>([]);

  const visible = (item: GridItem) => filter === "all" || item.categories.includes(filter);
  const shown = items.filter(visible).length;
  const filters = (["all", "web", "ai", "data"] as const).filter((f) => f === "all" || items.some((i) => i.categories.includes(f)));

  function choose(next: Filter) {
    if (next === filter) return;
    // Once someone filters, the scroll-in reveals are done: settle every card where it belongs.
    intros.current.forEach((tween) => tween.scrollTrigger?.kill());
    intros.current.forEach((tween) => tween.progress(1).kill());
    intros.current = [];
    if (!prefersReducedMotion() && grid.current) flipState.current = Flip.getState(grid.current.querySelectorAll("[data-card]"));
    setFilter(next);
  }

  // Animate from the captured layout to the new one right after React commits the change.
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !grid.current) return;
    flipState.current = null;
    Flip.from(state, {
      targets: grid.current.querySelectorAll("[data-card]"),
      duration: 0.8,
      ease: "expo.inOut",
      stagger: 0.03,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.25, ease: "expo.out" }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.35, ease: "power2.in" }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [filter]);

  // First appearance: cards rise in as they scroll into view.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      intros.current = gsap.utils.toArray<HTMLElement>("[data-card]").map((card) =>
        gsap.fromTo(card, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 92%", once: true } }),
      );
    },
    { scope: grid },
  );

  return (
    <div className="gutter pb-[clamp(110px,14vw,200px)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
        <div role="group" aria-label={labels.filters.label} className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => choose(f)}
              aria-pressed={filter === f}
              className={`rounded-full border px-4 py-1.5 text-[14px] font-semibold transition-colors ${
                filter === f ? "border-ink bg-ink text-paper" : "border-line text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {labels.filters[f]}
            </button>
          ))}
        </div>
        <p className="text-[14px] text-muted tabular-nums" aria-live="polite">
          {shown} {shown === 1 ? labels.countOne : labels.count}
        </p>
      </div>

      <ul ref={grid} className="mt-[clamp(32px,4vw,56px)] grid gap-x-[clamp(20px,3vw,44px)] gap-y-[clamp(48px,6vw,88px)] md:grid-cols-2">
        {items.map((item) => (
          <li key={item.slug} data-card className={visible(item) ? "" : "hidden"}>
            <TransitionLink href={item.href} label={item.title} className="group block">
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                {item.image ? (
                  <Image
                    src={item.image.src}
                    width={item.image.width}
                    height={item.image.height}
                    alt={item.image.alt}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="aspect-[16/10] w-full scale-[1.04] object-cover object-top transition-[scale] duration-[1.2s] ease-out-expo group-hover:scale-100"
                  />
                ) : (
                  <div className="grid aspect-[16/10] place-items-center text-[14px] text-muted">{item.title}</div>
                )}
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-4">
                <h2 className="text-[clamp(1.4rem,2.4vw,2rem)] leading-tight font-extrabold tracking-[-0.03em] transition-colors duration-300 group-hover:text-moss">{item.title}</h2>
                <span className="shrink-0 text-[14px] text-muted tabular-nums">{item.year}</span>
              </div>
              <p className="mt-1 font-serif text-[1.15rem] text-muted italic">{item.categoryLabel}</p>
              {item.summary && <p className="mt-3 max-w-[56ch] text-muted">{item.summary}</p>}
              <p className="mt-4 text-[14px]">{item.tools.join(", ")}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold">
                <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1.5px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 ease-out-expo group-hover:bg-[length:100%_1.5px]">
                  {labels.view}
                </span>
              </span>
            </TransitionLink>
          </li>
        ))}
      </ul>
      {shown === 0 && <p className="mt-10 text-muted">{labels.empty}</p>}
    </div>
  );
}
