"use client";

import { createContext, useCallback, useContext, useEffect, useRef, type RefObject } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

const LenisContext = createContext<RefObject<Lenis | null> | null>(null);

/** Lenis smooth scroll driven by GSAP's ticker, so ScrollTrigger and Lenis share one frame loop. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  // Scroll-linked animations measure the page once; recompute them whenever its height settles
  // differently (web fonts, images, Sanity content, filtered grids).
  useEffect(() => {
    let timer = 0;
    let lastHeight = document.documentElement.scrollHeight;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const h = document.documentElement.scrollHeight;
        if (Math.abs(h - lastHeight) < 2) return;
        lastHeight = h;
        ScrollTrigger.refresh();
      }, 150);
    };
    const ro = new ResizeObserver(refresh);
    ro.observe(document.body);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, autoRaf: false });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}

/** Scrolls to the top instantly, through Lenis when it is running. */
export function useScrollReset() {
  const ref = useContext(LenisContext);
  return useCallback(() => {
    if (ref?.current) ref.current.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [ref]);
}
