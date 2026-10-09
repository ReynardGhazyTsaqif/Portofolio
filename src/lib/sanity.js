import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || "production";

export const isSanityConfigured = Boolean(projectId);

// Selama masa transisi, data lama di src/data/ dipakai jika Sanity gagal.
// Set VITE_SANITY_FALLBACK=false setelah Sanity terbukti berjalan.
export const useFallback = import.meta.env.VITE_SANITY_FALLBACK !== "false";

export const client = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2025-01-01",
      useCdn: true, // dataset publik, read-only; perubahan muncul beberapa detik setelah publish
    })
  : null;

const builder = client ? createImageUrlBuilder(client) : null;

export function urlFor(source) {
  return builder.image(source).auto("format");
}

// Satu request per query, dibagi oleh semua komponen yang memakainya.
const cache = new Map();

export function fetchCached(query) {
  if (!client) {
    return Promise.reject(
      new Error("Sanity belum dikonfigurasi (VITE_SANITY_PROJECT_ID kosong)."),
    );
  }
  if (!cache.has(query)) {
    cache.set(
      query,
      client.fetch(query).catch((err) => {
        cache.delete(query);
        throw err;
      }),
    );
  }
  return cache.get(query);
}
