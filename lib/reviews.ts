import { getPayload } from "payload";
import config from "@payload-config";
import type { Business, Review as ReviewDoc } from "@/payload-types";
import type { Locale } from "@/data/content";

export type Review = {
  id: number;
  rating: number;
  author: string;
  text: string | null;
  createdAt: string;
  business?: { slug: string; name: string };
};
export type ReviewSummary = { average: number; count: number; reviews: Review[] };

function toReview(r: ReviewDoc): Review {
  const b = typeof r.business === "object" ? (r.business as Business) : null;
  return {
    id: r.id,
    rating: r.rating,
    author: r.author,
    text: r.text ?? null,
    createdAt: r.createdAt,
    ...(b?.slug ? { business: { slug: b.slug, name: b.name } } : {}),
  };
}

/** Approved reviews of one place, newest first, with the average rating. */
export async function getReviews(businessId: number): Promise<ReviewSummary> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "reviews",
    where: { and: [{ business: { equals: businessId } }, { status: { equals: "published" } }] },
    sort: "-createdAt",
    limit: 200,
    depth: 0,
    overrideAccess: false,
  });
  const reviews = res.docs.map((r) => toReview(r as ReviewDoc));
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return { average, count: reviews.length, reviews };
}

/** The newest approved reviews across the directory, for the home page. */
export async function getLatestReviews(locale: Locale, limit = 6): Promise<Review[]> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "reviews",
    locale,
    where: { and: [{ status: { equals: "published" } }, { text: { exists: true } }] },
    sort: "-createdAt",
    limit: limit * 2,
    depth: 1,
    overrideAccess: false,
  });
  return res.docs
    .map((r) => toReview(r as ReviewDoc))
    .filter((r) => r.business && r.text) // skip places since unpublished
    .slice(0, limit);
}
