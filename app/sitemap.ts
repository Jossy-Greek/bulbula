import type { MetadataRoute } from "next";
import { locales } from "@/data/content";
import { getCategories, getListings } from "@/lib/directory";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bulbula-directory.vercel.app";

// Rebuilt at most hourly; new listings appear in it without a deploy.
export const revalidate = 3600;

/** Every page in both languages, so search engines can find each place. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getListings("en");
  const categories = (await getCategories("en", listings)).filter((x) => x.count > 0);
  const alternates = (path: string) => ({ languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}${path}`])) });
  const pages = ["", "/businesses", "/add", "/about", "/privacy", "/terms"];
  return [
    ...pages.flatMap((p) => locales.map((l) => ({ url: `${site}/${l}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7, alternates: alternates(p) }))),
    ...categories.flatMap((x) =>
      locales.map((l) => ({ url: `${site}/${l}/businesses/${x.slug}`, changeFrequency: "daily" as const, priority: 0.8, alternates: alternates(`/businesses/${x.slug}`) })),
    ),
    ...listings.flatMap((b) =>
      locales.map((l) => ({ url: `${site}/${l}/b/${b.slug}`, changeFrequency: "weekly" as const, priority: b.unconfirmed ? 0.4 : 0.6, alternates: alternates(`/b/${b.slug}`) })),
    ),
  ];
}
