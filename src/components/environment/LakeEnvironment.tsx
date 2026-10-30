"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { RouteWatcher } from "@/components/motion/Pathname";
import { CAUSTIC, FOG, LINE, PULSE, RAYS, SHADE, cameraAt, keyed, smoothAzimuth } from "./camera";
import { EnvRenderer, type EnvFrame } from "./renderer";
import { BED_DEPTH, descend, surfaceY, type PathPoint } from "./world";

/*
 * The site's one background: a dive into Lake Maninjau. Every page is the same water and the same caldera
 * bed, and scrolling is the descent. It lives behind the content in a fixed canvas and reads the page rather
 * than being told about it, so sections need no wiring:
 *   - a pinned section stops the vertical descent and turns it into a sideways slide along the orbit
 *   - the footer's [data-env-plunge] spacer is where the water goes dark, ending on the lake floor
 * Without WebGL2, with reduced motion, or on save-data, data-env never turns on and the CSS background stays.
 */

const STRIP = 1024;
const PLUNGE_AT = 0.86;

type RGB = [number, number, number];
const rgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;

// The light stops stay pale enough that ink, muted and moss text all clear AA contrast. Dusk is one long dark.
const DAY = { top: rgb("#f2ede3"), shallow: rgb("#e0e7da"), mid: rgb("#dae3d6"), low: rgb("#d4dfd3"), twilight: rgb("#6f8a7c"), floor: rgb("#14201b"), end: rgb("#0d1512") };
const NIGHT = { top: rgb("#121511"), shallow: rgb("#16211b"), mid: rgb("#131d18"), low: rgb("#101915"), twilight: rgb("#0d1512"), floor: rgb("#0b120f"), end: rgb("#090e0b") };

type Layout = {
  heroH: number;
  vh: number;
  max: number;
  pins: { start: number; end: number }[];
  plungeContent: number; // content y where the spacer begins
  floorContent: number; // content y where the water has gone fully dark
  plungeScroll: number; // scroll position where the spacer enters the viewport
  docH: number;
};

/** Scroll position minus the distance spent pinned so far: how far the content itself has actually moved. */
function contentY(scroll: number, pins: Layout["pins"]) {
  let y = scroll;
  for (const p of pins) y -= Math.max(0, Math.min(scroll, p.end) - p.start);
  return y;
}

function strip(stops: { top: RGB; shallow: RGB; mid: RGB; low: RGB; twilight: RGB; floor: RGB; end: RGB }, l: Layout) {
  const positions: [number, RGB][] = [
    [0, stops.top],
    [l.vh * 0.8, stops.shallow],
    [Math.max(l.vh * 0.9, l.plungeContent * 0.5), stops.mid],
    [l.plungeContent, stops.low],
    [(l.plungeContent + l.floorContent) / 2, stops.twilight],
    [l.floorContent, stops.floor],
    [l.docH, stops.end],
  ];
  const data = new Uint8Array(STRIP * 4);
  let seg = 0;
  for (let i = 0; i < STRIP; i++) {
    const y = (i / (STRIP - 1)) * l.docH;
    while (seg < positions.length - 2 && positions[seg + 1][0] < y) seg++;
    const [a, ca] = positions[seg], [b, cb] = positions[seg + 1];
    let t = Math.min(1, Math.max(0, (y - a) / Math.max(b - a, 1)));
    // the dark crossing eases in and out, so it has no visible edge where it begins
    if (seg === 3) t = t * t;
    else if (seg === 4) t = 1 - (1 - t) * (1 - t);
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(ca[c] + (cb[c] - ca[c]) * t);
    data[i * 4 + 3] = 255;
  }
  return data;
}

/** Scroll position to place on the path: the content up to the plunge covers most of it, the plunge the rest. */
function progressAt(scroll: number, l: Layout) {
  const end = Math.max(1, l.plungeScroll);
  if (scroll <= end) return (scroll / end) * PLUNGE_AT;
  return PLUNGE_AT + ((scroll - end) / Math.max(1, l.max - end)) * (1 - PLUNGE_AT);
}

