import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // "/" shows the English home directly (its canonical is /en): a redirect cost visitors who
  // open the bare link, the one shared most, an extra round trip (~1 s on a phone).
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/en" }] };
  },
  images: {
    // Menu photos uploaded in the admin live in Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default withPayload(nextConfig);
