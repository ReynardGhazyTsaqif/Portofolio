/*
 * k-means colour clustering, small enough to run on the main thread for a ~25k pixel thumbnail.
 * Seeded k-means++ initialisation keeps results stable between runs of the same image.
 */

export type Cluster = { rgb: [number, number, number]; hex: string; share: number };
export type KMeansResult = { clusters: Cluster[]; iterations: number; pixels: number; ms: number; assign: Uint8Array };

function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

const toHex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/** Clusters RGBA pixel data (alpha ignored) into k colours. */
export function kmeans(data: Uint8ClampedArray, k: number, maxIter = 24): KMeansResult {
  const t0 = performance.now();
  const n = data.length / 4;
  const px = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    px[i * 3] = data[i * 4];
    px[i * 3 + 1] = data[i * 4 + 1];
    px[i * 3 + 2] = data[i * 4 + 2];
  }
  const dist = (i: number, c: Float32Array, j: number) => {
    const dr = px[i * 3] - c[j * 3], dg = px[i * 3 + 1] - c[j * 3 + 1], db = px[i * 3 + 2] - c[j * 3 + 2];
    return dr * dr + dg * dg + db * db;
  };

  // k-means++: each new centre is picked with probability proportional to its squared distance.
  const random = rng(1234567 + k);
  const centres = new Float32Array(k * 3);
  const first = Math.floor(random() * n);
  centres.set(px.subarray(first * 3, first * 3 + 3), 0);
  const nearest = new Float32Array(n).fill(Infinity);
  for (let c = 1; c < k; c++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      nearest[i] = Math.min(nearest[i], dist(i, centres, c - 1));
      sum += nearest[i];
    }
    let target = random() * sum, pick = 0;
    for (let i = 0; i < n; i++) {
      target -= nearest[i];
      if (target <= 0) { pick = i; break; }
    }
    centres.set(px.subarray(pick * 3, pick * 3 + 3), c * 3);
  }

  const assign = new Uint8Array(n);
  const sums = new Float64Array(k * 3);
  const counts = new Uint32Array(k);
  let iterations = 0;
  for (; iterations < maxIter; iterations++) {
    sums.fill(0);
    counts.fill(0);
    for (let i = 0; i < n; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = dist(i, centres, c);
        if (d < bestD) { bestD = d; best = c; }
      }
      assign[i] = best;
      counts[best]++;
      sums[best * 3] += px[i * 3];
      sums[best * 3 + 1] += px[i * 3 + 1];
      sums[best * 3 + 2] += px[i * 3 + 2];
    }
    let moved = 0;
    for (let c = 0; c < k; c++) {
      if (!counts[c]) continue;
      for (let ch = 0; ch < 3; ch++) {
        const v = sums[c * 3 + ch] / counts[c];
        moved = Math.max(moved, Math.abs(v - centres[c * 3 + ch]));
        centres[c * 3 + ch] = v;
      }
    }
    if (moved < 0.5) { iterations++; break; }
  }

  const clusters: Cluster[] = [];
  for (let c = 0; c < k; c++) {
    if (!counts[c]) continue;
    const rgb = [centres[c * 3], centres[c * 3 + 1], centres[c * 3 + 2]] as [number, number, number];
    clusters.push({ rgb, hex: toHex(rgb), share: counts[c] / n });
  }
  // Order the palette from largest share to smallest, and remap assignments to match.
  const order = clusters.map((_, i) => i).sort((a, b) => clusters[b].share - clusters[a].share);
  const remap = new Uint8Array(k);
  order.forEach((from, to) => (remap[from] = to));
  for (let i = 0; i < n; i++) assign[i] = remap[assign[i]];
  return { clusters: order.map((i) => clusters[i]), iterations, pixels: n, ms: Math.round(performance.now() - t0), assign };
}
