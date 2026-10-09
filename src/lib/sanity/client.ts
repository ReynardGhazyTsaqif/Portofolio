import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImage } from "./types";

// The dataset is public and read-only from the site, so the project ID can live in code as a fallback.
export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "yapgdhy0",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
};

export const sanity = createClient({ ...sanityConfig, useCdn: true, perspective: "published" });

const builder = createImageUrlBuilder(sanityConfig);

/** Image URL with automatic format; returns "" for images without an asset. */
export function imageUrl(image: SanityImage | null | undefined, width: number): string {
  if (!image?.asset?._ref) return "";
  return builder.image(image).width(width).fit("max").auto("format").url();
}

/** Intrinsic size from the asset id ("image-<hash>-1600x900-png"), for next/image width/height. */
export function imageSize(image: SanityImage | null | undefined): { width: number; height: number } | null {
  const m = image?.asset?._ref?.match(/-(\d+)x(\d+)-/);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}
