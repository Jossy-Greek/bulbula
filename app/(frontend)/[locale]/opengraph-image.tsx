import { getContent, isLocale } from "@/data/content";
import { getListings } from "@/lib/directory";
import { OG_SIZE, ogCard } from "@/lib/og";
import { brand } from "@/lib/seo";

/** The card shown when the site (or any page without its own card) is shared. */
export const alt = "Bulbula Directory: every business in Bole Bulbula, Addis Ababa";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "en";
  const c = getContent(locale);
  const count = (await getListings(locale)).length;
  return ogCard({
    pill: c.hero.eyebrow,
    title: c.hero.title,
    lines: [locale === "am" ? `${count} ${c.hero.stats.businesses}` : `${count} places · phone numbers, hours and directions`],
    footer: brand(locale),
  });
}
