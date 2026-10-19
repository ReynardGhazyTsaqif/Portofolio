"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/**
 * Fills its (relative, overflow-hidden) parent with a slightly taller layer that drifts against the scroll,
 * so a photo seems to sit a little deeper than the page. `amount` is the overscan in percent of the parent.
 */
export function Parallax({ children, amount = 6 }: { children: React.ReactNode; amount?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current!;
    const travel = amount * 0.85; // in percent of this taller layer, which keeps the edges covered
    gsap.fromTo(el, { yPercent: -travel }, { yPercent: travel, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });
  return (
    <div ref={ref} className="absolute inset-x-0 will-change-transform" style={{ top: `-${amount}%`, bottom: `-${amount}%` }}>
      {children}
    </div>
  );
}
