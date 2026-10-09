"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/** Children marked with data-stagger rise into place, in groups, as they scroll into view. */
export function Stagger({ children, className = "", as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-stagger]");
      gsap.set(items, { y: 48, opacity: 0 });
      ScrollTrigger.batch(items, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.09, overwrite: true }),
      });
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  );
}
