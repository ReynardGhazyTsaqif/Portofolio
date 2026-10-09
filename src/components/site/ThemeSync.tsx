"use client";

import { useLayoutEffect } from "react";

/**
 * Re-applies the saved theme and the motion flag before paint. The boot script in <head> does this on
 * first load, but React recreates <html> when the locale segment changes, which drops both.
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    try {
      const saved = localStorage.getItem("theme");
      const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", dark);
    } catch {}
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) root.dataset.motion = "on";
  }, []);
  return null;
}
