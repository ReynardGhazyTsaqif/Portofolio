"use client";

/**
 * next/image loader that sizes Sanity images on Sanity's own CDN (width, quality, best format) instead
 * of going through /_next/image. Local files are served as they are.
 */
export default function sanityLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (!src.startsWith("https://cdn.sanity.io/")) return src;
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("fit", "max");
  url.searchParams.set("auto", "format");
  return url.toString();
}
