import { isLocale } from "@/data/content";
import { site } from "@/data/site";
import { getListing } from "@/lib/directory";
import { OG_SIZE, ogCard } from "@/lib/og";
import { brand, placeLine } from "@/lib/seo";

/** A place's own card: what people see when a listing is shared on Telegram or WhatsApp. */
export const alt = "A place in Bole Bulbula on Bulbula Directory";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : "en";
  const l = await getListing(slug, locale);
  const area = locale === "am" ? site.areaAm : site.areaEn;
  if (!l) return ogCard({ pill: area, title: brand(locale), lines: [], footer: brand(locale) });
  const where = l.landmark ?? l.address;
  return ogCard({
    pill: l.category.name,
    title: l.name,
    lines: [placeLine(where, locale), ...(l.phone ? [l.phone] : [])],
    footer: brand(locale),
  });
}
