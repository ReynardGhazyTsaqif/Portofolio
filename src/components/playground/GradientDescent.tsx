"use client";

import { useEffect, useRef, useState } from "react";
import { rng } from "./kmeans";
import { context2d, gaussian, pointerFraction, readPalette, useCanvas } from "./canvas";

type Labels = {
  degree: string; rate: string; train: string; pause: string; reset: string; sample: string; clear: string;
  hint: string; stats: string; converged: string; diverged: string; needPoints: string; loss: string; canvas: string;
};
type Point = { x: number; y: number }; // 0..1, y measured from the bottom
type Status = "running" | "paused" | "converged" | "diverged";

const RATES = [0.01, 0.05, 0.1, 0.3, 0.8];
const STEPS_PER_FRAME = 20;
const MAX_EPOCHS = 30000;
const HISTORY = 240;

function sampleData(): Point[] {
  const random = rng(77);
  return Array.from({ length: 16 }, (_, i) => {
    const x = 0.06 + (i / 15) * 0.88 + gaussian(random) * 0.012;
    return { x, y: Math.min(0.95, Math.max(0.05, 0.5 + 0.28 * Math.sin(x * 5.2 - 1.1) + gaussian(random) * 0.05)) };
  });
}

/** Model works in -1..1 on both axes so every power of x stays bounded. */
const toModel = (v: number) => v * 2 - 1;
function predict(w: number[], x: number) {
  let y = 0, pw = 1;
  for (const wj of w) {
    y += wj * pw;
    pw *= x;
  }
  return y;
}

/** One full-batch gradient step on mean squared error; returns the loss before the step. */
function step(points: Point[], w: number[], lr: number) {
  const grad = new Array(w.length).fill(0);
  let loss = 0;
  for (const p of points) {
    const x = toModel(p.x);
    const err = predict(w, x) - toModel(p.y);
    loss += err * err;
    let pw = 1;
    for (let j = 0; j < w.length; j++) {
      grad[j] += err * pw;
      pw *= x;
    }
  }
  for (let j = 0; j < w.length; j++) w[j] -= (lr * 2 * grad[j]) / points.length;
  return loss / points.length;
}

const fmt = (v: number) => (Math.abs(v) < 0.005 ? "0.00" : v.toFixed(2));
function equation(w: number[]) {
  return w
    .map((v, j) => ({ v, term: j === 0 ? "" : j === 1 ? "x" : `x${"⁰¹²³⁴⁵"[j]}` }))
    .reverse()
    .map(({ v, term }, i) => `${i === 0 ? (v < 0 ? "−" : "") : v < 0 ? " − " : " + "}${fmt(Math.abs(v))}${term}`)
    .join("");
}

