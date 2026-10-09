import { RIDGES, WORLD } from "./scene";

/*
 * One full-screen fragment shader draws the whole lake: sky, sun/moon, four caldera ridges, mist,
 * then below the water line the same scene mirrored with ripples, glints and the shore. Everything is
 * procedural, so it stays sharp at any size and costs one draw call per frame.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

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
uniform vec4 uMisc[4];   // base, bowl, offsetX, offsetY
uniform vec3 uRidge[4];
uniform vec3 uSkyTop, uSkyLow, uSun, uGlow, uMist, uLakeTop, uLakeLow, uGlint, uShore, uInk;
uniform vec3 uSunPos;    // x, y, radius in world units
uniform float uNight;
uniform sampler2D uName;
uniform vec4 uNameRect;  // world x, y, w, h of the name texture
uniform float uNameAlpha;

const float TAU = 6.2831853;
const float W = ${WORLD.w.toFixed(1)};
const float HORIZON = ${WORLD.horizon.toFixed(1)};
const float SHORE = ${WORLD.shore.toFixed(1)};

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

vec3 scene(vec2 p, float aa) {
  float t = clamp(p.y / HORIZON, 0.0, 1.0);
  vec3 col = mix(uSkyTop, uSkyLow, t * t * (3.0 - 2.0 * t));

  // stars, night only, twinkling slowly
  vec2 cell = floor(p / 3.2);
  float h = hash(cell);
  col += step(0.9982, h) * uNight * (1.0 - t) * (0.55 + 0.45 * sin(uTime * 1.3 + h * 80.0));

  // sun or moon with its glow
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
    // a touch of shading under each ridge line gives the hills some volume
    vec3 shade = uRidge[i] * (1.0 - 0.07 * clamp((p.y - y) / 140.0, 0.0, 1.0));
    col = mix(col, shade, a);
    if (i == 1) {
      float band = exp(-pow((p.y - (552.0 + uMisc[1].w)) / 24.0, 2.0));
      col = mix(col, uMist, 0.5 * band * (0.7 + 0.3 * sin(p.x * 0.004 + uTime * 0.12)));
    }
  }
  return col;
}

void main() {
  vec2 p = uOrigin + vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
  float aa = 0.9 / uScale;
  vec3 col;

  if (p.y < HORIZON) {
    col = scene(p, aa);
  } else {
    float t = (p.y - HORIZON) / (${WORLD.h.toFixed(1)} - HORIZON);
    // long, slow swells; the ripple grows with distance from the water line like real perspective
    float k = 0.35 + 5.5 * t;
    float dx = (sin(p.y * 0.16 - uTime * 1.1) * 0.6 + sin(p.y * 0.05 + p.x * 0.004 + uTime * 0.55) * 0.9) * k;
    float dy = sin(p.y * 0.3 - uTime * 1.4) * 0.25 * k;
    vec2 q = vec2(p.x + dx, 2.0 * HORIZON - p.y + dy);
    vec3 refl = scene(q, aa * 2.0);

    vec2 uv = (q - uNameRect.xy) / uNameRect.zw;
    if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
      refl = mix(refl, uInk, texture2D(uName, uv).a * uNameAlpha);
    }

    vec3 water = mix(uLakeTop, uLakeLow, clamp(t, 0.0, 1.0));
    col = mix(water, refl, 0.6 - 0.3 * clamp(t, 0.0, 1.0));
    col = mix(col, uMist, 0.28 * exp(-(p.y - HORIZON) / 5.0));

    float n = noise(vec2(p.x * 0.006 + uTime * 0.03, p.y * 0.22 - uTime * 0.05));
    float n2 = noise(vec2(p.x * 0.02 - uTime * 0.02, p.y * 0.05));
    float streak = smoothstep(0.84, 0.96, n) * smoothstep(0.45, 0.8, n2) * smoothstep(0.0, 0.05, t) * (1.0 - 0.8 * clamp(t, 0.0, 1.0));
    col = mix(col, uGlint, streak * 0.3);

    float sy = SHORE + sin(p.x * 0.0042 + 0.6) * 12.0 + sin(p.x * 0.011 + 2.1) * 5.0;
    col = mix(col, uShore, smoothstep(sy - aa, sy + aa, p.y));
  }

  // dither to hide banding in the long gradients
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

export type Vec3 = [number, number, number];

export type FrameState = {
  time: number;
  scale: number; // canvas pixels per world unit
  originX: number;
  originY: number;
  night: number;
  palette: {
    skyTop: Vec3; skyLow: Vec3; sun: Vec3; glow: Vec3; ridges: Vec3[]; mist: Vec3;
    lakeTop: Vec3; lakeLow: Vec3; glint: Vec3; shore: Vec3; ink: Vec3;
  };
  ridgeOffsets: { x: number; y: number }[];
  sun: { x: number; y: number; r: number };
  nameRect: [number, number, number, number];
  nameAlpha: number;
};

export class HeroRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private nameTex: WebGLTexture | null;
  width = 0;
  height = 0;

  static create(canvas: HTMLCanvasElement): HeroRenderer | null {
    try {
      const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
      return gl ? new HeroRenderer(gl) : null;
    } catch {
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

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    for (const n of ["uRes", "uScale", "uOrigin", "uTime", "uSkyTop", "uSkyLow", "uSun", "uGlow", "uMist", "uLakeTop", "uLakeLow", "uGlint", "uShore", "uInk", "uSunPos", "uNight", "uName", "uNameRect", "uNameAlpha", "uAmp", "uFreq", "uPhase", "uMisc", "uRidge"])
      this.loc[n] = gl.getUniformLocation(prog, n);

    // ridge shapes never change; upload once
    gl.uniform4fv(this.loc.uAmp, RIDGES.flatMap((r) => r.amp));
    gl.uniform4fv(this.loc.uFreq, RIDGES.flatMap((r) => r.freq));
    gl.uniform4fv(this.loc.uPhase, RIDGES.flatMap((r) => r.phase));

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
    gl.uniform3fv(l.uSkyTop, p.skyTop);
    gl.uniform3fv(l.uSkyLow, p.skyLow);
    gl.uniform3fv(l.uSun, p.sun);
    gl.uniform3fv(l.uGlow, p.glow);
    gl.uniform3fv(l.uMist, p.mist);
    gl.uniform3fv(l.uLakeTop, p.lakeTop);
    gl.uniform3fv(l.uLakeLow, p.lakeLow);
    gl.uniform3fv(l.uGlint, p.glint);
    gl.uniform3fv(l.uShore, p.shore);
    gl.uniform3fv(l.uInk, p.ink);
    gl.uniform3fv(l.uRidge, p.ridges.flat());
    gl.uniform4fv(l.uMisc, RIDGES.flatMap((r, i) => [r.base, r.bowl, s.ridgeOffsets[i].x, s.ridgeOffsets[i].y]));
    gl.uniform3f(l.uSunPos, s.sun.x, s.sun.y, s.sun.r);
    gl.uniform4fv(l.uNameRect, s.nameRect);
    gl.uniform1f(l.uNameAlpha, s.nameAlpha);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteTexture(this.nameTex);
    gl.deleteProgram(this.program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
