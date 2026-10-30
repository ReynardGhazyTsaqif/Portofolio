/*
 * The world under the hero: the bed of Lake Maninjau as one continuous height field, in metres.
 * y is up and y = 0 is the water surface. Maninjau is a caldera, so the bed is a bowl that falls to
 * about 165 m at the middle and curls up into the crater walls past its rim, the same shape the hero's
 * ridges make above the water.
 *
 * The thread that runs through the whole site is a real optimisation run on this surface: gradient
 * descent with momentum, released on the rim and left to settle in the minimum. `terrainH` and
 * `TERRAIN_GLSL` must stay in step: the path is computed in JS and the bed is drawn in GLSL.
 */

export const BOWL_R = 1000;
export const BED_DEPTH = 165;
const RIM_RISE = 150;
const RELIEF = 22;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function terrainH(x: number, z: number): number {
  const rho = Math.hypot(x, z) / BOWL_R;
  const bowl = -BED_DEPTH * Math.exp(-Math.pow(rho / 0.74, 2.4)) + RIM_RISE * smoothstep(1.02, 1.7, rho);
  const n =
    Math.sin(x * 0.0061 + 1.3 + 1.4 * Math.sin(z * 0.0037 + 0.7)) +
    0.8 * Math.sin(z * 0.0083 - 0.9 + 1.1 * Math.sin(x * 0.0049 + 2.1)) +
    0.42 * Math.sin((x + z) * 0.0137 + 4.2) +
    0.26 * Math.sin((x - z * 0.7) * 0.0211 + 0.5);
  return bowl + RELIEF * smoothstep(0.04, 0.62, rho) * n;
}

export const TERRAIN_GLSL = /* glsl */ `
float terrainH(vec2 p) {
  float rho = length(p) / ${BOWL_R.toFixed(1)};
  float bowl = -${BED_DEPTH.toFixed(1)} * exp(-pow(rho / 0.74, 2.4)) + ${RIM_RISE.toFixed(1)} * smoothstep(1.02, 1.7, rho);
  float n = sin(p.x * 0.0061 + 1.3 + 1.4 * sin(p.y * 0.0037 + 0.7))
          + 0.8 * sin(p.y * 0.0083 - 0.9 + 1.1 * sin(p.x * 0.0049 + 2.1))
          + 0.42 * sin((p.x + p.y) * 0.0137 + 4.2)
          + 0.26 * sin((p.x - p.y * 0.7) * 0.0211 + 0.5);
  return bowl + ${RELIEF.toFixed(1)} * smoothstep(0.04, 0.62, rho) * n;
}
`;

export type PathPoint = { x: number; y: number; z: number; depth: number; azimuth: number };

const THREAD_LIFT = 2.5;

/**
 * Releases a ball on the rim with a sideways push and integrates heavy-ball gradient descent until it
 * settles, then resamples the run to even steps along its length so it can be scrubbed at a steady pace.
 */
export function descend(samples = 900): PathPoint[] {
  // learning rate, momentum loss per step, and a start found by scanning for a run that orbits and settles
  const lr = 0.02, friction = 0.0015, e = 0.5, start = 2, push = 1.8;
  let x = Math.cos(start) * 955, z = Math.sin(start) * 955;
  let vx = Math.sin(start) * push, vz = -Math.cos(start) * push;
  const raw: [number, number][] = [[x, z]];
  for (let i = 0; i < 30000; i++) {
    const gx = (terrainH(x + e, z) - terrainH(x - e, z)) / (2 * e);
    const gz = (terrainH(x, z + e) - terrainH(x, z - e)) / (2 * e);
    vx = (vx - gx * lr) * (1 - friction);
    vz = (vz - gz * lr) * (1 - friction);
    x += vx;
    z += vz;
    if (i % 4 === 0) raw.push([x, z]);
    if (Math.hypot(vx, vz) < 0.004) break;
  }
  raw.push([0, 0]);

  const lengths = [0];
  for (let i = 1; i < raw.length; i++) lengths.push(lengths[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const total = lengths[lengths.length - 1];

  const out: PathPoint[] = [];
  let at = 0, azimuth = Math.atan2(raw[0][1], raw[0][0]), deepest = 0;
  for (let i = 0; i < samples; i++) {
    const want = (i / (samples - 1)) * total;
    while (at < lengths.length - 2 && lengths[at + 1] < want) at++;
    const k = (want - lengths[at]) / Math.max(lengths[at + 1] - lengths[at], 1e-6);
    const px = raw[at][0] + (raw[at + 1][0] - raw[at][0]) * k;
    const pz = raw[at][1] + (raw[at + 1][1] - raw[at][1]) * k;
    const h = terrainH(px, pz);
    deepest = Math.max(deepest, -h);
    // unwrap, so the camera can follow the orbit without ever spinning back
    let a = Math.atan2(pz, px);
    while (a - azimuth > Math.PI) a -= Math.PI * 2;
    while (a - azimuth < -Math.PI) a += Math.PI * 2;
    if (Math.hypot(px, pz) < 60) a = azimuth; // the angle means nothing this close to the middle
    azimuth = a;
    out.push({ x: px, y: h + THREAD_LIFT, z: pz, depth: deepest, azimuth });
  }
  return out;
}

/** Where the water line sits, in CSS pixels from the top of the viewport. With a hero it starts just below
 *  the fold and climbs faster than the page, so the view dips under the lake; other pages start submerged. */
export function surfaceY(scrollY: number, heroH: number): number {
  return heroH > 0 ? heroH * 1.04 - scrollY * 1.6 : -scrollY;
}

/** The moving edge of the water line, in CSS pixels. Shared by the hero (above it) and the environment (below it). */
export const WAVE_GLSL = /* glsl */ `
float waterWave(float x, float t) {
  return sin(x * 0.0047 + t * 0.5) * 9.0 + sin(x * 0.012 + t * 1.1) * 5.0 + sin(x * 0.031 - t * 1.7) * 2.4;
}
`;
