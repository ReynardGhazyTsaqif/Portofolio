"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
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

type Labels = { tools: string; moreTitle: string; moreBody: string; all: string; noImage: string; view: string };

/**
 * Selected work as a row of boxes. On desktop the section pins and vertical scrolling slides the row
 * sideways; on small screens it is a native swipeable row.
 * Each box assembles itself as it arrives: its text rises and its screenshot is wiped open from the
 * leading edge, so the row reads as one current flowing in from the right.
 */

/** A paused timeline that assembles one box; fromTo sets the hidden state straight away. */
function assemble(card: HTMLElement) {
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(card.querySelectorAll("[data-rail-part]"), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.08 }, 0);
  const media = card.querySelector("[data-rail-media]");
  if (media) tl.fromTo(media, { clipPath: "inset(0% 0% 0% 100% round 8px)" }, { clipPath: "inset(0% 0% 0% 0% round 8px)", duration: 1.3, ease: "expo.inOut" }, 0.05);
  return tl;
}

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
        const slide = gsap.to(el, {
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

        // Boxes already in the window assemble as the section arrives; the rest as they slide in.
        const first: gsap.core.Timeline[] = [];
        gsap.utils.toArray<HTMLElement>("[data-rail-card]", el).forEach((card) => {
          const tl = assemble(card);
          if (card.offsetLeft < window.innerWidth * 0.9) first.push(tl);
          else ScrollTrigger.create({ trigger: card, containerAnimation: slide, start: "left 90%", once: true, onEnter: () => void tl.play() });
        });
        ScrollTrigger.create({ trigger: pin.current, start: "top 70%", once: true, onEnter: () => first.forEach((tl, i) => tl.delay(i * 0.14).play()) });
      });

      mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          gsap.utils.toArray<HTMLElement>("[data-rail-card]", track.current),
          { x: 64, opacity: 0 },
          { x: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: track.current, start: "top 85%", once: true } },
        );
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
              data-rail-card
              data-cursor={labels.view}
              className="group grid w-[min(560px,84vw)] shrink-0 snap-start grid-rows-[auto_auto_1fr] gap-6 border-l border-line px-[clamp(20px,2.6vw,40px)] py-2 first:max-md:ml-[var(--gutter)]"
            >
              <div data-rail-part className="flex items-start gap-5">
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
              <div data-rail-part>
                <p className="text-[13px] font-semibold text-muted">{labels.tools}</p>
                <p className="mt-1 text-[15px]">{item.tools.join(", ")}</p>
              </div>
              <div data-rail-media className="self-end overflow-hidden rounded-lg border border-line bg-surface">
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
          <div data-rail-card className="grid w-[min(440px,78vw)] shrink-0 snap-start content-center justify-items-start gap-5 border-x border-line px-[clamp(20px,2.6vw,40px)] max-md:mr-[var(--gutter)]">
            <p data-rail-part className="text-[clamp(1.8rem,3vw,2.6rem)] leading-tight font-extrabold tracking-[-0.035em]">{labels.moreTitle}</p>
            <p data-rail-part className="max-w-[30ch] text-muted">{labels.moreBody}</p>
            <div data-rail-part>
              <TransitionLink href={allHref} data-magnetic="0.3" className="btn-fill inline-block rounded-md bg-ink px-5 py-3 text-[15px] font-semibold text-paper">
                {labels.all}
              </TransitionLink>
            </div>
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
