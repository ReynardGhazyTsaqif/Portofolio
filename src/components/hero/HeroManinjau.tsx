"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { handwriting } from "./handwriting";
import { HeroRenderer, type Vec3 } from "./renderer";
import { NAME, RIDGES, SUN, WORLD, paletteRGB, ridgeY, shoreY, viewFor } from "./scene";

type Props = { eyebrow: string; oneLiner: string; place: string; replay: string; scroll: string };

const REY = handwriting.reynard;
const HALO = handwriting.halo;
const [VX, VY, VW, VH] = REY.viewBox;
// "Halo" shares Reynard's baseline and centre line.
const HALO_SHIFT = VX + VW / 2 - (HALO.viewBox[0] + HALO.viewBox[2] / 2);
const STROKE = 30; // font units

// Static scene geometry for the first paint and for browsers without WebGL.
function ridgePath(i: number) {
  const pts: string[] = [];
  for (let x = -20; x <= WORLD.w + 20; x += 10) pts.push(`${x} ${ridgeY(RIDGES[i], x).toFixed(1)}`);
  return `M-20 ${WORLD.horizon + 40} L${pts.join(" L")} L${WORLD.w + 20} ${WORLD.horizon + 40}Z`;
}
const RIDGE_PATHS = RIDGES.map((_, i) => ridgePath(i));
const SHORE_PATH = (() => {
  const pts: string[] = [];
  for (let x = -20; x <= WORLD.w + 20; x += 20) pts.push(`${x} ${shoreY(x).toFixed(1)}`);
  return `M-20 ${WORLD.h} L${pts.join(" L")} L${WORLD.w + 20} ${WORLD.h}Z`;
})();

const LIGHT = paletteRGB("light");
const DARK = paletteRGB("dark");
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function blendPalette(t: number) {
  return {
    skyTop: mix3(LIGHT.skyTop, DARK.skyTop, t), skyLow: mix3(LIGHT.skyLow, DARK.skyLow, t),
    sun: mix3(LIGHT.sun, DARK.sun, t), glow: mix3(LIGHT.glow, DARK.glow, t),
    ridges: LIGHT.ridges.map((c, i) => mix3(c, DARK.ridges[i], t)), mist: mix3(LIGHT.mist, DARK.mist, t),
    lakeTop: mix3(LIGHT.lakeTop, DARK.lakeTop, t), lakeLow: mix3(LIGHT.lakeLow, DARK.lakeLow, t),
    glint: mix3(LIGHT.glint, DARK.glint, t), shore: mix3(LIGHT.shore, DARK.shore, t), ink: mix3(LIGHT.ink, DARK.ink, t),
  };
}

