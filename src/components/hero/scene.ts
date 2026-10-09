/*
 * Lake Maninjau scene, shared by the WebGL renderer and the static SVG fallback so both draw the same
 * shapes. World space is 1600 x 1000 units, y down. Mountains meet a calm lake at y = 560, rocks line
 * the near shore, and only the handwritten name is reflected in the water. The viewport shows the
 * world like `background-size: cover`, centred.
 */

export const WORLD = { w: 1600, h: 1000, horizon: 560 } as const;

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;

export type Ridge = {
  base: number; // mean height of the ridge line
  bowl: number; // how steeply the caldera walls rise toward the edges
  amp: [number, number, number, number];
  freq: [number, number, number, number];
  phase: [number, number, number, number];
  depth: number; // parallax factor, 0 = far
};

function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function ridge(seed: number, base: number, amp: number, freq: number, bowl: number, depth: number): Ridge {
  const r = rng(seed);
  const a = [0, 1, 2, 3].map((i) => amp / (i + 1.4));
  const f = [0, 1, 2, 3].map((i) => (i + 1) * freq * (0.7 + r() * 0.6));
  const p = [0, 1, 2, 3].map(() => r() * Math.PI * 2);
  return { base, bowl, depth, amp: a as Ridge["amp"], freq: f as Ridge["freq"], phase: p as Ridge["phase"] };
}

// Far to near. Maninjau is a caldera lake, so every ridge curls up at the edges.
export const RIDGES: Ridge[] = [
  ridge(7, 432, 46, 1.2, 130, 0.18),
  ridge(21, 476, 38, 1.6, 170, 0.34),
  ridge(3, 520, 24, 2.2, 215, 0.58),
  ridge(11, 552, 12, 2.8, 265, 0.85),
];

/** Height of a ridge line at world x. Mirrors the ridge loop in the shader. */
export function ridgeY(r: Ridge, x: number): number {
  let y = r.base;
  for (let i = 0; i < 4; i++) y -= Math.sin((x / WORLD.w) * r.freq[i] * Math.PI * 2 + r.phase[i]) * r.amp[i];
  return y - Math.pow(Math.abs(x - WORLD.w / 2) / (WORLD.w / 2), 2.2) * r.bowl;
}

/** Shore rocks: centre x/y and radii in world units, plus a seed for the outline wobble. Drawn back to front. */
export type Rock = { x: number; y: number; rx: number; ry: number; seed: number };
export const ROCKS: Rock[] = [
  { x: -60, y: 930, rx: 230, ry: 150, seed: 1.3 },
  { x: 175, y: 985, rx: 190, ry: 105, seed: 4.1 },
  { x: 360, y: 1010, rx: 110, ry: 58, seed: 2.7 },
  { x: 610, y: 1000, rx: 95, ry: 46, seed: 6.2 },
  { x: 700, y: 1012, rx: 46, ry: 20, seed: 8.8 },
  { x: 790, y: 1018, rx: 70, ry: 26, seed: 3.3 },
  { x: 985, y: 992, rx: 120, ry: 58, seed: 9.6 },
  { x: 1660, y: 925, rx: 240, ry: 160, seed: 5.5 },
  { x: 1440, y: 985, rx: 200, ry: 110, seed: 0.9 },
  { x: 1255, y: 1012, rx: 95, ry: 50, seed: 7.4 },
];
export const ROCK_DEPTH = 1.15;

/** Radius multiplier of a rock outline at angle a. Mirrors `rockRadius` in the shader. */
export function rockRadius(a: number, seed: number): number {
  return 1 + 0.07 * Math.sin(3 * a + seed) + 0.035 * Math.sin(7 * a + seed * 2) + 0.018 * Math.sin(13 * a + seed * 3);
}

/** Morning (light theme) and night (dark theme). Keep in sync with the --hero-* tokens in globals.css. */
export const PALETTES = {
  light: {
    skyTop: "#f7f2e8",
    skyLow: "#e9ede4",
    sun: "#fff6e2",
    glow: "#fbecd0",
    ridges: ["#cdd4ca", "#aebbab", "#889a81", "#5f7558"],
    mist: "#f1f1ea",
    waterTop: "#d3ddd6",
    waterLow: "#93a89e",
    glint: "#fffaf0",
    rockLight: "#9a9a8c",
    rockDark: "#4e5248",
    rockMoss: "#6c7d5c",
    ink: "#1d221b",
  },
  dark: {
    skyTop: "#0b100e",
    skyLow: "#1a2520",
    sun: "#ece6d2",
    glow: "#3a4a3f",
    ridges: ["#2c3a32", "#222e27", "#18221c", "#101814"],
    mist: "#22302a",
    waterTop: "#1c2822",
    waterLow: "#0a100d",
    glint: "#d8e4cf",
    rockLight: "#3a3e37",
    rockDark: "#121512",
    rockMoss: "#26321f",
    ink: "#ebe6da",
  },
} as const;

export type PaletteName = keyof typeof PALETTES;
export type Palette = { [K in keyof (typeof PALETTES)["light"]]: K extends "ridges" ? RGB[] : RGB };

/** A palette as RGB triplets, ready to blend on the CPU and upload as uniforms. */
export function paletteRGB(name: PaletteName): Palette {
  const p = PALETTES[name];
  return Object.fromEntries(
    Object.entries(p).map(([k, v]) => [k, Array.isArray(v) ? v.map(hex) : hex(v as string)]),
  ) as Palette;
}

/** Sun by day, moon by night: world position and radius. */
export const SUN = { x: 1300, y: 170, r: 56 } as const;

/** Where the name floats: centred on x, baseline in world units, above the water line. */
export const NAME = { cx: 800, baseline: 382, maxWidth: 880, fill: 0.8 } as const;

/** Cover-fit mapping from world units to CSS pixels for a hero of size w x h. */
export function viewFor(w: number, h: number) {
  const scale = Math.max(w / WORLD.w, h / WORLD.h);
  return { scale, ox: (WORLD.w - w / scale) / 2, oy: (WORLD.h - h / scale) / 2, visibleW: w / scale };
}
