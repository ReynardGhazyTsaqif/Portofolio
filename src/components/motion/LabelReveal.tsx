"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/** A section's small moss label: the dot drops in like a pebble, then the words surface beside it. */
export function LabelReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useGSAP(
    () => {
      const el = ref.current!;
      el.classList.remove("reveal-pending");
      if (prefersReducedMotion()) return;
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: "top 90%", once: true } })
        .fromTo("[data-dot]", { scale: 0 }, { scale: 1, duration: 0.9, ease: "elastic.out(1.1, 0.4)" })
        .fromTo("[data-words]", { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.out" }, 0.08);
    },
    { scope: ref },
  );
  return (
    <p ref={ref} className={`reveal-pending inline-flex items-center gap-2.5 text-[14px] font-semibold text-moss ${className}`}>
      <span data-dot className="size-1.5 rounded-full bg-moss" aria-hidden />
      <span className="rv-line-mask overflow-hidden">
        <span data-words className="block">
          {children}
        </span>
      </span>
    </p>
  );
}
