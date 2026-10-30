"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { surfaceY } from "@/components/environment/world";
import { handwriting } from "./handwriting";
import { HeroRenderer } from "./renderer";
import { NAME, REFLECTION_AXIS, RIDGES, ROCKS, ROCK_DEPTH, SUN, WORLD, paletteRGB, ridgeY, rockRadius, shoreY, viewFor, type Palette } from "./scene";

type Props = { oneLiner: string; eyebrow: string; place: string; replay: string; scroll: string };

const NAME_PATHS = handwriting.reynard.paths;
const [VX, VY, VW, VH] = handwriting.reynard.viewBox;
const STROKE = 30; // font units

/*
 * The name box is placed in pure CSS with container units, using the same cover-fit maths as the canvas,
 * so it sits in the right spot on the very first frame (no layout shift while JS loads).
 * --s: CSS pixels per world unit. --nw: the name's width in pixels.
 */
const SCENE_VARS = {
  containerType: "size",
  "--s": `max(calc(100cqw / ${WORLD.w}), calc(100cqh / ${WORLD.h}))`,
  "--nw": `min(calc(${NAME.maxWidth} * var(--s)), ${NAME.fill * 100}cqw)`,
} as React.CSSProperties;
const NAME_BOX: React.CSSProperties = {
  left: "calc(50cqw - var(--nw) / 2)",
  width: "var(--nw)",
  height: `calc(var(--nw) * ${VH / VW})`,
  top: `calc(50cqh + ${NAME.baseline - WORLD.h / 2} * var(--s) + var(--nw) * ${VY / VW})`,
};
// mirrored about the reflection line: used when WebGL isn't drawing the reflection
const REFLECTION_BOX: React.CSSProperties = {
  ...NAME_BOX,
  top: `calc(50cqh + ${2 * REFLECTION_AXIS - WORLD.h / 2 - NAME.baseline} * var(--s) - var(--nw) * ${(VY + VH) / VW})`,
};

// The handwriting plays once per visit; coming back to the page shows the finished name.
// If the hero remounts mid-stroke (React's dev double-mount, a streamed re-render), the pen picks up
// where it left off instead of jumping to the end.
let introTime = 0;
let introDone = false;

// ---- static scene for first paint, reduced motion and browsers without WebGL ----
const RIDGE_PATHS = RIDGES.map((r) => {
  const pts: string[] = [];
  for (let x = -20; x <= WORLD.w + 20; x += 10) pts.push(`${x} ${ridgeY(r, x).toFixed(1)}`);
  return `M-20 ${WORLD.horizon + 40} L${pts.join(" L")} L${WORLD.w + 20} ${WORLD.horizon + 40}Z`;
});
const WATER_PATH = (() => {
  const pts: string[] = [];
  for (let x = -20; x <= WORLD.w + 20; x += 10) pts.push(`${x} ${shoreY(x).toFixed(1)}`);
  return `M-20 ${WORLD.h + 20} L${pts.join(" L")} L${WORLD.w + 20} ${WORLD.h + 20}Z`;
})();
const ROCK_PATHS = ROCKS.map((r) => {
  const pts: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2, k = rockRadius(a, r.seed);
    pts.push(`${(r.x + Math.cos(a) * k * r.rx).toFixed(1)} ${(r.y + Math.sin(a) * k * r.ry).toFixed(1)}`);
  }
  return `M${pts.join(" L")}Z`;
});

const LIGHT = paletteRGB("light");
const DARK = paletteRGB("dark");
function blend(t: number): Palette {
  const mix = (a: number[], b: number[]) => a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];
  return Object.fromEntries(
    Object.keys(LIGHT).map((k) => {
      const a = LIGHT[k as keyof Palette], b = DARK[k as keyof Palette];
      return [k, k === "ridges" ? (a as number[][]).map((c, i) => mix(c, (b as number[][])[i])) : mix(a as number[], b as number[])];
    }),
  ) as Palette;
}