/** Click to drop points; a polynomial fits itself to them one gradient step at a time. */
export function GradientDescent({ labels, lang }: { labels: Labels; lang: string }) {
  const [points, setPoints] = useState<Point[]>(sampleData);
  const [degree, setDegree] = useState(3);
  const [rate, setRate] = useState(2);
  const [status, setStatus] = useState<Status>("paused");
  const [stat, setStat] = useState({ epoch: 0, loss: NaN, w: [] as number[] });
  const [history, setHistory] = useState<number[]>([]);
  const weights = useRef<number[]>(new Array(4).fill(0));
  const epoch = useRef(0);
  const visible = useRef(false);
  const { ref, size, theme } = useCanvas();

  function reset(nextDegree = degree) {
    weights.current = new Array(nextDegree + 1).fill(0);
    epoch.current = 0;
    setStat({ epoch: 0, loss: NaN, w: [] });
    setHistory([]);
  }

  // Start training the first time the experiment scrolls into view, and pause while it's off-screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (entry.isIntersecting && epoch.current === 0) setStatus((s) => (s === "paused" ? "running" : s));
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  useEffect(() => {
    if (status !== "running") return;
    const lr = RATES[rate];
    let raf = 0;
    const tick = () => {
      if (points.length < 2) return setStatus("paused");
      raf = requestAnimationFrame(tick);
      if (!visible.current) return;
      const w = weights.current;
      let loss = 0;
      const before = epoch.current ? step(points, w.slice(), lr) : Infinity;
      for (let s = 0; s < STEPS_PER_FRAME; s++) loss = step(points, w, lr);
      epoch.current += STEPS_PER_FRAME;
      setStat({ epoch: epoch.current, loss, w: w.slice() });
      setHistory((h) => [...h.slice(-(HISTORY - 1)), loss]);
      if (!Number.isFinite(loss) || loss > 1e4) {
        cancelAnimationFrame(raf);
        setStatus("diverged");
      } else if ((before - loss) / loss < 1e-6 || epoch.current >= MAX_EPOCHS) {
        cancelAnimationFrame(raf);
        setStatus("converged");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, points, rate]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !size.w) return;
    const ctx = context2d(canvas, size.w);
    const pal = readPalette();
    const X = (x: number) => x * size.w, Y = (y: number) => (1 - y) * size.h;
    const w = stat.w;
    const curve = (x: number) => (predict(w, toModel(x)) + 1) / 2;

    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(X(i / 4), 0);
      ctx.lineTo(X(i / 4), size.h);
      ctx.moveTo(0, Y(i / 4));
      ctx.lineTo(size.w, Y(i / 4));
      ctx.stroke();
    }

    const fitted = stat.epoch > 0 && status !== "diverged";
    if (fitted) {
      ctx.strokeStyle = pal.muted;
      ctx.setLineDash([2, 3]);
      for (const p of points) {
        ctx.beginPath();
        ctx.moveTo(X(p.x), Y(p.y));
        ctx.lineTo(X(p.x), Y(curve(p.x)));
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, size.w, size.h);
      ctx.clip();
      ctx.strokeStyle = pal.moss;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const x = i / 160;
        const y = Math.max(-2, Math.min(3, curve(x)));
        if (i) ctx.lineTo(X(x), Y(y));
        else ctx.moveTo(X(x), Y(y));
      }
      ctx.stroke();
      ctx.restore();
    }

    for (const p of points) {
      ctx.beginPath();
      ctx.arc(X(p.x), Y(p.y), 5, 0, Math.PI * 2);
      ctx.fillStyle = pal.ink;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = pal.surface;
      ctx.stroke();
    }
  }, [points, stat, status, size, theme, ref]);

  const nf = new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US");
  const statsLine = labels.stats.replace("{epoch}", nf.format(stat.epoch)).replace("{loss}", Number.isFinite(stat.loss) ? stat.loss.toFixed(4) : "—");
  const note =
    points.length < 2 ? labels.needPoints : status === "diverged" ? labels.diverged : status === "converged" ? labels.converged : labels.hint;

  // Loss sparkline on a log scale, so the long tail of small improvements stays visible.
  const logs = history.filter(Number.isFinite).map((v) => Math.log10(Math.max(v, 1e-6)));
  const lo = Math.min(...logs), hi = Math.max(...logs);
  const spark = logs.map((v, i) => `${(i / Math.max(1, logs.length - 1)) * 100},${hi === lo ? 15 : 28 - ((v - lo) / (hi - lo)) * 26}`).join(" ");

  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-[14px] font-semibold tabular-nums transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`;

  return (
    <div className="mt-[clamp(32px,4vw,56px)] grid gap-6 rounded-2xl border border-line bg-surface p-[clamp(18px,3vw,40px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-[13px] font-semibold text-muted">{labels.degree}</p>
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={degree === d}
                  className={chip(degree === d)}
                  onClick={() => {
                    setDegree(d);
                    reset(d);
                    setStatus("running");
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-muted">{labels.rate}</p>
            <div className="mt-2 flex gap-1.5">
              {RATES.map((r, i) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={rate === i}
                  className={chip(rate === i)}
                  onClick={() => {
                    setRate(i);
                    if (status === "diverged") reset();
                    setStatus("running");
                  }}
                >
                  {nf.format(r)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (status === "running") return setStatus("paused");
              if (status === "diverged") reset();
              setStatus("running");
            }}
            className="rounded-md border border-ink bg-ink px-3.5 py-1.5 text-[14px] font-semibold text-paper transition-opacity hover:opacity-85"
          >
            {status === "running" ? labels.pause : labels.train}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setStatus("paused");
            }}
            className="rounded-md border border-ink px-3.5 py-1.5 text-[14px] font-semibold transition-colors hover:bg-ink hover:text-paper"
          >
            {labels.reset}
          </button>
          <button
            type="button"
            onClick={() => {
              setPoints(sampleData());
              reset();
              setStatus("running");
            }}
            className="rounded-md border border-line px-3.5 py-1.5 text-[14px] font-semibold transition-colors hover:border-ink"
          >
            {labels.sample}
          </button>
          <button
            type="button"
            onClick={() => {
              setPoints([]);
              reset();
              setStatus("paused");
            }}
            className="rounded-md border border-line px-3.5 py-1.5 text-[14px] font-semibold transition-colors hover:border-ink"
          >
            {labels.clear}
          </button>
        </div>
      </div>

      <canvas
        ref={ref}
        aria-label={labels.canvas}
        className="aspect-[4/3] w-full cursor-crosshair touch-none rounded-lg border border-line bg-paper md:aspect-[16/8]"
        onPointerDown={(e) => {
          const p = pointerFraction(e);
          setPoints((ps) => [...ps, { x: p.x, y: 1 - p.y }]);
          if (status === "diverged") reset();
          setStatus("running");
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <div className="grid gap-1">
          <p className="font-mono text-[14px] tabular-nums">
            ŷ = {stat.epoch > 0 && status !== "diverged" ? equation(stat.w) : "…"}
          </p>
          <p className="text-[14px] text-muted">{note}</p>
        </div>
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-32 overflow-visible" role="img" aria-label={labels.loss}>
            {logs.length > 1 && <polyline points={spark} fill="none" stroke="var(--moss)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
          </svg>
          <p className="text-[13px] text-muted tabular-nums">{statsLine}</p>
        </div>
      </div>
    </div>
  );
}
