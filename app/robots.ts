import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bulbula-directory.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    // Not "/e": robots rules match by prefix, so that blocked every /en page. The /e
    // endpoint only takes POSTs, which crawlers never send.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
