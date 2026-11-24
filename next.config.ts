import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // "/" shows the English home directly (its canonical is /en): a redirect cost visitors who
  // open the bare link, the one shared most, an extra round trip (~1 s on a phone).
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/en" }] };
  },
  // "Add your business" can carry a photo; the browser shrinks it first, so this is headroom
  // (Vercel's own request limit is 4.5 MB).
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  images: {
    // Photos live in Cloudflare R2 (R2_PUBLIC_URL, see payload.config.ts); the first ones went to Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      ...(process.env.R2_PUBLIC_URL ? [{ protocol: "https" as const, hostname: new URL(process.env.R2_PUBLIC_URL).hostname }] : []),
    ],
  },
};

export default withPayload(nextConfig);
