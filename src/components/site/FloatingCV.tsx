"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { useI18n } from "@/components/providers/I18nProvider";
import { site } from "@/lib/site";

/** Always-visible CV download, pinned to the bottom-right corner on every page. */
export function FloatingCV() {
  const { dict } = useI18n();
  const ref = useRef<HTMLAnchorElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(ref.current, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", delay: 1.4 });
  });

  return (
    <a
      ref={ref}
      href={site.cv}
      download
      data-magnetic="0.25"
      className="group fixed right-[max(16px,env(safe-area-inset-right))] bottom-[max(16px,env(safe-area-inset-bottom))] z-[80] flex items-center gap-2.5 rounded-full bg-ink py-3 pr-5 pl-4 text-[14px] font-semibold text-paper shadow-[0_12px_32px_-12px_rgba(29,34,27,0.45)]"
    >
      <span className="grid size-6 place-items-center overflow-hidden rounded-full bg-moss text-on-moss">
        <svg viewBox="0 0 24 24" className="size-3.5 transition-transform duration-500 ease-out-expo group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 4v12M6.5 10.5 12 16l5.5-5.5M5 20h14" />
        </svg>
      </span>
      {dict.cv}
    </a>
  );
}
