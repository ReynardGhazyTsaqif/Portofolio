"use client";

import { useEffect, useRef, useState } from "react";

export type Palette = { ink: string; muted: string; line: string; moss: string; surface: string; dark: boolean };

/** Site colour tokens, read at draw time so canvases follow the light/dark theme. */
export function readPalette(): Palette {
  const root = document.documentElement;
  const s = getComputedStyle(root);
  const v = (name: string) => s.getPropertyValue(`--${name}`).trim();
  return { ink: v("ink"), muted: v("muted"), line: v("line"), moss: v("moss"), surface: v("surface"), dark: root.classList.contains("dark") };
}

/**
 * Keeps a canvas's backing store at device resolution for its CSS box.
 * `size` changes on resize and `theme` on a light/dark switch, so effects that draw can depend on both.
 */
export function useCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [theme, setTheme] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    const mo = new MutationObserver(() => setTheme((t) => t + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return { ref, size, theme };
}

/** 2D context scaled so drawing happens in CSS pixels. */
export function context2d(canvas: HTMLCanvasElement, cssWidth: number) {
  const ctx = canvas.getContext("2d")!;
  const dpr = cssWidth ? canvas.width / cssWidth : 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return ctx;
}

/** Pointer position as a 0..1 fraction of the element's box (y measured from the top). */
export function pointerFraction(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
}

/** Standard-normal sample from a uniform generator (Box–Muller). */
export function gaussian(random: () => number) {
  return Math.sqrt(-2 * Math.log(random() || 1e-9)) * Math.cos(2 * Math.PI * random());
}
