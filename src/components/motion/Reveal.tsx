"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP, prefersReducedMotion } from "@/lib/gsap";

type RevealProps = {
  as?: "h1" | "h2" | "p" | "div";
  className?: string;
  delay?: number;
  children: React.ReactNode;
};

/** Lifts text in line by line from behind a mask. Re-splits when fonts load or the width changes. */
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
      let played = false;
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "rv-line",
        aria: "none",
        autoSplit: true,
        onSplit(self) {
          el.classList.remove("reveal-pending");
          if (played) return; // a re-split after resize keeps the finished state
          played = true;
          return gsap.from(self.lines, { yPercent: 135, duration: 1.2, ease: "expo.out", stagger: 0.08, delay });
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
