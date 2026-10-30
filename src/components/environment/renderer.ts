import { TERRAIN_GLSL, WAVE_GLSL, type PathPoint } from "./world";

/*
 * Draws the lake from below, in five cheap passes on one WebGL2 context:
 *   water    the page-long colour band, locked to the content so text always sits on its own shade
 *   bed      the caldera floor as a real mesh with contour lines drawn per pixel
 *   thread   the descent path as a screen-space ribbon, and the bead at its head
 *   motes    specks of sediment drifting through the volume
 *   light    sun shafts and the bright underside of the surface
 * Everything is procedural: no images to load and the same sharpness on every screen.
 */

const HEAD = /* glsl */ `#version 300 es
precision highp float;
`;

const WATER_FN = /* glsl */ `
uniform sampler2D uPalDay;
uniform sampler2D uPalNight;
uniform float uNight;
uniform float uScroll;   // content offset in CSS pixels
uniform float uDoc;      // height the palette covers, in CSS pixels
uniform vec2 uRes;       // canvas pixels
uniform float uDpr;
vec3 waterAt() {
  float v = (uScroll + (uRes.y - gl_FragCoord.y) / uDpr) / uDoc;
  return mix(texture(uPalDay, vec2(v, 0.5)).rgb, texture(uPalNight, vec2(v, 0.5)).rgb, uNight);
}
float dither() { return (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 1.6 / 255.0; }
// strokes that read on whichever shade of water is behind them
vec3 inkOn(vec3 water) {
  float lum = dot(water, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(0.86, 0.87, 0.80), vec3(0.11, 0.14, 0.105), smoothstep(0.1, 0.34, lum));
}
`;

const FULLSCREEN_VERT = /* glsl */ `${HEAD}
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const WATER_FRAG = /* glsl */ `${HEAD}${WATER_FN}
out vec4 outColor;
void main() { outColor = vec4(waterAt() + dither(), 1.0); }
`;

const BED_VERT = /* glsl */ `${HEAD}${TERRAIN_GLSL}
in vec2 aXZ;
uniform mat4 uVP;
uniform vec2 uShift;
out vec3 vW;
void main() {
  vec3 w = vec3(aXZ.x, terrainH(aXZ), aXZ.y);
  vW = w;
  vec4 p = uVP * vec4(w, 1.0);
  p.xy += uShift * p.w;
  gl_Position = p;
}
`;

const BED_FRAG = /* glsl */ `${HEAD}${WATER_FN}${TERRAIN_GLSL}
in vec3 vW;
uniform vec3 uEye;
uniform float uFog, uLine, uShade, uCaustic, uPulse, uTime, uQuiet;
out vec4 outColor;

float contour(float h, float spacing, float width) {
  float f = h / spacing;
  float d = fwidth(f);
  float dist = abs(fract(f - 0.5) - 0.5) / max(d, 1e-5);
  return (1.0 - smoothstep(width - 0.75, width + 0.75, dist)) * (1.0 - smoothstep(0.32, 0.7, d));
}

// a light net that drifts over the shallows
float caustic(vec2 p, float t) {
  vec2 q = p * 0.052;
  float a = sin(q.x + sin(q.y * 1.3 + t * 0.42) * 1.6 + t * 0.21);
  float b = sin(q.y * 1.15 + sin(q.x * 0.9 - t * 0.36) * 1.7 - t * 0.17);
  return pow(1.0 - abs(a + b) * 0.5, 7.0);
}

