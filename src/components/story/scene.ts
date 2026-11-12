import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { TERRAIN_GLSL, descend } from "@/components/environment/world";
import { LAND } from "./land";

/*
 * The Home story in one three.js scene, driven entirely by scroll progress (see progress.ts). Every shot is a
 * pure function of progress, so scrubbing backwards plays the film in reverse and nothing can drift.
 *
 *   converge 0.00-0.42  the lake bed seen whole; a ball runs the gradient descent down to the minimum, and the
 *                       camera rises until the bed reads as what it is: a loss surface on a plot
 *   converge 0.42-0.64  the minimum bursts into a cloud of data, which sorts itself into clusters
 *   converge 0.64-1.00  a laptop opens, the data flies in and becomes its screen, and the camera goes into it
 *   between             inside the screen: a quiet field of pixels behind the work, experience and notes
 *   outro    0.00-1.00  out of the screen: the laptop, alone in the dark, then a dot in Padang on the globe,
 *                       with lines going out to the rest of the world
 *
 * Everything is procedural (geometry, textures, the globe from Natural Earth points), so nothing is fetched.
 * Colour management is off: hex colours go to the screen as written, the same as the hand-written shaders
 * elsewhere on the site, so the 3D and the CSS colours match exactly.
 */

THREE.ColorManagement.enabled = false;

export type ScreenCopy = { title: string; accent: string; label: string; nav: string[] };

export type StoryFrame = {
  time: number;
  approach: number;
  converge: number;
  outro: number;
  scroll: number;
  night: number;
  nudge: number;
  velocity: number;
  narrow: boolean;
};

// ---------------------------------------------------------------------------------------------- helpers

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => {
  const c = 1.4;
  return t <= 0 ? 0 : 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic random numbers, so the cloud and the stars are the same on every visit. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-6, r()))) * Math.cos(2 * Math.PI * r());
}

const Y = new THREE.Vector3(0, 1, 0);
const v3 = () => new THREE.Vector3();

/** Unit vectors only: rotates a toward b by t along the great circle. */
function slerpDir(out: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const d = THREE.MathUtils.clamp(a.dot(b), -1, 1);
  const angle = Math.acos(d);
  if (angle < 1e-5) return out.copy(a);
  const s = Math.sin(angle);
  const wa = Math.sin((1 - t) * angle) / s, wb = Math.sin(t * angle) / s;
  return out.set(a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb).normalize();
}

function latLon(lat: number, lon: number, r: number, out = v3()) {
  const phi = THREE.MathUtils.degToRad(lat), lam = THREE.MathUtils.degToRad(lon);
  return out.set(r * Math.cos(phi) * Math.sin(lam), r * Math.sin(phi), r * Math.cos(phi) * Math.cos(lam));
}

// ---------------------------------------------------------------------------------------------- palette

type Swatch = {
  water: string; paper: string; ink: string; accent: string; deep: string; globe: string; land: string; glow: string;
  body: string; keys: string; bezel: string; clusters: [string, string, string, string];
};
// keep in step with the CSS tokens in globals.css and the lake palette in LakeEnvironment.tsx
const DAY: Swatch = {
  water: "#dae3d6", paper: "#f2ede3", ink: "#1d221b", accent: "#46663f", deep: "#111a16", globe: "#1b2822", land: "#a9c79b", glow: "#f6e7bd",
  body: "#d9d5cb", keys: "#2b302a", bezel: "#151913", clusters: ["#46663f", "#b07a3a", "#3d6f72", "#1d221b"],
};
const NIGHT: Swatch = {
  water: "#131d18", paper: "#121511", ink: "#ebe6da", accent: "#b4d3a4", deep: "#090e0b", globe: "#16211b", land: "#8fb27f", glow: "#f0dca4",
  body: "#6a6f68", keys: "#1b1e1a", bezel: "#0b0d0a", clusters: ["#b4d3a4", "#e0b073", "#86c1c0", "#ebe6da"],
};
type Palette = { [K in keyof Swatch]: K extends "clusters" ? THREE.Color[] : THREE.Color };
function palette(s: Swatch): Palette {
  const out = {} as Record<string, THREE.Color | THREE.Color[]>;
  for (const [k, v] of Object.entries(s)) out[k] = Array.isArray(v) ? v.map((c) => new THREE.Color(c)) : new THREE.Color(v);
  return out as Palette;
}

// ---------------------------------------------------------------------------------------------- shaders

const TERRAIN_VERT = /* glsl */ `
${TERRAIN_GLSL}
varying vec3 vW;
void main() {
  vec3 w = vec3(position.x, terrainH(position.xz), position.z);
  vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
`;

const TERRAIN_FRAG = /* glsl */ `
${TERRAIN_GLSL}
uniform vec3 uBg, uInk;
uniform vec2 uRes;
uniform float uFog, uLine, uShade, uPulse, uSwell, uFade, uQuiet, uTime;
varying vec3 vW;

float contour(float h, float spacing, float width) {
  float f = h / spacing;
  float d = fwidth(f);
  float dist = abs(fract(f - 0.5) - 0.5) / max(d, 1e-5);
  return (1.0 - smoothstep(width - 0.75, width + 0.75, dist)) * (1.0 - smoothstep(0.32, 0.7, d));
}
float caustic(vec2 p, float t) {
  vec2 q = p * 0.052;
  float a = sin(q.x + sin(q.y * 1.3 + t * 0.42) * 1.6 + t * 0.21);
  float b = sin(q.y * 1.15 + sin(q.x * 0.9 - t * 0.36) * 1.7 - t * 0.17);
  return pow(1.0 - abs(a + b) * 0.5, 7.0);
}
void main() {
  float h = terrainH(vW.xz);
  vec3 P = vec3(vW.x, h, vW.z);
  vec3 n = normalize(cross(dFdx(P), dFdy(P)));
  if (n.y < 0.0) n = -n;
  float lit = clamp(0.5 + 2.6 * dot(n.xz, normalize(vec2(0.74, -0.67))), 0.0, 1.0);
  float fog = 1.0 - exp(-distance(cameraPosition, P) * uFog);
  // captions live on the left on wide screens, so the surface is drawn quieter there
  float quiet = 1.0 - uQuiet * (1.0 - smoothstep(0.18, 0.72, gl_FragCoord.x / uRes.x));
  vec3 col = mix(uBg, uInk, uShade * quiet * (0.3 + 0.7 * (1.0 - lit)));
  col += caustic(vW.xz, uTime) * 0.06 * (1.0 - fog);
  float minor = contour(h, 5.0, 0.6) * 0.62;
  float major = contour(h, 25.0, 0.95);
  // once the ball has settled, a swell runs out along the contour lines from the minimum
  float r = length(vW.xz);
  float band = exp(-pow((r - uSwell) / 52.0, 2.0)) * (1.0 - smoothstep(160.0, 760.0, r));
  float line = max(minor, major) * (uLine * quiet + uPulse * band);
  col = mix(col, uInk, clamp(line, 0.0, 1.0));
  col = mix(col, uBg, fog);
  gl_FragColor = vec4(mix(uBg, col, uFade), 1.0);
}
`;

const THREAD_VERT = /* glsl */ `
varying float vU;
varying vec3 vP;
void main() {
  vU = uv.x;
  vP = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const THREAD_FRAG = /* glsl */ `