export function HeroManinjau({ eyebrow, oneLiner, place, replay, scroll }: Props) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const nameBox = useRef<HTMLDivElement>(null);
  const haloG = useRef<SVGGElement>(null);
  const reyG = useRef<SVGGElement>(null);
  const replayRef = useRef<() => void>(() => {});

  useGSAP(
    () => {
      const section = root.current!, box = nameBox.current!, cvs = canvas.current!;
      const reduce = prefersReducedMotion();
      const finePointer = window.matchMedia("(pointer: fine)").matches;

      const haloPaths = Array.from(haloG.current!.querySelectorAll("path"));
      const reyPaths = Array.from(reyG.current!.querySelectorAll("path"));
      const haloLens = haloPaths.map((p) => p.getTotalLength());
      const reyLens = reyPaths.map((p) => p.getTotalLength());
      const halo2d = HALO.paths.map((d) => new Path2D(d));
      const rey2d = REY.paths.map((d) => new Path2D(d));

      const st = { halo: 0, rey: reduce ? 1 : 0, haloAlpha: 1, mx: 0, scroll: 0, night: document.documentElement.classList.contains("dark") ? 1 : 0 };

      // Low-res copy of the name for the reflection; only redrawn while the pen moves.
      const nameCanvas = document.createElement("canvas");
      nameCanvas.width = 640;
      nameCanvas.height = Math.round((640 * VH) / VW);
      const nctx = nameCanvas.getContext("2d")!;
      let nameDirty = true;

      function dash(paths: SVGPathElement[], lens: number[], p2d: Path2D[], progress: number, alpha: number, shift: number) {
        const total = lens.reduce((a, b) => a + b, 0);
        let left = progress * total;
        nctx.save();
        nctx.translate(shift, 0);
        nctx.globalAlpha = alpha;
        paths.forEach((path, i) => {
          const len = lens[i];
          const drawn = Math.max(0, Math.min(len, left));
          left -= len;
          path.style.strokeDasharray = `${len} ${len}`;
          path.style.strokeDashoffset = String(len - drawn);
          if (drawn > 0 && alpha > 0) {
            nctx.setLineDash([len, len]);
            nctx.lineDashOffset = len - drawn;
            nctx.stroke(p2d[i]);
          }
        });
        nctx.restore();
      }

      function paint() {
        nctx.setTransform(1, 0, 0, 1, 0, 0);
        nctx.clearRect(0, 0, nameCanvas.width, nameCanvas.height);
        nctx.setTransform(nameCanvas.width / VW, 0, 0, nameCanvas.height / VH, (-VX * nameCanvas.width) / VW, (-VY * nameCanvas.height) / VH);
        nctx.lineWidth = STROKE;
        nctx.lineCap = "round";
        nctx.lineJoin = "round";
        nctx.strokeStyle = "#000";
        dash(haloPaths, haloLens, halo2d, st.halo, st.haloAlpha, HALO_SHIFT);
        dash(reyPaths, reyLens, rey2d, st.rey, 1, 0);
        haloG.current!.style.opacity = String(st.haloAlpha);
        nameDirty = true;
      }
      paint();

      // ---- layout: map the world onto the section like background-size: cover ----
      let view = viewFor(1, 1);
      let nameRect: [number, number, number, number] = [0, 0, 1, 1];
      let quality = 1;
      const renderer = reduce ? null : HeroRenderer.create(cvs);

      function layout() {
        const w = section.clientWidth, h = section.clientHeight;
        view = viewFor(w, h);
        const width = Math.min(NAME.maxWidth, view.visibleW * NAME.fill);
        const s = width / VW;
        nameRect = [NAME.cx - width / 2, NAME.baseline + VY * s, width, VH * s];
        Object.assign(box.style, {
          left: `${(nameRect[0] - view.ox) * view.scale}px`,
          top: `${(nameRect[1] - view.oy) * view.scale}px`,
          width: `${nameRect[2] * view.scale}px`,
          height: `${nameRect[3] * view.scale}px`,
        });
        if (renderer) {
          const dpr = Math.min(window.devicePixelRatio || 1, finePointer ? 1.75 : 1.35) * quality;
          renderer.resize(Math.round(w * dpr), Math.round(h * dpr));
        }
      }
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(section);

      // ---- frame loop: only while the hero is on screen ----
      let active = true, shown = false, frames = 0, slow = 0;
      let palette = blendPalette(st.night), paletteFor = st.night;

      function tick(time: number, delta: number) {
        if (!active || !renderer) return;
        if (nameDirty) {
          renderer.setName(nameCanvas);
          nameDirty = false;
        }
        if (paletteFor !== st.night) {
          palette = blendPalette(st.night);
          paletteFor = st.night;
        }
        const nx = -st.mx * 0.45 * 30, ny = -st.scroll * 80;
        box.style.transform = `translate3d(${nx * view.scale}px, ${ny * view.scale}px, 0)`;
        box.style.opacity = String(1 - Math.min(1, st.scroll * 1.6));
        const dpr = renderer.width / section.clientWidth;
        renderer.render({
          time,
          scale: view.scale * dpr,
          originX: view.ox,
          originY: view.oy,
          night: st.night,
          palette,
          ridgeOffsets: RIDGES.map((r) => ({ x: -st.mx * r.depth * 30, y: -st.scroll * r.depth * 190 })),
          sun: { x: SUN.x - st.mx * 4, y: SUN.y + st.scroll * 110, r: SUN.r },
          nameRect: [nameRect[0] + nx, nameRect[1] + ny, nameRect[2], nameRect[3]],
          nameAlpha: 0.75 * (1 - Math.min(1, st.scroll * 1.6)),
        });
        if (!shown) {
          shown = true;
          cvs.style.opacity = "1";
        }
        // If the device can't keep up, render fewer pixels rather than drop frames.
        if (++frames > 180 && delta > 28) slow++;
        if (slow > 45 && quality > 0.55) {
          quality -= 0.15;
          slow = 0;
          layout();
        }
      }

      if (renderer) {
        gsap.ticker.add(tick);
        cvs.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          active = false;
          cvs.style.opacity = "0";
        });
        ScrollTrigger.create({ trigger: section, start: "top bottom", end: "bottom top", onToggle: (s) => (active = s.isActive) });
      }

      ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom top", onUpdate: (s) => (st.scroll = s.progress) });
      gsap.to("[data-hero-fade]", { opacity: 0, y: -24, ease: "none", scrollTrigger: { trigger: section, start: "top top", end: "45% top", scrub: true } });

      if (finePointer && !reduce) {
        const to = gsap.quickTo(st, "mx", { duration: 1.4, ease: "power3" });
        section.addEventListener("pointermove", (e) => to(e.clientX / window.innerWidth - 0.5));
      }

      const themeObserver = new MutationObserver(() => {
        gsap.to(st, { night: document.documentElement.classList.contains("dark") ? 1 : 0, duration: 0.9, ease: "power2.inOut" });
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

      // ---- intro: "Halo" is written, lifts away, then "Reynard" is written ----
      if (!reduce) {
        const intro = gsap
          .timeline({ delay: 0.6, onUpdate: paint })
          .to(st, { halo: 1, duration: 1.7, ease: "power1.inOut" })
          .to(st, { haloAlpha: 0, duration: 0.6, ease: "power2.in" }, "+=0.5")
          .to(st, { rey: 1, duration: 2.9, ease: "power1.inOut" }, "+=0.05")
          .fromTo("[data-hero-in]", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: "expo.out" }, "-=1.3");
        replayRef.current = () => intro.restart(true);
      } else {
        gsap.set("[data-hero-in]", { opacity: 1 });
      }

      return () => {
        gsap.ticker.remove(tick);
        ro.disconnect();
        themeObserver.disconnect();
        renderer?.dispose();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className="hero-scene relative h-[100svh] min-h-[600px] overflow-hidden" aria-label={place}>
      <h1 className="sr-only">Reynard Ghazy Tsaqif</h1>

      {/* first paint and no-WebGL fallback */}
      <svg className="absolute inset-0 size-full" viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--hero-sky-top)" }} />
            <stop offset="1" style={{ stopColor: "var(--hero-sky-low)" }} />
          </linearGradient>
          <clipPath id="hero-water">
            <rect x="0" y={WORLD.horizon} width={WORLD.w} height={WORLD.h - WORLD.horizon} />
          </clipPath>
        </defs>
        <rect x="-20" y="-20" width={WORLD.w + 40} height={WORLD.horizon + 60} fill="url(#hero-sky)" />
        <circle cx={SUN.x} cy={SUN.y} r={SUN.r} style={{ fill: "var(--hero-sun)" }} />
        {RIDGE_PATHS.map((d, i) => <path key={i} d={d} style={{ fill: `var(--hero-r${i + 1})` }} />)}
        <rect x="-20" y={WORLD.horizon} width={WORLD.w + 40} height={WORLD.h - WORLD.horizon} style={{ fill: "var(--hero-lake)" }} />
        <g clipPath="url(#hero-water)" opacity="0.4" transform={`translate(0 ${WORLD.horizon * 2}) scale(1 -1)`}>
          {RIDGE_PATHS.map((d, i) => <path key={i} d={d} style={{ fill: `var(--hero-r${i + 1})` }} />)}
        </g>
        <path d={SHORE_PATH} style={{ fill: "var(--paper)" }} />
      </svg>

      <canvas ref={canvas} className="absolute inset-0 size-full opacity-0 transition-opacity duration-700" aria-hidden />

      <div ref={nameBox} className="pointer-events-none absolute top-0 left-0 will-change-transform" aria-hidden>
        <svg viewBox={`${VX} ${VY} ${VW} ${VH}`} className="block size-full overflow-visible">
          <defs>
            <linearGradient id="hw-ink" gradientUnits="userSpaceOnUse" x1={VX} y1="0" x2={VX + VW} y2="0">
              <stop offset="0" style={{ stopColor: "var(--ink)" }} />
              <stop offset="0.55" style={{ stopColor: "var(--moss)" }} />
              <stop offset="1" style={{ stopColor: "var(--ink)" }} />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#hw-ink)" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
            <g ref={haloG} transform={`translate(${HALO_SHIFT} 0)`} style={{ opacity: 0 }}>
              {HALO.paths.map((d, i) => <path key={i} d={d} />)}
            </g>
            <g ref={reyG}>
              {REY.paths.map((d, i) => <path key={i} d={d} />)}
            </g>
          </g>
        </svg>
      </div>

      <div data-hero-fade className="gutter absolute inset-x-0 top-[calc(92px+env(safe-area-inset-top))] md:top-[112px]">
        <p data-hero-in className="hero-in text-[14px] font-semibold text-moss">{eyebrow}</p>
        <p data-hero-in className="hero-in mt-2 max-w-[30ch] text-[clamp(15px,1.3vw,18px)] leading-snug font-medium">{oneLiner}</p>
      </div>

      <div data-hero-fade className="gutter absolute inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] flex items-end justify-between gap-4 text-[13px] md:bottom-[max(20px,env(safe-area-inset-bottom))]">
        <div data-hero-in className="hero-in flex items-center gap-3">
          <span className="text-muted">{place}</span>
          <button type="button" onClick={() => replayRef.current()} className="rounded-full border border-line px-3 py-1 font-semibold transition-colors hover:border-ink">
            {replay}
          </button>
        </div>
        <span data-hero-in className="hero-in absolute left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-muted md:flex">
          {scroll}
          <span className="block h-8 w-px origin-top animate-[hero-drip_2.2s_cubic-bezier(.7,0,.2,1)_infinite] bg-muted" />
        </span>
      </div>
    </section>
  );
}
