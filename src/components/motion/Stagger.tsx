"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";

// "3.97" or "120+" count up; years and words are left as they are.
const NUMBER = /^(\D*?)(\d+(?:\.\d+)?)(\D*)$/;

function countUp(el: HTMLElement, delay: number) {
  const text = el.textContent ?? "";
  const m = NUMBER.exec(text.trim());
  if (!m) return null;
  const [, before, num, after] = m;
  const target = Number(num);
  if (!Number.isFinite(target) || (target >= 1900 && target <= 2100 && !num.includes("."))) return null;
  const decimals = num.split(".")[1]?.length ?? 0;
  const state = { v: 0 };
  const show = () => void (el.textContent = `${before}${state.v.toFixed(decimals)}${after}`);
  show();
  return gsap.to(state, {
    v: target,
    duration: 1.6,
    ease: "expo.out",
    delay,
    onUpdate: show,
    onComplete: () => void (el.textContent = text),
  });
}

/**
 * Children marked with data-stagger rise into place, in groups, as they scroll into view.
 * Inside them, [data-draw] rules draw across from the left and [data-count] figures count up.
 */
export function Stagger({ children, className = "", as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-stagger]");
      gsap.set(items, { y: 48, opacity: 0 });
      const rules = gsap.utils.toArray<HTMLElement>("[data-draw]");
      if (rules.length) gsap.set(rules, { scaleX: 0, transformOrigin: "left center" });
      ScrollTrigger.batch(items, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.09, overwrite: "auto" });
          batch.forEach((item, i) => {
            const drawn = item.querySelectorAll("[data-draw]");
            if (drawn.length) gsap.to(drawn, { scaleX: 1, duration: 1.3, ease: "expo.inOut", delay: i * 0.09 });
            item.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => countUp(el, 0.15 + i * 0.09));
          });
        },
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

/** A one-pixel rule along the top of its (relative) parent, drawn in by Stagger. */
export function Rule({ className = "bg-line" }: { className?: string }) {
  return <span data-draw aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-px ${className}`} />;
}
