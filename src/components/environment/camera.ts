import { terrainH, type PathPoint } from "./world";

export type Vec3 = [number, number, number];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Column-major perspective * lookAt, written into `out`. */
export function viewProjection(out: Float32Array, eye: Vec3, target: Vec3, up: Vec3, fovY: number, aspect: number, near: number, far: number) {
  const z = norm(sub(eye, target)), x = norm(cross(up, z)), y = cross(z, x);
  const f = 1 / Math.tan(fovY / 2), nf = 1 / (near - far);
  const a = f / aspect, b = f, c = (far + near) * nf, d = 2 * far * near * nf;
  const tx = -dot(x, eye), ty = -dot(y, eye), tz = -dot(z, eye);
  out[0] = a * x[0]; out[1] = b * y[0]; out[2] = c * z[0]; out[3] = -z[0];
  out[4] = a * x[1]; out[5] = b * y[1]; out[6] = c * z[1]; out[7] = -z[1];
  out[8] = a * x[2]; out[9] = b * y[2]; out[10] = c * z[2]; out[11] = -z[2];
  out[12] = a * tx; out[13] = b * ty; out[14] = c * tz + d; out[15] = -tz;
}

type Keys = readonly (readonly [number, number])[];

/** Eased interpolation through [position, value] keys. */
export function keyed(keys: Keys, s: number): number {
  if (s <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (s <= keys[i][0]) {
      const t = (s - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
      return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * t * t * (3 - 2 * t);
    }
  }
  return keys[keys.length - 1][1];
}

/**
 * The dive, as functions of how far along the descent the visitor is (0 = just under the surface,
 * 0.86 = the last section of the page, 1 = the footer). The camera stays outside the orbit looking in,
 * so moving along the path is mostly a slide sideways, then it rises at the end into a plan view:
 * what looked like a landscape turns out to have been a map.
 */
const BACK: Keys = [[0, 250], [0.3, 280], [0.6, 260], [0.86, 170], [0.95, 30], [1, 0]];
const LIFT: Keys = [[0, 60], [0.3, 70], [0.6, 74], [0.86, 96], [0.95, 420], [1, 920]];
const FOV: Keys = [[0, 52], [0.86, 50], [1, 38]];
export const FOG: Keys = [[0, 0.0021], [0.2, 0.0015], [0.55, 0.0012], [0.86, 0.001], [1, 0.0006]];
export const LINE: Keys = [[0, 0.13], [0.15, 0.21], [0.6, 0.26], [0.86, 0.32], [1, 0.5]];
export const SHADE: Keys = [[0, 0.07], [0.4, 0.11], [0.86, 0.14], [1, 0.14]];
export const CAUSTIC: Keys = [[0, 0.16], [0.3, 0.09], [0.6, 0.03], [0.8, 0]];
export const RAYS: Keys = [[0, 1], [0.2, 0.8], [0.55, 0.42], [0.8, 0.14], [0.92, 0]];
export const PULSE: Keys = [[0.93, 0], [1, 1]];
const SHIFT_X: Keys = [[0, 0.26], [0.86, 0.3], [1, 0.42]];
const SHIFT_Y: Keys = [[0, 0.02], [0.86, 0.06], [1, 0.04]];
const SHIFT_X_NARROW: Keys = [[0, 0.1], [0.86, 0.12], [1, 0]];
const SHIFT_Y_NARROW: Keys = [[0, 0.1], [0.86, 0.14], [1, 0.46]];

export type Shot = { eye: Vec3; bead: Vec3; shift: [number, number] };

/** Writes the camera for path position `s` (0..1) into `out`, and returns the rest of the framing. */
export function cameraAt(out: Float32Array, path: PathPoint[], s: number, aspect: number, nudge: number): Shot {
  const f = Math.min(1, Math.max(0, s)) * (path.length - 1);
  const i = Math.floor(f), k = f - i;
  const a = path[i], b = path[Math.min(i + 1, path.length - 1)];
  const bead: Vec3 = [a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, a.z + (b.z - a.z) * k];
  const az = a.azimuth + (b.azimuth - a.azimuth) * k + nudge;
  const cx = Math.cos(az), cz = Math.sin(az);
  const r = Math.hypot(bead[0], bead[2]) + keyed(BACK, s);
  const ex = cx * r, ez = cz * r;
  // ride above the bed so the camera never clips a hill it is passing over
  const eye: Vec3 = [ex, Math.max(bead[1] + keyed(LIFT, s), terrainH(ex, ez) + 26), ez];
  const flat = Math.min(1, Math.max(0, (s - 0.86) / 0.14));
  const up = norm([-cx * flat, 1 - flat, -cz * flat]);
  const fov = (keyed(FOV, s) * Math.PI) / 180;
  viewProjection(out, eye, bead, up, fov, aspect, 4, 5000);
  const narrow = aspect < 0.9;
  return { eye, bead, shift: narrow ? [keyed(SHIFT_X_NARROW, s), keyed(SHIFT_Y_NARROW, s)] : [keyed(SHIFT_X, s), keyed(SHIFT_Y, s)] };
}

/** Evens out the azimuth so the camera turns smoothly even where the run wobbles. */
export function smoothAzimuth(path: PathPoint[], window = 45): PathPoint[] {
  return path.map((p, i) => {
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - window); j <= Math.min(path.length - 1, i + window); j++) {
      sum += path[j].azimuth;
      n++;
    }
    return { ...p, azimuth: sum / n };
  });
}
