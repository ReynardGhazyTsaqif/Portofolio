/*
 * Lake Maninjau scene, shared by the WebGL renderer and the static SVG fallback so both draw the same hills.
 * World space is 1600 x 1000 units, y down, with the water line at y = 600. The viewport shows it like
 * `background-size: cover`, centred.
 */

export const WORLD = { w: 1600, h: 1000, horizon: 600, shore: 935 } as const;

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
  ridge(7, 478, 46, 1.2, 130, 0.18),
  ridge(21, 522, 38, 1.6, 170, 0.34),
  ridge(3, 566, 24, 2.2, 215, 0.58),
  ridge(11, 598, 12, 2.8, 265, 0.85),
];

/** Height of a ridge line at world x. Mirrors `ridgeY` in the shader. */
export function ridgeY(r: Ridge, x: number): number {
  let y = r.base;
  for (let i = 0; i < 4; i++) y -= Math.sin((x / WORLD.w) * r.freq[i] * Math.PI * 2 + r.phase[i]) * r.amp[i];
  return y - Math.pow(Math.abs(x - WORLD.w / 2) / (WORLD.w / 2), 2.2) * r.bowl;
}

export function shoreY(x: number): number {
  return WORLD.shore + Math.sin(x * 0.0042 + 0.6) * 12 + Math.sin(x * 0.011 + 2.1) * 5;
}

/** Morning (light theme) and night (dark theme). Keep in sync with the --hero-* tokens in globals.css. */
export const PALETTES = {
  light: {
    skyTop: "#f7f2e8",
    skyLow: "#e9ede4",
    sun: "#fff6e2",
    glow: "#fbecd0",
    ridges: ["#cdd4ca", "#aebbab", "#889a81", "#5f7558"],
    mist: "#f4f3ec",
    lakeTop: "#c2cec6",
    lakeLow: "#9fb1a8",
    glint: "#fffaf0",
    shore: "#f2ede3",
    ink: "#1d221b",
  },
  dark: {
    skyTop: "#0b100e",
    skyLow: "#1a2520",
    sun: "#ece6d2",
    glow: "#3a4a3f",
    ridges: ["#2c3a32", "#222e27", "#18221c", "#101814"],
    mist: "#22302a",
    lakeTop: "#16201b",
    lakeLow: "#0b110e",
    glint: "#d8e4cf",
    shore: "#121511",
    ink: "#ebe6da",
  },
} as const;

export type PaletteName = keyof typeof PALETTES;

/** Both palettes as RGB triplets, ready to blend on the CPU and upload as uniforms. */
export function paletteRGB(name: PaletteName) {
  const p = PALETTES[name];
  return {
    skyTop: hex(p.skyTop),
    skyLow: hex(p.skyLow),
    sun: hex(p.sun),
    glow: hex(p.glow),
    ridges: p.ridges.map(hex),
    mist: hex(p.mist),
    lakeTop: hex(p.lakeTop),
    lakeLow: hex(p.lakeLow),
    glint: hex(p.glint),
    shore: hex(p.shore),
    ink: hex(p.ink),
  };
}

/** Sun by day, moon by night: world position and radius. */
export const SUN = { x: 1300, y: 178, r: 56 } as const;

/** Where the name sits: centred on x, baseline in world units. */
export const NAME = { cx: 800, baseline: 400, maxWidth: 880, fill: 0.8 } as const;

/** Cover-fit mapping from world units to CSS pixels for a hero of size w x h. */
export function viewFor(w: number, h: number) {
  const scale = Math.max(w / WORLD.w, h / WORLD.h);
  return { scale, ox: (WORLD.w - w / scale) / 2, oy: (WORLD.h - h / scale) / 2, visibleW: w / scale };
}
