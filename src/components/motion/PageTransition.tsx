"use client";

import { createContext, useCallback, useContext, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { useScrollReset } from "./SmoothScroll";
import { RouteWatcher } from "./Pathname";

type Navigate = (href: string, label?: string) => void;
const TransitionContext = createContext<Navigate | null>(null);

/**
 * Curtain transition between pages: the curtain rises to cover the page, the route changes
 * underneath, then the curtain keeps rising to reveal the new page. Back/forward skips the cover.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const resetScroll = useScrollReset();
  const curtain = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const state = useRef({ busy: false, pending: false, safety: 0 });

  const reveal = useCallback(() => {
    const s = state.current;
    window.clearTimeout(s.safety);
    s.pending = false;
    resetScroll();
    requestAnimationFrame(() => ScrollTrigger.refresh());
    gsap
      .timeline({ onComplete: () => { s.busy = false; gsap.set(curtain.current, { y: 0, yPercent: 100 }); } })
      .to(label.current, { yPercent: -60, opacity: 0, duration: 0.4, ease: "power3.in" }, 0.05)
      .to(curtain.current, { yPercent: -100, duration: 0.8, ease: "expo.inOut" }, 0.12);
  }, [resetScroll]);

  const navigate = useCallback<Navigate>(
    (href, text) => {
      const s = state.current;
      if (s.busy || href === window.location.pathname) return;
      if (prefersReducedMotion()) {
        router.push(href, { scroll: false });
        resetScroll();
        return;
      }
      s.busy = true;
      s.pending = true;
      if (label.current) label.current.textContent = text ?? "";
      gsap
        .timeline({ onComplete: () => router.push(href, { scroll: false }) })
        .fromTo(curtain.current, { y: 0, yPercent: 100 }, { y: 0, yPercent: 0, duration: 0.7, ease: "expo.inOut" })
        .fromTo(label.current, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.35);
      // Never leave the page covered if navigation stalls.
      s.safety = window.setTimeout(reveal, 6000);
    },
    [router, resetScroll, reveal],
  );

  const onRoute = useCallback(() => {
    if (state.current.pending) reveal();
  }, [reveal]);

  return (
    <TransitionContext.Provider value={navigate}>
      {children}
      <RouteWatcher onChange={onRoute} />
      <div
        ref={curtain}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[90] grid translate-y-full place-items-center bg-moss text-on-moss"
      >
        <span ref={label} className="font-serif text-[clamp(3rem,10vw,8rem)] italic leading-none opacity-0" />
      </div>
    </TransitionContext.Provider>
  );
}

type TransitionLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & { href: string; label?: string };

/** A next/link that plays the curtain on plain left clicks and behaves normally otherwise. */
export function TransitionLink({ href, label, onClick, ...rest }: TransitionLinkProps) {
  const navigate = useContext(TransitionContext);
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || !navigate) return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === "_blank") return;
        e.preventDefault();
        navigate(href, label ?? (typeof rest.children === "string" ? rest.children : undefined));
      }}
      {...rest}
    />
  );
}
