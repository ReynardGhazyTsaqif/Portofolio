"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/** The one-liner, set large; each word darkens as it passes the reading line. */
export function Statement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      SplitText.create(ref.current, {
        type: "words",
        aria: "none", // the words stay real text, so screen readers read the sentence as is
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(self.words, { opacity: 0.5 }, {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: ref.current, start: "top 82%", end: "bottom 45%", scrub: true },
          }),
      });
    },
    { scope: ref },
  );

  return (
    <section className="gutter py-[clamp(110px,15vw,220px)]">
      <p ref={ref} className="max-w-[21ch] text-[clamp(2rem,5.4vw,5.2rem)] leading-[1.04] font-bold tracking-[-0.038em]">
        {text}
      </p>
    </section>
  );
}