uniform vec3 uBg, uAccent;
uniform float uHead, uFade, uFog;
varying float vU;
varying vec3 vP;
void main() {
  if (vU > uHead) discard;
  float tail = mix(0.4, 1.0, smoothstep(uHead - 0.18, uHead, vU));
  vec3 col = mix(uBg, uAccent, tail);
  col = mix(col, uBg, (1.0 - exp(-distance(cameraPosition, vP) * uFog * 0.75)));
  gl_FragColor = vec4(mix(uBg, col, uFade), 1.0);
}
`;

const BEAD_VERT = /* glsl */ `
uniform float uSize, uDpr;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * uDpr;
}
`;
const BEAD_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha, uTime;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float core = 1.0 - smoothstep(0.17, 0.23, d);
  float ring = (1.0 - smoothstep(0.02, 0.06, abs(d - 0.45 - 0.05 * sin(uTime * 1.6)))) * 0.55;
  float glow = (1.0 - smoothstep(0.1, 1.0, d)) * 0.18;
  float a = clamp(core + ring + glow, 0.0, 1.0) * uAlpha;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

const CLOUD_VERT = /* glsl */ `
attribute vec3 aCluster;
attribute vec3 aScreen;
attribute vec3 aScol;
attribute float aSeed;
attribute float aCid;
uniform vec3 uOrigin, uInk, uC0, uC1, uC2, uC3, uLift;
uniform float uBurst, uCluster, uScreen, uAlpha, uTime, uScale, uDpr, uSize;
varying vec3 vColor;
varying float vA;
void main() {
  float b = clamp((uBurst - aSeed * 0.25) / 0.75, 0.0, 1.0);
  b = 1.0 - pow(1.0 - b, 3.0);
  vec3 p = mix(uOrigin, position, b);
  float c = clamp((uCluster - aSeed * 0.3) / 0.7, 0.0, 1.0);
  c = c * c * (3.0 - 2.0 * c);
  p = mix(p, aCluster, c);
  float s = clamp((uScreen - aSeed * 0.45) / 0.55, 0.0, 1.0);
  s = s * s * (3.0 - 2.0 * s);
  // each point flies in on an arc that bows out toward the viewer before it lands on the screen
  vec3 mid = mix(p, aScreen, 0.5) + uLift * (0.6 + aSeed);
  vec3 q = mix(mix(p, mid, s), mix(mid, aScreen, s), s);
  q += vec3(sin(uTime * 0.6 + aSeed * 40.0), cos(uTime * 0.5 + aSeed * 30.0), sin(uTime * 0.4 + aSeed * 20.0)) * 6.0 * b * (1.0 - s);
  vec4 mv = modelViewMatrix * vec4(q, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uSize * (1.0 - 0.5 * s) * uScale / max(-mv.z, 1.0), 1.0, 22.0) * uDpr;
  vec3 cc = aCid < 0.5 ? uC0 : aCid < 1.5 ? uC1 : aCid < 2.5 ? uC2 : uC3;
  vColor = mix(mix(uInk, cc, c), aScol, s);
  vA = uAlpha * smoothstep(0.0, 0.04, uBurst);
}
`;
const DISC_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.6, 1.0, d)) * vA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

const SCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
// the page on the laptop: paper and a pixel grid drawn per fragment (sharp at any distance), the layout from a canvas
const SCREEN_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uPaper, uInk, uBezel;
uniform float uOn;
varying vec2 vUv;
void main() {
  vec2 g = vUv * vec2(64.0, 40.0);
  vec2 f = fract(g) - 0.5;
  float px = fwidth(g.x);
  float dotA = (1.0 - smoothstep(0.07, 0.07 + px * 1.5, length(f))) * (1.0 - smoothstep(0.18, 0.45, px)) * smoothstep(0.012, 0.04, px);
  vec3 col = mix(uPaper, uInk, dotA * 0.2);
  vec4 ui = texture2D(uMap, vUv);
  col = mix(col, ui.rgb, ui.a);
  gl_FragColor = vec4(mix(uBezel, col, uOn), 1.0);
}
`;

const FIELD_VERT = /* glsl */ `
uniform float uTravel, uTime, uScale, uDpr, uExtent, uWave;
uniform vec2 uRes;
varying float vA;
void main() {
  float z = mod(position.z + uTravel, uExtent) - uExtent + 60.0;
  float y = sin(position.x * 0.011 + uTime * 0.5 + z * 0.004) * 12.0 + sin(z * 0.016 - uTime * 0.35) * 9.0;
  y *= uWave;
  vec4 mv = modelViewMatrix * vec4(position.x, y, z, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = -mv.z;
  gl_PointSize = clamp(2.6 * uScale / max(dist, 1.0), 0.8, 5.0) * uDpr;
  vec2 ndc = gl_Position.xy / gl_Position.w;
  // quiet behind the text column on the left, gone into the distance and at the very front
  float side = smoothstep(-0.9, 0.2, ndc.x);
  vA = smoothstep(uExtent * 0.98, uExtent * 0.55, dist) * smoothstep(20.0, 140.0, dist) * mix(0.45, 1.0, side);
}
`;
const FIELD_FRAG = /* glsl */ `
uniform vec3 uInk;
uniform float uAlpha;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.55, 1.0, d)) * vA * uAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uInk, a);
}
`;
const QUAD_VERT = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const QUAD_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
void main() { gl_FragColor = vec4(uColor, uAlpha); }
`;

const GLOBE_FRAG = /* glsl */ `
uniform vec3 uColor, uBg;
uniform float uAlpha;
varying vec3 vN;
varying vec3 vV;
void main() {
  float rim = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.5);
  vec3 col = uColor * (0.8 + 0.35 * max(dot(normalize(vN), normalize(vec3(-0.4, 0.6, 0.7))), 0.0)) + rim * 0.06;
  gl_FragColor = vec4(mix(uBg, col, uAlpha), 1.0);
}
`;
const GLOBE_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalMatrix * normal;
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;
const ATMO_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
varying vec3 vN;
varying vec3 vV;
void main() {
  // seen from inside the halo: 0 at its silhouette, 1 where it meets the globe's edge
  float d = -dot(normalize(vN), normalize(vV));
  float i = pow(smoothstep(0.0, 0.5, d), 2.2) * 0.42;
  gl_FragColor = vec4(uColor * i * uAlpha, 1.0);
}
`;
const LAND_VERT = /* glsl */ `
uniform float uScale, uDpr, uSize;
varying float vA;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uSize * uScale / max(-mv.z, 0.001), 1.0, 7.0) * uDpr;
  vec3 n = normalize(world.xyz);
  vA = smoothstep(-0.05, 0.3, dot(n, normalize(cameraPosition - world.xyz)));
}
`;
const LAND_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.5, 1.0, d)) * vA * uAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}
`;
const ARC_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uDraw, uTime, uAlpha, uSeed;
varying float vU;
varying vec3 vP;
void main() {
  if (vU > uDraw) discard;
  float head = exp(-pow((uDraw - vU) * 14.0, 2.0)) * step(uDraw, 0.999);
  float run = exp(-pow(fract(vU - uTime * 0.22 + uSeed) * 2.0 - 1.0, 2.0) * 60.0) * step(0.999, uDraw);
  float a = (0.38 + head * 0.9 + run * 0.8) * uAlpha;
  gl_FragColor = vec4(uColor * a, a);
}
`;
const STAR_VERT = /* glsl */ `
attribute float aSize;
uniform float uDpr;
varying float vA;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uDpr;
  vA = 0.25 + 0.75 * fract(aSize * 7.31);
}
`;
const STAR_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.3, 1.0, d)) * vA * uAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

