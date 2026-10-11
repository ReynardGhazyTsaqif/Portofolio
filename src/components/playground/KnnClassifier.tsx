"use client";

import { useEffect, useRef, useState } from "react";
import { rng } from "./kmeans";
import { context2d, gaussian, pointerFraction, readPalette, useCanvas } from "./canvas";

type Labels = {
  classes: string[]; addAs: string; k: string; sample: string; clear: string; hint: string; prediction: string; empty: string; canvas: string;
};
type Point = { x: number; y: number; c: number };

const COLORS = { light: ["#4f7f45", "#c06a34", "#3a6c9f"], dark: ["#9dc58c", "#e7a06c", "#82acd8"] };
const CELL = 8; // px per shaded cell of the decision map

/** Three seeded blobs that overlap a little, so small k and large k disagree near the edges. */
function sampleData(): Point[] {
  const random = rng(20240611);
  const centres = [[0.27, 0.32], [0.72, 0.36], [0.5, 0.74]];
  return centres.flatMap(([cx, cy], c) =>
    Array.from({ length: 16 }, () => ({
      x: Math.min(0.98, Math.max(0.02, cx + gaussian(random) * 0.11)),
      y: Math.min(0.98, Math.max(0.02, cy + gaussian(random) * 0.1)),
      c,
    })),
  );
}

/**
 * Majority vote of the k nearest points. `ratio` (width / height) keeps distance round on a non-square canvas.
 * Ties go to whichever tied class owns the closest neighbour.
 */
function classify(points: Point[], x: number, y: number, k: number, ratio: number) {
  const idx: number[] = [], dist: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const dx = (points[i].x - x) * ratio, dy = points[i].y - y;
    const d = dx * dx + dy * dy;
    if (idx.length === k && d >= dist[k - 1]) continue;
    let j = idx.length < k ? idx.length : k - 1;
    while (j > 0 && dist[j - 1] > d) {
      dist[j] = dist[j - 1];
      idx[j] = idx[j - 1];
      j--;
    }
    dist[j] = d;
    idx[j] = i;
  }
  const votes = [0, 0, 0];
  for (const i of idx) votes[points[i].c]++;
  const top = Math.max(...votes);
  const winner = points[idx.find((i) => votes[points[i].c] === top)!].c;
  return { winner, votes: top, neighbours: idx };
}

/** Click to place labelled points; every spot on the canvas is coloured by the class its k nearest points vote for. */
export function KnnClassifier({ labels }: { labels: Labels }) {
  const [points, setPoints] = useState<Point[]>(sampleData);
  const [active, setActive] = useState(0);
  const [k, setK] = useState(5);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const { ref, size, theme } = useCanvas();
  const regions = useRef<HTMLCanvasElement | null>(null);

  const kUsed = Math.min(k, points.length);
  const ratio = size.h ? size.w / size.h : 1;

  // Decision map: rebuilt only when the data, k, size or theme change; hovering just blits it.
  useEffect(() => {
    if (!size.w) return;
    const off = (regions.current ??= document.createElement("canvas"));
    const cols = Math.ceil(size.w / CELL), rows = Math.ceil(size.h / CELL);
    off.width = cols;
    off.height = rows;
    const ctx = off.getContext("2d")!;
    ctx.clearRect(0, 0, cols, rows);
    if (!kUsed) return;
    const colors = readPalette().dark ? COLORS.dark : COLORS.light;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = colors[classify(points, ((c + 0.5) * CELL) / size.w, ((r + 0.5) * CELL) / size.h, kUsed, ratio).winner];
        ctx.fillRect(c, r, 1, 1);
      }
    }
  }, [points, kUsed, size, ratio, theme]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !size.w) return;
    const ctx = context2d(canvas, size.w);
    const pal = readPalette();
    const colors = pal.dark ? COLORS.dark : COLORS.light;

    if (regions.current && kUsed) {
      ctx.globalAlpha = pal.dark ? 0.22 : 0.16;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(regions.current, 0, 0, Math.ceil(size.w / CELL) * CELL, Math.ceil(size.h / CELL) * CELL);
      ctx.globalAlpha = 1;
    }

    if (hover && kUsed) {
      const hx = hover.x * size.w, hy = hover.y * size.h;
      const { winner, neighbours } = classify(points, hover.x, hover.y, kUsed, ratio);
      ctx.strokeStyle = pal.ink;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (const i of neighbours) {
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(points[i].x * size.w, points[i].y * size.h);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(hx, hy, 9, 0, Math.PI * 2);
      ctx.fillStyle = colors[winner];
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = pal.surface;
      ctx.stroke();
    }

    const near = hover && kUsed ? new Set(classify(points, hover.x, hover.y, kUsed, ratio).neighbours) : null;
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x * size.w, p.y * size.h, near?.has(i) ? 6.5 : 5, 0, Math.PI * 2);
      ctx.fillStyle = colors[p.c];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = near?.has(i) ? pal.ink : pal.surface;
      ctx.stroke();
    });
  }, [points, kUsed, hover, size, ratio, theme, ref]);

  const counts = [0, 1, 2].map((c) => points.filter((p) => p.c === c).length);
  const readout = (() => {
    if (!kUsed) return labels.empty;
    if (!hover) return labels.hint;
    const { winner, votes } = classify(points, hover.x, hover.y, kUsed, ratio);
    return labels.prediction.replace("{class}", labels.classes[winner]).replace("{votes}", String(votes)).replace("{k}", String(kUsed));
  })();
  const swatch = COLORS.light;

  return (
    <div className="mt-[clamp(32px,4vw,56px)] grid gap-6 rounded-2xl border border-line bg-surface p-[clamp(18px,3vw,40px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[13px] font-semibold text-muted">{labels.addAs}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {labels.classes.map((name, c) => (
              <button
                key={name}
                type="button"
                onClick={() => setActive(c)}
                aria-pressed={active === c}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[14px] font-semibold transition-colors ${active === c ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
              >
                <span className="size-2.5 rounded-full" style={{ background: swatch[c] }} aria-hidden />
                {name}
                <span className="tabular-nums opacity-60">{counts[c]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="grid gap-2 text-[13px] font-semibold text-muted" htmlFor="knn-k">
            <span>
              {labels.k}: <span className="text-ink tabular-nums">{k}</span>
            </span>
            <input id="knn-k" type="range" min={1} max={15} step={2} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-44 accent-[var(--moss)]" />
          </label>
          <button type="button" onClick={() => setPoints(sampleData())} className="rounded-md border border-ink px-3.5 py-1.5 text-[14px] font-semibold transition-colors hover:bg-ink hover:text-paper">
            {labels.sample}
          </button>
          <button type="button" onClick={() => setPoints([])} className="rounded-md border border-line px-3.5 py-1.5 text-[14px] font-semibold transition-colors hover:border-ink">
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
          setPoints((ps) => [...ps, { ...p, c: active }]);
          setHover(p);
        }}
        onPointerMove={(e) => setHover(pointerFraction(e))}
        onPointerLeave={() => setHover(null)}
      />

      <p className="text-[14px] text-muted tabular-nums">{readout}</p>
    </div>
  );
}