void main() {
  vec3 water = waterAt();
  vec3 ink = inkOn(water);
  float h = terrainH(vW.xz);
  vec3 P = vec3(vW.x, h, vW.z);
  vec3 n = normalize(cross(dFdx(P), dFdy(P)));
  if (n.y < 0.0) n = -n;
  // gentle slopes barely turn the normal, so the sideways part of the light is exaggerated
  float lit = clamp(0.5 + 2.6 * dot(n.xz, normalize(vec2(0.74, -0.67))), 0.0, 1.0);

  float dist = distance(uEye, P);
  float fog = 1.0 - exp(-dist * uFog);

  // text lives on the left, so the map is drawn quieter there
  float side = gl_FragCoord.x / uRes.x;
  float quiet = uQuiet >= 1.0 ? 0.42 : 1.0 - uQuiet * (1.0 - smoothstep(0.18, 0.72, side));

  // near ground is darker than the water around it; distance washes it out, which is where the depth comes from
  vec3 col = mix(water, ink, uShade * quiet * (0.3 + 0.7 * (1.0 - lit)));
  col += caustic(vW.xz, uTime) * uCaustic * vec3(1.0, 0.98, 0.9) * (1.0 - fog);

  float minor = contour(h, 5.0, 0.6) * 0.62;
  float major = contour(h, 25.0, 0.95);

  // the minimum: once the bead has arrived, a swell of light runs out along the contour lines from it
  float r = length(vW.xz);
  float swell = mod(uTime * 70.0, 560.0);
  float band = exp(-pow((r - swell) / 46.0, 2.0)) * (1.0 - smoothstep(120.0, 560.0, r));
  float line = max(minor, major) * (uLine * quiet + uPulse * band * 0.7);

  col = mix(col, ink, clamp(line, 0.0, 1.0));
  col = mix(col, water, fog);
  outColor = vec4(col + dither(), 1.0);
}
`;

const THREAD_VERT = /* glsl */ `${HEAD}
in vec3 aP;
in vec3 aT;
in float aSide;
in float aU;
uniform mat4 uVP;
uniform vec2 uShift;
uniform vec2 uRes;
uniform float uWidth;
uniform vec3 uEye;
out float vU;
out float vSide;
out float vDist;
void main() {
  vec4 a = uVP * vec4(aP, 1.0);
  vec4 b = uVP * vec4(aP + aT, 1.0);
  a.xy += uShift * a.w;
  b.xy += uShift * b.w;
  vec2 dir = (b.xy / b.w - a.xy / a.w) * uRes;
  float l = length(dir);
  vec2 normal = l > 1e-4 ? vec2(-dir.y, dir.x) / l : vec2(0.0, 1.0);
  a.xy += normal * aSide * uWidth / uRes * a.w * 2.0;
  gl_Position = a;
  vU = aU;
  vSide = aSide;
  vDist = distance(uEye, aP);
}
`;

const THREAD_FRAG = /* glsl */ `${HEAD}${WATER_FN}
in float vU;
in float vSide;
in float vDist;
uniform float uHead, uFog;
uniform vec3 uAccentDay, uAccentNight;
out vec4 outColor;
void main() {
  if (vU > uHead) discard;
  float edge = 1.0 - smoothstep(0.55, 1.0, abs(vSide));
  float tail = mix(0.42, 1.0, smoothstep(uHead - 0.12, uHead, vU));
  float fog = exp(-vDist * uFog * 0.75);
  vec3 water = waterAt();
  float lum = dot(water, vec3(0.2126, 0.7152, 0.0722));
  vec3 accent = mix(uAccentNight, uAccentDay, smoothstep(0.1, 0.34, lum));
  float a = edge * tail * fog;
  outColor = vec4(accent * a, a);
}
`;

const BEAD_VERT = /* glsl */ `${HEAD}
uniform mat4 uVP;
uniform vec2 uShift;
uniform vec3 uBead;
uniform float uSize;
void main() {
  vec4 p = uVP * vec4(uBead, 1.0);
  p.xy += uShift * p.w;
  gl_Position = p;
  gl_PointSize = uSize;
}
`;

const BEAD_FRAG = /* glsl */ `${HEAD}${WATER_FN}
uniform vec3 uAccentDay, uAccentNight;
uniform float uTime, uBeadAlpha;
out vec4 outColor;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  vec3 water = waterAt();
  float lum = dot(water, vec3(0.2126, 0.7152, 0.0722));
  vec3 accent = mix(uAccentNight, uAccentDay, smoothstep(0.1, 0.34, lum));
  float core = 1.0 - smoothstep(0.17, 0.22, d);
  float ring = (1.0 - smoothstep(0.018, 0.05, abs(d - 0.42 - 0.05 * sin(uTime * 1.6)))) * 0.5;
  float glow = (1.0 - smoothstep(0.1, 1.0, d)) * 0.16;
  float a = clamp(core + ring + glow, 0.0, 1.0) * uBeadAlpha;
  outColor = vec4(accent * a, a);
}
`;

const MOTE_VERT = /* glsl */ `${HEAD}
in vec4 aSeed;  // xyz in the box, w for size and twinkle
uniform mat4 uVP;
uniform vec2 uShift;
uniform vec3 uEye;
uniform float uTime, uDpr;
const float BOX = 460.0;
out float vA;
void main() {
  vec3 drift = vec3(sin(uTime * 0.09 + aSeed.w * 40.0) * 9.0, uTime * (1.2 + aSeed.w * 2.4), cos(uTime * 0.07 + aSeed.w * 30.0) * 9.0);
  vec3 p = mod(aSeed.xyz + drift - uEye + BOX * 0.5, BOX) - BOX * 0.5;
  float dist = length(p);
  vec4 clip = uVP * vec4(p + uEye, 1.0);
  clip.xy += uShift * clip.w;
  gl_Position = clip;
  gl_PointSize = clamp((620.0 + aSeed.w * 900.0) / max(dist, 1.0), 1.0, 7.0) * uDpr;
  // fade at the walls of the box, so specks never pop in or out as they wrap
  vA = smoothstep(BOX * 0.5, BOX * 0.3, dist) * smoothstep(8.0, 34.0, dist) * (0.3 + 0.7 * aSeed.w);
}
`;

const MOTE_FRAG = /* glsl */ `${HEAD}${WATER_FN}
in float vA;
uniform float uMote;
out vec4 outColor;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  vec3 ink = inkOn(waterAt());
  float a = (1.0 - smoothstep(0.35, 1.0, d)) * vA * uMote;
  outColor = vec4(ink * a, a);
}
`;

const LIGHT_FRAG = /* glsl */ `${HEAD}${WATER_FN}${WAVE_GLSL}
uniform float uSurface, uRays, uSunX, uTime, uCeil, uQuiet;
uniform vec3 uGlint;
out vec4 outColor;
void main() {
  vec2 res = uRes / uDpr;
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float below = px.y - (uSurface + waterWave(px.x, uTime));
  float under = smoothstep(-1.0, 1.0, below);
  float b = max(below, 0.0);

  // the underside of the surface: bright, and rippling the way it does when seen from below
  float reach = exp(-b / (res.y * 0.17));
  vec2 q = vec2(px.x * 0.0075 + uTime * 0.05, b * 0.016 - uTime * 0.11);
  float ripple = sin(q.x * 3.0 + sin(q.y * 2.0) * 2.2) * sin(q.y * 2.6 + sin(q.x * 1.7 + uTime * 0.2) * 1.6);
  float ceiling = reach * (0.5 + 0.5 * ripple) * uCeil;

  // shafts fall from the hero's sun, so the light above the lake is the light under it
  vec2 o = vec2(res.x * uSunX, min(uSurface, 0.0) - res.y * 0.42);
  vec2 d = px - o;
  float ang = atan(d.x, d.y);
  float s = sin(ang * 27.0 + uTime * 0.11 + 1.0) * sin(ang * 11.0 - uTime * 0.07) + 0.55 * sin(ang * 53.0 - uTime * 0.17);
  // text lives on the left, so the light is gentler there; on phones it is gentle everywhere
  float side = uQuiet >= 1.0 ? 0.0 : smoothstep(0.2, 0.7, gl_FragCoord.x / uRes.x);
  float shafts = smoothstep(0.0, 1.25, s + 0.25) * exp(-length(d) / res.y * 0.9) * uRays * mix(0.5, 1.0, side);

  // on pale water light alone hardly reads, so the gaps between shafts are shaded a touch as well
  float gap = (1.0 - smoothstep(-0.7, 0.25, s + 0.25)) * exp(-length(d) / res.y * 0.9) * uRays * 0.075 * under;
  float a = clamp(ceiling * 0.7 + shafts * 0.7, 0.0, 0.9) * under;
  // the meniscus: one thin bright line where air meets water
  a = max(a, exp(-abs(below) / 1.5) * 0.85 * step(-40.0, below) * uCeil);
  vec3 ink = inkOn(waterAt());
  outColor = vec4(uGlint * a + ink * gap * (1.0 - a), a + gap * (1.0 - a));
}
`;

export type EnvFrame = {
  time: number;
  viewProj: Float32Array;
  eye: [number, number, number];
  shift: [number, number];
  bead: [number, number, number];
  scroll: number;
  doc: number;
  surface: number;
  night: number;
  head: number;
  fog: number;
  line: number;
  shade: number;
  caustic: number;
  rays: number;
  pulse: number;
  quiet: number;
  clipTop: number; // CSS pixels from the top of the screen hidden behind the hero
  sunX: number;
  moteAlpha: number;
  beadAlpha: number;
};

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null>; vao: WebGLVertexArrayObject };

const hexRGB = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export class EnvRenderer {
  private gl: WebGL2RenderingContext;
  private parallel: KHR_parallel_shader_compile | null;
  private programs: WebGLProgram[] = [];
  private state: "compiling" | "ready" | "failed" = "compiling";
  private passes!: Record<"water" | "bed" | "thread" | "bead" | "mote" | "light", Prog>;
  private palDay: WebGLTexture | null = null;
  private palNight: WebGLTexture | null = null;
  private buffers: (WebGLBuffer | null)[] = [];
  private bedIndices = 0;
  private threadVerts = 0;
  private moteCount: number;
  private gridSize: number;
  private path: PathPoint[];
  private pendingPalette: [Uint8Array, Uint8Array] | null = null;
  width = 1;
  height = 1;
  dpr = 1;

  static create(canvas: HTMLCanvasElement, path: PathPoint[], lite: boolean): EnvRenderer | null {
    try {
      const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: true, stencil: false, powerPreference: "default" });
      if (!gl || gl.isContextLost()) return null;
      // Without a GPU this would run on the CPU and stall the page; the static background looks fine there.
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
      if (/swiftshader|llvmpipe|software|basic render/i.test(name)) return null;
      return new EnvRenderer(gl, path, lite);
    } catch (err) {
      console.warn("[environment] WebGL2 unavailable, using the static background", err);
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext, path: PathPoint[], lite: boolean) {
    this.gl = gl;
    this.path = path;
    this.gridSize = lite ? 110 : 200;
    this.moteCount = lite ? 70 : 170;
    this.parallel = gl.getExtension("KHR_parallel_shader_compile");
    const link = (vs: string, fs: string) => {
      const compile = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog);
      this.programs.push(prog);
      return prog;
    };
    // compile now, finish setup once the driver reports it is ready: the page never waits on shaders
    this.programs = [];
    link(FULLSCREEN_VERT, WATER_FRAG);
    link(BED_VERT, BED_FRAG);
    link(THREAD_VERT, THREAD_FRAG);
    link(BEAD_VERT, BEAD_FRAG);
    link(MOTE_VERT, MOTE_FRAG);
    link(FULLSCREEN_VERT, LIGHT_FRAG);
  }

  get failed() {
    return this.state === "failed";
  }
  get lost() {
    return this.gl.isContextLost();
  }

  private ready(): boolean {
    if (this.state !== "compiling") return this.state === "ready";
    const gl = this.gl;
    if (this.parallel && !this.programs.every((p) => gl.getProgramParameter(p, this.parallel!.COMPLETION_STATUS_KHR))) return false;
    for (const p of this.programs) {
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.warn("[environment] shader failed, using the static background", gl.getProgramInfoLog(p));
        this.state = "failed";
        return false;
      }
    }
    this.state = "ready";
    this.setup();
    return true;
  }

  private buffer(data: ArrayBufferView, target: number = this.gl.ARRAY_BUFFER) {
    const gl = this.gl, b = gl.createBuffer();
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    this.buffers.push(b);
    return b;
  }

  private pass(program: WebGLProgram, uniforms: string[], attrs: () => void): Prog {
    const gl = this.gl;
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    attrs();
    gl.bindVertexArray(null);
    const u: Prog["u"] = {};
    for (const n of uniforms) u[n] = gl.getUniformLocation(program, n);
    return { p: program, u, vao };
  }

  private setup() {
    const gl = this.gl, [water, bed, thread, bead, mote, light] = this.programs;
    const SHARED = ["uPalDay", "uPalNight", "uNight", "uScroll", "uDoc", "uRes", "uDpr"];
    const attr = (prog: WebGLProgram, name: string, size: number, stride = 0, offset = 0) => {
      const loc = gl.getAttribLocation(prog, name);
      if (loc < 0) return;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
    };

    const tri = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const triBuffer = this.buffer(tri);
    const fullscreen = (prog: WebGLProgram) => () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, triBuffer);
      attr(prog, "aPos", 2);
    };

    // the bed: a square grid, displaced in the vertex shader
    const N = this.gridSize, EXT = 1750;
    const verts = new Float32Array((N + 1) * (N + 1) * 2);
    for (let j = 0, k = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      verts[k++] = (i / N - 0.5) * 2 * EXT;
      verts[k++] = (j / N - 0.5) * 2 * EXT;
    }
    const idx = new Uint32Array(N * N * 6);
    for (let j = 0, k = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b;
      idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
    this.bedIndices = idx.length;
    const bedVerts = this.buffer(verts);

    // the thread: two vertices per sample, pushed apart in screen space
    const pts = this.path, count = pts.length;
    const ribbon = new Float32Array(count * 2 * 8);
    for (let i = 0, k = 0; i < count; i++) {
      const p = pts[i], q = pts[Math.min(i + 1, count - 1)], o = pts[Math.max(i - 1, 0)];
      const tx = q.x - o.x, ty = q.y - o.y, tz = q.z - o.z;
      for (const side of [-1, 1]) {
        ribbon[k++] = p.x; ribbon[k++] = p.y; ribbon[k++] = p.z;
        ribbon[k++] = tx; ribbon[k++] = ty; ribbon[k++] = tz;
        ribbon[k++] = side;
        ribbon[k++] = i / (count - 1);
      }
    }
    this.threadVerts = count * 2;
    const threadBuffer = this.buffer(ribbon);

    const seeds = new Float32Array(this.moteCount * 4);
    for (let i = 0; i < this.moteCount; i++) {
      seeds[i * 4] = Math.random() * 460;
      seeds[i * 4 + 1] = Math.random() * 460;
      seeds[i * 4 + 2] = Math.random() * 460;
      seeds[i * 4 + 3] = Math.random();
    }
    const moteBuffer = this.buffer(seeds);

    this.passes = {
      water: this.pass(water, SHARED, fullscreen(water)),
      bed: this.pass(bed, [...SHARED, "uVP", "uShift", "uEye", "uFog", "uLine", "uShade", "uCaustic", "uPulse", "uTime", "uQuiet"], () => {
        gl.bindBuffer(gl.ARRAY_BUFFER, bedVerts);
        attr(bed, "aXZ", 2);
        this.buffer(idx, gl.ELEMENT_ARRAY_BUFFER);
      }),
      thread: this.pass(thread, [...SHARED, "uVP", "uShift", "uWidth", "uEye", "uHead", "uFog", "uAccentDay", "uAccentNight"], () => {
        gl.bindBuffer(gl.ARRAY_BUFFER, threadBuffer);
        attr(thread, "aP", 3, 32, 0);
        attr(thread, "aT", 3, 32, 12);
        attr(thread, "aSide", 1, 32, 24);
        attr(thread, "aU", 1, 32, 28);
      }),
      bead: this.pass(bead, [...SHARED, "uVP", "uShift", "uBead", "uSize", "uAccentDay", "uAccentNight", "uTime", "uBeadAlpha"], () => {}),
      mote: this.pass(mote, [...SHARED, "uVP", "uShift", "uEye", "uTime", "uMote"], () => {
        gl.bindBuffer(gl.ARRAY_BUFFER, moteBuffer);
        attr(mote, "aSeed", 4);
      }),
      light: this.pass(light, [...SHARED, "uSurface", "uRays", "uSunX", "uTime", "uCeil", "uGlint", "uQuiet"], fullscreen(light)),
    };

    this.palDay = gl.createTexture();
    this.palNight = gl.createTexture();
    for (const [unit, tex] of [[0, this.palDay], [1, this.palNight]] as const) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    if (this.pendingPalette) this.setPalette(...this.pendingPalette);
  }

  /** Uploads the page's water colours, top to bottom, as 1-pixel-tall RGBA strips. */
  setPalette(day: Uint8Array, night: Uint8Array) {
    if (this.state !== "ready") {
      this.pendingPalette = [day, night];
      return;
    }
    const gl = this.gl;
    for (const [unit, data] of [[0, day], [1, night]] as const) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, data.length / 4, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }
  }

  resize(width: number, height: number, dpr: number) {
    const c = this.gl.canvas as HTMLCanvasElement;
    if (c.width !== width || c.height !== height) {
      c.width = width;
      c.height = height;
    }
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.gl.viewport(0, 0, width, height);
  }

  private use(pass: Prog, f: EnvFrame) {
    const gl = this.gl, u = pass.u;
    gl.useProgram(pass.p);
    gl.bindVertexArray(pass.vao);
    gl.uniform1i(u.uPalDay, 0);
    gl.uniform1i(u.uPalNight, 1);
    gl.uniform1f(u.uNight, f.night);
    gl.uniform1f(u.uScroll, f.scroll);
    gl.uniform1f(u.uDoc, f.doc);
    gl.uniform2f(u.uRes, this.width, this.height);
    gl.uniform1f(u.uDpr, this.dpr);
    if (u.uVP) gl.uniformMatrix4fv(u.uVP, false, f.viewProj);
    if (u.uShift) gl.uniform2f(u.uShift, f.shift[0], f.shift[1]);
    if (u.uEye) gl.uniform3f(u.uEye, f.eye[0], f.eye[1], f.eye[2]);
    if (u.uTime) gl.uniform1f(u.uTime, f.time);
    return u;
  }

  /** Draws a frame; returns false while the shaders are still compiling. */
  render(f: EnvFrame): boolean {
    if (!this.ready()) return false;
    const gl = this.gl, P = this.passes;

    // while the hero still covers the top of the screen, nothing behind it needs shading
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, 0, this.width, Math.max(0, Math.ceil(this.height - f.clipTop * this.dpr)));

    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    this.use(P.water, f);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    let u = this.use(P.bed, f);
    gl.uniform1f(u.uFog, f.fog);
    gl.uniform1f(u.uLine, f.line);
    gl.uniform1f(u.uShade, f.shade);
    gl.uniform1f(u.uCaustic, f.caustic);
    gl.uniform1f(u.uPulse, f.pulse);
    gl.uniform1f(u.uQuiet, f.quiet);
    gl.drawElements(gl.TRIANGLES, this.bedIndices, gl.UNSIGNED_INT, 0);

    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    u = this.use(P.thread, f);
    gl.uniform1f(u.uWidth, 1.35 * this.dpr);
    gl.uniform1f(u.uHead, f.head);
    gl.uniform1f(u.uFog, f.fog);
    gl.uniform3fv(u.uAccentDay, ACCENT_DAY);
    gl.uniform3fv(u.uAccentNight, ACCENT_NIGHT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.threadVerts);

    u = this.use(P.mote, f);
    gl.uniform1f(u.uMote, f.moteAlpha);
    gl.drawArrays(gl.POINTS, 0, this.moteCount);

    gl.disable(gl.DEPTH_TEST);
    u = this.use(P.bead, f);
    gl.uniform3f(u.uBead, f.bead[0], f.bead[1], f.bead[2]);
    gl.uniform1f(u.uSize, 44 * this.dpr);
    gl.uniform3fv(u.uAccentDay, ACCENT_DAY);
    gl.uniform3fv(u.uAccentNight, ACCENT_NIGHT);
    gl.uniform1f(u.uBeadAlpha, f.beadAlpha);
    gl.drawArrays(gl.POINTS, 0, 1);

    u = this.use(P.light, f);
    gl.uniform1f(u.uSurface, f.surface);
    gl.uniform1f(u.uRays, f.rays);
    gl.uniform1f(u.uSunX, f.sunX);
    gl.uniform1f(u.uCeil, 1);
    gl.uniform1f(u.uQuiet, f.quiet);
    gl.uniform3f(u.uGlint, ...(GLINT_DAY.map((c, i) => c + (GLINT_NIGHT[i] - c) * f.night) as [number, number, number]));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindVertexArray(null);
    return true;
  }

  /** Frees GPU resources; the context stays alive so the canvas can be reused if the layout comes back. */
  dispose() {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    this.buffers.forEach((b) => gl.deleteBuffer(b));
    gl.deleteTexture(this.palDay);
    gl.deleteTexture(this.palNight);
    if (this.state === "ready") Object.values(this.passes).forEach((p) => gl.deleteVertexArray(p.vao));
    this.programs.forEach((p) => gl.deleteProgram(p));
  }
}

const ACCENT_DAY = hexRGB("#46663f");
const ACCENT_NIGHT = hexRGB("#b4d3a4");
const GLINT_DAY = hexRGB("#fffaf0");
const GLINT_NIGHT = hexRGB("#7f9685");
