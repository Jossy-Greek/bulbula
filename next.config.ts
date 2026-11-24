import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

/** Sent with every page and API response. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // "Near me" asks for location; nothing uses the camera, microphone or payments.
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
];

const nextConfig: NextConfig = {
  // No "X-Powered-By: Next.js, Payload" (withPayload adds it unless this is false).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
