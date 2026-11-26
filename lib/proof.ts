import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Real numbers that show the directory is used: how many places owners manage themselves,
 * how many reviews are published, and what visitors did in the last 30 days. Counts only
 * (no rows are read), cached for a day, so they cost the database almost nothing.
 *
 * Each number appears on the site only once it is big enough to help (`SHOW_FROM`); a small
 * number ("1 review") reads as an empty place, not as proof.
 */
export type Proof = {
  /** Published places whose owner or staff manage the listing. */
  claimed: number;
  /** Published reviews. */
  reviews: number;
  /** Taps on Call or Directions, last 30 days (website and apps). */
  contacts: number;
  /** Page views, last 30 days. */
  views: number;
};

export const SHOW_FROM: Proof = { claimed: 5, reviews: 10, contacts: 50, views: 500 };

/** The two taps the copy names ("called or asked for directions"). */
const LEAD_ACTIONS = ["call", "directions"];

export const getProof = unstable_cache(
  async (): Promise<Proof> => {
    const zero: Proof = { claimed: 0, reviews: 0, contacts: 0, views: 0 };
    try {
      const payload = await getPayload({ config });
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [claimed, reviews, contacts, views] = await Promise.all([
        payload.count({ collection: "businesses", where: { and: [{ status: { equals: "published" } }, { claimed: { equals: true } }] } }),
        payload.count({ collection: "reviews", where: { status: { equals: "published" } } }),
        payload.count({
          collection: "analytics-events",
          where: { and: [{ type: { equals: "action" } }, { action: { in: LEAD_ACTIONS } }, { createdAt: { greater_than: since } }] },
        }),
        payload.count({ collection: "analytics-events", where: { and: [{ type: { equals: "pageview" } }, { createdAt: { greater_than: since } }] } }),
      ]);
      return { claimed: claimed.totalDocs, reviews: reviews.totalDocs, contacts: contacts.totalDocs, views: views.totalDocs };
    } catch {
      // Proof is decoration: never let it break a page.
      return zero;
    }
  },
  ["proof"],
  { revalidate: 86_400, tags: ["directory"] },
);

/** The number if it is big enough to show, else null. */
export function shown(proof: Proof, key: keyof Proof): number | null {
  return proof[key] >= SHOW_FROM[key] ? proof[key] : null;
}
