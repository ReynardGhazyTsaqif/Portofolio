"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/** Opens its content like a curtain lifting, from the bottom edge up, once it scrolls into view. */
export function ClipReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const el = ref.current!;
      const media = el.querySelector("img");
      const tl = gsap.timeline({ delay, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0% round 12px)" }, { clipPath: "inset(0% 0% 0% 0% round 12px)", duration: 1.4, ease: "expo.inOut" });
      if (media) tl.fromTo(media, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0.2);
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