export function HeroManinjau({ oneLiner, eyebrow, place, replay, scroll }: Props) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const nameBox = useRef<HTMLDivElement>(null);
  const reflBox = useRef<HTMLDivElement>(null);
  const staticScene = useRef<HTMLDivElement>(null);
  const nameG = useRef<SVGGElement>(null);
  const replayRef = useRef<() => void>(() => {});

  useGSAP(
    () => {
      const section = root.current!, box = nameBox.current!, refl = reflBox.current!, cvs = canvas.current!, still = staticScene.current!;
      const reduce = prefersReducedMotion();
      const finePointer = window.matchMedia("(pointer: fine)").matches;
      const skipIntro = reduce || introDone;

      const paths = Array.from(nameG.current!.querySelectorAll("path"));
      const lens = paths.map((p) => p.getTotalLength());
      const total = lens.reduce((a, b) => a + b, 0);
      const paths2d = NAME_PATHS.map((d) => new Path2D(d));

      const st = { write: skipIntro ? 1 : 0, mx: 0, scroll: 0, night: document.documentElement.classList.contains("dark") ? 1 : 0 };

      // Low-res copy of the name for the reflection; redrawn only while the pen moves.
      const nameCanvas = document.createElement("canvas");
      nameCanvas.width = 640;
      nameCanvas.height = Math.round((640 * VH) / VW);
      const nctx = nameCanvas.getContext("2d")!;
      let nameDirty = true;

      function paint() {
        let left = st.write * total;
        nctx.setTransform(1, 0, 0, 1, 0, 0);
        nctx.clearRect(0, 0, nameCanvas.width, nameCanvas.height);
        nctx.setTransform(nameCanvas.width / VW, 0, 0, nameCanvas.height / VH, (-VX * nameCanvas.width) / VW, (-VY * nameCanvas.height) / VH);
        Object.assign(nctx, { lineWidth: STROKE, lineCap: "round", lineJoin: "round", strokeStyle: "#000" });
        paths.forEach((path, i) => {
          const len = lens[i], drawn = Math.max(0, Math.min(len, left));
          left -= len;
          path.style.strokeDasharray = `${len} ${len}`;
          path.style.strokeDashoffset = String(len - drawn);
          if (drawn > 0) {
            nctx.setLineDash([len, len]);
            nctx.lineDashOffset = len - drawn;
            nctx.stroke(paths2d[i]);
          }
        });
        nameDirty = true;
      }
      paint();

      // ---- layout: map the world onto the section like background-size: cover ----
      let view = viewFor(1, 1);
      let nameRect: [number, number, number, number] = [0, 0, 1, 1];
      let quality = 1;
      let renderer: HeroRenderer | null = null;

      function layout() {
        const w = section.clientWidth, h = section.clientHeight;
        view = viewFor(w, h);
        const width = Math.min(NAME.maxWidth, view.visibleW * NAME.fill);
        const s = width / VW;
        // same rectangle the CSS on the name box computes; the shader needs it in world units
        nameRect = [NAME.cx - width / 2, NAME.baseline + VY * s, width, VH * s];
        if (renderer) {
          const dpr = Math.min(window.devicePixelRatio || 1, finePointer ? 1.75 : 1.35) * quality;
          renderer.resize(Math.round(w * dpr), Math.round(h * dpr));
        }
      }
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(section);

      // ---- frame loop: only while the hero is on screen ----
      let active = true, frames = 0, slow = 0;
      let palette = blend(st.night), paletteFor = st.night;
      let stillUntil = Infinity;

      function showStaticScene() {
        renderer = null;
        cvs.style.opacity = "0";
        refl.style.opacity = "";
        still.style.visibility = "";
      }

      function tick(time: number, delta: number) {
        const nx = -st.mx * 0.45 * 30, ny = -st.scroll * 80;
        const fade = 1 - Math.min(1, st.scroll * 1.6);
        box.style.transform = `translate3d(${nx * view.scale}px, ${ny * view.scale}px, 0)`;
        box.style.opacity = String(fade);
        if (!active || !renderer) return;
        if (renderer.lost || renderer.failed) return showStaticScene();
        // once the water line has climbed past the top of the screen there is nothing of the hero left to draw
        const heroH = section.clientHeight, top = st.scroll * heroH;
        const water = surfaceY(top, heroH);
        if (water < -24) return;
        if (nameDirty) {
          renderer.setName(nameCanvas);
          nameDirty = false;
        }
        if (paletteFor !== st.night) {
          palette = blend(st.night);
          paletteFor = st.night;
        }
        const dpr = renderer.width / section.clientWidth;
        // the still scene would show through the cut-away water; it can go once the canvas has faded in
        if (time > stillUntil && water < heroH) still.style.visibility = "hidden";
        // tall phone screens show little of the shore, so the rocks rise a little to stay in frame
        const lift = Math.min(130, Math.max(0, (1 - section.clientWidth / section.clientHeight) * 190));
        const drawn = renderer.render({
          time,
          scale: view.scale * dpr,
          originX: view.ox,
          originY: view.oy,
          night: st.night,
          palette,
          ridgeOffsets: RIDGES.map((r) => ({ x: -st.mx * r.depth * 30, y: -st.scroll * r.depth * 190 })),
          rockOffset: { x: -st.mx * ROCK_DEPTH * 30, y: -lift - st.scroll * ROCK_DEPTH * 190 },
          sun: { x: SUN.x - st.mx * 4, y: SUN.y + st.scroll * 110, r: SUN.r },
          nameRect: [nameRect[0] + nx, nameRect[1] + ny, nameRect[2], nameRect[3]],
          nameAlpha: 0.55 * fade,
          waterline: water + top,
          px: dpr,
          // above the screen, or under the water line (plus room for its waves): nobody sees those pixels
          clip: [Math.max(0, top - 120), Math.min(heroH, water + top + 24)],
        });
        if (!drawn) return; // shader still compiling: the static scene stays up
        if (stillUntil === Infinity) stillUntil = time + 0.8;
        cvs.style.opacity = "1";
        refl.style.opacity = "0";
        // If the device can't keep up, render fewer pixels rather than drop frames.
        if (++frames > 180 && delta > 28) slow++;
        if (slow > 45 && quality > 0.55) {
          quality -= 0.15;
          slow = 0;
          layout();
        }
      }

      gsap.ticker.add(tick);
      const onLost = (e: Event) => {
        e.preventDefault();
        showStaticScene();
      };
      cvs.addEventListener("webglcontextlost", onLost);

      // WebGL starts once the browser is idle, so it never competes with the first paint or the handwriting.
      const startGL = () => {
        renderer = HeroRenderer.create(cvs);
        if (renderer) layout();
      };
      const idleId: number = reduce ? 0 : typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(startGL, { timeout: 3000 }) : window.setTimeout(startGL, 300);

      ScrollTrigger.create({ trigger: section, start: "top bottom", end: "bottom top", onToggle: (s) => (active = s.isActive) });
      ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom top", onUpdate: (s) => (st.scroll = s.progress) });
      gsap.to("[data-hero-fade]", { opacity: 0, y: -24, ease: "none", scrollTrigger: { trigger: section, start: "top top", end: "45% top", scrub: true } });

      const onMove = (e: PointerEvent) => to?.(e.clientX / window.innerWidth - 0.5);
      const to = finePointer && !reduce ? gsap.quickTo(st, "mx", { duration: 1.4, ease: "power3" }) : null;
      if (to) section.addEventListener("pointermove", onMove);

      const themeObserver = new MutationObserver(() => {
        gsap.to(st, { night: document.documentElement.classList.contains("dark") ? 1 : 0, duration: 0.9, ease: "power2.inOut" });
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

      // ---- intro: the name is written stroke by stroke, then the copy settles in ----
      const intro: gsap.core.Timeline = gsap
        .timeline({
          paused: true,
          onUpdate: () => {
            paint();
            introTime = intro.time();
          },
          onComplete: () => void (introDone = true),
        })
        .fromTo(st, { write: 0 }, { write: 1, duration: 3.2, ease: "power1.inOut", immediateRender: false })
        .fromTo("[data-hero-in]", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: "expo.out", immediateRender: false }, "-=1.2");
      replayRef.current = () => intro.restart();
      if (skipIntro) gsap.set("[data-hero-in]", { opacity: 1, y: 0 });
      else if (introTime > 0) intro.seek(introTime).play();
      else intro.delay(0.6).play();

      return () => {
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
        window.clearTimeout(idleId);
        gsap.ticker.remove(tick);
        ro.disconnect();
        themeObserver.disconnect();
        cvs.removeEventListener("webglcontextlost", onLost);
        section.removeEventListener("pointermove", onMove);
        renderer?.dispose();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className="hero-scene relative h-[100svh] min-h-[600px] overflow-hidden" style={SCENE_VARS} aria-label={place}>
      <h1 className="sr-only">Reynard Ghazy Tsaqif</h1>

      <div ref={staticScene} className="absolute inset-0">
      <svg className="absolute inset-0 size-full" viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--hero-sky-top)" }} />
            <stop offset="1" style={{ stopColor: "var(--hero-sky-low)" }} />
          </linearGradient>
          <linearGradient id="hero-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--hero-water-top)" }} />
            <stop offset="1" style={{ stopColor: "var(--hero-water-low)" }} />
          </linearGradient>
        </defs>
        <rect x="-20" y="-20" width={WORLD.w + 40} height={WORLD.horizon + 40} fill="url(#hero-sky)" />
        <circle cx={SUN.x} cy={SUN.y} r={SUN.r} style={{ fill: "var(--hero-sun)" }} />
        {RIDGE_PATHS.map((d, i) => <path key={i} d={d} style={{ fill: `var(--hero-r${i + 1})` }} />)}
        <path d={WATER_PATH} fill="url(#hero-water)" />
        {ROCK_PATHS.map((d, i) => <path key={i} d={d} style={{ fill: "var(--hero-rock)" }} />)}
      </svg>
      {/* static fade into the page (WebGL draws its own) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-b from-transparent to-paper" aria-hidden />
      </div>

      <canvas ref={canvas} className="absolute inset-0 size-full opacity-0 transition-opacity duration-700" aria-hidden />

      {/* reflection used only when WebGL isn't drawing it */}
      <div ref={reflBox} className="pointer-events-none absolute -scale-y-100 opacity-30 blur-[1px] transition-opacity duration-500" style={REFLECTION_BOX} aria-hidden>
        <svg viewBox={`${VX} ${VY} ${VW} ${VH}`} className="block size-full overflow-visible">
          <use href="#hero-name" />
        </svg>
      </div>

      <div ref={nameBox} className="pointer-events-none absolute will-change-transform" style={NAME_BOX} aria-hidden>
        <svg viewBox={`${VX} ${VY} ${VW} ${VH}`} className="block size-full overflow-visible">
          <defs>
            <linearGradient id="hw-ink" gradientUnits="userSpaceOnUse" x1={VX} y1="0" x2={VX + VW} y2="0">
              <stop offset="0" style={{ stopColor: "var(--ink)" }} />
              <stop offset="0.55" style={{ stopColor: "var(--moss)" }} />
              <stop offset="1" style={{ stopColor: "var(--ink)" }} />
            </linearGradient>
          </defs>
          <g id="hero-name" ref={nameG} fill="none" stroke="url(#hw-ink)" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
            {NAME_PATHS.map((d, i) => <path key={i} d={d} />)}
          </g>
        </svg>
      </div>

      <div data-hero-fade className="gutter absolute inset-x-0 top-[calc(92px+env(safe-area-inset-top))] md:top-[112px]">
        <p data-hero-in className="hero-in text-[14px] font-semibold text-moss">{eyebrow}</p>
        <p data-hero-in className="hero-in mt-2 max-w-[30ch] text-[clamp(15px,1.3vw,18px)] leading-snug font-medium">{oneLiner}</p>
      </div>

      <div data-hero-fade className="gutter absolute inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] flex items-end justify-between gap-4 text-[13px] md:bottom-[max(20px,env(safe-area-inset-bottom))]">
        <div data-hero-in className="hero-in flex items-center gap-3 rounded-full bg-paper/85 py-1 pr-1 pl-3">
          <span className="text-ink/80">{place}</span>
          <button type="button" onClick={() => replayRef.current()} className="rounded-full border border-line bg-paper px-3 py-1 font-semibold transition-colors hover:border-ink">
            {replay}
          </button>
        </div>
        <span data-hero-in className="hero-in absolute left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-ink/70 md:flex">
          {scroll}
          <span className="block h-8 w-px origin-top animate-[hero-drip_2.2s_cubic-bezier(.7,0,.2,1)_infinite] bg-ink/50" />
        </span>
      </div>
    </section>
  );
}
