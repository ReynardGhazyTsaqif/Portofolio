import { RIDGES, ROCKS, WORLD, type Palette } from "./scene";

/*
 * One full-screen fragment shader draws the whole picture: sky, sun/moon, four caldera ridges and mist
 * above the water line; below it a calm lake with soft ripples, a glitter path under the sun and the
 * reflection of the handwritten name; shore rocks in front. Everything is procedural, so it stays sharp
 * at any size and costs one draw call per frame.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const N_ROCKS = ROCKS.length;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uScale;
uniform vec2 uOrigin;
uniform float uTime;
uniform vec4 uAmp[4];
uniform vec4 uFreq[4];
uniform vec4 uPhase[4];
uniform vec4 uMisc[4];        // base, bowl, offsetX, offsetY
uniform vec3 uRidge[4];
uniform vec4 uRock[${N_ROCKS}];   // x, y, rx, ry
uniform float uRockSeed[${N_ROCKS}];
uniform vec2 uRockOffset;
uniform vec3 uSkyTop, uSkyLow, uSun, uGlow, uMist, uWaterTop, uWaterLow, uGlint, uRockLight, uRockDark, uRockMoss, uInk;
uniform vec3 uSunPos;         // x, y, radius in world units
uniform float uNight;
uniform sampler2D uName;
uniform vec4 uNameRect;       // world x, y, w, h of the name texture
uniform float uNameAlpha;

const float TAU = 6.2831853;
const float W = ${WORLD.w.toFixed(1)};
const float H = ${WORLD.h.toFixed(1)};
const float HORIZON = ${WORLD.horizon.toFixed(1)};

float shoreY(float x) {
  return HORIZON + 9.0 * sin(x * 0.0061 + 1.1) + 5.0 * sin(x * 0.0173 + 2.3) + 2.5 * sin(x * 0.0419 + 0.4);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

vec3 sky(vec2 p, float aa) {
  float t = clamp(p.y / HORIZON, 0.0, 1.0);
  vec3 col = mix(uSkyTop, uSkyLow, t * t * (3.0 - 2.0 * t));
  float h = hash(floor(p / 3.2));
  col += step(0.9982, h) * uNight * (1.0 - t) * (0.55 + 0.45 * sin(uTime * 1.3 + h * 80.0));
  float d = distance(p, uSunPos.xy);
  col = mix(col, uGlow, exp(-d / (uSunPos.z * 2.4)) * 0.6);
  col = mix(col, uSun, 1.0 - smoothstep(uSunPos.z - aa, uSunPos.z + aa, d));
  for (int i = 0; i < 4; i++) {
    vec4 m = uMisc[i];
    float x = p.x - m.z;
    float y = m.x + m.w;
    y -= sin(x / W * uFreq[i].x * TAU + uPhase[i].x) * uAmp[i].x;
    y -= sin(x / W * uFreq[i].y * TAU + uPhase[i].y) * uAmp[i].y;
    y -= sin(x / W * uFreq[i].z * TAU + uPhase[i].z) * uAmp[i].z;
    y -= sin(x / W * uFreq[i].w * TAU + uPhase[i].w) * uAmp[i].w;
    y -= pow(abs(x - W * 0.5) / (W * 0.5), 2.2) * m.y;
    float a = smoothstep(y - aa, y + aa, p.y);
    vec3 shade = uRidge[i] * (1.0 - 0.07 * clamp((p.y - y) / 140.0, 0.0, 1.0));
    col = mix(col, shade, a);
    if (i == 1) {
      float band = exp(-pow((p.y - (HORIZON - 58.0 + uMisc[1].w)) / 26.0, 2.0));
      col = mix(col, uMist, 0.5 * band * (0.7 + 0.3 * sin(p.x * 0.004 + uTime * 0.12)));
    }
  }
  // soft haze settling on the shore
  col = mix(col, uMist, 0.32 * exp(-max(shoreY(p.x) - p.y, 0.0) / 16.0));
  return col;
}

vec3 water(vec2 p, float aa, float shore) {
  float t = clamp((p.y - HORIZON) / (H - HORIZON), 0.0, 1.0);
  float below = max(p.y - shore, 0.0);
  vec3 col = mix(uWaterTop, uWaterLow, smoothstep(0.0, 1.0, t));
  // the dark foot of the hills blurred into the water, then a thin pale line of mist on the surface
  col = mix(col, uRidge[3] * 0.92, 0.55 * exp(-below / 18.0) * (0.85 + 0.15 * sin(p.x * 0.02 + uTime * 0.4)));
  col = mix(col, uMist, 0.35 * exp(-below / 4.0));

  // slow ripple bands that stretch out toward the horizon
  float band = noise(vec2(p.x * 0.0035 + uTime * 0.015, p.y * (0.05 + 0.1 * t) - uTime * 0.22));
  col *= 0.97 + 0.06 * band;

  // the name, mirrored about the water line and broken up by the ripples
  float k = 0.8 + 4.2 * t;
  float dx = (sin(p.y * 0.17 - uTime * 1.15) * 0.6 + sin(p.y * 0.055 + p.x * 0.003 + uTime * 0.5) * 0.8) * k;
  float dy = sin(p.y * 0.32 - uTime * 1.4) * 0.35 * k;
  vec2 q = vec2(p.x + dx, 2.0 * HORIZON - p.y + dy);
  vec2 uv = (q - uNameRect.xy) / uNameRect.zw;
  if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
    float a = texture2D(uName, uv).a * uNameAlpha * (1.0 - 0.55 * t);
    col = mix(col, mix(col, uInk, 0.7), a);
  }

  // glitter path under the sun or moon
  float spread = 24.0 + 160.0 * t;
  float path = exp(-abs(p.x - uSunPos.x) / spread);
  float sparkle = smoothstep(0.72, 0.95, noise(vec2(p.x * 0.045, p.y * 0.5 - uTime * 0.6)));
  col = mix(col, uGlint, path * sparkle * (0.55 - 0.3 * t));

  // stray glints across the lake
  float g = smoothstep(0.86, 0.97, noise(vec2(p.x * 0.006 + uTime * 0.03, p.y * 0.22 - uTime * 0.05)))
          * smoothstep(0.5, 0.8, noise(vec2(p.x * 0.02 - uTime * 0.02, p.y * 0.05)));
  col = mix(col, uGlint, g * 0.22 * (1.0 - 0.7 * t));
  return col;
}

float rockRadius(float a, float s) {
  return 1.0 + 0.07 * sin(3.0 * a + s) + 0.035 * sin(7.0 * a + s * 2.0) + 0.018 * sin(13.0 * a + s * 3.0);
}

vec3 rocks(vec2 p, vec3 col, float aa) {
  // light from the upper right, where the sun is
  vec2 L = normalize(vec2(0.45, -0.9));
  for (int i = 0; i < ${N_ROCKS}; i++) {
    vec4 r = uRock[i];
    vec2 c = r.xy + uRockOffset;
    vec2 local = (p - c) / r.zw;
    float dl = length(local);
    // contact shadow on the water around each rock
    col *= 1.0 - 0.18 * exp(-max(dl - 1.0, 0.0) * 5.0) * step(HORIZON, p.y);
    float rad = rockRadius(atan(local.y, local.x), uRockSeed[i]);
    float edge = (dl - rad) * min(r.z, r.w);
    float inside = 1.0 - smoothstep(-aa, aa, edge);
    if (inside > 0.0) {
      vec2 n = local / max(rad, 0.001);
      float lit = clamp(0.5 + 0.55 * dot(n, L), 0.0, 1.0);
      vec3 stone = mix(uRockDark, uRockLight, smoothstep(0.15, 0.95, lit));
      float moss = smoothstep(-0.25, -0.8, n.y) * smoothstep(0.35, 0.75, noise(p * 0.03 + uRockSeed[i] * 7.0));
      stone = mix(stone, uRockMoss, moss * 0.55);
      stone *= 0.93 + 0.1 * noise(p * 0.22);
      stone *= 1.0 - 0.25 * smoothstep(0.6, 1.0, dl / rad) * step(0.0, n.y);
      col = mix(col, stone, inside);
    }
  }
  return col;
}

void main() {
  vec2 p = uOrigin + vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
  float aa = 0.9 / uScale;
  float shore = shoreY(p.x);
  // blend land into water over a couple of pixels instead of a hard cut
  float w = smoothstep(shore - aa * 1.5, shore + aa * 1.5, p.y);
  vec3 col = w <= 0.0 ? sky(p, aa) : w >= 1.0 ? water(p, aa, shore) : mix(sky(p, aa), water(p, aa, shore), w);
  col = rocks(p, col, aa);
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;   // dither long gradients
  gl_FragColor = vec4(col, 1.0);
}
`;

export type FrameState = {
  time: number;
  scale: number; // canvas pixels per world unit
  originX: number;
  originY: number;
  night: number;
  palette: Palette;
  ridgeOffsets: { x: number; y: number }[];
  rockOffset: { x: number; y: number };
  sun: { x: number; y: number; r: number };
  nameRect: [number, number, number, number];
  nameAlpha: number;
};

const COLOR_UNIFORMS = {
  uSkyTop: "skyTop", uSkyLow: "skyLow", uSun: "sun", uGlow: "glow", uMist: "mist", uWaterTop: "waterTop", uWaterLow: "waterLow",
  uGlint: "glint", uRockLight: "rockLight", uRockDark: "rockDark", uRockMoss: "rockMoss", uInk: "ink",
} as const;

export class HeroRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer | null;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private nameTex: WebGLTexture | null;
  width = 0;
  height = 0;

  static create(canvas: HTMLCanvasElement): HeroRenderer | null {
    try {
      const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" });
      if (!gl || gl.isContextLost()) return null;
      return new HeroRenderer(gl);
    } catch (err) {
      console.warn("[hero] WebGL unavailable, using the static scene", err);
      return null;
    }
  }

  private constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link error");
    this.program = prog;
    gl.useProgram(prog);

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const names = ["uRes", "uScale", "uOrigin", "uTime", "uSunPos", "uNight", "uName", "uNameRect", "uNameAlpha", "uAmp", "uFreq", "uPhase", "uMisc", "uRidge", "uRock", "uRockSeed", "uRockOffset", ...Object.keys(COLOR_UNIFORMS)];
    for (const n of names) this.loc[n] = gl.getUniformLocation(prog, n);

    // shapes never change; upload once
    gl.uniform4fv(this.loc.uAmp, RIDGES.flatMap((r) => r.amp));
    gl.uniform4fv(this.loc.uFreq, RIDGES.flatMap((r) => r.freq));
    gl.uniform4fv(this.loc.uPhase, RIDGES.flatMap((r) => r.phase));
    gl.uniform4fv(this.loc.uRock, ROCKS.flatMap((r) => [r.x, r.y, r.rx, r.ry]));
    gl.uniform1fv(this.loc.uRockSeed, ROCKS.map((r) => r.seed));

    this.nameTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.nameTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.uniform1i(this.loc.uName, 0);
  }

  get lost() {
    return this.gl.isContextLost();
  }

  resize(width: number, height: number) {
    const c = this.gl.canvas as HTMLCanvasElement;
    if (c.width !== width || c.height !== height) {
      c.width = width;
      c.height = height;
    }
    this.width = width;
    this.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  /** Uploads the low-resolution name drawing used for the reflection. */
  setName(source: HTMLCanvasElement) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.nameTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }

  render(s: FrameState) {
    const gl = this.gl, l = this.loc, p = s.palette;
    gl.uniform2f(l.uRes, this.width, this.height);
    gl.uniform1f(l.uScale, s.scale);
    gl.uniform2f(l.uOrigin, s.originX, s.originY);
    gl.uniform1f(l.uTime, s.time);
    gl.uniform1f(l.uNight, s.night);
    for (const [u, k] of Object.entries(COLOR_UNIFORMS)) gl.uniform3fv(l[u], p[k]);
    gl.uniform3fv(l.uRidge, p.ridges.flat());
    gl.uniform4fv(l.uMisc, RIDGES.flatMap((r, i) => [r.base, r.bowl, s.ridgeOffsets[i].x, s.ridgeOffsets[i].y]));
    gl.uniform2f(l.uRockOffset, s.rockOffset.x, s.rockOffset.y);
    gl.uniform3f(l.uSunPos, s.sun.x, s.sun.y, s.sun.r);
    gl.uniform4fv(l.uNameRect, s.nameRect);
    gl.uniform1f(l.uNameAlpha, s.nameAlpha);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Frees GPU resources but keeps the context alive, so the same canvas can be reused when the page comes back. */
  dispose() {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    gl.deleteTexture(this.nameTex);
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
  }
}
