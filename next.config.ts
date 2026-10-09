import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Sanity's CDN resizes and converts images itself; /_next/image isn't reachable behind the Vercel services router.
    loader: "custom",
    loaderFile: "./src/lib/sanity/image-loader.ts",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