// ---------------------------------------------------------------------------------------------- the screen

const SCREEN_W = 316, SCREEN_H = 198; // world units at full laptop size
/** Where the camera dives into the screen: an empty stretch of the page right of the title, in uv from top-left. */
const FOCUS = { u: 0.805, v: 0.31, halfU: 0.135, halfV: 0.13 };

function fonts() {
  const style = getComputedStyle(document.body);
  const sans = style.fontFamily || "system-ui, sans-serif";
  // next/font puts its variables on <body>
  const serif = style.getPropertyValue("--font-instrument").trim();
  return { sans, serif: serif ? `${serif}, Georgia, serif` : "Georgia, serif" };
}

/** The page as the laptop shows it, drawn on a transparent canvas: the shader adds paper and the pixel grid. */
function drawScreen(canvas: HTMLCanvasElement, s: Swatch, copy: ScreenCopy) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const W = canvas.width, H = canvas.height;
  const { sans, serif } = fonts();
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";

  // nav
  ctx.fillStyle = s.ink;
  ctx.font = `800 ${H * 0.042}px ${sans}`;
  ctx.fillText("Reynard.", W * 0.05, H * 0.095);
  ctx.font = `600 ${H * 0.026}px ${sans}`;
  let x = W * 0.95;
  for (const item of [...copy.nav].reverse()) {
    const w = ctx.measureText(item).width;
    x -= w;
    ctx.globalAlpha = 0.75;
    ctx.fillText(item, x, H * 0.09);
    x -= W * 0.03;
  }
  ctx.globalAlpha = 0.15;
  ctx.fillRect(W * 0.05, H * 0.14, W * 0.9, Math.max(1, H * 0.002));

  // label + title, sized to stay clear of the empty patch the camera dives into
  ctx.globalAlpha = 1;
  ctx.fillStyle = s.accent;
  ctx.beginPath();
  ctx.arc(W * 0.056, H * 0.207, H * 0.007, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `600 ${H * 0.026}px ${sans}`;
  ctx.fillText(copy.label, W * 0.068, H * 0.216);
  let size = H * 0.09;
  const fit = () => {
    ctx.font = `800 ${size}px ${sans}`;
    const a = ctx.measureText(`${copy.title} `).width;
    ctx.font = `italic 400 ${size * 1.08}px ${serif}`;
    return a + ctx.measureText(copy.accent).width;
  };
  while (fit() > W * 0.6 && size > H * 0.04) size *= 0.94;
  ctx.fillStyle = s.ink;
  ctx.font = `800 ${size}px ${sans}`;
  ctx.fillText(`${copy.title} `, W * 0.05, H * 0.33);
  const tw = ctx.measureText(`${copy.title} `).width;
  ctx.fillStyle = s.accent;
  ctx.font = `italic 400 ${size * 1.08}px ${serif}`;
  ctx.fillText(copy.accent, W * 0.05 + tw, H * 0.33);

  const bar = (bx: number, by: number, bw: number, bh: number, alpha: number) => {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, bh / 2);
    ctx.fill();
  };
  ctx.fillStyle = s.ink;
  bar(W * 0.05, H * 0.39, W * 0.3, H * 0.016, 0.22);
  bar(W * 0.05, H * 0.425, W * 0.22, H * 0.016, 0.22);

  // three project cards
  for (let i = 0; i < 3; i++) {
    const cx = W * (0.05 + i * 0.305), cw = W * 0.28;
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = s.ink;
    ctx.fillRect(cx, H * 0.52, Math.max(1, W * 0.0016), H * 0.42);
    ctx.globalAlpha = 0.5;
    ctx.font = `800 ${H * 0.05}px ${sans}`;
    ctx.fillText(`0${i + 1}`, cx + W * 0.015, H * 0.585);
    ctx.globalAlpha = 1;
    bar(cx + W * 0.075, H * 0.553, cw * 0.55, H * 0.02, 0.85);
    bar(cx + W * 0.075, H * 0.588, cw * 0.32, H * 0.014, 0.35);
    const iy = H * 0.66, ih = H * 0.27, ix = cx + W * 0.015, iw = cw - W * 0.015;
    const grad = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih);
    grad.addColorStop(0, s.clusters[i]);
    grad.addColorStop(1, s.clusters[(i + 1) % 3]);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(ix, iy, iw, ih, H * 0.012);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = s.paper;
    bar(ix + iw * 0.08, iy + ih * 0.2, iw * 0.5, ih * 0.08, 0.5);
    bar(ix + iw * 0.08, iy + ih * 0.36, iw * 0.32, ih * 0.08, 0.35);
  }
  ctx.globalAlpha = 1;
  return ctx;
}

// ---------------------------------------------------------------------------------------------- scene

type Uniforms = Record<string, THREE.IUniform>;
const shader = (vertexShader: string, fragmentShader: string, uniforms: Uniforms, extra: THREE.ShaderMaterialParameters = {}) =>
  new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, ...extra });

const CITIES: [number, number][] = [
  [-6.2, 106.8], // Jakarta
  [1.35, 103.8], // Singapore
  [3.14, 101.7], // Kuala Lumpur
  [35.7, 139.7], // Tokyo
  [37.57, 126.98], // Seoul
  [-33.87, 151.2], // Sydney
  [12.97, 77.59], // Bengaluru
  [25.2, 55.27], // Dubai
  [52.37, 4.9], // Amsterdam
];
const PADANG: [number, number] = [-0.95, 100.35];
const R = 100; // globe radius
const LAPTOP_SMALL = 0.012; // the laptop's scale when it sits on the globe

