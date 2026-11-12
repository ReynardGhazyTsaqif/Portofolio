"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { progress } from "./progress";
import type { ScreenCopy, StoryScene } from "./scene";

/*
 * The Home page's 3D story: a fixed canvas over the lake background, drawn by three.js (loaded on demand,
 * only on this page). It takes over from the lake as the first chapter scrolls in and keeps the screen for the
 * rest of the page. While it covers the screen it sets html[data-story="cover"], which tells the lake to stop
 * drawing, and it owns the colour flip of the fixed UI ([data-env-flip]) and of [data-story-dark] captions.
 * Without WebGL, with reduced motion or on save-data nothing here turns on and the lake carries the page.
 */
export function StoryWorld({ screen }: { screen: ScreenCopy }) {
  const host = useRef<HTMLDivElement>(null);
  const { title, accent, label } = screen;
  const nav = screen.nav.join("|");

  useEffect(() => {
    const box = host.current!;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (prefersReducedMotion() || conn?.saveData || (memory !== undefined && memory < 2)) return;

    const root = document.documentElement;
    const lite = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    // a fresh canvas per mount: when Next's Activity hides and shows the page, the old context is already gone
    const canvas = document.createElement("canvas");
    canvas.className = "block size-full";
    canvas.style.opacity = "0";
    box.appendChild(canvas);

    let scene: StoryScene | null = null;
    let cancelled = false;
    let quality = 1, frames = 0, slow = 0, reveal = 0;
    let nudge = 0, nudgeTo = 0, velocity = 0, lastScroll = window.scrollY;
    let covering = false, dark = false;
    let flips: HTMLElement[] = [];
    const theme = { night: root.classList.contains("dark") ? 1 : 0 };

    function size() {
      if (!scene) return;
      const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.5) * quality;
      scene.resize(box.clientWidth, box.clientHeight, dpr);
    }

    function collect() {
      // until the story is drawing, the lake owns these colours
      if (!scene) return;
      flips = Array.from(document.querySelectorAll<HTMLElement>("[data-env-flip], [data-story-dark]"));
      setDark(dark, true);
    }

    function setDark(want: boolean, force = false) {
      if (want === dark && !force) return;
      dark = want;
      flips.forEach((el) => el.classList.toggle("dark", want));
    }

    function setCover(want: boolean) {
      if (want === covering) return;
      covering = want;
      if (want) root.dataset.story = "cover";
      else delete root.dataset.story;
    }

    function turnOff() {
      gsap.ticker.remove(tick);
      canvas.style.opacity = "0";
      setCover(false);
      setDark(false, true);
      delete root.dataset.storyFlips;
    }

    function tick(time: number, delta: number) {
      if (!scene) return;
      if (scene.lost) {
        scene = null;
        return turnOff();
      }
      // hidden by Activity after a route change: nothing to draw
      if (box.getClientRects().length === 0) return;

      const dt = Math.min(delta, 64) / 1000;
      const scroll = window.scrollY;
      velocity += ((scroll - lastScroll) / Math.max(dt, 1e-3) - velocity) * (1 - Math.exp(-dt * 4));
      lastScroll = scroll;
      nudge += (nudgeTo - nudge) * (1 - Math.exp(-dt * 1.6));

      const started = progress.converge > 0 || progress.outro > 0;
      const shown = started ? 1 : gsap.utils.clamp(0, 1, (progress.approach - 0.35) / 0.65);
      reveal = Math.min(1, reveal + dt / 0.6);
      const opacity = shown * reveal;
      canvas.style.opacity = String(opacity);
      setCover(opacity > 0.999);
      if (opacity <= 0.001) return setDark(false);

      const result = scene.render({
        time,
        approach: progress.approach,
        converge: progress.converge,
        outro: progress.outro,
        scroll,
        night: theme.night,
        nudge,
        velocity,
        narrow: box.clientWidth < 768 || box.clientWidth / Math.max(1, box.clientHeight) < 0.9,
      });
      setDark(result.dark);

      // if the device can't keep up, draw fewer pixels rather than drop frames
      if (++frames > 120 && delta > 28) slow++;
      if (slow > 40 && quality > 0.6) {
        quality -= 0.15;
        slow = 0;
        size();
      }
    }

    const onLost = (e: Event) => {
      e.preventDefault();
      scene = null;
      turnOff();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const start = () => {
      import("./scene")
        .then(({ StoryScene }) => StoryScene.create(canvas, lite, { title, accent, label, nav: nav.split("|") }))
        .then((s) => {
          if (cancelled) return s?.release();
          if (!s) return;
          scene = s;
          root.dataset.storyFlips = "on";
          size();
          collect();
          gsap.ticker.add(tick);
        })
        .catch((err) => console.warn("[story] could not start, keeping the lake background", err));
    };
    // after the hero and the lake have had their turn, so the three never compete for the first paint
    const idleId: number = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(start, { timeout: 5000 }) : window.setTimeout(start, 1200);

    const ro = new ResizeObserver(size);
    ro.observe(box);
    ScrollTrigger.addEventListener("refresh", collect);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") nudgeTo = (e.clientX / window.innerWidth - 0.5) * 0.05;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const themeObserver = new MutationObserver(() => {
      gsap.to(theme, { night: root.classList.contains("dark") ? 1 : 0, duration: 0.9, ease: "power2.inOut", overwrite: true });
    });
    themeObserver.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      window.clearTimeout(idleId);
      gsap.ticker.remove(tick);
      gsap.killTweensOf(theme);
      ScrollTrigger.removeEventListener("refresh", collect);
      ro.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("webglcontextlost", onLost);
      setCover(false);
      setDark(false, true);
      delete root.dataset.storyFlips;
      scene?.release();
      scene = null;
      canvas.remove();
    };
  }, [title, accent, label, nav]);

  return <div ref={host} aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[-1] h-[100lvh] w-full" />;
}
