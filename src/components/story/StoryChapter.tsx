"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { CAPTION_TIMING, CHAPTER_LENGTH, progress, type ChapterKind } from "./progress";

export type Beat = { label: string; title: string; accent: string; body: string };

/*
 * One pinned chapter of the Home story. The section holds the screen while the 3D world plays (StoryWorld reads
 * the progress written here), and its captions come and go at fixed points of that progress.
 * With reduced motion there is no pin: the captions are simply set one after another.
 */
export function StoryChapter({ kind, beats, label }: { kind: ChapterKind; beats: Beat[]; label: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 768px) and (prefers-reduced-motion: no-preference)", narrow: "(max-width: 767px) and (prefers-reduced-motion: no-preference)" }, (ctx) => {
        const section = root.current!;
        const length = CHAPTER_LENGTH[kind][ctx.conditions?.wide ? 0 : 1];
        const write = (value: number) => {
          progress[kind] = value;
        };
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * length)}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (s) => write(s.progress),
            onRefresh: (s) => write(s.progress),
          },
        });
        gsap.utils.toArray<HTMLElement>("[data-beat]", section).forEach((el, i) => {
          const [enter, leave] = CAPTION_TIMING[kind][i] ?? [0, 1];
          const parts = el.querySelectorAll("[data-beat-part]");
          tl.fromTo(parts, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: 0.05, stagger: 0.012, ease: "power2.out" }, enter);
          if (leave < 1) tl.to(parts, { autoAlpha: 0, y: -36, duration: 0.04, stagger: 0.008, ease: "power2.in" }, leave);
        });
        // the timeline spans exactly 0..1, so caption times are chapter progress
        tl.set({}, {}, 1);

        if (kind === "converge") {
          ScrollTrigger.create({
            trigger: section,
            start: "top bottom",
            end: "top top",
            onUpdate: (s) => void (progress.approach = s.progress),
            onRefresh: (s) => void (progress.approach = s.progress),
          });
        }
        return () => {
          write(0);
          if (kind === "converge") progress.approach = 0;
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-label={label} data-story-chapter={kind} data-story-dark={kind === "outro" ? "" : undefined} className="story-chapter text-ink">
      <div className="story-stage">
        {beats.map((b, i) => (
          <div key={i} className="story-beat-pos gutter">
            <div data-beat className="max-w-[min(36rem,100%)]">
              <p data-beat-part className="story-part flex items-center gap-2 text-[14px] font-semibold text-moss">
                <span className="size-1.5 rounded-full bg-moss" aria-hidden />
                {b.label}
              </p>
              <h2 data-beat-part className="story-part mt-4 text-[clamp(2.4rem,5.6vw,5.2rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">
                {b.title} <span className="accent">{b.accent}</span>
              </h2>
              <p data-beat-part className="story-part mt-5 max-w-[40ch] text-[clamp(16px,1.25vw,18px)] text-muted">
                {b.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
