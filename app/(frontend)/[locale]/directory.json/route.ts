import { isLocale, locales } from "@/data/content";
import { services } from "@/data/services";
import { getCategories, getListings, getSiteSettings } from "@/lib/directory";

/**
 * The whole directory in one file, for the mobile apps: /en/directory.json, /am/directory.json.
 * Same listings, order and switches as the website. Static, refreshed by admin edits
 * (lib/revalidate.ts) and once a day as a fallback.
 */
export const dynamic = "force-static";
// Admin edits refresh this at once (lib/revalidate.ts); the daily refresh is only a fallback,
// kept long so the database (billed while awake) can sleep between edits.
export const revalidate = 86400;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  const [listings, { showMenus, android }] = await Promise.all([getListings(locale), getSiteSettings()]);
  const categories = (await getCategories(locale, listings)).filter((c) => c.count > 0);
  return Response.json({
    version: 1,
    categories,
    // Labels for the service keys a listing can have ("dineIn" → "Dine-in").
    services: Object.fromEntries(Object.entries(services).map(([key, label]) => [key, label[locale]])),
    listings: showMenus ? listings : listings.map((l) => ({ ...l, menu: [] })),
    // The latest Android release (admin → Site settings), so older APKs offer an update.
    ...(android && { app: { android } }),
  });
}
