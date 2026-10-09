"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/** A thin moss line under the navbar that fills as you read the article with the given id. */
export function ReadingProgress({ target, label }: { target: string; label: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: `#${target}`, start: "top 72px", end: "bottom bottom", scrub: true } });
  });
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(64px+env(safe-area-inset-top))] z-[69] h-[2px] md:top-[calc(72px+env(safe-area-inset-top))]" role="presentation" aria-label={label}>
      <div ref={bar} className="h-full origin-left bg-moss" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
