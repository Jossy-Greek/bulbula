import type { MetadataRoute } from "next";
import { locales } from "@/data/content";
import { getListings } from "@/lib/directory";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bulbula-directory.vercel.app";

// Rebuilt at most hourly; new listings appear in it without a deploy.
export const revalidate = 3600;

/** Every page in both languages, so search engines can find each place. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getListings("en");
  const alternates = (path: string) => ({ languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}${path}`])) });
  const pages = ["", "/businesses", "/add", "/about"];
  return [
    ...pages.flatMap((p) => locales.map((l) => ({ url: `${site}/${l}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7, alternates: alternates(p) }))),
    ...listings.flatMap((b) =>
      locales.map((l) => ({ url: `${site}/${l}/b/${b.slug}`, changeFrequency: "weekly" as const, priority: b.unconfirmed ? 0.4 : 0.6, alternates: alternates(`/b/${b.slug}`) })),
    ),
  ];
}
