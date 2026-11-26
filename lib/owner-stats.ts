import "server-only";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Numbers for one place's owner, on their private stats page (/[locale]/stats/[key]).
 *
 * Two 30-day windows (this one and the one before) so the page can say whether things
 * are going up. Visits count a person once a day (the daily visitor hash), so refreshing
 * the page doesn't inflate them; taps are counted as they happen.
 */
export type Window = { visits: number; calls: number; directions: number; links: number; shares: number };
export type OwnerStats = { now: Window; before: Window; reviews: number; rating: number | null };

const DAY = 86_400_000;
const empty = (): Window => ({ visits: 0, calls: 0, directions: 0, links: 0, shares: 0 });

/** Which tracked action counts as what (see app/e/route.ts for the full list). */
const KIND: Record<string, keyof Omit<Window, "visits">> = {
  call: "calls",
  directions: "directions",
  maps: "directions",
  website: "links",
  social: "links",
  share: "shares",
  telegram: "shares",
  whatsapp: "shares",
  copy: "shares",
};

/** The listing a stats link points to, or null. Not cached: a replaced link must stop working at once. */
export async function findByStatsKey(key: string, locale: "en" | "am") {
  // Keys are 22 URL-safe characters; anything else can't match, so don't ask the database.
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(key)) return null;
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "businesses",
    where: { and: [{ statsKey: { equals: key } }, { status: { equals: "published" } }] },
    limit: 1,
    depth: 0,
    locale,
    overrideAccess: true,
    select: { slug: true, name: true, createdAt: true, claimed: true, featured: true, featuredUntil: true },
  });
  return res.docs[0] ?? null;
}

/** One small read per place (its events from the last 60 days), refreshed at most every 6 hours. */
export const getOwnerStats = unstable_cache(
  async (id: number, slug: string): Promise<OwnerStats> => {
    const payload = await getPayload({ config });
    const cut = Date.now() - 30 * DAY;
    const [events, reviews] = await Promise.all([
      payload.find({
        collection: "analytics-events",
        where: { and: [{ slug: { equals: slug } }, { createdAt: { greater_than: new Date(Date.now() - 60 * DAY).toISOString() } }] },
        pagination: false,
        depth: 0,
        overrideAccess: true,
        select: { type: true, action: true, visitor: true, createdAt: true },
      }),
      payload.find({
        collection: "reviews",
        where: { and: [{ business: { equals: id } }, { status: { equals: "published" } }] },
        pagination: false,
        depth: 0,
        overrideAccess: true,
        select: { rating: true },
      }),
    ]);

    const now = empty();
    const before = empty();
    const seen = new Set<string>();
    for (const e of events.docs) {
      const at = new Date(e.createdAt).getTime();
      const w = at > cut ? now : before;
      if (e.type === "pageview") {
        // One visit per person per day; the visitor hash already changes daily.
        const v = `${e.createdAt.slice(0, 10)}|${e.visitor ?? Math.random()}`;
        if (seen.has(v)) continue;
        seen.add(v);
        w.visits++;
      } else if (e.type === "action" && e.action && KIND[e.action]) {
        w[KIND[e.action]]++;
      }
    }
    const ratings = reviews.docs.map((r) => r.rating).filter((r): r is number => typeof r === "number");
    return {
      now,
      before,
      reviews: ratings.length,
      rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
    };
  },
  ["owner-stats"],
  { revalidate: 6 * 3600 },
);