export class StoryScene {
  private renderer: THREE.WebGLRenderer;
  private lite: boolean;
  private copy: ScreenCopy;
  private main = new THREE.Scene();
  private inside = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 2, 6000);
  private insideCam = new THREE.PerspectiveCamera(50, 1, 1, 4000);
  private day = palette(DAY);
  private nightPal = palette(NIGHT);
  private pal = palette(DAY);
  private nightFor = -1;
  private themeIsNight = false;
  private dpr = 1;
  private cssW = 1;
  private cssH = 1;
  private disposables: { dispose(): void }[] = [];

  // converge
  private terrain!: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private thread!: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private bead!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private axes!: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  private cloud!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private path = descend();
  private bottom = v3();
  private h = new THREE.Vector3(0, 0, 1); // the side the camera works from; along an axis so the plot frame is square to the screen

  // laptop
  private laptop = new THREE.Group();
  private lidPivot = new THREE.Group();
  private screen!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private screenCanvas = document.createElement("canvas");
  private screenTexture!: THREE.CanvasTexture;
  private samplePixels = new Uint32Array(0);
  private laptopMats: THREE.MeshStandardMaterial[] = [];
  private placedFor: "converge" | "outro" | null = null;
  private shot = { center: v3(), normal: v3(), focus: v3(), up: v3() };

  // inside
  private field!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private veil!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

  // outro
  private globe = new THREE.Group();
  private globeBase!: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private atmosphere!: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private land!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private arcs: THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>[] = [];
  private marker!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private stars!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private padang = latLon(PADANG[0], PADANG[1], 1).normalize();
  private north = v3();

  private bg = new THREE.Color();
  private tmp = { a: v3(), b: v3(), c: v3(), d: v3(), e: v3() };

  static async create(canvas: HTMLCanvasElement, lite: boolean, copy: ScreenCopy): Promise<StoryScene | null> {
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: false, stencil: false, powerPreference: "high-performance" });
    } catch (err) {
      console.warn("[story] WebGL unavailable, keeping the lake background", err);
      return null;
    }
    const gl = renderer.getContext();
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    // without a GPU this would run on the CPU and stall the page
    if (/swiftshader|llvmpipe|software|basic render/i.test(name)) {
      renderer.dispose();
      return null;
    }
    await document.fonts?.ready;
    const scene = new StoryScene(renderer, lite, copy);
    await scene.warm();
    return scene;
  }

  private constructor(renderer: THREE.WebGLRenderer, lite: boolean, copy: ScreenCopy) {
    this.renderer = renderer;
    this.lite = lite;
    this.copy = copy;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.autoClear = false;
    const end = this.path[this.path.length - 1];
    this.bottom.set(end.x, end.y, end.z);

    this.buildConverge();
    this.buildLaptop();
    this.buildCloud();
    this.buildInside();
    this.buildGlobe();
    this.placeLaptop("converge");
  }

  /** Compiles every program before the first frame, so scrolling into the story never stalls on a shader. */
  private async warm() {
    const all = [this.terrain, this.thread, this.bead, this.axes, this.cloud, this.laptop, this.globe, this.stars];
    const was = all.map((o) => o.visible);
    all.forEach((o) => (o.visible = true));
    try {
      await this.renderer.compileAsync(this.main, this.camera);
      await this.renderer.compileAsync(this.inside, this.insideCam);
    } catch {
      // compileAsync is an optimisation; the first render compiles whatever is left
    }
    all.forEach((o, i) => (o.visible = was[i]));
  }

  get lost() {
    return this.renderer.getContext().isContextLost();
  }

  private track<T extends { dispose(): void }>(x: T): T {
    this.disposables.push(x);
    return x;
  }

  // ------------------------------------------------------------------ build

  private buildConverge() {
    const N = this.lite ? 120 : 190;
    const plane = this.track(new THREE.PlaneGeometry(3500, 3500, N, N));
    plane.rotateX(-Math.PI / 2);
    this.terrain = new THREE.Mesh(
      plane,
      this.track(
        shader(TERRAIN_VERT, TERRAIN_FRAG, {
          uBg: { value: new THREE.Color() }, uInk: { value: new THREE.Color() }, uRes: { value: new THREE.Vector2(1, 1) },
          uFog: { value: 0.0006 }, uLine: { value: 0.3 }, uShade: { value: 0.12 }, uPulse: { value: 0 }, uSwell: { value: 0 },
          uFade: { value: 1 }, uQuiet: { value: 0.7 }, uTime: { value: 0 },
        }),
      ),
    );
    this.terrain.frustumCulled = false;
    this.main.add(this.terrain);

    // the descent as a thin tube, revealed up to the ball
    const step = Math.max(1, Math.floor(this.path.length / 260));
    const pts = this.path.filter((_, i) => i % step === 0 || i === this.path.length - 1).map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    this.thread = new THREE.Mesh(
      this.track(new THREE.TubeGeometry(curve, this.lite ? 420 : 700, 2.6, 5, false)),
      this.track(shader(THREAD_VERT, THREAD_FRAG, { uBg: { value: new THREE.Color() }, uAccent: { value: new THREE.Color() }, uHead: { value: 0 }, uFade: { value: 1 }, uFog: { value: 0.0006 } })),
    );
    this.main.add(this.thread);

    const beadGeo = this.track(new THREE.BufferGeometry());
    beadGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
    this.bead = new THREE.Points(
      beadGeo,
      this.track(shader(BEAD_VERT, BEAD_FRAG, { uSize: { value: 44 }, uDpr: { value: 1 }, uColor: { value: new THREE.Color() }, uAlpha: { value: 1 }, uTime: { value: 0 } }, { transparent: true, depthTest: false, depthWrite: false })),
    );
    this.bead.frustumCulled = false;
    this.bead.renderOrder = 5;
    this.main.add(this.bead);

    // a plot frame with ticks, so the bed seen from above reads as a chart
    const S = 470, yA = this.bottom.y + 190, tick = 16, seg: number[] = [];
    const line = (a: number[], b: number[]) => seg.push(...a, ...b);
    line([-S, yA, -S], [S, yA, -S]); line([S, yA, -S], [S, yA, S]); line([S, yA, S], [-S, yA, S]); line([-S, yA, S], [-S, yA, -S]);
    for (let i = -S; i <= S + 1; i += S / 4) {
      line([i, yA, S], [i, yA, S + tick]);
      line([-S, yA, i], [-S - tick, yA, i]);
      line([i, yA, -S], [i, yA, -S - tick]);
      line([S, yA, i], [S + tick, yA, i]);
    }
    const axesGeo = this.track(new THREE.BufferGeometry());
    axesGeo.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    this.axes = new THREE.LineSegments(axesGeo, this.track(new THREE.LineBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })));
    this.main.add(this.axes);
  }

  private buildLaptop() {
    const L = this.laptop;
    const body = this.track(new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.15 }));
    const keys = this.track(new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 }));
    const bezel = this.track(new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }));
    this.laptopMats = [body, keys, bezel];

    const base = new THREE.Mesh(this.track(new RoundedBoxGeometry(340, 12, 230, 3, 5)), body);
    base.position.set(0, 6, 0);
    L.add(base);

    const cols = 13, rows = 5;
    const keyGeo = this.track(new THREE.BoxGeometry(18.5, 1.6, 17));
    const keyMesh = new THREE.InstancedMesh(keyGeo, keys, cols * rows);
    const m = new THREE.Matrix4();
    for (let r = 0, k = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      m.makeTranslation((c - (cols - 1) / 2) * 22, 12.4, -92 + r * 20.5);
      keyMesh.setMatrixAt(k++, m);
    }
    keyMesh.instanceMatrix.needsUpdate = true;
    L.add(keyMesh);
    const pad = new THREE.Mesh(this.track(new THREE.BoxGeometry(120, 0.6, 66)), keys);
    pad.position.set(0, 12.2, 62);
    L.add(pad);

    // the lid turns about the back edge of the base; the screen faces down onto the keys when closed
    this.lidPivot.position.set(0, 12, -115);
    const panel = new THREE.Mesh(this.track(new RoundedBoxGeometry(340, 8, 225, 3, 4)), body);
    panel.position.set(0, 4, 112.5);
    this.lidPivot.add(panel);
    const frame = new THREE.Mesh(this.track(new THREE.PlaneGeometry(334, 219)), bezel);
    frame.rotation.x = Math.PI / 2;
    frame.position.set(0, -0.15, 112.5);
    this.lidPivot.add(frame);

    const T = this.lite ? [1024, 640] : [1536, 960];
    this.screenCanvas.width = T[0];
    this.screenCanvas.height = T[1];
    this.screenTexture = this.track(new THREE.CanvasTexture(this.screenCanvas));
    this.screenTexture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.screenTexture.generateMipmaps = true;
    this.screenTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.screen = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H)),
      this.track(shader(SCREEN_VERT, SCREEN_FRAG, { uMap: { value: this.screenTexture }, uPaper: { value: new THREE.Color() }, uInk: { value: new THREE.Color() }, uBezel: { value: new THREE.Color() }, uOn: { value: 0 } })),
    );
    this.screen.rotation.x = Math.PI / 2;
    this.screen.position.set(0, -0.35, 112.5 + 1.5);
    this.lidPivot.add(this.screen);
    L.add(this.lidPivot);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x7d8a79, 2.1);
    const sun = new THREE.DirectionalLight(0xfff6e2, 2.2);
    sun.position.set(-0.5, 1, 0.8);
    this.main.add(hemi, sun);
    this.main.add(L);
  }

  /** Puts the laptop where the chapter needs it and records the shots of its screen. */
  private placeLaptop(mode: "converge" | "outro") {
    if (this.placedFor === mode) return;
    this.placedFor = mode;
    const L = this.laptop;
    this.setLid(1);
    if (mode === "converge") {
      this.main.add(L);
      L.scale.setScalar(1);
      L.quaternion.setFromAxisAngle(Y, Math.atan2(this.h.x, this.h.z));
      L.position.set(0, 0, 0);
      L.updateMatrixWorld(true);
      // the screen's centre sits on the minimum, where the cloud was born
      const c = this.screenPoint(0.5, 0.5, this.tmp.a);
      L.position.copy(this.bottom).add(new THREE.Vector3(0, 40, 0)).sub(c);
    } else {
      this.globe.add(L);
      this.globe.rotation.set(0, 0, 0);
      const up = this.padang, north = this.north.copy(Y).addScaledVector(up, -Y.dot(up)).normalize();
      const front = north.clone().negate(); // the screen faces south, so pulling up and back leaves north at the top
      const x = new THREE.Vector3().crossVectors(up, front);
      L.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, up, front));
      L.scale.setScalar(LAPTOP_SMALL);
      L.position.copy(up).multiplyScalar(R * 1.0015);
    }
    (mode === "outro" ? this.globe : L).updateMatrixWorld(true);
    this.screenPoint(0.5, 0.5, this.shot.center);
    this.screenPoint(FOCUS.u, FOCUS.v, this.shot.focus);
    this.shot.normal.set(0, 0, 1).transformDirection(this.screen.matrixWorld);
    this.shot.up.set(0, 1, 0).transformDirection(this.screen.matrixWorld);
  }

  private screenPoint(u: number, v: number, out: THREE.Vector3) {
    this.laptop.updateMatrixWorld(true);
    return out.set((u - 0.5) * SCREEN_W, (0.5 - v) * SCREEN_H, 0).applyMatrix4(this.screen.matrixWorld);
  }

  private setLid(open: number) {
    this.lidPivot.rotation.x = -THREE.MathUtils.degToRad(105) * open;
  }

  private buildCloud() {
    const n = this.lite ? 1100 : 2400;
    const r = rng(7);
    const pos = new Float32Array(n * 3), cl = new Float32Array(n * 3), scr = new Float32Array(n * 3), scol = new Float32Array(n * 3);
    const seed = new Float32Array(n), cid = new Float32Array(n);
    const centres = [
      [-150, 70, -60], [130, -20, -130], [60, 110, 150], [-90, -80, 120],
    ].map(([x, y, z]) => new THREE.Vector3(x, y + 30, z).add(this.bottom));
    for (let i = 0; i < n; i++) {
      const g = [gauss(r), gauss(r), gauss(r)];
      pos[i * 3] = this.bottom.x + g[0] * 120;
      pos[i * 3 + 1] = this.bottom.y + 40 + g[1] * 90;
      pos[i * 3 + 2] = this.bottom.z + g[2] * 120;
      const k = i % 4;
      cid[i] = k;
      cl[i * 3] = centres[k].x + gauss(r) * 34;
      cl[i * 3 + 1] = centres[k].y + gauss(r) * 30;
      cl[i * 3 + 2] = centres[k].z + gauss(r) * 34;
      seed[i] = r();
    }
    const geo = this.track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aCluster", new THREE.BufferAttribute(cl, 3));
    geo.setAttribute("aScreen", new THREE.BufferAttribute(scr, 3));
    geo.setAttribute("aScol", new THREE.BufferAttribute(scol, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aCid", new THREE.BufferAttribute(cid, 1));
    this.cloud = new THREE.Points(
      geo,
      this.track(
        shader(CLOUD_VERT, DISC_FRAG, {
          uOrigin: { value: this.bottom.clone() }, uInk: { value: new THREE.Color() }, uLift: { value: v3() },
          uC0: { value: new THREE.Color() }, uC1: { value: new THREE.Color() }, uC2: { value: new THREE.Color() }, uC3: { value: new THREE.Color() },
          uBurst: { value: 0 }, uCluster: { value: 0 }, uScreen: { value: 0 }, uAlpha: { value: 1 }, uTime: { value: 0 }, uScale: { value: 1 }, uDpr: { value: 1 }, uSize: { value: 4.6 },
        }, { transparent: true, depthWrite: false }),
      ),
    );
    this.cloud.frustumCulled = false;
    this.cloud.renderOrder = 4;
    this.main.add(this.cloud);
  }

  /** Lays the cloud's landing spots on the screen's drawn pixels and takes their colours. */
  private paintScreen(night: boolean) {
    const s = night ? NIGHT : DAY;
    const ctx = drawScreen(this.screenCanvas, s, this.copy);
    this.screenTexture.needsUpdate = true;
    const W = this.screenCanvas.width, H = this.screenCanvas.height;
    const data = ctx.getImageData(0, 0, W, H).data;
    const geo = this.cloud.geometry, n = geo.getAttribute("position").count;
    if (this.samplePixels.length !== n) {
      const candidates: number[] = [];
      for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 140) candidates.push(y * W + x);
      const r = rng(11);
      this.samplePixels = new Uint32Array(n);
      for (let i = 0; i < n; i++) this.samplePixels[i] = candidates.length ? candidates[Math.floor(r() * candidates.length)] : Math.floor(r() * W * H);
      // landing spots are fixed in the converge placement of the laptop
      const wasPlaced = this.placedFor;
      this.placedFor = null;
      this.placeLaptop("converge");
      const scr = geo.getAttribute("aScreen") as THREE.BufferAttribute;
      const p = v3();
      for (let i = 0; i < n; i++) {
        const px = this.samplePixels[i];
        this.screenPoint((px % W) / W, Math.floor(px / W) / H, p);
        scr.setXYZ(i, p.x, p.y, p.z);
      }
      scr.needsUpdate = true;
      if (wasPlaced === "outro") this.placeLaptop("outro");
    }
    const col = geo.getAttribute("aScol") as THREE.BufferAttribute;
    for (let i = 0; i < n; i++) {
      const o = this.samplePixels[i] * 4;
      col.setXYZ(i, data[o] / 255, data[o + 1] / 255, data[o + 2] / 255);
    }
    col.needsUpdate = true;
  }

  private buildInside() {
    const nx = this.lite ? 80 : 130, nz = this.lite ? 50 : 80, gap = 22;
    const pos = new Float32Array(nx * nz * 3);
    for (let j = 0, k = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      pos[k++] = (i - (nx - 1) / 2) * gap;
      pos[k++] = 0;
      pos[k++] = j * gap;
    }
    const geo = this.track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.field = new THREE.Points(
      geo,
      this.track(
        shader(FIELD_VERT, FIELD_FRAG, {
          uTravel: { value: 0 }, uTime: { value: 0 }, uScale: { value: 1 }, uDpr: { value: 1 }, uExtent: { value: nz * gap }, uWave: { value: 1 },
          uRes: { value: new THREE.Vector2(1, 1) }, uInk: { value: new THREE.Color() }, uAlpha: { value: 0.3 },
        }, { transparent: true, depthTest: false, depthWrite: false }),
      ),
    );
    this.field.frustumCulled = false;
    this.veil = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(2, 2)),
      this.track(shader(QUAD_VERT, QUAD_FRAG, { uColor: { value: new THREE.Color() }, uAlpha: { value: 1 } }, { transparent: true, depthTest: false, depthWrite: false })),
    );
    this.veil.frustumCulled = false;
    this.veil.renderOrder = -1;
    this.inside.add(this.veil, this.field);
  }

  private buildGlobe() {
    const G = this.globe;
    this.globeBase = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(R * 0.996, 72, 54)),
      this.track(shader(GLOBE_VERT, GLOBE_FRAG, { uColor: { value: new THREE.Color() }, uBg: { value: new THREE.Color() }, uAlpha: { value: 0 } })),
    );
    G.add(this.globeBase);

    const n = LAND.length / 2, pos = new Float32Array(n * 3), p = v3();
    for (let i = 0; i < n; i++) {
      latLon(LAND[i * 2] / 10, LAND[i * 2 + 1] / 10, R * 1.002, p);
      pos.set([p.x, p.y, p.z], i * 3);
    }
    const landGeo = this.track(new THREE.BufferGeometry());
    landGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.land = new THREE.Points(
      landGeo,
      this.track(shader(LAND_VERT, LAND_FRAG, { uScale: { value: 1 }, uDpr: { value: 1 }, uSize: { value: 1.05 }, uColor: { value: new THREE.Color() }, uAlpha: { value: 0 } }, { transparent: true, depthWrite: false })),
    );
    this.land.renderOrder = 2;
    G.add(this.land);

    this.atmosphere = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(R * 1.14, 64, 48)),
      this.track(shader(GLOBE_VERT, ATMO_FRAG, { uColor: { value: new THREE.Color() }, uAlpha: { value: 0 } }, { side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })),
    );
    G.add(this.atmosphere);

    // lines from Padang out to the world, lifted higher the further they go
    const from = this.padang;
    CITIES.forEach(([lat, lon], i) => {
      const to = latLon(lat, lon, 1).normalize();
      const angle = from.angleTo(to);
      const lift = 0.04 + 0.32 * (angle / Math.PI);
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 48; k++) {
        const t = k / 48;
        pts.push(slerpDir(v3(), from, to, t).multiplyScalar(R * (1.003 + lift * Math.sin(Math.PI * t))));
      }
      const mesh = new THREE.Mesh(
        this.track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.32, 4, false)),
        this.track(shader(THREAD_VERT, ARC_FRAG, { uColor: { value: new THREE.Color() }, uDraw: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 0 }, uSeed: { value: i * 0.37 } }, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })),
      );
      mesh.renderOrder = 3;
      this.arcs.push(mesh);
      G.add(mesh);
    });

    const markGeo = this.track(new THREE.BufferGeometry());
    const mp = this.padang.clone().multiplyScalar(R * 1.004);
    markGeo.setAttribute("position", new THREE.Float32BufferAttribute([mp.x, mp.y, mp.z], 3));
    this.marker = new THREE.Points(
      markGeo,
      this.track(shader(BEAD_VERT, BEAD_FRAG, { uSize: { value: 30 }, uDpr: { value: 1 }, uColor: { value: new THREE.Color() }, uAlpha: { value: 0 }, uTime: { value: 0 } }, { transparent: true, depthWrite: false })),
    );
    this.marker.renderOrder = 6;
    G.add(this.marker);
    this.main.add(G);

    const r = rng(3), count = this.lite ? 400 : 900, sp = new Float32Array(count * 3), size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const d = v3().set(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(1600 + r() * 400);
      sp.set([d.x, d.y, d.z], i * 3);
      size[i] = 0.8 + r() * r() * 2.4;
    }
    const starGeo = this.track(new THREE.BufferGeometry());
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    starGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    this.stars = new THREE.Points(starGeo, this.track(shader(STAR_VERT, STAR_FRAG, { uDpr: { value: 1 }, uColor: { value: new THREE.Color() }, uAlpha: { value: 0 } }, { transparent: true, depthWrite: false })));
    this.stars.frustumCulled = false;
    this.main.add(this.stars);
  }

  // ------------------------------------------------------------------ frame

  resize(width: number, height: number, dpr: number) {
    this.cssW = Math.max(1, width);
    this.cssH = Math.max(1, height);
    this.dpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.cssW, this.cssH, false);
  }

  private applyPalette(night: number) {
    if (Math.abs(night - this.nightFor) < 1e-3) return;
    this.nightFor = night;
    for (const key of Object.keys(this.day) as (keyof Palette)[]) {
      const a = this.day[key], b = this.nightPal[key], out = this.pal[key];
      if (Array.isArray(a)) (out as THREE.Color[]).forEach((c, i) => c.copy(a[i]).lerp((b as THREE.Color[])[i], night));
      else (out as THREE.Color).copy(a).lerp(b as THREE.Color, night);
    }
    const P = this.pal;
    const [body, keys, bezel] = this.laptopMats;
    body.color.copy(P.body);
    keys.color.copy(P.keys);
    bezel.color.copy(P.bezel);
    const su = this.screen.material.uniforms;
    su.uPaper.value.copy(P.paper);
    su.uInk.value.copy(P.ink);
    su.uBezel.value.copy(P.bezel);
    const cu = this.cloud.material.uniforms;
    cu.uInk.value.copy(P.ink);
    P.clusters.forEach((c, i) => cu[`uC${i}`].value.copy(c));
    this.thread.material.uniforms.uAccent.value.copy(P.accent);
    this.bead.material.uniforms.uColor.value.copy(P.accent);
    this.terrain.material.uniforms.uInk.value.copy(P.ink);
    this.axes.material.color.copy(P.ink);
    this.field.material.uniforms.uInk.value.copy(P.ink);
    this.veil.material.uniforms.uColor.value.copy(P.paper);
    this.globeBase.material.uniforms.uColor.value.copy(P.globe);
    this.land.material.uniforms.uColor.value.copy(P.land);
    this.atmosphere.material.uniforms.uColor.value.copy(P.land);
    this.marker.material.uniforms.uColor.value.copy(P.glow);
    this.arcs.forEach((a) => a.material.uniforms.uColor.value.copy(P.glow));
    this.stars.material.uniforms.uColor.value.copy(P.glow);
    const isNight = night > 0.5;
    if (isNight !== this.themeIsNight || this.samplePixels.length === 0) {
      this.themeIsNight = isNight;
      this.paintScreen(isNight);
    }
  }

  /** Pixels per world unit at distance 1, for sizing points in world units. */
  private pointScale(cam: THREE.PerspectiveCamera) {
    return this.cssH / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
  }

  /** Shifts the picture on screen (in NDC) without moving the camera, so the subject clears the captions. */
  private offset(cam: THREE.PerspectiveCamera, sx: number, sy: number) {
    cam.updateProjectionMatrix();
    const e = cam.projectionMatrix.elements;
    e[8] -= sx;
    e[9] -= sy;
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }

  /** Distance at which a window of half-size (hw, hh) around the camera's target exactly fills the view. */
  private coverDistance(cam: THREE.PerspectiveCamera, hw: number, hh: number) {
    const t = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    return Math.min(hh / t, hw / (t * cam.aspect));
  }

  render(f: StoryFrame) {
    this.applyPalette(f.night);
    const P = this.pal, r = this.renderer;
    const aspect = this.cssW / this.cssH;
    this.camera.aspect = aspect;
    this.insideCam.aspect = aspect;
    const drawW = this.cssW * this.dpr, drawH = this.cssH * this.dpr;

    let main = false, overlay = 0;
    if (f.outro > 0) {
      main = true;
      overlay = 1 - smooth(0, 0.05, f.outro);
      this.outroFrame(f);
    } else if (f.converge >= 1) {
      overlay = 1;
    } else {
      main = true;
      overlay = smooth(0.955, 0.995, f.converge);
      this.convergeFrame(f, drawW, drawH);
    }

    r.setClearColor(main ? this.bg : P.paper, 1);
    r.clear();
    if (main) r.render(this.main, this.camera);
    if (overlay > 0.002) {
      this.insideFrame(f, overlay, !main);
      if (main) r.clearDepth();
      r.render(this.inside, this.insideCam);
    }
    return { dark: f.outro > 0.09 };
  }

  private convergeFrame(f: StoryFrame, drawW: number, drawH: number) {
    const p = f.converge, P = this.pal, cam = this.camera, t = this.tmp;
    this.placeLaptop("converge");
    this.globe.visible = false;
    this.stars.visible = false;

    // ---- the descent, then the rise into plan view
    const run = ease(smooth(0.02, 0.33, p));
    const rise = ease(smooth(0.25, 0.42, p));
    const toB = ease(smooth(0.42, 0.64, p));
    const toC = ease(smooth(0.64, 0.82, p));
    const dive = smooth(0.84, 1, p);
    const fade = 1 - smooth(0.42, 0.52, p);

    this.bg.copy(P.water).lerp(P.paper, smooth(0.62, 0.8, p));

    // far enough back that the cloud and the laptop fit across narrow screens too
    const tanH = Math.tan(THREE.MathUtils.degToRad(45) / 2);
    const fitCloud = Math.min(1700, 270 / (tanH * cam.aspect));
    const fitLaptop = 205 / (tanH * cam.aspect * 0.92);
    const eye = t.a, target = t.b, up = t.c;
    if (p < 0.42) {
      const q = smooth(0, 0.34, p);
      const swing = -0.55 * (1 - q) + f.nudge;
      const dir = t.d.copy(this.h).applyAxisAngle(Y, swing);
      const dist = mix(1500, 1240, q);
      eye.copy(this.bottom).addScaledVector(dir, dist).addScaledVector(Y, mix(760, 600, q));
      target.set(0, -110, 0);
      const top = t.e.copy(this.bottom).addScaledVector(Y, 1500);
      eye.lerp(top, rise);
      target.lerp(this.bottom, rise);
      up.copy(Y).lerp(t.d.copy(this.h).negate(), rise).normalize();
    } else if (p < 0.64) {
      const dB = t.d.copy(this.h).multiplyScalar(0.8).addScaledVector(Y, 0.6).normalize().applyAxisAngle(Y, f.nudge);
      const dir = slerpDir(t.e, Y, dB, toB);
      eye.copy(this.bottom).addScaledVector(dir, mix(1500, Math.max(1000, fitCloud), toB));
      target.copy(this.bottom);
      up.copy(this.h).negate().lerp(Y, toB).normalize();
    } else {
      const dB = t.d.copy(this.h).multiplyScalar(0.8).addScaledVector(Y, 0.6).normalize().applyAxisAngle(Y, f.nudge);
      const dir = slerpDir(t.e, dB, this.shot.normal, toC);
      target.copy(this.bottom).lerp(this.shot.center, toC);
      const far = mix(Math.max(1000, fitCloud), Math.max(820, fitLaptop), toC);
      // the dive: straight down the screen's normal onto an empty patch of the page
      const near = this.coverDistance(cam, FOCUS.halfU * SCREEN_W, FOCUS.halfV * SCREEN_H) * 0.96;
      const k = dive * dive * (3 - 2 * dive);
      const dist = Math.exp(mix(Math.log(far), Math.log(near), k));
      target.lerp(this.shot.focus, k);
      eye.copy(target).addScaledVector(dir, dist);
      up.copy(Y);
    }
    cam.fov = 45;
    cam.near = p > 0.84 ? 0.5 : 2;
    cam.far = 6000;
    cam.position.copy(eye);
    cam.up.copy(up);
    cam.lookAt(target);
    const shift = 1 - ease(smooth(0.84, 0.95, p));
    this.offset(cam, f.narrow ? 0 : 0.27 * shift, f.narrow ? 0.16 * shift : 0);

    // ---- terrain, thread, ball, plot frame
    const time = f.time;
    const tu = this.terrain.material.uniforms;
    tu.uBg.value.copy(this.bg);
    tu.uRes.value.set(drawW, drawH);
    tu.uFade.value = fade;
    tu.uQuiet.value = f.narrow ? 0.35 : 0.7;
    tu.uTime.value = time;
    tu.uLine.value = mix(0.26, 0.42, rise);
    const swell = smooth(0.33, 0.47, p);
    tu.uPulse.value = Math.sin(Math.PI * swell) * 0.9;
    tu.uSwell.value = swell * 760;
    this.terrain.visible = fade > 0.002;

    const thu = this.thread.material.uniforms;
    thu.uBg.value.copy(this.bg);
    thu.uHead.value = Math.max(0.002, run);
    thu.uFade.value = fade;
    this.thread.visible = fade > 0.002 && run > 0;

    const idx = Math.min(this.path.length - 1, Math.round(run * (this.path.length - 1)));
    const bp = this.path[idx];
    (this.bead.geometry.getAttribute("position") as THREE.BufferAttribute).setXYZ(0, bp.x, bp.y, bp.z);
    this.bead.geometry.getAttribute("position").needsUpdate = true;
    const bu = this.bead.material.uniforms;
    bu.uAlpha.value = smooth(0, 0.04, p + f.approach * 0.04) * (1 - smooth(0.44, 0.5, p));
    bu.uTime.value = time;
    bu.uDpr.value = this.dpr;
    bu.uSize.value = 44 + 30 * Math.sin(Math.PI * smooth(0.36, 0.46, p));
    this.bead.visible = bu.uAlpha.value > 0.002;

    this.axes.material.opacity = 0.32 * smooth(0.3, 0.42, p) * fade;
    this.axes.visible = this.axes.material.opacity > 0.002;

    // ---- the cloud
    const cu = this.cloud.material.uniforms;
    const burst = smooth(0.43, 0.55, p);
    cu.uBurst.value = burst;
    cu.uCluster.value = smooth(0.52, 0.64, p);
    cu.uScreen.value = smooth(0.68, 0.85, p);
    cu.uAlpha.value = 1 - smooth(0.85, 0.9, p);
    cu.uTime.value = time;
    cu.uScale.value = this.pointScale(cam);
    cu.uDpr.value = this.dpr;
    (cu.uLift.value as THREE.Vector3).copy(this.shot.normal).multiplyScalar(120);
    this.cloud.visible = burst > 0 && cu.uAlpha.value > 0.002;

    // ---- the laptop arrives, opens, and the screen comes on
    const arrive = smooth(0.62, 0.72, p);
    const s = easeOutBack(arrive);
    this.laptop.visible = arrive > 0.001;
    if (this.laptop.visible) {
      // grows about where its open screen will be, so it unfolds in place around the cloud
      this.setLid(ease(smooth(0.66, 0.78, p)));
      this.anchorFor(s);
    }
    this.screen.material.uniforms.uOn.value = smooth(0.8, 0.86, p);
  }

  /** Where the laptop's origin goes so that, at full size and fully open, its screen centre is on the minimum. */
  private anchorFor(scale: number) {
    // the origin's offset from the open screen centre, measured at full size; it scales with the laptop
    if (!this.anchorOffset) {
      const L = this.laptop, lid = this.lidPivot.rotation.x;
      this.setLid(1);
      L.scale.setScalar(1);
      L.position.set(0, 0, 0);
      L.updateMatrixWorld(true);
      this.anchorOffset = this.screenPoint(0.5, 0.5, v3());
      this.lidPivot.rotation.x = lid;
    }
    this.laptop.scale.setScalar(Math.max(0.001, scale));
    this.laptop.position.copy(this.shot.center).addScaledVector(this.anchorOffset, -scale);
    this.laptop.updateMatrixWorld(true);
  }
  private anchorOffset: THREE.Vector3 | null = null;

  private outroFrame(f: StoryFrame) {
    const o = f.outro, P = this.pal, cam = this.camera, t = this.tmp;
    this.placeLaptop("outro");
    this.terrain.visible = this.thread.visible = this.bead.visible = this.axes.visible = this.cloud.visible = false;
    this.globe.visible = true;
    this.stars.visible = true;
    this.laptop.scale.setScalar(LAPTOP_SMALL);
    this.setLid(1);
    this.screen.material.uniforms.uOn.value = 1;

    const dark = smooth(0.03, 0.13, o);
    this.bg.copy(P.paper).lerp(P.deep, dark);

    cam.fov = 40;
    cam.aspect = this.cssW / this.cssH;
    const fill = this.coverDistance(cam, (SCREEN_W / 2) * LAPTOP_SMALL, (SCREEN_H / 2) * LAPTOP_SMALL) * 0.98;
    const out = 1 - Math.pow(1 - smooth(0.04, 0.17, o), 3);
    const far = ease(smooth(0.17, 0.64, o));
    // the globe ends up about 85% of the screen's width on phones, and a fixed size on wide screens
    const globeAt = Math.max(470, (R * 1.14) / (0.85 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.aspect));
    const dist = Math.exp(mix(mix(Math.log(fill), Math.log(fill * 9), out), Math.log(globeAt), far));
    // the crane: from in front of the screen up over the laptop, which leaves north at the top of the frame
    const crane = ease(smooth(0.07, 0.38, o));
    const dir = slerpDir(t.a, this.shot.normal, this.padang, crane);
    const up = slerpDir(t.b, this.shot.up, this.north, crane);
    // the target sinks from the screen to the centre of the earth only as fast as the camera climbs
    const sink = ease(smooth(25, globeAt, dist));
    const target = t.c.copy(this.shot.center).lerp(this.globe.position, sink);

    // a slow turn of the earth once it is in view, settling into a gentle sway under the footer
    const turn = -0.42 * ease(smooth(0.55, 1, o)) + Math.sin(f.time * 0.06) * 0.05 * smooth(0.9, 1, o);
    this.globe.rotation.y = turn;

    cam.position.copy(target).addScaledVector(dir, dist);
    cam.up.copy(up);
    cam.near = Math.max(0.002, dist * 0.02);
    cam.far = dist + 3000;
    cam.lookAt(target);
    const aside = smooth(0.05, 0.2, o);
    this.offset(cam, f.narrow ? 0 : 0.42 * aside, f.narrow ? 0.3 * aside : 0);

    const scale = this.pointScale(cam);
    this.laptop.visible = dist < 220;
    this.globeBase.material.uniforms.uAlpha.value = smooth(18, 110, dist);
    this.globeBase.material.uniforms.uBg.value.copy(this.bg);
    const lu = this.land.material.uniforms;
    lu.uAlpha.value = smooth(22, 140, dist) * 0.9;
    lu.uScale.value = scale;
    lu.uDpr.value = this.dpr;
    this.atmosphere.material.uniforms.uAlpha.value = smooth(60, 260, dist) * 0.55;
    const mu = this.marker.material.uniforms;
    mu.uAlpha.value = smooth(14, 60, dist);
    mu.uTime.value = f.time;
    mu.uDpr.value = this.dpr;
    mu.uSize.value = 34;
    const draw = smooth(0.52, 0.9, o);
    this.arcs.forEach((a, i) => {
      const u = a.material.uniforms;
      u.uDraw.value = clamp01((draw - i * 0.05) / (1 - (CITIES.length - 1) * 0.05));
      u.uAlpha.value = smooth(0.5, 0.56, o);
      u.uTime.value = f.time;
      a.visible = u.uDraw.value > 0.001;
    });
    const su = this.stars.material.uniforms;
    su.uAlpha.value = dark * 0.8;
    su.uDpr.value = this.dpr;
  }

  private insideFrame(f: StoryFrame, alpha: number, alone: boolean) {
    const cam = this.insideCam;
    cam.fov = 50;
    cam.position.set(f.nudge * 600, 92, 0);
    cam.lookAt(f.nudge * 300, 6, -520);
    cam.near = 1;
    cam.far = 4000;
    this.offset(cam, 0, f.narrow ? -0.05 : -0.12);
    const u = this.field.material.uniforms;
    u.uTravel.value = f.scroll * 0.32;
    u.uTime.value = f.time;
    u.uScale.value = this.pointScale(cam);
    u.uDpr.value = this.dpr;
    u.uWave.value = 1 + Math.min(1.6, Math.abs(f.velocity) / 1800);
    u.uAlpha.value = (f.narrow ? 0.22 : 0.34) * alpha;
    this.veil.material.uniforms.uAlpha.value = alone ? 1 : alpha;
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.arcs.length = 0;
    this.renderer.dispose();
  }

  /** Frees the GPU context now rather than whenever the canvas is collected. */
  release() {
    this.dispose();
    this.renderer.forceContextLoss();
  }
}