export function LakeEnvironment() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const gauge = useRef<HTMLDivElement>(null);
  const reading = useRef<HTMLSpanElement>(null);
  const onRoute = useRef<() => void>(() => {});
  const routeChanged = useCallback(() => onRoute.current(), []);

  useEffect(() => {
    const cvs = canvas.current!;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (prefersReducedMotion() || conn?.saveData || (memory !== undefined && memory < 2)) return;

    const root = document.documentElement;
    const lite = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    let path: PathPoint[] | null = null;

    const viewProj = new Float32Array(16);
    const frame: EnvFrame = {
      time: 0, viewProj, eye: [0, 0, 0], shift: [0, 0], bead: [0, 0, 0], scroll: 0, doc: 1, surface: 0,
      night: root.classList.contains("dark") ? 1 : 0, head: 0, fog: 0, line: 0, shade: 0, caustic: 0, rays: 0, pulse: 0,
      quiet: 0, clipTop: 0, sunX: 0.81, moteAlpha: 0, beadAlpha: 0,
    };
    const theme = { night: frame.night };

    let renderer: EnvRenderer | null = null;
    let layout: Layout = { heroH: 0, vh: 1, max: 1, pins: [], plungeContent: 1, floorContent: 2, plungeScroll: 1, docH: 3 };
    let flips: { el: HTMLElement; y: number }[] = [];
    let shown = false, snap = true, quality = 1, frames = 0, slow = 0;
    let head = 0, nudge = 0, nudgeTo = 0, lastScroll = -1, idleFor = 0, skip = false, lastDepth = -1;

    function size() {
      if (!renderer) return;
      const w = cvs.clientWidth, h = cvs.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.5) * quality;
      renderer.resize(Math.max(1, Math.round(w * dpr)), Math.max(1, Math.round(h * dpr)), dpr);
    }

    /** Re-reads the page. Runs on every ScrollTrigger refresh, so pins and heights are already current. */
    function measure() {
      const vh = cvs.clientHeight || window.innerHeight;
      const visible = (el: Element | null) => (el && (el as HTMLElement).offsetParent !== null ? (el as HTMLElement) : null);
      const hero = Array.from(document.querySelectorAll(".hero-scene")).map(visible).find(Boolean) ?? null;
      const plunge = Array.from(document.querySelectorAll("[data-env-plunge]")).map(visible).find(Boolean) ?? null;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pins = ScrollTrigger.getAll()
        .filter((t) => t.vars.pin && t.end > t.start && (t.trigger as HTMLElement | undefined)?.offsetParent !== null)
        .map((t) => ({ start: t.start, end: t.end }))
        .sort((a, b) => a.start - b.start);
      const plungeTop = plunge ? plunge.getBoundingClientRect().top + window.scrollY : max + vh;
      const plungeH = plunge ? plunge.offsetHeight : 0;
      const plungeContent = contentY(plungeTop, pins);
      layout = {
        heroH: hero ? hero.offsetHeight : 0,
        vh,
        max,
        pins,
        plungeContent,
        floorContent: plungeContent + plungeH * 0.9,
        plungeScroll: Math.min(max - 1, Math.max(1, plungeTop - vh)),
        docH: contentY(max, pins) + vh,
      };
      frame.doc = layout.docH;
      renderer?.setPalette(strip(DAY, layout), strip(NIGHT, layout));

      // fixed UI flips to its dark colours as the dark water passes behind it
      flips = Array.from(document.querySelectorAll<HTMLElement>("[data-env-flip]")).map((el) => {
        const r = el.getBoundingClientRect();
        return { el, y: r.top + r.height / 2 };
      });
      size();
    }

    function tick(time: number, delta: number) {
      if (!path) return;
      const scroll = window.scrollY;
      const content = contentY(scroll, layout.pins);
      const surface = surfaceY(scroll, layout.heroH);
      const dt = Math.min(delta, 64) / 1000;

      const target = progressAt(scroll, layout);
      // the camera has a little weight, but the colour band below stays locked to the content
      head = snap ? target : head + (target - head) * (1 - Math.exp(-dt * 7));
      snap = false;
      nudge += (nudgeTo - nudge) * (1 - Math.exp(-dt * 1.6));

      const midpoint = (layout.plungeContent + layout.floorContent) / 2;
      for (const f of flips) {
        const want = content + f.y > midpoint;
        if (f.el.classList.contains("dark") !== want) f.el.classList.toggle("dark", want);
      }

      const depth = Math.round(Math.min(BED_DEPTH, Math.max(0, path[Math.round(Math.min(1, head) * (path.length - 1))].depth * Math.min(1, head / 0.05))));
      if (depth !== lastDepth && reading.current && gauge.current) {
        lastDepth = depth;
        reading.current.textContent = `−${depth} m`;
        gauge.current.style.setProperty("--depth", String(depth / BED_DEPTH));
      }
      if (gauge.current) gauge.current.style.opacity = surface < layout.vh * 0.5 ? "1" : "0";

      if (!renderer) return;
      if (renderer.lost || renderer.failed) return turnOff();
      // the hero fully covers the canvas until the water line comes into view
      if (surface > layout.vh + 20) return;

      // settle to half rate when nothing is moving: drifting light doesn't need more, and the battery notices
      if (scroll !== lastScroll || Math.abs(target - head) > 1e-4) idleFor = 0;
      else idleFor += dt;
      lastScroll = scroll;
      if (idleFor > 2 && (skip = !skip)) return;

      const aspect = cvs.clientWidth / Math.max(1, cvs.clientHeight);
      const shot = cameraAt(viewProj, path, head, aspect, nudge);
      frame.bead = shot.bead;
      frame.eye = shot.eye;
      frame.time = time;
      frame.shift = shot.shift;
      frame.scroll = content;
      frame.surface = surface;
      // the margin keeps the seam covered when a touch scroll moves the hero ahead of this frame
      frame.clipTop = Math.max(0, surface - 80);
      frame.night = theme.night;
      frame.head = head;
      frame.fog = keyed(FOG, head);
      frame.line = keyed(LINE, head);
      frame.shade = keyed(SHADE, head);
      frame.caustic = keyed(CAUSTIC, head);
      frame.rays = keyed(RAYS, head);
      frame.pulse = keyed(PULSE, head);
      // phones have text across the full width, so the map stays quiet everywhere
      frame.quiet = aspect < 0.9 ? 1 : 0.72 * (1 - keyed(PULSE, head) * 0.4);
      frame.moteAlpha = 0.34;
      frame.beadAlpha = Math.min(1, head / 0.03);
      // the shafts lean with the camera, so they seem to hang in the same space as the bed
      frame.sunX = 0.81 + nudge * 0.3;

      if (!renderer.render(frame)) return;
      if (!shown) {
        shown = true;
        root.dataset.env = "on";
        cvs.style.opacity = "1";
      }
      // if the device can't keep up, render fewer pixels rather than drop frames
      if (++frames > 120 && delta > 28 && idleFor === 0) slow++;
      if (slow > 40 && quality > 0.6) {
        quality -= 0.15;
        slow = 0;
        size();
      }
    }

    function turnOff() {
      renderer = null;
      shown = false;
      delete root.dataset.env;
      cvs.style.opacity = "0";
      flips.forEach(({ el }) => el.classList.remove("dark"));
    }

    const onLost = (e: Event) => {
      e.preventDefault();
      turnOff();
    };
    const onRestored = () => {
      if (path) renderer = EnvRenderer.create(cvs, path, lite);
      measure();
    };
    cvs.addEventListener("webglcontextlost", onLost);
    cvs.addEventListener("webglcontextrestored", onRestored);

    // Starts after the hero's own shader had its chance, so the two never compete for the first paint.
    const start = () => {
      path = smoothAzimuth(descend());
      renderer = EnvRenderer.create(cvs, path, lite);
      if (renderer) measure();
    };
    const idleId: number = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(start, { timeout: 4000 }) : window.setTimeout(start, 800);

    const ro = new ResizeObserver(size);
    ro.observe(cvs);
    ScrollTrigger.addEventListener("refresh", measure);
    measure();
    onRoute.current = () => {
      snap = true;
      requestAnimationFrame(() => requestAnimationFrame(measure));
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") nudgeTo = (e.clientX / window.innerWidth - 0.5) * 0.05;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const themeObserver = new MutationObserver(() => {
      gsap.to(theme, { night: root.classList.contains("dark") ? 1 : 0, duration: 0.9, ease: "power2.inOut", overwrite: true });
    });
    themeObserver.observe(root, { attributes: true, attributeFilter: ["class"] });

    gsap.ticker.add(tick);

    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      window.clearTimeout(idleId);
      gsap.ticker.remove(tick);
      gsap.killTweensOf(theme);
      ScrollTrigger.removeEventListener("refresh", measure);
      ro.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      cvs.removeEventListener("webglcontextlost", onLost);
      cvs.removeEventListener("webglcontextrestored", onRestored);
      onRoute.current = () => {};
      renderer?.dispose();
      turnOff();
    };
  }, []);

  return (
    <>
      <RouteWatcher onChange={routeChanged} />
      <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[-1] h-[100lvh] w-full opacity-0 transition-opacity duration-700" />
      {/* the depth, as the lake's own instrument: the scale of the dive on one quiet line */}
      <div ref={gauge} data-env-flip aria-hidden className="env-gauge pointer-events-none fixed top-1/2 right-[max(14px,calc(var(--gutter)/2-8px))] z-[40] hidden h-[34vh] w-px -translate-y-1/2 bg-ink/15 text-ink opacity-0 transition-opacity duration-500 lg:block">
        <span className="env-gauge-mark absolute left-0 h-px w-2 -translate-x-1/2 bg-ink" />
        <span ref={reading} className="env-gauge-mark absolute right-3 -translate-y-1/2 text-[12px] font-medium whitespace-nowrap text-ink/70 tabular-nums" />
      </div>
    </>
  );
}
