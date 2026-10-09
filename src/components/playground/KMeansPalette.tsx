"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { kmeans, type KMeansResult } from "./kmeans";

type Labels = {
  samples: string; upload: string; k: string; run: string; original: string; quantized: string; palette: string;
  stats: string; copied: string; copy: string; error: string;
};

const SAMPLES = [
  { src: "/ProjectNeo.png", name: "Neo Telemetri" },
  { src: "/ProjectUcw.png", name: "UNAND Co-Workspace" },
  { src: "/ReyAbout.jpg", name: "Portrait" },
];
const WORK_WIDTH = 180; // pixels clustered; small enough to stay instant

/** Pick or upload an image, cluster its colours with k-means, show the palette and the image rebuilt from it. */
export function KMeansPalette({ labels, lang }: { labels: Labels; lang: string }) {
  const [src, setSrc] = useState(SAMPLES[0].src);
  const [k, setK] = useState(5);
  const [result, setResult] = useState<KMeansResult | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const quant = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const uploaded = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const w = Math.min(WORK_WIDTH, img.naturalWidth);
      const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
      const work = document.createElement("canvas");
      work.width = w;
      work.height = h;
      const ctx = work.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      // let the browser paint the controls before the CPU work
      requestAnimationFrame(() => {
        if (cancelled) return;
        const res = kmeans(data.data, k);
        const out = quant.current;
        if (out) {
          out.width = w;
          out.height = h;
          const q = out.getContext("2d")!;
          const img2 = q.createImageData(w, h);
          for (let i = 0; i < res.assign.length; i++) {
            const c = res.clusters[res.assign[i]].rgb;
            img2.data.set([c[0], c[1], c[2], 255], i * 4);
          }
          q.putImageData(img2, 0, 0);
        }
        setError(false);
        setResult(res);
      });
    };
    img.onerror = () => !cancelled && setError(true);
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, k, run]);

  useEffect(() => () => {
    if (uploaded.current) URL.revokeObjectURL(uploaded.current);
  }, []);

  // Palette segments grow in from the left whenever a new result lands.
  useGSAP(
    () => {
      if (!result || prefersReducedMotion()) return;
      gsap.fromTo("[data-swatch]", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "expo.out", stagger: 0.06, transformOrigin: "left center" });
      gsap.fromTo("[data-hex]", { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.06, delay: 0.2 });
    },
    { scope: bar, dependencies: [result] },
  );

  function onFile(file: File | undefined) {
    if (!file) return;
    if (uploaded.current) URL.revokeObjectURL(uploaded.current);
    uploaded.current = URL.createObjectURL(file);
    setSrc(uploaded.current);
  }

  async function copy(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  const stats = result
    ? labels.stats.replace("{iterations}", String(result.iterations)).replace("{pixels}", new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US").format(result.pixels)).replace("{ms}", String(Math.max(1, result.ms)))
    : "";

  return (
    <div className="mt-[clamp(32px,4vw,56px)] grid gap-8 rounded-2xl border border-line bg-surface p-[clamp(18px,3vw,40px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[13px] font-semibold text-muted">{labels.samples}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.src}
                type="button"
                onClick={() => setSrc(s.src)}
                aria-pressed={src === s.src}
                className={`rounded-full border px-3.5 py-1.5 text-[14px] font-semibold transition-colors ${src === s.src ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
              >
                {s.name}
              </button>
            ))}
            <label className="cursor-pointer rounded-full border border-dashed border-ink px-3.5 py-1.5 text-[14px] font-semibold transition-colors hover:bg-ink hover:text-paper">
              {labels.upload}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
        </div>
        <div className="flex items-end gap-4">
          <label className="grid gap-2 text-[13px] font-semibold text-muted" htmlFor="kmeans-k">
            <span>
              {labels.k}: <span className="text-ink tabular-nums">{k}</span>
            </span>
            <input id="kmeans-k" type="range" min={2} max={8} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-44 accent-[var(--moss)]" />
          </label>
          <button type="button" onClick={() => setRun((r) => r + 1)} className="rounded-md border border-ink px-3.5 py-1.5 text-[14px] font-semibold transition-colors hover:bg-ink hover:text-paper">
            {labels.run}
          </button>
        </div>
      </div>

      {error && <p className="rounded-md border border-line bg-paper px-4 py-3 text-[15px]">{labels.error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- user uploads are blob URLs, which next/image can't serve */}
          <img src={src} alt={labels.original} className="aspect-[4/3] w-full rounded-lg border border-line bg-paper object-cover" />
          <figcaption className="mt-2 text-[13px] font-semibold text-muted">{labels.original}</figcaption>
        </figure>
        <figure>
          <canvas ref={quant} className="aspect-[4/3] w-full rounded-lg border border-line bg-paper object-cover [image-rendering:pixelated]" aria-label={labels.quantized} />
          <figcaption className="mt-2 text-[13px] font-semibold text-muted">{labels.quantized}</figcaption>
        </figure>
      </div>

      <div ref={bar}>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[13px] font-semibold text-muted">{labels.palette}</p>
          <p className="text-[13px] text-muted tabular-nums" aria-live="polite">{stats}</p>
        </div>
        <div className="mt-3 flex h-24 overflow-hidden rounded-lg border border-line">
          {result?.clusters.map((c) => (
            <button
              key={c.hex + c.share}
              type="button"
              data-swatch
              onClick={() => copy(c.hex)}
              style={{ background: c.hex, flexGrow: c.share }}
              className="min-w-6 basis-0 transition-[filter] hover:brightness-110"
              aria-label={`${c.hex}, ${Math.round(c.share * 100)}%`}
            />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px] tabular-nums">
          {result?.clusters.map((c) => (
            <li key={c.hex + c.share} data-hex className="flex items-center gap-2">
              <span className="size-3 rounded-full border border-line" style={{ background: c.hex }} />
              <span className="font-semibold">{copied === c.hex ? labels.copied : c.hex}</span>
              <span className="text-muted">{Math.round(c.share * 100)}%</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-muted">{labels.copy}</p>
      </div>
    </div>
  );
}
