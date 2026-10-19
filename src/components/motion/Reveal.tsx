"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP, prefersReducedMotion } from "@/lib/gsap";

type RevealProps = {
  as?: "h1" | "h2" | "p" | "div";
  className?: string;
  delay?: number;
  children: React.ReactNode;
};

/**
 * Lifts text in line by line from behind a mask, each line tipping level as it surfaces, once it scrolls into view.
 * Re-splits when fonts load or the width changes.
 */
export function Reveal({ as: Tag = "div", className = "", delay = 0.35, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        el.classList.remove("reveal-pending");
        return;
      }
      let started = false;
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "rv-line",
        aria: "none",
        autoSplit: true,
        onSplit(self) {
          el.classList.remove("reveal-pending");
          // A re-split (fonts loading, a resize) replays only if the reveal hasn't begun yet;
          // otherwise the new lines simply stay in place.
          if (started) return;
          // Waits until the text scrolls into view; text already on screen starts right away.
          return gsap.from(self.lines, {
            yPercent: 135,
            rotate: 2.5,
            transformOrigin: "0% 0%",
            duration: 1.2,
            ease: "expo.out",
            stagger: 0.08,
            delay,
            onStart: () => void (started = true),
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        },
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref as React.Ref<never>} className={`reveal-pending ${className}`}>
      {children}
    </Tag>
  );
}
